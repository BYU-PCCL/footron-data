(function () {
  function create(threeScene, sceneDef) {
    var lamp = sceneDef.attractPath[0].slice();
    var photons = [];

    function spawn(p) {
      var path = PhotonPath.tracePhotonPath(sceneDef, lamp, Math.random);
      // cumulative segment lengths for constant-speed travel
      var lens = [0];
      for (var i = 1; i < path.points.length; i++) {
        var a = path.points[i - 1], b = path.points[i];
        lens.push(lens[i - 1] + Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]));
      }
      p.path = path;
      p.lens = lens;
      p.total = lens[lens.length - 1];
      p.dist = 0;
      p.deadUntil = 0;
      p.restoreIdx = undefined; // fresh geometry: no overwritten frontier vertex yet
      // (re)build geometry: positions + colors, drawRange grows as the head advances
      var n = path.points.length;
      var pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (var j = 0; j < n; j++) {
        pos[j*3] = path.points[j][0]; pos[j*3+1] = path.points[j][1]; pos[j*3+2] = path.points[j][2];
        col[j*3] = path.colors[j][0]; col[j*3+1] = path.colors[j][1]; col[j*3+2] = path.colors[j][2];
      }
      p.line.geometry.dispose();
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setDrawRange(0, 0);
      p.line.geometry = geo;
      p.line.material.opacity = 0.9;
      p.head.material.color.setRGB(path.colors[0][0], path.colors[0][1], path.colors[0][2]);
    }

    for (var i = 0; i < CONFIG.PHOTONS.COUNT; i++) {
      var line = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9,
          blending: THREE.AdditiveBlending, depthWrite: false })
      );
      var head = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      threeScene.add(line); threeScene.add(head);
      var p = { line: line, head: head };
      photons.push(p);
      spawn(p);
      p.dist = Math.random() * p.total; // desync starts
    }

    // Restore the pristine path point at index idx into the position buffer.
    function restoreVertex(p, arr, idx) {
      var orig = p.path.points[idx];
      arr[idx*3] = orig[0]; arr[idx*3+1] = orig[1]; arr[idx*3+2] = orig[2];
    }

    function update(dtMs, lampWorld) {
      lamp = lampWorld;
      var dt = dtMs / 1000;
      photons.forEach(function (p) {
        if (p.deadUntil > 0) {
          p.deadUntil -= dtMs;
          p.line.material.opacity = Math.max(0, p.line.material.opacity - dt * 2.5);
          if (p.deadUntil <= 0) spawn(p);
          return;
        }
        p.dist += CONFIG.PHOTONS.SPEED * dt;
        var d = Math.min(p.dist, p.total);
        // find the frontier vertex: first path index not yet fully reached
        var vis = 1;
        while (vis < p.lens.length && p.lens[vis] < d) vis++;
        if (vis >= p.lens.length) vis = p.lens.length - 1;
        var segLen = p.lens[vis] - p.lens[vis - 1] || 1;
        var t = (d - p.lens[vis - 1]) / segLen;
        var a = p.path.points[vis - 1], b = p.path.points[vis];
        var hp = [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t];
        p.head.position.set(hp[0], hp[1], hp[2]);

        // Frontier-vertex technique: keep the drawn polyline's last vertex
        // exactly at the head, so the trail never detaches from it.
        var posAttr = p.line.geometry.attributes.position;
        var arr = posAttr.array;
        if (p.restoreIdx !== undefined && p.restoreIdx !== vis) {
          restoreVertex(p, arr, p.restoreIdx);
        }
        arr[vis*3] = hp[0]; arr[vis*3+1] = hp[1]; arr[vis*3+2] = hp[2];
        p.restoreIdx = vis;
        posAttr.needsUpdate = true;
        p.line.geometry.setDrawRange(0, vis + 1);

        if (p.dist >= p.total) {
          // restore the overwritten vertex and show the full pristine path
          // while it fades out
          restoreVertex(p, arr, p.restoreIdx);
          posAttr.needsUpdate = true;
          p.line.geometry.setDrawRange(0, p.path.points.length);
          p.deadUntil = CONFIG.PHOTONS.RESPAWN_DELAY_MS;
          p.head.position.set(-100, -100, -100); // hide
        }
      });
    }

    return { update: update };
  }

  if (typeof window !== 'undefined') window.PhotonSim = { create: create };
})();
