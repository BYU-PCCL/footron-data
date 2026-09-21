import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/**
 * Everything upstream renders in linear HDR. This final pass does the grade:
 * ACES tonemap, subtle chromatic aberration, vignette, film grain and a
 * muzzle-flash exposure kick, then encodes to sRGB for the display.
 */
const GradeShader = {
  uniforms: {
    tDiffuse:   { value: null },
    uTime:      { value: 0 },
    uExposure:  { value: 1.0 },
    uVignette:  { value: 1.0 },
    uGrain:     { value: 0.035 },
    uAberration:{ value: 1.0 },
    uSaturation:{ value: 1.06 },
    uLetterbox: { value: 0.0 },
    uFade:      { value: 0.0 }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uExposure, uVignette, uGrain, uAberration, uSaturation, uFade;
    varying vec2 vUv;

    // Narkowicz ACES approximation
    vec3 aces(vec3 x) {
      const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec2 uv = vUv;
      vec2 fromC = uv - 0.5;
      float r2 = dot(fromC, fromC);

      // lateral chromatic aberration grows toward the corners
      float ab = 0.0016 * uAberration * r2;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + fromC * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - fromC * ab).b;

      col *= uExposure;
      col = aces(col);

      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, uSaturation);

      // gentle lift in the shadows, cool toe
      col = pow(col, vec3(0.98, 1.0, 1.02));
      col += vec3(0.010, 0.013, 0.022) * (1.0 - l);

      float vig = 1.0 - uVignette * smoothstep(0.18, 0.78, r2);
      col *= vig;

      float g = hash(uv * vec2(1920.0, 1080.0) + fract(uTime) * 91.7) - 0.5;
      col += g * uGrain * (1.0 - 0.6 * l);

      col *= (1.0 - uFade);

      // linear -> sRGB
      col = mix(col * 12.92, 1.055 * pow(max(col, 1e-5), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, col));
      gl_FragColor = vec4(col, 1.0);
    }
  `
};

export function createComposer(renderer, scene, camera) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: 0,
    depthBuffer: true,
    stencilBuffer: false
  });

  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(size, 0.62, 0.72, 0.82);
  composer.addPass(bloom);

  const grade = new ShaderPass(GradeShader);
  grade.renderToScreen = true;
  composer.addPass(grade);

  return { composer, bloom, grade };
}
