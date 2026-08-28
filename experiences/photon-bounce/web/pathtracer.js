(function () {
  var VERT = [
    'precision highp float;',
    'in vec3 position;',
    'void main() { gl_Position = vec4(position, 1.0); }'
  ].join('\n');

  function traceFrag(sceneGLSL) {
    return [
      'precision highp float;',
      'uniform sampler2D uHistory;',
      'uniform int uFrame;',
      'uniform int uMaxBounces;',
      'uniform vec2 uResolution;',
      'uniform vec3 uLamp;',
      'uniform float uLampRadius;',
      'uniform vec3 uLampEmit;',
      'uniform vec3 uCamPos; uniform vec3 uCamRight; uniform vec3 uCamUp; uniform vec3 uCamFwd;',
      'uniform float uTanHalfFov; uniform float uAspect;',
      'out vec4 fragColor;',
      sceneGLSL,
      '',
      'uint gSeed;',
      'uint pcg(uint v){ v = v*747796405u + 2891336453u; uint w = ((v >> ((v>>28u)+4u)) ^ v) * 277803737u; return (w>>22u) ^ w; }',
      'float rnd(){ gSeed = pcg(gSeed); return float(gSeed) / 4294967296.0; }',
      '',
      '// mat: 0 diffuse, 1 mirror, 2 glass, 3 emissive-window, 4 lamp',
      'struct Hit { float t; vec3 n; vec3 col; int mat; };',
      '',
      'bool boxHit(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax, out float t, out vec3 n) {',
      '  vec3 inv = 1.0 / rd;',
      '  vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;',
      '  vec3 tmn = min(t0, t1), tmx = max(t0, t1);',
      '  float tN = max(max(tmn.x, tmn.y), tmn.z);',
      '  float tF = min(min(tmx.x, tmx.y), tmx.z);',
      '  if (tN > tF || tF < 0.001) return false;',
      '  t = tN > 0.001 ? tN : tF;',
      '  vec3 c = (bmin + bmax) * 0.5;',
      '  vec3 d = (ro + rd * t - c) / ((bmax - bmin) * 0.5);',
      '  vec3 ad = abs(d);',
      '  n = (ad.x > ad.y && ad.x > ad.z) ? vec3(sign(d.x), 0.0, 0.0)',
      '    : (ad.y > ad.z) ? vec3(0.0, sign(d.y), 0.0) : vec3(0.0, 0.0, sign(d.z));',
      '  return true;',
      '}',
      '',
      'float sphHit(vec3 ro, vec3 rd, vec3 c, float r) {',
      '  vec3 oc = ro - c; float b = dot(oc, rd); float cc = dot(oc, oc) - r * r;',
      '  float h = b * b - cc; if (h < 0.0) return -1.0; h = sqrt(h);',
      '  float t = -b - h; if (t > 0.001) return t;',
      '  t = -b + h; return t > 0.001 ? t : -1.0;',
      '}',
      '',
      'Hit roomHit(vec3 ro, vec3 rd) {',
      '  vec3 inv = 1.0 / rd;',
      '  vec3 t0 = (ROOM_MIN - ro) * inv, t1 = (ROOM_MAX - ro) * inv;',
      '  vec3 tmx = max(t0, t1);',
      '  float tF = min(min(tmx.x, tmx.y), tmx.z);',
      '  vec3 n; vec3 col;',
      '  if (tF == tmx.x) { n = vec3(-sign(rd.x), 0.0, 0.0); col = rd.x < 0.0 ? WALL_ACCENT : WALL_MAIN; }',
      '  else if (tF == tmx.y) { n = vec3(0.0, -sign(rd.y), 0.0); col = rd.y < 0.0 ? FLOOR_COL : CEIL_COL; }',
      '  else { n = vec3(0.0, 0.0, -sign(rd.z)); col = WALL_MAIN; }',
      '  return Hit(tF, n, col, 0);',
      '}',
      '',
      'Hit sceneHit(vec3 ro, vec3 rd) {',
      '  Hit best = roomHit(ro, rd);',
      '  float t; vec3 n;',
      '  for (int i = 0; i < NUM_BOXES; i++) {',
      '    if (boxHit(ro, rd, boxMin[i], boxMax[i], t, n) && t < best.t)',
      '      best = Hit(t, n, boxCol[i], boxMat[i]);',
      '  }',
      '  t = sphHit(ro, rd, CARAFE_C, CARAFE_R);',
      '  if (t > 0.0 && t < best.t) best = Hit(t, normalize(ro + rd * t - CARAFE_C), CARAFE_COL, 2);',
      '  t = sphHit(ro, rd, uLamp, uLampRadius);',
      '  if (t > 0.0 && t < best.t) best = Hit(t, normalize(ro + rd * t - uLamp), uLampEmit, 4);',
      '  return best;',
      '}',
      '',
      '// Approximate transmission of a shadow ray through the glass carafe.',
      '//',
      '// This is an AUTHORED APPROXIMATION, not a derivation, and it is worth',
      '// being explicit about why. A true caustic is an LSDS path -- light,',
      '// specular (the glass), diffuse (the desk), sensor. Next-event',
      '// estimation cannot express one at all: a specular vertex has zero',
      '// probability of being hit by an explicit light sample. The rare BSDF',
      '// paths that would find a caustic are exactly the high-variance samples',
      '// FIREFLY_CLAMP suppresses. So neither of the tracer\'s two mechanisms',
      '// can produce this beat, and the honest options are to author it or to',
      '// drop it. The design spec calls for "a caustic pool beneath the',
      '// carafe", so it is authored here.',
      '//',
      '// Before this, occluded() skipped glass entirely and never tested the',
      '// carafe sphere, so light passed through as though it were not there --',
      '// no shadow, no caustic, just a flat unshadowed patch of desk.',
      '//',
      '// Model: a ball lens concentrates light on its axis. Rays passing near',
      '// the centre are transmitted and boosted; rays near the rim are',
      '// deviated away and so attenuated. That roughly conserves energy while',
      '// putting a bright pool where one belongs.',
      'vec3 glassShadow(vec3 ro, vec3 rd, float maxT) {',
      '  vec3 oc = CARAFE_C - ro;',
      '  float tca = dot(oc, rd);',
      '  if (tca <= 0.0 || tca >= maxT) return vec3(1.0);',
      '  float d2 = dot(oc, oc) - tca * tca;',
      '  float r2 = CARAFE_R * CARAFE_R;',
      '  if (d2 >= r2) return vec3(1.0);',
      '  float u2 = d2 / r2;              // 0 on axis, 1 at the rim',
      '  float transmit = 1.0 - u2;',
      '  float focus = 1.0 + ' + CONFIG.PT.CAUSTIC.GAIN.toFixed(2) + ' * exp(-u2 / ' + (CONFIG.PT.CAUSTIC.WIDTH * CONFIG.PT.CAUSTIC.WIDTH).toFixed(4) + ');',
      '  return CARAFE_COL * transmit * focus;',
      '}',
      '',
      '// Visibility along a shadow ray: vec3(0) if an opaque surface blocks it,',
      '// otherwise the tint it picks up on the way. Returning a colour rather',
      '// than a bool is what lets the carafe cast a glassy shadow instead of',
      '// either a wrong hard shadow or none at all.',
      'vec3 shadowVis(vec3 ro, vec3 rd, float maxT) {',
      '  float t; vec3 n;',
      '  for (int i = 0; i < NUM_BOXES; i++) {',
      '    if (boxMat[i] == 2) continue; // glass is handled by glassShadow',
      '    if (boxMat[i] == 3) continue; // the emissive pane is a light, not an occluder',
      '    if (boxHit(ro, rd, boxMin[i], boxMax[i], t, n) && t < maxT) return vec3(0.0);',
      '  }',
      '  return glassShadow(ro, rd, maxT);',
      '}',
      '',
      'vec3 onb(vec3 w, vec2 disk, float z) {',
      '  vec3 a = abs(w.x) > 0.5 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);',
      '  vec3 u = normalize(cross(w, a)); vec3 v = cross(w, u);',
      '  return normalize(u * disk.x + v * disk.y + w * z);',
      '}',
      '',
      'vec3 trace(vec3 ro, vec3 rd) {',
      '  vec3 rad = vec3(0.0); vec3 thr = vec3(1.0); bool spec = true;',
      '  for (int b = 0; b < 8; b++) {',
      '    if (b >= uMaxBounces) break;',
      '    Hit h = sceneHit(ro, rd);',
      '    vec3 p = ro + rd * h.t;',
      '    if (h.mat == 3) { if (spec) rad += thr * h.col * ' + CONFIG.PT.WINDOW_GAIN.toFixed(1) + '; break; }',
      '    if (h.mat == 4) { if (spec) rad += thr * h.col; break; }',
      '    if (h.mat == 0) {',
      '      thr *= h.col;',
      '      vec3 toL = uLamp - p; float dL = length(toL);',
      '      if (dL > uLampRadius * 1.05) {',
      '        vec3 ldir = toL / dL;',
      '        float cosMax = sqrt(max(0.0, 1.0 - uLampRadius * uLampRadius / (dL * dL)));',
      '        float u1 = rnd(), u2 = rnd();',
      '        float ct = 1.0 - u1 * (1.0 - cosMax);',
      '        float st = sqrt(max(0.0, 1.0 - ct * ct)); float ph = 6.2831853 * u2;',
      '        vec3 sdir = onb(ldir, vec2(st * cos(ph), st * sin(ph)), ct);',
      '        float ndl = dot(h.n, sdir);',
      '        vec3 vis = shadowVis(p + h.n * 0.002, sdir, dL - uLampRadius);',
      '        if (ndl > 0.0 && dot(vis, vis) > 0.0)',
      '          rad += thr * vis * uLampEmit * ndl * 2.0 * (1.0 - cosMax);',
      '      }',
      '      // Next-event estimation toward the window pane, sampled uniformly',
      '      // over its front face as an area light. Without this the pane only',
      '      // contributed when a diffuse bounce happened to wander into it, so',
      '      // the cool ambient fill the design calls for -- the thing that keeps',
      '      // unlit corners readable -- was almost entirely missing.',
      '      {',
      '        vec3 wp = vec3(mix(WINDOW_MIN.x, WINDOW_MAX.x, rnd()),',
      '                       mix(WINDOW_MIN.y, WINDOW_MAX.y, rnd()),',
      '                       WINDOW_MAX.z);',
      '        vec3 toW = wp - p;',
      '        float d2 = dot(toW, toW);',
      '        float dW = sqrt(d2);',
      '        vec3 wdir = toW / dW;',
      '        float ndl = dot(h.n, wdir);',
      '        // The pane faces +z into the room, so the cosine at the light is',
      '        // measured against -wdir.',
      '        float cosL = -wdir.z;',
      '        vec3 wvis = shadowVis(p + h.n * 0.002, wdir, dW - 0.01);',
      '        if (ndl > 0.0 && cosL > 0.0 && dot(wvis, wvis) > 0.0) {',
      '          rad += thr * wvis * WINDOW_EMIT * ndl * cosL * WINDOW_AREA / d2;',
      '        }',
      '      }',
      '      float r1 = 6.2831853 * rnd(), r2 = rnd(), r2s = sqrt(r2);',
      '      rd = onb(h.n, vec2(cos(r1) * r2s, sin(r1) * r2s), sqrt(1.0 - r2));',
      '      ro = p + h.n * 0.002; spec = false;',
      '    } else if (h.mat == 1) {',
      '      thr *= h.col; rd = reflect(rd, h.n); ro = p + h.n * 0.002; spec = true;',
      '    } else {',
      '      vec3 n = h.n; float eta = 1.0 / 1.5; float ci = -dot(rd, n);',
      '      if (ci < 0.0) { n = -n; ci = -ci; eta = 1.5; }',
      '      float f = 0.04 + 0.96 * pow(1.0 - ci, 5.0);',
      '      float k = 1.0 - eta * eta * (1.0 - ci * ci);',
      '      if (k < 0.0 || rnd() < f) rd = reflect(rd, n);',
      '      else rd = normalize(eta * rd + (eta * ci - sqrt(k)) * n);',
      '      thr *= h.col; ro = p + rd * 0.002; spec = true;',
      '    }',
      '    if (b > 2) {',
      '      float pc = clamp(max(thr.r, max(thr.g, thr.b)), 0.05, 0.95);',
      '      if (rnd() > pc) break;',
      '      thr /= pc;',
      '    }',
      '  }',
      '  return rad;',
      '}',
      '',
      'void main() {',
      '  gSeed = uint(gl_FragCoord.x) * 1973u + uint(gl_FragCoord.y) * 9277u + uint(uFrame) * 26699u;',
      '  gSeed = pcg(gSeed);',
      '  vec2 jit = vec2(rnd(), rnd()) - 0.5;',
      '  vec2 uv = (gl_FragCoord.xy + jit) / uResolution * 2.0 - 1.0;',
      '  vec3 rd = normalize(uCamFwd + uv.x * uAspect * uTanHalfFov * uCamRight + uv.y * uTanHalfFov * uCamUp);',
      '  vec3 col = trace(uCamPos, rd);',
      '  vec3 prev = texelFetch(uHistory, ivec2(gl_FragCoord.xy), 0).rgb;',
      '  // A non-finite sample would poison the running average permanently',
      '  // (mix(NaN, x, w) stays NaN), so reject it before it enters history.',
      '  if (any(isnan(col)) || any(isinf(col))) col = uFrame <= 1 ? vec3(0.0) : prev;',
      '  // Firefly clamp: rare huge NEE samples (tiny pdf) read as bright',
      '  // speckle that takes thousands of frames to average out. The bound',
      '  // must stay above uLampEmit so direct/mirror views of the lamp keep',
      '  // full brightness.',
      '  col = min(col, vec3(' + CONFIG.PT.FIREFLY_CLAMP.toFixed(1) + '));',
      '  vec3 acc = uFrame <= 1 ? col : mix(prev, col, 1.0 / float(uFrame));',
      '  fragColor = vec4(acc, 1.0);',
      '}'
    ].join('\n');
  }

  // Bloom. The lamp emits radiance far above 1.0, which ACES then compresses
  // to flat white -- the light source ended up the least luminous-looking
  // thing in a piece about light. Extracting the above-threshold energy and
  // blurring it back in BEFORE tone mapping is the physically-ordered fix:
  // light spills, then the curve compresses the result.
  //
  // Two separable passes at 1/DOWNSCALE resolution. Discrete taps rather than
  // the usual linear-sampled Gaussian, because without OES_texture_float_linear
  // these targets fall back to NearestFilter and the half-texel trick would
  // silently degrade into a box blur.
  function blurFrag(applyThreshold) {
    var B = CONFIG.PT.BLOOM;
    var lines = [
      'precision highp float;',
      'uniform sampler2D uSrc;',
      'uniform vec2 uResolution;',
      'uniform vec2 uTexel;',
      'uniform vec2 uDir;',
      'out vec4 fragColor;',
      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / uResolution;',
      '  float w[5] = float[5](0.2270, 0.1945, 0.1216, 0.0540, 0.0162);',
      '  vec3 sum = vec3(0.0);',
      '  for (int i = -4; i <= 4; i++) {',
      '    vec2 o = uDir * uTexel * float(i) * ' + B.RADIUS.toFixed(2) + ';',
      '    vec3 c = texture(uSrc, uv + o).rgb;'
    ];
    if (applyThreshold) {
      // Keep only the energy above every diffuse surface in the room, so the
      // bleed comes from actual light sources and not from bright plaster.
      lines.push('    c = max(c - vec3(' + B.THRESHOLD.toFixed(3) + '), vec3(0.0));');
    }
    lines.push(
      '    sum += c * w[i < 0 ? -i : i];',
      '  }',
      '  fragColor = vec4(sum, 1.0);',
      '}'
    );
    return lines.join('\n');
  }

  // Deviation from brief: added uOrigin uniform. gl_FragCoord is in absolute
  // framebuffer (window) coordinates, not viewport-relative -- when draw()
  // renders into the right-half viewport (x offset = halfW), gl_FragCoord.x
  // ranges [halfW, 2*halfW] rather than [0, halfW]. Dividing by uResolution
  // alone therefore produced uv.x in [1,2], which clamped to the texture's
  // edge column and rendered as horizontal streaks with no scene structure.
  // Subtracting the known viewport origin before normalizing fixes this.
  var DISPLAY_FRAG = [
    'precision highp float;',
    'uniform sampler2D uImage;',
    'uniform vec2 uResolution;',
    'uniform vec2 uOrigin;',
    'uniform sampler2D uBloom;',
    'uniform float uBloomStrength;',
    'out vec4 fragColor;',
    'vec3 aces(vec3 x) {',
    '  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);',
    '}',
    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - uOrigin) / uResolution;',
    '  vec3 c = texture(uImage, uv).rgb;',
    '  // Composite before tone mapping: bloom is light, so it goes',
    '  // through the same curve as the rest of the image.',
    '  c += texture(uBloom, uv).rgb * uBloomStrength;',
    '  fragColor = vec4(pow(aces(c), vec3(1.0 / 2.2)), 1.0);',
    '}'
  ].join('\n');

  function create(renderer, sceneDef) {
    var W = CONFIG.PT.INTERNAL_W, H = CONFIG.PT.INTERNAL_H;
    // magFilter: Linear so the display pass upscales softly; minFilter stays
    // Nearest (accumulation reads via texelFetch, which ignores filtering).
    // WebGL2 core does NOT make RGBA32F filterable -- LinearFilter on a
    // FloatType target is only valid when the OES_texture_float_linear
    // extension is present. Without it the render target is texture-incomplete
    // and sampling it returns black (no console error), so probe for the
    // extension and fall back to NearestFilter when it's unavailable.
    var floatLinear = renderer.extensions.has('OES_texture_float_linear');
    if (!floatLinear) {
      console.warn('PathTracer: OES_texture_float_linear unsupported; falling back to NearestFilter (image will look blockier at internal resolution).');
    }
    var magFilter = floatLinear ? THREE.LinearFilter : THREE.NearestFilter;
    var opts = { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: magFilter, depthBuffer: false };
    var rtA = new THREE.WebGLRenderTarget(W, H, opts);
    var rtB = new THREE.WebGLRenderTarget(W, H, opts);
    // Bloom targets at 1/DOWNSCALE. Low resolution is what makes the glow wide
    // and soft for very few taps; it never carries detail, only spilled energy.
    var BW = Math.max(1, Math.round(W / CONFIG.PT.BLOOM.DOWNSCALE));
    var BH = Math.max(1, Math.round(H / CONFIG.PT.BLOOM.DOWNSCALE));
    var rtBloomA = new THREE.WebGLRenderTarget(BW, BH, opts);
    var rtBloomB = new THREE.WebGLRenderTarget(BW, BH, opts);
    var frame = 0;
    var preview = false;

    // Camera basis
    var cp = sceneDef.camera.pos, ct = sceneDef.camera.target;
    var fwd = new THREE.Vector3(ct[0]-cp[0], ct[1]-cp[1], ct[2]-cp[2]).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    var up = new THREE.Vector3().crossVectors(right, fwd);
    var lampEmit = CONFIG.LAMP.COLOR.map(function (c) { return c * CONFIG.LAMP.INTENSITY; });

    var quad = new THREE.PlaneGeometry(2, 2);
    var traceMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: traceFrag(SceneDef.sceneToGLSL(sceneDef)),
      uniforms: {
        uHistory: { value: rtA.texture },
        uFrame: { value: 0 },
        uMaxBounces: { value: CONFIG.PT.MAX_BOUNCES },
        uResolution: { value: new THREE.Vector2(W, H) },
        uLamp: { value: new THREE.Vector3().fromArray(sceneDef.attractPath[0]) },
        uLampRadius: { value: CONFIG.LAMP.RADIUS },
        uLampEmit: { value: new THREE.Vector3().fromArray(lampEmit) },
        uCamPos: { value: new THREE.Vector3().fromArray(cp) },
        uCamRight: { value: right }, uCamUp: { value: up }, uCamFwd: { value: fwd },
        uTanHalfFov: { value: Math.tan(sceneDef.camera.fovDeg * Math.PI / 360) },
        uAspect: { value: W / H }
      }
    });
    var displayMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: DISPLAY_FRAG,
      uniforms: {
        uImage: { value: rtB.texture },
        uResolution: { value: new THREE.Vector2(1368, CONFIG.WALL_H) },
        uOrigin: { value: new THREE.Vector2(0, 0) },
        uBloom: { value: rtBloomB.texture },
        uBloomStrength: { value: CONFIG.PT.BLOOM.STRENGTH }
      }
    });
    function blurMaterial(applyThreshold) {
      return new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: blurFrag(applyThreshold),
        uniforms: {
          uSrc: { value: null },
          uResolution: { value: new THREE.Vector2(BW, BH) },
          uTexel: { value: new THREE.Vector2(1 / BW, 1 / BH) },
          uDir: { value: new THREE.Vector2(1, 0) }
        }
      });
    }
    var brightMat = blurMaterial(true);   // bright-pass + horizontal blur
    var blurMat = blurMaterial(false);    // vertical blur
    var brightScene = new THREE.Scene();
    brightScene.add(new THREE.Mesh(quad, brightMat));
    var blurScene = new THREE.Scene();
    blurScene.add(new THREE.Mesh(quad, blurMat));
    var traceScene = new THREE.Scene();
    traceScene.add(new THREE.Mesh(quad, traceMat));
    var displayScene = new THREE.Scene();
    displayScene.add(new THREE.Mesh(quad, displayMat));
    var ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    function step() {
      // Once converged, stop tracing: past a few thousand samples the image
      // no longer visibly changes, and this exhibit runs all day. Any reset
      // (lamp move, preview toggle) zeroes `frame` and resumes accumulation.
      if (!preview && frame >= CONFIG.PT.MAX_SAMPLES) return;
      if (preview) frame = 0;
      frame++;
      traceMat.uniforms.uFrame.value = frame;
      traceMat.uniforms.uHistory.value = rtA.texture;
      renderer.setRenderTarget(rtB);
      renderer.setViewport(0, 0, W, H);
      renderer.render(traceScene, ortho);
      renderer.setRenderTarget(null);
      var tmp = rtA; rtA = rtB; rtB = tmp;
      // Rebuild the glow from the accumulation buffer that step() just wrote.
      // This lives inside step() rather than draw() so it stops along with
      // accumulation at MAX_SAMPLES -- once the image is final, so is its glow.
      updateBloom(rtA.texture);
    }

    // src -> (bright-pass + horizontal blur) -> rtBloomA -> (vertical blur) -> rtBloomB
    function updateBloom(srcTex) {
      brightMat.uniforms.uSrc.value = srcTex;
      brightMat.uniforms.uDir.value.set(1, 0);
      renderer.setRenderTarget(rtBloomA);
      renderer.setViewport(0, 0, BW, BH);
      renderer.render(brightScene, ortho);

      blurMat.uniforms.uSrc.value = rtBloomA.texture;
      blurMat.uniforms.uDir.value.set(0, 1);
      renderer.setRenderTarget(rtBloomB);
      renderer.setViewport(0, 0, BW, BH);
      renderer.render(blurScene, ortho);

      renderer.setRenderTarget(null);
      displayMat.uniforms.uBloom.value = rtBloomB.texture;
    }

    function draw(x, y, w, h) {
      displayMat.uniforms.uImage.value = rtA.texture; // rtA now holds latest (post-swap)
      displayMat.uniforms.uResolution.value.set(w, h);
      displayMat.uniforms.uOrigin.value.set(x, y);
      renderer.setViewport(x, y, w, h);
      renderer.setScissor(x, y, w, h);
      renderer.render(displayScene, ortho);
    }

    return {
      step: step,
      draw: draw,
      setLamp: function (l) {
        traceMat.uniforms.uLamp.value.set(l[0], l[1], l[2]);
        frame = 0;
      },
      setPreview: function (on) {
        preview = on;
        traceMat.uniforms.uMaxBounces.value = on ? CONFIG.PT.PREVIEW_BOUNCES : CONFIG.PT.MAX_BOUNCES;
        if (!on) frame = 0;
      },
      getSampleCount: function () { return frame; },
      // Exposed so bloom can be tuned live on the wall (and A/B tested)
      // without an edit-reload cycle: __PB._internals.pathTracer.setBloom(0).
      setBloom: function (strength) {
        displayMat.uniforms.uBloomStrength.value = strength;
      },
      getBloom: function () { return displayMat.uniforms.uBloomStrength.value; }
    };
  }

  if (typeof window !== 'undefined') window.PathTracer = { create: create };
})();
