import * as THREE from 'three';

/**
 * Gerstner-wave ocean. The same wave set is evaluated on the CPU
 * (`waveAt`) so hulls, splashes and foam ride exactly the surface the
 * shader draws.
 */

// amplitude, wavelength, steepness, dirX, dirZ, speed
export const WAVES = [
  [0.62, 46.0, 0.72, 1.00, 0.12, 1.00],
  [0.40, 27.0, 0.66, 0.72, -0.69, 1.25],
  [0.24, 14.5, 0.58, -0.34, 0.94, 1.55],
  [0.13, 8.20, 0.52, 0.91, 0.42, 1.95],
  [0.07, 4.60, 0.45, -0.80, -0.60, 2.40]
];

const _p = new THREE.Vector3();

/** Displaced surface point for the still-water coordinate (x, z). */
export function waveAt(x, z, time, swell = 1, out = _p) {
  let dx = 0, dy = 0, dz = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const [amp, len, steep, dirx, dirz, spd] = WAVES[i];
    const k = (2 * Math.PI) / len;
    const c = Math.sqrt(9.81 / k);
    const f = k * (dirx * x + dirz * z) - c * spd * time;
    const a = amp * swell;
    const s = Math.sin(f), co = Math.cos(f);
    dx += steep * a * dirx * co;
    dz += steep * a * dirz * co;
    dy += a * s;
  }
  return out.set(x + dx, dy, z + dz);
}

/** Surface height plus normal — used for hull attitude. */
export function waveFrame(x, z, time, swell, normal) {
  const e = 0.9;
  const h0 = waveAt(x, z, time, swell, new THREE.Vector3()).y;
  const hx = waveAt(x + e, z, time, swell, new THREE.Vector3()).y;
  const hz = waveAt(x, z + e, time, swell, new THREE.Vector3()).y;
  if (normal) normal.set(-(hx - h0) / e, 1, -(hz - h0) / e).normalize();
  return h0;
}

const OCEAN_VERT = /* glsl */`
uniform float uTime;
uniform float uSwell;
uniform vec3  uOrigin;      // where the disc currently sits, in world space
uniform vec3  uShipA;
uniform vec3  uShipB;

varying vec3 vWorld;
varying vec3 vNormal;
varying float vFoam;

const int NW = 5;
uniform vec4 uWaveA[NW];   // amp, len, steep, speed
uniform vec2 uWaveD[NW];   // direction

vec3 gerstner(vec2 p, out vec3 nrm, out float jacobian) {
  vec3 disp = vec3(p.x, 0.0, p.y);
  vec3 tx = vec3(1.0, 0.0, 0.0);
  vec3 tz = vec3(0.0, 0.0, 1.0);
  for (int i = 0; i < NW; i++) {
    float amp = uWaveA[i].x * uSwell;
    float len = uWaveA[i].y;
    float st  = uWaveA[i].z;
    float spd = uWaveA[i].w;
    vec2  d   = uWaveD[i];
    float k = 6.2831853 / len;
    float c = sqrt(9.81 / k);
    float f = k * dot(d, p) - c * spd * uTime;
    float s = sin(f), co = cos(f);
    disp += vec3(st * amp * d.x * co, amp * s, st * amp * d.y * co);
    float ka = k * amp;
    tx += vec3(-st * ka * d.x * d.x * s, ka * d.x * co, -st * ka * d.x * d.y * s);
    tz += vec3(-st * ka * d.x * d.y * s, ka * d.y * co, -st * ka * d.y * d.y * s);
  }
  nrm = normalize(cross(tz, tx));
  // 1 - det of the horizontal displacement Jacobian: rises toward 1 as the
  // crest pinches over and the surface starts to fold
  jacobian = 1.0 - (tx.x * tz.z - tx.z * tz.x);
  return disp;
}

void main() {
  vec3 nrm;
  float steep;
  vec3 world = gerstner(position.xz + uOrigin.xz, nrm, steep);
  vWorld = world;
  vNormal = nrm;

  // whitecaps on steep crests, plus wake around each fleet centre
  // foam where the wave is both high and genuinely breaking
  float crest = smoothstep(0.66 * uSwell, 1.12 * uSwell, world.y);
  float breaking = smoothstep(0.28, 0.72, steep);
  float wA = 1.0 - smoothstep(5.0, 18.0, distance(world.xz, uShipA.xz));
  float wB = 1.0 - smoothstep(5.0, 18.0, distance(world.xz, uShipB.xz));
  vFoam = clamp(crest * breaking * 1.15 + max(wA, wB) * 0.20, 0.0, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
}
`;

const OCEAN_FRAG = /* glsl */`
uniform vec3  uDeep;
uniform vec3  uShallow;
uniform vec3  uSky;        // warm horizon band
uniform vec3  uReflect;    // averaged sky dome, what the surface actually mirrors
uniform vec3  uSunDir;
uniform vec3  uSunColor;
uniform float uTime;
uniform vec3  uFlashPos;
uniform vec3  uFlashColor;

varying vec3 vWorld;
varying vec3 vNormal;
varying float vFoam;

// cheap value noise for the foam mottling
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(vNormal);

  // Schlick fresnel, capped: a real sea is never a perfect mirror because
  // the sub-pixel chop scatters the grazing reflection
  float fres = pow(1.0 - max(dot(N, V), 0.0), 5.0);
  fres = mix(0.02, 0.78, fres);

  float facing = max(dot(N, V), 0.0);
  // subsurface: wave crests glow where light passes through thin water
  float thin = smoothstep(0.0, 0.85, vWorld.y) * max(dot(N, uSunDir) * 0.5 + 0.5, 0.0);
  vec3 body = mix(uDeep, uShallow, pow(facing, 1.4) * 0.85);
  body += uShallow * thin * 0.55;

  // sun glitter
  vec3 H = normalize(uSunDir + V);
  float spec = pow(max(dot(N, H), 0.0), 320.0) * 3.4;
  float sheen = pow(max(dot(N, H), 0.0), 26.0) * 0.30;

  // the mirrored sky is mostly the dome colour, warming toward the horizon
  vec3 mirrored = mix(uReflect, uSky, pow(max(1.0 - abs(N.y), 0.0), 3.0) * 0.55);
  vec3 col = mix(body, mirrored, fres);
  col += uSunColor * (spec + sheen);

  // muzzle flashes and fires light the sea around them
  vec3 fl = uFlashPos - vWorld;
  float fdist = length(fl);
  if (fdist < 140.0) {
    vec3 L = fl / max(fdist, 1e-3);
    vec3 FH = normalize(L + V);
    float atten = 1.0 / (1.0 + fdist * fdist * 0.0045);
    float diff = max(dot(N, L), 0.0) * 0.55;
    float fspec = pow(max(dot(N, FH), 0.0), 90.0) * 2.6;
    col += uFlashColor * (diff + fspec) * atten;
  }

  // horizon haze so the plane never shows a hard edge
  float dist = length(cameraPosition.xz - vWorld.xz);
  float haze = smoothstep(260.0, 1100.0, dist);

  // break the foam into streaks and bubbles rather than solid patches
  float fn = noise(vWorld.xz * 1.9 + uTime * 0.30) * 0.40
           + noise(vWorld.xz * 6.0 - uTime * 0.55) * 0.33
           + noise(vWorld.xz * 17.0 + uTime * 0.85) * 0.18
           + noise(vWorld.xz * 46.0 - uTime * 1.3) * 0.09;
  float foam = smoothstep(0.52, 0.93, vFoam * (0.22 + fn * 1.55));
  // the residue left behind a broken crest is thinner than the crest itself
  float residue = smoothstep(0.30, 0.62, vFoam * (0.30 + fn * 1.3)) * 0.30;
  vec3 foamCol = vec3(0.90, 0.94, 0.97) * (0.50 + 0.50 * max(dot(N, uSunDir), 0.0));
  col = mix(col, foamCol, clamp(foam * 0.90 + residue, 0.0, 1.0));

  // distant water dissolves into the horizon band, never a hard plane edge
  col = mix(col, mix(uSky, uReflect, 0.35), haze);
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * A radial disc that rides with the camera: rings are packed tightly near the
 * viewer and stretch toward the horizon, so the chop close to the lens is
 * finely tessellated while a single mesh still reaches the skyline. A uniform
 * grid big enough to hide its edges is far too coarse underfoot.
 */
function radialOceanGeometry(rings = 320, radials = 400, inner = 1.2, outer = 2400) {
  const vcount = rings * radials;
  const pos = new Float32Array(vcount * 3);
  const idx = new Uint32Array((rings - 1) * radials * 6);

  let p = 0;
  for (let i = 0; i < rings; i++) {
    // geometric growth: constant screen-space density as distance increases
    const t = i / (rings - 1);
    const r = inner * Math.pow(outer / inner, t);
    for (let j = 0; j < radials; j++) {
      const a = (j / radials) * Math.PI * 2;
      pos[p++] = Math.cos(a) * r;
      pos[p++] = 0;
      pos[p++] = Math.sin(a) * r;
    }
  }

  let k = 0;
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < radials; j++) {
      const j2 = (j + 1) % radials;
      const a = i * radials + j;
      const b = i * radials + j2;
      const c = (i + 1) * radials + j;
      const d = (i + 1) * radials + j2;
      idx[k++] = a; idx[k++] = b; idx[k++] = c;
      idx[k++] = b; idx[k++] = d; idx[k++] = c;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

export function createOcean(env) {
  const geo = radialOceanGeometry();

  const waveA = WAVES.map(w => new THREE.Vector4(w[0], w[1], w[2], w[5]));
  const waveD = WAVES.map(w => {
    const l = Math.hypot(w[3], w[4]);
    return new THREE.Vector2(w[3] / l, w[4] / l);
  });

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:     { value: 0 },
      uSwell:    { value: 1 },
      uOrigin:   { value: new THREE.Vector3() },
      uWaveA:    { value: waveA },
      uWaveD:    { value: waveD },
      uDeep:     { value: new THREE.Color(env.deep) },
      uShallow:  { value: new THREE.Color(env.shallow) },
      uSky:      { value: new THREE.Color(env.horizon) },
      uReflect:  { value: new THREE.Color(env.reflect) },
      uSunDir:   { value: env.sunDir.clone() },
      uSunColor: { value: new THREE.Color(env.sunColor) },
      uShipA:    { value: new THREE.Vector3() },
      uShipB:    { value: new THREE.Vector3() },
      uFlashPos:   { value: new THREE.Vector3(0, -999, 0) },
      uFlashColor: { value: new THREE.Color(0, 0, 0) }
    },
    vertexShader: OCEAN_VERT,
    fragmentShader: OCEAN_FRAG,
    // the surface is only ever seen from above, but a steep crest can flip a
    // triangle toward the viewer; double-siding avoids any hole in the sea
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}

// ------------------------------------------------------------------- sky

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;   // always at the far plane
}
`;

const SKY_FRAG = /* glsl */`
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uTime;
varying vec3 vDir;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
  return v;
}

void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);

  vec3 col = mix(uHorizon, uZenith, pow(smoothstep(0.46, 1.0, h), 0.8));
  // warm band hugging the sea
  col = mix(col, uSunColor * 0.95, pow(1.0 - abs(d.y), 14.0) * 0.55);

  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * pow(sd, 180.0) * 4.0;          // disc
  col += uSunColor * pow(sd, 6.0) * 0.28;           // glow

  // layered cloud deck
  if (d.y > 0.0) {
    vec2 uv = d.xz / max(d.y, 0.06);
    float c1 = fbm(uv * 0.55 + vec2(uTime * 0.006, 0.0));
    float c2 = fbm(uv * 1.30 - vec2(uTime * 0.011, uTime * 0.004));
    float cloud = smoothstep(0.52, 0.95, c1 * 0.65 + c2 * 0.45);
    cloud *= smoothstep(0.0, 0.22, d.y);
    vec3 lit = mix(vec3(0.16, 0.14, 0.20), uSunColor * 1.05, pow(sd, 1.4) * 0.8 + 0.18);
    col = mix(col, lit, cloud * 0.80);
  }

  // faint stars high up once the sky darkens
  float star = step(0.9975, hash(floor(d.xz * 900.0 / max(d.y, 0.2))));
  col += star * smoothstep(0.35, 0.9, d.y) * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createSky(env) {
  const geo = new THREE.SphereGeometry(1, 48, 32);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uZenith:   { value: new THREE.Color(env.zenith) },
      uHorizon:  { value: new THREE.Color(env.horizon) },
      uSunDir:   { value: env.sunDir.clone() },
      uSunColor: { value: new THREE.Color(env.sunColor) },
      uTime:     { value: 0 }
    },
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  m.renderOrder = -100;
  return m;
}
