import * as THREE from 'three';
import { createOcean, createSky, waveAt } from './geometry/ocean.js';
import { World } from './sim/world.js';
import { OrbitRig, Director } from './sim/camera.js';
import { createComposer } from './fx/post.js';
import { FACTIONS } from './sim/factions.js';
import { SHIP } from './geometry/ship.js';
import { HUD } from './ui/hud.js';
import { ImpactShowcase } from './fx/showcase.js';
import { AnatomyPanel } from './ui/anatomy.js';
import { Genesis } from './fx/genesis.js';
import { GenesisPanel } from './ui/genesisPanel.js';
import { connectFootron } from './footron.js';
import { explosion as explosionFx } from './fx/emitters.js';

// ---------------------------------------------------------------- environment

const ENV = {
  calm: {
    zenith:  0x0b1830,
    horizon: 0xe8945a,
    reflect: 0x3f5a86,          // what the sea mirrors: the whole dome, not the sunset band
    deep:    0x030a14,
    shallow: 0x0c3b5c,
    sunColor: 0xffb469,
    sunDir: new THREE.Vector3(-0.72, 0.085, 0.30).normalize(),
    exposure: 1.12, bloom: 0.62,
    // splat lighting
    sun: [1.45, 0.95, 0.58], skyLight: [0.26, 0.38, 0.62], groundLight: [0.09, 0.08, 0.10], ambient: 0.80
  },
  storm: {
    zenith:  0x070b14,
    horizon: 0x4a4352,
    reflect: 0x2c3242,
    deep:    0x02060c,
    shallow: 0x0a2637,
    sunColor: 0x8fa2c0,
    sunDir: new THREE.Vector3(-0.72, 0.16, 0.30).normalize(),
    exposure: 0.95, bloom: 0.82,
    sun: [0.62, 0.70, 0.86], skyLight: [0.20, 0.24, 0.34], groundLight: [0.05, 0.06, 0.08], ambient: 0.92
  }
};

// ---------------------------------------------------------------- renderer

const canvas = document.getElementById('stage');
// ?capture keeps the drawing buffer readable for offline screenshot tooling
const CAPTURE = new URLSearchParams(location.search).has('capture');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: false, alpha: false,
  powerPreference: 'high-performance', stencil: false,
  preserveDrawingBuffer: CAPTURE
});
if (!renderer.capabilities.isWebGL2) {
  document.getElementById('bootTxt').textContent = 'WebGL 2 is required';
  throw new Error('WebGL2 required');
}
renderer.setClearColor(0x05070c, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;   // the grade pass does it

let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 4000);
camera.position.set(120, 34, 120);

// pick a density that a weaker GPU can still carry
const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700;
const density = isSmall ? 0.72 : 1.0;

const sky = createSky(ENV.calm);
scene.add(sky);
const ocean = createOcean(ENV.calm);
scene.add(ocean);

const world = new World(scene, {
  density,
  dynamicCapacity: isSmall ? 14000 : 26000,
  deferFleet: true
});

const { composer, bloom, grade } = createComposer(renderer, scene, camera);
const rig = new OrbitRig(canvas);
rig.onInput = () => markInput();
const director = new Director(world);
const hud = new HUD(world);
const showcase = new ImpactShowcase(world, new AnatomyPanel());

let genesis = null;
const genesisPanel = new GenesisPanel();
const _genPos = new THREE.Vector3();
const _genLook = new THREE.Vector3();

// ---------------------------------------------------------------- state

const MODE = { IDLE: 'idle', PLAY: 'play' };
let mode = MODE.IDLE;
let idleAfter = 32;          // seconds of no input before the attract loop resumes
let lastInput = -1e9;
let stormy = false;
let envMix = 0;              // 0 = calm, 1 = storm
let camPreset = 0;           // 0 orbit, 1 follow, 2 cinematic
const CAM_NAMES = ['Orbit', 'Follow', 'Cinematic'];
let victoryAt = -1;
let fadeOut = 0;
let fadeGoal = 0;
const explosionFor = (p, power) => explosionFx(world.fx, p, power);
let restarting = false;
let captureCam = null;      // set only by offline screenshot tooling
let paused = false;
let timeScale = 1;

// ---------------------------------------------------------------- boot

const bootEl = document.getElementById('boot');
const bootFill = document.getElementById('bootFill');
const bootTxt = document.getElementById('bootTxt');

(async function boot() {
  bootFill.style.width = '6%';
  await new Promise(r => requestAnimationFrame(r));
  await world.spawnFleetAsync((p, name) => {
    bootFill.style.width = `${6 + p * 92}%`;
    bootTxt.textContent = `Splatting ${name}…`;
  });
  bootTxt.textContent = `${world.totalSplats.toLocaleString()} gaussians afloat`;
  bootFill.style.width = '100%';
  hud.rebuild();
  showcase.rearm();
  world.sortAll(camera);
  beginGenesis();
  setTimeout(() => bootEl.classList.add('done'), 420);
  requestAnimationFrame(loop);
})();

/**
 * The opening explainer. It runs on the real splat data of the lead ship —
 * the cloud that scatters and reassembles is literally her own Gaussians — so
 * by the time the battle starts the viewer has seen the primitive, watched a
 * hull built out of it, and knows what is coming apart when a shot lands.
 */
function beginGenesis() {
  const lead = world.ships[0];
  if (!lead) return;

  // hold the fleet still and out of shot while the lead ship assembles
  world.ships.forEach((s, i) => { s.mesh.visible = i === 0; });
  lead.pos.set(0, 0, 0);
  lead.heading = -0.35;
  lead.targetHeading = -0.35;
  lead.update(0.0001, world.time, world.swell);

  showcase.enabled = false;
  // she is a cloud until the last beat, so nothing about her should occlude
  world.ships.forEach(s => s.setProxiesVisible(false));
  genesis = new Genesis(lead, genesisPanel);
  genesis.start();
  genesisPanel.show();
}

function endGenesis() {
  genesis = null;
  world.ships.forEach(s => { s.mesh.visible = true; s.setProxiesVisible(true); });
  showcase.enabled = true;
  // The genesis has just spent twenty seconds on captions; give the battle a
  // proper run before the next explainer, or the piece reads as a slideshow.
  showcase.rearm(26);
  genesisPanel.hide();
  director.cut();
}

// ---------------------------------------------------------------- input

function markInput() {
  lastInput = clock;
  if (genesis) { genesis.skip(); endGenesis(); return; }
  showcase.dismiss();
  if (mode === MODE.IDLE) enterPlay();
}

/** The distance that frames the whole engagement right now. */
function framingDistance() {
  return THREE.MathUtils.clamp(world.battleRadius(rig.target) * 2.0 + 38, 50, 165);
}

function enterPlay() {
  mode = MODE.PLAY;
  lastInput = clock;          // taking the helm counts as input

  document.body.classList.add('mode-play');
  // Seed the orbit rig from wherever the director left the camera, so the
  // handover reads as taking the wheel rather than a cut — but keep it near
  // a distance that actually frames the battle. Inheriting a wide establishing
  // shot verbatim strands the viewer 190 units out, staring at four specks,
  // for the several seconds the auto-framing takes to ease in.
  const c = world.battleCenter(new THREE.Vector3());
  const d = camera.position.clone().sub(c);
  rig.target.copy(c);
  rig.smoothTarget.copy(c);
  const want = framingDistance();
  rig.dist = rig.distGoal = THREE.MathUtils.clamp(d.length(), Math.max(30, want * 0.5), want * 1.25);
  rig.az = rig.azGoal = Math.atan2(d.z, d.x);
  rig.el = rig.elGoal = Math.asin(THREE.MathUtils.clamp(d.y / Math.max(d.length(), 1e-3), -0.05, 0.95));
  camPreset = 0;
  hud.setCamLabel(CAM_NAMES[0]);
  if (camera.fov !== 42) { camera.fov = 42; camera.updateProjectionMatrix(); }
}

function enterIdle() {
  mode = MODE.IDLE;
  document.body.classList.remove('mode-play');
  director.cut();
  hud.clearTarget();
}

canvas.addEventListener('pointerdown', markInput);
window.addEventListener('wheel', markInput, { passive: true });

// --- picking -----------------------------------------------------------

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const _sphere = new THREE.Sphere();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hit = new THREE.Vector3();

function pick(clientX, clientY) {
  ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);

  // ships first, nearest wins
  let best = null, bestT = Infinity;
  for (const s of world.ships) {
    if (s.dead) continue;
    _sphere.center.copy(s.mesh.position).setY(s.mesh.position.y + 8);
    _sphere.radius = SHIP.L * 0.55;
    const p = ray.ray.intersectSphere(_sphere, _hit);
    if (p) {
      const t = p.distanceTo(camera.position);
      if (t < bestT) { bestT = t; best = s; }
    }
  }
  if (best) return { ship: best };

  const p = ray.ray.intersectPlane(_plane, _hit);
  if (p) {
    const d = p.distanceTo(camera.position);
    if (d < 900) return { sea: p.clone() };
  }
  return null;
}

canvas.addEventListener('pointerup', (e) => {
  if (mode !== MODE.PLAY) return;
  if (rig.dragged) return;                 // that was a camera move, not a tap
  const r = pick(e.clientX, e.clientY);
  if (!r) return;

  if (r.ship) {
    world.playerTarget = r.ship;
    hud.setTarget(r.ship);
    // every enemy that can bring guns to bear answers the call
    const foes = world.ships.filter(s => !s.dead && !s.sinking && s.faction.key !== r.ship.faction.key);
    foes.sort((a, b) => a.pos.distanceTo(r.ship.pos) - b.pos.distanceTo(r.ship.pos));
    const aim = r.ship.pos.clone().setY(3.2);
    foes.slice(0, 2).forEach((f, i) => setTimeout(() => world.orderBroadside(f, aim), i * 320));
  } else if (r.sea) {
    const h = waveAt(r.sea.x, r.sea.z, world.time, world.swell, new THREE.Vector3()).y;
    const aim = r.sea.clone().setY(h + 0.5);
    let near = null, nd = Infinity;
    for (const s of world.ships) {
      if (s.dead || s.sinking) continue;
      const d = s.pos.distanceTo(aim);
      if (d < nd) { nd = d; near = s; }
    }
    if (near) world.orderBroadside(near, aim, 0.7);
    hud.pingMarker(e.clientX, e.clientY);
  }
});

// --- commands ----------------------------------------------------------

function volley(factionKey) {
  const f = FACTIONS[factionKey];
  const mine = world.living(f);
  if (!mine.length) return;
  mine.forEach((s, i) => {
    const foes = world.enemiesOf(s).filter(e => !e.sinking);
    if (!foes.length) return;
    foes.sort((a, b) => a.pos.distanceTo(s.pos) - b.pos.distanceTo(s.pos));
    const t = world.playerTarget && !world.playerTarget.dead &&
      world.playerTarget.faction.key !== f.key ? world.playerTarget : foes[0];
    const flight = t.pos.distanceTo(s.pos) / 74;
    const lead = new THREE.Vector3(Math.cos(t.heading), 0, Math.sin(t.heading))
      .multiplyScalar(t.speed * flight * 1.25);
    setTimeout(() => world.orderBroadside(s, t.pos.clone().add(lead).setY(3.2)), i * 260);
  });
}

function cycleCamera() {
  camPreset = (camPreset + 1) % CAM_NAMES.length;
  hud.setCamLabel(CAM_NAMES[camPreset]);
  if (camPreset === 2) director.cut();
  if (camPreset !== 2 && camera.fov !== 42) { camera.fov = 42; camera.updateProjectionMatrix(); }
}

function toggleStorm() {
  stormy = !stormy;
  world.stormTarget = stormy ? 2.35 : 1.0;
  hud.setStormLabel(stormy ? 'Calm the sea' : 'Summon squall');
}

/** Dip to black, swap the fleet, and come back up. */
async function fadeThrough(fn) {
  fadeGoal = 1;
  await new Promise(r => setTimeout(r, 750));
  await fn();
  fadeGoal = 0;
}

async function resetFleet({ silent = false } = {}) {
  if (!silent) {
    bootEl.classList.remove('done');
    bootTxt.textContent = 'Raising the fleet…';
    bootFill.style.width = '4%';
  }
  world.playerTarget = null;
  hud.clearTarget();
  victoryAt = -1;
  await world.spawnFleetAsync((p, name) => {
    if (silent) return;
    bootFill.style.width = `${4 + p * 94}%`;
    bootTxt.textContent = `Splatting ${name}…`;
  });
  world.sortAll(camera);
  hud.rebuild();
  if (!silent) bootEl.classList.add('done');
  stormy = false;
  world.stormTarget = 1.0;
  hud.setStormLabel('Summon squall');
  showcase.rearm();
  director.cut();
}

hud.onAction((act) => {
  markInput();
  if (act === 'broadsideA') volley('crimson');
  else if (act === 'broadsideB') volley('azure');
  else if (act === 'camera') cycleCamera();
  else if (act === 'storm') toggleStorm();
  else if (act === 'reset') resetFleet();
});

/**
 * Everything the phone can ask for. These are the same entry points the
 * on-wall buttons use, deliberately: one code path means the controls cannot
 * drift away from what the wall actually does.
 */
const footron = connectFootron({
  markInput,
  volley,
  camera(which) {
    const i = CAM_NAMES.findIndex(n => n.toLowerCase() === String(which).toLowerCase());
    if (i >= 0) { camPreset = i; hud.setCamLabel(CAM_NAMES[i]); if (i === 2) director.cut(); }
    else cycleCamera();
  },
  target(i) {
    const s = world.ships[i];
    if (!s || s.dead) return;
    world.playerTarget = s;
    hud.setTarget(s);
    const foes = world.ships.filter(x => !x.dead && !x.sinking && x.faction.key !== s.faction.key);
    foes.sort((a, b) => a.pos.distanceTo(s.pos) - b.pos.distanceTo(s.pos));
    const aim = s.pos.clone().setY(3.2);
    foes.slice(0, 2).forEach((f, k) => setTimeout(() => world.orderBroadside(f, aim), k * 320));
  },
  storm(on) { if (on !== stormy) toggleStorm(); },
  reset() { resetFleet(); },
  replay() { beginGenesis(); },
  release() { enterIdle(); }
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'q') { markInput(); volley('crimson'); }
  else if (k === 'e') { markInput(); volley('azure'); }
  else if (k === 'c') { markInput(); cycleCamera(); }
  else if (k === 's') { markInput(); toggleStorm(); }
  else if (k === 'r') { markInput(); resetFleet(); }
  else if (k === 'escape') enterIdle();
  else if (k === ' ') { e.preventDefault(); markInput(); volley('crimson'); volley('azure'); }
});

// ---------------------------------------------------------------- resize

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(w, h, false);
  composer.setPixelRatio?.(pixelRatio);
  composer.setSize(w, h);
  bloom.setSize(w * pixelRatio, h * pixelRatio);
  const buf = renderer.getDrawingBufferSize(new THREE.Vector2());
  world.setViewport(buf.x, buf.y);
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------- GPU context recovery

/**
 * A wall display runs unattended, and a lost WebGL context — GPU reset,
 * driver update, the compositor reclaiming memory — otherwise leaves a black
 * screen that nobody is there to reload. Everything needed to rebuild is
 * still in CPU-side typed arrays, so recovery is a re-upload, not a rebuild.
 */
let contextLost = false;

canvas.addEventListener('webglcontextlost', (e) => {
  // without this the browser will not even try to give the context back
  e.preventDefault();
  contextLost = true;
  bootEl.classList.remove('done');
  bootTxt.textContent = 'Recovering the display…';
  bootFill.style.width = '35%';
}, false);

canvas.addEventListener('webglcontextrestored', () => {
  try {
    renderer.resetState();
    resize();
    for (const s of world.ships) s.mesh.restore();
    world.fx.mesh.restore();
    world.ballMesh.instanceMatrix.needsUpdate = true;
    sky.material.needsUpdate = true;
    ocean.material.needsUpdate = true;
    world.sortAll(camera);
    bootFill.style.width = '100%';
    bootEl.classList.add('done');
    contextLost = false;
    last = performance.now();     // do not integrate the whole outage at once
  } catch (err) {
    bootTxt.textContent = 'Display recovery failed — reload required';
  }
}, false);

// ---------------------------------------------------- adaptive resolution

let frameAcc = 0, frameN = 0, lastAdapt = 0;
function adapt(dtMs) {
  frameAcc += dtMs; frameN++;
  if (clock - lastAdapt < 1.5) return;
  const avg = frameAcc / Math.max(1, frameN);
  frameAcc = 0; frameN = 0; lastAdapt = clock;
  const cap = Math.min(window.devicePixelRatio || 1, 1.5);
  let next = pixelRatio;
  if (avg > 24 && pixelRatio > 0.62) next = Math.max(0.62, pixelRatio - 0.12);
  else if (avg < 13.5 && pixelRatio < cap) next = Math.min(cap, pixelRatio + 0.08);
  if (Math.abs(next - pixelRatio) > 0.01) { pixelRatio = next; resize(); }
}

// ---------------------------------------------------------------- loop

const _tmp = new THREE.Vector3();
const _flashCol = new THREE.Color();
let clock = 0;
let last = performance.now();
let fps = 60;

function mixRGB(target, ka, kb, u) {
  target.setRGB(
    THREE.MathUtils.lerp(ka[0], kb[0], u),
    THREE.MathUtils.lerp(ka[1], kb[1], u),
    THREE.MathUtils.lerp(ka[2], kb[2], u)
  );
}

function updateEnvironment(dt) {
  const goal = stormy ? 1 : 0;
  envMix += (goal - envMix) * Math.min(1, dt * 0.5);
  const a = ENV.calm, b = ENV.storm;
  const lerpC = (u, ka, kb) => u.value.setHex(ka).lerp(new THREE.Color(kb), envMix);

  lerpC(sky.material.uniforms.uZenith, a.zenith, b.zenith);
  lerpC(sky.material.uniforms.uHorizon, a.horizon, b.horizon);
  lerpC(sky.material.uniforms.uSunColor, a.sunColor, b.sunColor);
  lerpC(ocean.material.uniforms.uDeep, a.deep, b.deep);
  lerpC(ocean.material.uniforms.uShallow, a.shallow, b.shallow);
  lerpC(ocean.material.uniforms.uSky, a.horizon, b.horizon);
  lerpC(ocean.material.uniforms.uReflect, a.reflect, b.reflect);
  lerpC(ocean.material.uniforms.uSunColor, a.sunColor, b.sunColor);
  sky.material.uniforms.uSunDir.value.copy(a.sunDir).lerp(b.sunDir, envMix).normalize();
  ocean.material.uniforms.uSunDir.value.copy(sky.material.uniforms.uSunDir.value);

  // the splat clouds are lit by the same sun and sky as the water
  const L = world.lighting;
  L.sunDir.copy(sky.material.uniforms.uSunDir.value);
  mixRGB(L.sunColor, a.sun, b.sun, envMix);
  mixRGB(L.skyColor, a.skyLight, b.skyLight, envMix);
  mixRGB(L.groundColor, a.groundLight, b.groundLight, envMix);
  L.ambient = THREE.MathUtils.lerp(a.ambient, b.ambient, envMix);
  world.setLighting(L);

  sky.material.uniforms.uTime.value = world.time;
  ocean.material.uniforms.uTime.value = world.time;
  ocean.material.uniforms.uSwell.value = world.swell;

  const crimson = world.living(FACTIONS.crimson)[0];
  const azure = world.living(FACTIONS.azure)[0];
  ocean.material.uniforms.uShipA.value.copy(crimson ? crimson.pos : _tmp.set(0, 0, 0));
  ocean.material.uniforms.uShipB.value.copy(azure ? azure.pos : _tmp.set(0, 0, 0));
}

/** Feed the brightest live flash to the water shader and the exposure. */
function applyFlashes() {
  let best = null, bestI = 0;
  for (const f of world.flashes) {
    const k = f.intensity * (1 - f.t / f.life);
    if (k > bestI) { bestI = k; best = f; }
  }
  if (best) {
    ocean.material.uniforms.uFlashPos.value.copy(best.pos);
    _flashCol.copy(best.color).multiplyScalar(Math.min(2.2, bestI * 0.30));
    ocean.material.uniforms.uFlashColor.value.copy(_flashCol);
  } else {
    ocean.material.uniforms.uFlashColor.value.setRGB(0, 0, 0);
  }
  return bestI;
}

function loop(now) {
  requestAnimationFrame(loop);
  // nothing to draw into until the GPU gives the context back
  if (contextLost) { last = now; return; }
  const dtMs = Math.min(64, now - last);
  last = now;
  const dt = dtMs / 1000;
  clock += dt;
  fps += ((1000 / Math.max(dtMs, 1)) - fps) * 0.08;

  if (genesis) {
    genesis.update(dt);
    // the sea and sky still live; the fleet does not sail until she is built
    world.time += dt;
    world.fx.update(dt, world.time, world.swell);
    if (genesis.done) endGenesis();
  } else if (!paused) {
    world.update(dt * timeScale * showcase.timeScale, dt);
  }
  updateEnvironment(dt);
  const flashI = applyFlashes();

  // ---- camera
  if (!genesis) {
    // the attract loop and the cinematic preset are where this moment does the
    // most work, and it runs more often there
    showcase.cinematic = (mode === MODE.IDLE) || camPreset === 2;
    showcase.update(dt, camera, world.time, world.swell);
    world.fx.reveal = showcase.reveal;
  }

  if (captureCam) {
    captureCam(camera, world, dt);
  } else if (genesis) {
    genesis.camera(_genPos, _genLook);
    camera.position.copy(_genPos);
    camera.lookAt(_genLook);
  } else if (showcase.active) {
    // the showcase has already placed the camera
  } else if (mode === MODE.IDLE) {
    director.update(dt, camera, world.time, world.swell);
  } else if (camPreset === 2) {
    director.update(dt, camera, world.time, world.swell);
  } else {
    if (camPreset === 1) {
      const t = (world.playerTarget && !world.playerTarget.dead)
        ? world.playerTarget
        : world.ships.find(s => !s.dead);
      if (t) rig.target.copy(t.mesh.position).setY(t.mesh.position.y + 7);
      rig.azGoal += dt * 0.035;
    } else {
      world.battleCenter(rig.target);
      // gently widen or close the shot so the whole action stays framed,
      // unless the viewer has touched the zoom in the last few seconds
      if (clock - lastInput > 4) {
        rig.distGoal += (framingDistance() - rig.distGoal) * Math.min(1, dt * 0.22);
      }
    }
    rig.apply(camera, dt);
  }

  // ---- broadside shake
  if (world.shake > 0.001) {
    const s = world.shake * world.shake * 0.55;
    camera.position.x += Math.sin(clock * 61.3) * s;
    camera.position.y += Math.sin(clock * 47.7 + 1.3) * s;
    camera.position.z += Math.cos(clock * 53.1) * s;
  }

  sky.position.copy(camera.position);
  // the ocean disc rides with the viewer so its dense rings are always underfoot
  ocean.material.uniforms.uOrigin.value.set(camera.position.x, 0, camera.position.z);
  camera.updateMatrixWorld();

  world.sortAll(camera);

  // ---- grade
  const g = grade.uniforms;
  g.uTime.value = clock;
  const baseExp = THREE.MathUtils.lerp(ENV.calm.exposure, ENV.storm.exposure, envMix)
    + showcase.reveal * 0.22;
  // a flash lifts the exposure a touch; it must never blow the frame to white
  g.uExposure.value += (baseExp + Math.min(0.20, flashI * 0.016) - g.uExposure.value) * Math.min(1, dt * 9);
  g.uVignette.value = showcase.active ? 1.16 : (mode === MODE.IDLE ? 1.22 : 0.92);
  g.uSaturation.value = mode === MODE.IDLE ? 1.10 : 1.04;
  g.uGrain.value = mode === MODE.IDLE ? 0.042 : 0.028;
  fadeOut += (fadeGoal - fadeOut) * Math.min(1, dt * (fadeGoal > fadeOut ? 3.2 : 1.6));
  g.uFade.value = fadeOut;
  bloom.strength = THREE.MathUtils.lerp(ENV.calm.bloom, ENV.storm.bloom, envMix)
    + Math.min(0.28, flashI * 0.020) - showcase.reveal * 0.30;

  composer.render();

  // ---- housekeeping
  if (mode === MODE.PLAY && clock - lastInput > idleAfter) enterIdle();

  // the battle restarts itself so the attract loop never runs dry
  if (!genesis && world.allOneSideLeft()) {
    if (victoryAt < 0) victoryAt = clock;
    else if (clock - victoryAt > 11 && !restarting) {
      restarting = true;
      victoryAt = -1;
      // let the victor hold the frame, then dip out and raise a fresh fleet
      fadeThrough(() => resetFleet({ silent: mode === MODE.IDLE }))
        .finally(() => { restarting = false; });
    }
  } else victoryAt = -1;

  hud.update(dt, { fps, mode, splats: world.liveSplatCount(), shots: world.shotsFired });
  adapt(dtMs);
}

if (CAPTURE) {
  // expose a handle so tooling can drive the scene deterministically
  window.__fleet = {
    world, camera, rig, director, renderer, footron,
    play: () => enterPlay(),
    idle: () => enterIdle(),
    setCam: (i) => { camPreset = i; hud.setCamLabel(CAM_NAMES[i]); },
    storm: () => toggleStorm(),
    volley,
    showcase,
    genesis: () => genesis,
    replayGenesis: () => beginGenesis(),
    /** Lock the camera to a ship-relative offset for deterministic captures. */
    lockTo(shipIndex, off, lookOff = [0, 6, 0]) {
      enterPlay();
      captureCam = (cam, w) => {
        const s = w.ships[shipIndex] || w.ships.find(x => !x.dead);
        if (!s) return;
        cam.position.set(off[0], off[1], off[2]).applyMatrix4(s.mesh.matrixWorld);
        const look = new THREE.Vector3(lookOff[0], lookOff[1], lookOff[2]).applyMatrix4(s.mesh.matrixWorld);
        cam.lookAt(look);
      };
    },
    lockWorld(pos, look) {
      enterPlay();
      captureCam = (cam) => { cam.position.set(...pos); cam.lookAt(...look); };
    },
    unlock() { captureCam = null; },
    /** Freeze the sim so a capture is reproducible frame to frame. */
    pause(v = true) { paused = v; },
    /** Slow the sim down to inspect an impact as it happens. */
    slow(k = 1) { timeScale = k; },
    /** Advance the frozen sim by a fixed step. */
    step(dt = 1 / 60) { world.update(dt); },
    /** Land a hit at a local point on a ship, for effect review. */
    hit(shipIndex = 0, local = [0, 4, 4], radius = 2.6, power = 1.3, dir = [0, 0, -1]) {
      const s = world.ships[shipIndex];
      const p = new THREE.Vector3(...local);
      const d = new THREE.Vector3(...dir).normalize();
      const removed = s.impact(p, radius, power, world.fx, { dir: d });
      const w = p.clone().applyMatrix4(s.mesh.matrixWorld);
      explosionFor(w, power);
      world.flashes.push({ pos: w.clone(), t: 0, life: 0.28,
        color: new THREE.Color(1, 0.58, 0.22), intensity: 7.5 * power });
      // go through the same notification a real detonation uses, so the
      // showcase sees debug hits too
      world.onHit?.({
        ship: s, removed, power, radius,
        fragments: s.lastDebrisMade,
        local: p.clone(), world: w.clone(),
        dir: d.clone().applyQuaternion(s.mesh.quaternion), debris: world.fx.aliveCount
      });
      return removed;
    },
    /** Tint every splat by its PART id, to see what is actually where. */
    debugParts(on = true) {
      const PAL = [[.9,.2,.2],[.2,.9,.3],[.95,.85,.2],[.2,.5,1],[1,1,1],
                   [1,.4,.9],[.1,.9,.9],[1,.6,.1],[.6,.2,1],[.5,.5,.5]];
      for (const s of world.ships) {
        if (on) {
          if (!s._origCol) s._origCol = s.data.col.slice();
          for (let i = 0; i < s.splatCount; i++) {
            const c = PAL[s.part[i]] || [1, 0, 1];
            s.mesh.setColor(i, c[0], c[1], c[2]);
          }
        } else if (s._origCol) {
          for (let i = 0; i < s.splatCount; i++) {
            s.mesh.setColor(i, s._origCol[i * 3], s._origCol[i * 3 + 1], s._origCol[i * 3 + 2]);
          }
        }
        s.mesh.litAmount = on ? 0 : 1;
        s.mesh.flush();
      }
    },
    /** Isolate one ship at the origin for geometry review. */
    solo(index = 0) {
      paused = true;
      world.ships.forEach((s, i) => { s.mesh.visible = i === index; });
      const s = world.ships[index];
      s.pos.set(0, 0, 0);
      s.heading = 0;
      s.update(0.0001, 0, 0);
      world.fx.mesh.visible = false;
    }
  };
}
