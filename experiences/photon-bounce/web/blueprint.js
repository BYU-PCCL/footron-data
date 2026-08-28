(function () {
  var LINE_COLOR = 0x8fb8d8;
  var FACE_OPACITY = 0.05;

  function boxGroup(min, max, lineColor, faceOpacity) {
    var g = new THREE.Group();
    var size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    var geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.85 })
    );
    var face = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: lineColor, transparent: true, opacity: faceOpacity, depthWrite: false })
    );
    g.add(face); g.add(edges);
    g.position.set(min[0] + size[0] / 2, min[1] + size[1] / 2, min[2] + size[2] / 2);
    return g;
  }

  function build(scene) {
    var root = new THREE.Group();
    // Room shell: edges only (no faces, so the interior stays visible)
    var r = scene.room;
    var size = [r.max[0] - r.min[0], r.max[1] - r.min[1], r.max[2] - r.min[2]];
    var shellGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    var shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(shellGeo),
      new THREE.LineBasicMaterial({ color: LINE_COLOR, transparent: true, opacity: 0.5 })
    );
    shell.position.set(size[0] / 2, size[1] / 2, size[2] / 2);
    root.add(shell);
    scene.boxes.forEach(function (b) {
      // Mirror and window get a slightly brighter tint so they read as special
      var c = b.mat === 1 ? 0xcfe8ff : (b.mat === 3 ? 0x4f6fbf : LINE_COLOR);
      root.add(boxGroup(b.min, b.max, c, FACE_OPACITY));
    });
    scene.spheres.forEach(function (s) {
      var geo = new THREE.SphereGeometry(s.radius, 20, 14);
      var wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.6 })
      );
      wire.position.set(s.center[0], s.center[1], s.center[2]);
      root.add(wire);
    });
    return root;
  }

  if (typeof window !== 'undefined') window.Blueprint = { build: build };
})();
