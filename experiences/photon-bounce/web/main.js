(function () {
  (function guard() {
    var test = document.createElement('canvas').getContext('webgl2');
    var floatOk = test && test.getExtension('EXT_color_buffer_float');
    if (test && floatOk) return;
    document.getElementById('stage').innerHTML =
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
      'font-family:\'Inter\',\'Segoe UI\',system-ui,sans-serif;color:rgba(255,255,255,0.8);font-size:48px;">' +
      'Photon Bounce needs a WebGL2 display — exhibit hardware only.</div>';
    throw new Error('WebGL2/float buffers unavailable');
  })();

  var canvas = document.getElementById('gl');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(CONFIG.WALL_W, CONFIG.WALL_H, false);
  renderer.autoClear = false;

  var sceneDef = SceneDef.createScene();

  // ── Left viewport: blueprint scene ──
  var simScene = new THREE.Scene();
  simScene.background = new THREE.Color(0x0a0a12);
  simScene.add(Blueprint.build(sceneDef));

  var halfW = CONFIG.WALL_W / 2;
  var simCam = new THREE.PerspectiveCamera(
    sceneDef.camera.fovDeg, halfW / CONFIG.WALL_H, 0.05, 50);
  simCam.position.fromArray(sceneDef.camera.pos);
  simCam.lookAt(new THREE.Vector3().fromArray(sceneDef.camera.target));

  // Lamp orb (shared visual in the sim half).
  //
  // An opaque MeshBasicMaterial sphere read as a paper cutout: it punched an
  // solid hole in the wireframe behind it, which is the wrong impression in a
  // panel whose subject is light travelling through the room. It is now a
  // small additive core inside a larger additive halo, so the blueprint stays
  // visible through it and the orb reads as emitting rather than occluding --
  // the left-hand counterpart of the bloom on the render side.
  var lampWorld = sceneDef.attractPath[0].slice();
  var lampMesh = new THREE.Group();
  var lampCore = new THREE.Mesh(
    new THREE.SphereGeometry(CONFIG.LAMP.RADIUS, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffe0b0, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  lampMesh.add(lampCore);
  // Radial-gradient sprite for the halo. A texture beats stacked shells: it
  // is one draw call, always faces the camera, and falls off smoothly instead
  // of banding at each shell boundary.
  var haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 128;
  var hx = haloCanvas.getContext('2d');
  var grad = hx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.00, 'rgba(255,224,176,0.85)');
  grad.addColorStop(0.25, 'rgba(232,167,101,0.38)');
  grad.addColorStop(1.00, 'rgba(232,167,101,0)');
  hx.fillStyle = grad;
  hx.fillRect(0, 0, 128, 128);
  var haloTex = new THREE.CanvasTexture(haloCanvas);
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: false, transparent: true
  }));
  halo.scale.setScalar(CONFIG.LAMP.RADIUS * 9);
  lampMesh.add(halo);
  lampMesh.position.fromArray(lampWorld);
  simScene.add(lampMesh);

  var photonSim = PhotonSim.create(simScene, sceneDef);
  var pathTracer = PathTracer.create(renderer, sceneDef);
  var lastT = performance.now();
  var lastMeterT = 0;

  // ── Exhibit state machine, messaging, and lamp easing ──
  var CAPTIONS = [
    'Every pixel is the sum of millions of simulated light paths.',
    'When the light moves, the computer starts over from noise.',
    'Photons pick up color from the surfaces they bounce off.',
    'This is how animated films and video games light their worlds.'
  ];
  var exhibit = ExhibitState.createExhibitState(CONFIG, sceneDef.attractPath, CAPTIONS);
  var coalescer = Messages.createCoalescer();
  var lampCurrent = sceneDef.attractPath[0].slice();
  var lampTarget = lampCurrent.slice();
  var lampEaseFrom = lampCurrent.slice();
  var lampEaseStart = -1;
  var lastMoveMsgAt = -Infinity;
  var lastStatsAt = 0;
  var previewOn = false;

  Messaging.connect(CONFIG.ROUTER_URL,
    function onMessage(body) {
      var m = Messages.validateMove(body);
      if (m) coalescer.push(m);
    },
    function onConnect() { exhibit.onConnect(performance.now()); },
    function onDisconnect() { exhibit.onDisconnect(performance.now()); }
  );


  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function setLampTarget(world, nowT) {
    if (world[0] === lampTarget[0] && world[1] === lampTarget[1] && world[2] === lampTarget[2]) return;
    lampEaseFrom = lampCurrent.slice();
    lampTarget = world.slice();
    lampEaseStart = nowT;
  }

  function render() {
    var nowT = performance.now();
    var dtMs = Math.min(100, nowT - lastT);
    lastT = nowT;

    // 1. Drain controller input. A move whose coordinates are unchanged must
    // NOT open a preview window: preview forces the accumulator to zero every
    // frame and resets it again on exit, so a visitor resting a finger on the
    // pad (touchscreens keep emitting pointermove while stationary) would hold
    // the render permanently in noisy preview and never see it converge.
    var mv = coalescer.take();
    if (mv) {
      var world = SceneDef.lampFromNormalized(mv.x, mv.y, mv.h);
      exhibit.onMove(nowT, world);
      if (world[0] !== lampTarget[0] || world[1] !== lampTarget[1] || world[2] !== lampTarget[2]) {
        lastMoveMsgAt = nowT;
      }
    }

    // 2. State machine
    var s = exhibit.tick(nowT);
    setLampTarget(s.lampTarget, nowT);
    UI.setCaption(s.caption);

    // 3. Ease lamp; attract travel uses ATTRACT.TRAVEL_MS, interactive uses LAMP.EASE_MS
    var easeMs = s.mode === 'attract' ? CONFIG.ATTRACT.TRAVEL_MS : CONFIG.LAMP.EASE_MS;
    if (lampEaseStart >= 0) {
      var t = Math.min(1, (nowT - lampEaseStart) / easeMs);
      var e = easeInOut(t);
      var moved = false;
      for (var i = 0; i < 3; i++) {
        var v = lampEaseFrom[i] + (lampTarget[i] - lampEaseFrom[i]) * e;
        if (v !== lampCurrent[i]) moved = true;
        lampCurrent[i] = v;
      }
      if (moved) pathTracer.setLamp(lampCurrent);
      if (t >= 1) lampEaseStart = -1;
    }
    lampMesh.position.fromArray(lampCurrent);

    // 4. Preview quality while move messages are streaming (guard against
    // redundant resets), and during attract glides — the accumulator resets
    // every frame while the lamp is in motion anyway, so full bounce depth
    // buys nothing there.
    var wantPreview = nowT - lastMoveMsgAt < CONFIG.PT.PREVIEW_HOLD_MS ||
      (s.mode === 'attract' && lampEaseStart >= 0);
    if (wantPreview !== previewOn) { pathTracer.setPreview(wantPreview); previewOn = wantPreview; }

    // 5. Stats to controller
    if (nowT - lastStatsAt > CONFIG.STATS_INTERVAL_MS) {
      lastStatsAt = nowT;
      var samples = pathTracer.getSampleCount();
      Messaging.send({ type: 'stats', samples: samples,
        paths: samples * CONFIG.PT.INTERNAL_W * CONFIG.PT.INTERNAL_H });
    }

    // 6. Draw
    photonSim.update(dtMs, lampCurrent);
    renderer.setScissorTest(true);
    // Left half
    renderer.setViewport(0, 0, halfW, CONFIG.WALL_H);
    renderer.setScissor(0, 0, halfW, CONFIG.WALL_H);
    renderer.clear();
    renderer.render(simScene, simCam);
    // Right half: GLSL progressive path tracer
    renderer.setScissorTest(false);
    pathTracer.step();
    renderer.setScissorTest(true);
    pathTracer.draw(halfW, 0, halfW, CONFIG.WALL_H);

    if (nowT - lastMeterT > 250) {
      UI.setMeter(pathTracer.getSampleCount());
      lastMeterT = nowT;
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  window.__PB = {
    scene: sceneDef,
    setLampNormalized: function (nx, nz, nh) {
      exhibit.onMove(performance.now(), SceneDef.lampFromNormalized(nx, nz, nh));
    },
    _internals: { renderer: renderer, simScene: simScene, simCam: simCam, lampMesh: lampMesh,
                  pathTracer: pathTracer, getLamp: function () { return lampCurrent; } }
  };
})();
