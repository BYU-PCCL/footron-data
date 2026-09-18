import * as THREE from 'three';
import { RadixDepthSorter } from './sorter.js';

/**
 * SplatMesh — a real-time 3D Gaussian splat renderer.
 *
 * Splat data lives in one RGBA32F DataTexture (4 texels per splat):
 *   texel 0: position.xyz , opacity
 *   texel 1: scale.xyz    , emissive
 *   texel 2: rotation quaternion xyzw
 *   texel 3: colour rgb   , (spare)
 *
 * Geometry is a single 2x2 quad drawn instanced. The only per-instance
 * attribute is a float index, so re-sorting back-to-front each frame costs
 * one small buffer upload instead of shuffling every attribute.
 *
 * Projection follows the EWA splatting of Kerbl et al. 2023: the 3D
 * covariance RSS^T R^T is pushed through the model-view matrix and the
 * local affine approximation J of the perspective projection, then the
 * resulting 2x2 covariance is eigen-decomposed into screen-space axes.
 */

const VERT = /* glsl */`
precision highp float;
precision highp int;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

in vec2  corner;      // [-3,3] quad, in units of sigma
in float aIndex;      // which splat this instance draws

uniform sampler2D uData;
uniform vec2  uDataSize;    // texture dimensions
uniform vec2  uViewport;    // drawing buffer size in px
uniform float uScale;       // global splat size multiplier
uniform float uAlpha;       // global opacity multiplier
uniform float uFade;        // distance fade start (world units)

// deferred-free lighting: splats carry a surface normal in their rotation,
// so we can shade them like the oriented discs they actually are
uniform vec3  uSunDir;
uniform vec3  uSunColor;
uniform vec3  uSkyColor;
uniform vec3  uGroundColor;
uniform float uAmbient;
uniform float uLit;         // 0 = raw albedo (smoke reads better half-lit)

out vec2 vPos;
out vec4 vColor;

vec4 fetch(float i, float t) {
  float lin = i * 4.0 + t;
  float x = mod(lin, uDataSize.x);
  float y = floor(lin / uDataSize.x);
  return texture(uData, (vec2(x, y) + 0.5) / uDataSize);
}

mat3 quatToMat(vec4 q) {
  float x = q.x, y = q.y, z = q.z, w = q.w;
  return mat3(
    1.0 - 2.0*(y*y + z*z), 2.0*(x*y + z*w),       2.0*(x*z - y*w),
    2.0*(x*y - z*w),       1.0 - 2.0*(x*x + z*z), 2.0*(y*z + x*w),
    2.0*(x*z + y*w),       2.0*(y*z - x*w),       1.0 - 2.0*(x*x + y*y)
  );
}

void main() {
  vec4 p0 = fetch(aIndex, 0.0);
  vec4 p1 = fetch(aIndex, 1.0);
  vec4 p2 = fetch(aIndex, 2.0);
  vec4 p3 = fetch(aIndex, 3.0);

  float opacity = p0.w * uAlpha;
  if (opacity < 0.0035) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

  vec4 cam = modelViewMatrix * vec4(p0.xyz, 1.0);
  if (cam.z > -0.25) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

  // right-handed camera space with +z pointing away from the viewer
  vec3 t = vec3(cam.x, cam.y, -cam.z);
  mat3 flip = mat3(1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, -1.0);

  mat3 R = quatToMat(p2);

  // A = flip * MV3 * R * S, so camera-space covariance is A * A^T
  mat3 A = flip * mat3(modelViewMatrix) * R;
  A[0] *= p1.x * uScale;
  A[1] *= p1.y * uScale;
  A[2] *= p1.z * uScale;
  mat3 cov3 = A * transpose(A);

  // local affine approximation of the perspective projection, in pixels
  float fx = projectionMatrix[0][0] * 0.5 * uViewport.x;
  float fy = projectionMatrix[1][1] * 0.5 * uViewport.y;
  float iz = 1.0 / t.z;
  vec3 J0 = vec3(fx * iz, 0.0, -fx * t.x * iz * iz);
  vec3 J1 = vec3(0.0, fy * iz, -fy * t.y * iz * iz);

  // cov2d = J * cov3 * J^T, plus a low-pass so every splat covers a pixel
  vec3 c0 = cov3 * J0;
  vec3 c1 = cov3 * J1;
  float a = dot(J0, c0) + 0.30;
  float b = dot(J0, c1);
  float c = dot(J1, c1) + 0.30;

  float mid = 0.5 * (a + c);
  float rad = sqrt(max(1e-6, mid * mid - (a * c - b * b)));
  float l1 = mid + rad;
  float l2 = max(mid - rad, 0.08);

  vec2 dir = vec2(b, l1 - a);
  if (dot(dir, dir) < 1e-9) dir = vec2(1.0, 0.0);
  vec2 e1 = normalize(dir);
  vec2 e2 = vec2(-e1.y, e1.x);

  // clamp the screen footprint so a near-camera splat cannot eat the frame
  float s1 = min(sqrt(l1), 420.0);
  float s2 = min(sqrt(l2), 420.0);

  vec4 clip = projectionMatrix * cam;
  vec2 offset = corner.x * s1 * e1 + corner.y * s2 * e2;
  clip.xy += offset / uViewport * 2.0 * clip.w;
  gl_Position = clip;

  // distance fade keeps the far horizon from turning to mush
  float fade = 1.0 - smoothstep(uFade, uFade * 2.2, length(cam.xyz));

  // ---- shading ------------------------------------------------------
  vec3 world = (modelMatrix * vec4(p0.xyz, 1.0)).xyz;
  vec3 nrm = normalize(mat3(modelMatrix) * R[2]);
  vec3 toEye = normalize(cameraPosition - world);
  if (dot(nrm, toEye) < 0.0) nrm = -nrm;          // splats are two-sided sheets

  float ndl = max(dot(nrm, uSunDir), 0.0);
  // wrapped diffuse: canvas and smoke are thin, so light bleeds around them
  float wrap = max((dot(nrm, uSunDir) + 0.45) / 1.45, 0.0);
  vec3 hemi = mix(uGroundColor, uSkyColor, nrm.y * 0.5 + 0.5);

  vec3 albedo = p3.rgb;
  vec3 lit = albedo * (hemi * uAmbient + uSunColor * mix(ndl, wrap, 0.55));
  // a little grazing sheen picks out hull planking and wet timber
  lit += uSunColor * albedo * pow(1.0 - max(dot(nrm, toEye), 0.0), 5.0) * 0.09;

  vec3 shaded = mix(albedo, lit, uLit);
  shaded = mix(shaded, albedo * (1.0 + p1.w * 1.15), clamp(p1.w, 0.0, 1.0));

  vPos   = corner;
  vColor = vec4(shaded, opacity * fade);
}
`;

const FRAG = /* glsl */`
precision highp float;

in vec2 vPos;
in vec4 vColor;

layout(location = 0) out vec4 fragColor;

void main() {
  float r2 = dot(vPos, vPos);
  if (r2 > 9.0) discard;
  // exp(-4.5) is the value at the quad edge; removing it lands the falloff
  // on exactly zero there, so no splat can show its quad
  const float PEDESTAL = 0.011109;
  float g = (exp(-0.5 * r2) - PEDESTAL) / (1.0 - PEDESTAL);
  float alpha = vColor.a * g;
  if (alpha < 0.0035) discard;
  fragColor = vec4(vColor.rgb * alpha, alpha);   // premultiplied
}
`;

const TEX_W = 2048;

export class SplatMesh extends THREE.Mesh {
  /** @param {number} capacity maximum number of splats */
  constructor(capacity, { name = 'splats', sortEvery = 2, renderOrder = 0 } = {}) {
    const rows = Math.max(1, Math.ceil((capacity * 4) / TEX_W));
    const data = new Float32Array(TEX_W * rows * 4);

    const tex = new THREE.DataTexture(data, TEX_W, rows, THREE.RGBAFormat, THREE.FloatType);
    tex.needsUpdate = true;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([
      -3, -3,  3, -3,  3, 3,  -3, 3
    ]), 2));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1));

    const indices = new Float32Array(capacity);
    const idxAttr = new THREE.InstancedBufferAttribute(indices, 1);
    idxAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aIndex', idxAttr);
    geo.instanceCount = 0;
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    const mat = new THREE.RawShaderMaterial({
      uniforms: {
        uData:     { value: tex },
        uDataSize: { value: new THREE.Vector2(TEX_W, rows) },
        uViewport: { value: new THREE.Vector2(1, 1) },
        uScale:    { value: 1.0 },
        uAlpha:    { value: 1.0 },
        uFade:     { value: 260.0 },
        uSunDir:      { value: new THREE.Vector3(-0.72, 0.085, 0.30).normalize() },
        uSunColor:    { value: new THREE.Color(1.35, 0.92, 0.62) },
        uSkyColor:    { value: new THREE.Color(0.30, 0.42, 0.68) },
        uGroundColor: { value: new THREE.Color(0.10, 0.11, 0.14) },
        uAmbient:     { value: 0.85 },
        uLit:         { value: 1.0 }
      },
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor
    });

    super(geo, mat);

    this.name = name;
    this.frustumCulled = false;
    this.renderOrder = renderOrder;

    this.capacity = capacity;
    this.count = 0;
    this.data = data;
    this.texture = tex;
    this.indexAttr = idxAttr;
    this.indices = indices;

    // CPU-side mirror of positions, used for sorting and spatial queries
    this.px = new Float32Array(capacity);
    this.py = new Float32Array(capacity);
    this.pz = new Float32Array(capacity);

    this._sorter = new RadixDepthSorter(capacity);
    this._sortEvery = sortEvery;
    this._sortTick = Math.floor(Math.random() * sortEvery);
    this._dirty = true;
    this._lastDir = new THREE.Vector3(0, 0, 1);
  }

  /** Write one splat. `i` must be < capacity. */
  set(i, px, py, pz, sx, sy, sz, qx, qy, qz, qw, r, g, b, opacity, emissive = 0) {
    const o = i * 16;
    const d = this.data;
    d[o]      = px; d[o + 1]  = py; d[o + 2]  = pz; d[o + 3]  = opacity;
    d[o + 4]  = sx; d[o + 5]  = sy; d[o + 6]  = sz; d[o + 7]  = emissive;
    d[o + 8]  = qx; d[o + 9]  = qy; d[o + 10] = qz; d[o + 11] = qw;
    d[o + 12] = r;  d[o + 13] = g;  d[o + 14] = b;  d[o + 15] = 0;
    this.px[i] = px; this.py[i] = py; this.pz[i] = pz;
    this._dirty = true;
  }

  getOpacity(i) { return this.data[i * 16 + 3]; }
  setOpacity(i, v) { this.data[i * 16 + 3] = v; this._dirty = true; }

  getColor(i, out) {
    const o = i * 16 + 12;
    out.set(this.data[o], this.data[o + 1], this.data[o + 2]);
    return out;
  }
  setColor(i, r, g, b) {
    const o = i * 16 + 12;
    this.data[o] = r; this.data[o + 1] = g; this.data[o + 2] = b;
    this._dirty = true;
  }
  setPosition(i, x, y, z) {
    const o = i * 16;
    this.data[o] = x; this.data[o + 1] = y; this.data[o + 2] = z;
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this._dirty = true;
  }
  getScale(i, out) {
    const o = i * 16 + 4;
    out.set(this.data[o], this.data[o + 1], this.data[o + 2]);
    return out;
  }
  getQuat(i, out) {
    const o = i * 16 + 8;
    out.set(this.data[o], this.data[o + 1], this.data[o + 2], this.data[o + 3]);
    return out;
  }
  setEmissive(i, v) { this.data[i * 16 + 7] = v; this._dirty = true; }

  setCount(n) {
    this.count = Math.min(n, this.capacity);
    this.geometry.instanceCount = this.count;
  }

  /** Re-sort back-to-front for the given camera. Cheap: only the index buffer moves. */
  sort(camera, force = false) {
    if (this.count === 0) return;
    if (!force && (this._sortTick++ % this._sortEvery) !== 0) return;

    // view direction expressed in this mesh's local space
    const m = this._tmpMat || (this._tmpMat = new THREE.Matrix4());
    m.copy(this.matrixWorld).invert();
    const dir = this._lastDir.set(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .transformDirection(m)
      .normalize();

    this._sorter.sort(this.px, this.py, this.pz, this.count, dir.x, dir.y, dir.z, this.indices);
    this.indexAttr.addUpdateRange(0, this.count);
    this.indexAttr.needsUpdate = true;
  }

  /**
   * Re-upload everything after a GPU context loss. The CPU-side arrays
   * survive; only the GL objects are gone, so marking them dirty is enough.
   */
  restore() {
    this.texture.needsUpdate = true;
    this.indexAttr.needsUpdate = true;
    this._dirty = false;
  }

  flush() {
    if (this._dirty) { this.texture.needsUpdate = true; this._dirty = false; }
  }

  setViewport(w, h) { this.material.uniforms.uViewport.value.set(w, h); }

  /** Push the shared lighting environment onto this mesh. */
  setLighting({ sunDir, sunColor, skyColor, groundColor, ambient }) {
    const u = this.material.uniforms;
    if (sunDir) u.uSunDir.value.copy(sunDir);
    if (sunColor) u.uSunColor.value.copy(sunColor);
    if (skyColor) u.uSkyColor.value.copy(skyColor);
    if (groundColor) u.uGroundColor.value.copy(groundColor);
    if (ambient !== undefined) u.uAmbient.value = ambient;
  }
  set litAmount(v) { this.material.uniforms.uLit.value = v; }
  set splatScale(v) { this.material.uniforms.uScale.value = v; }
  set globalAlpha(v) { this.material.uniforms.uAlpha.value = v; }
  set fadeStart(v) { this.material.uniforms.uFade.value = v; }
}
