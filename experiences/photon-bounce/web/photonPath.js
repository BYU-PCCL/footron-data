(function () {
  var Geom = (typeof module !== 'undefined') ? require('./geom.js') : window.Geom;
  var CONFIG = (typeof module !== 'undefined') ? require('./config.js') : window.CONFIG;

  function sampleSphereDir(rng) {
    var u = 2 * rng() - 1;
    var phi = 2 * Math.PI * rng();
    var s = Math.sqrt(Math.max(0, 1 - u * u));
    return [s * Math.cos(phi), u, s * Math.sin(phi)];
  }

  function cosineDir(n, rng) {
    var r1 = 2 * Math.PI * rng(), r2 = rng(), r2s = Math.sqrt(r2);
    var w = n;
    var a = Math.abs(w[0]) > 0.5 ? [0, 1, 0] : [1, 0, 0];
    var u = Geom.norm([w[1]*a[2]-w[2]*a[1], w[2]*a[0]-w[0]*a[2], w[0]*a[1]-w[1]*a[0]]);
    var v = [w[1]*u[2]-w[2]*u[1], w[2]*u[0]-w[0]*u[2], w[0]*u[1]-w[1]*u[0]];
    return Geom.norm([
      u[0]*Math.cos(r1)*r2s + v[0]*Math.sin(r1)*r2s + w[0]*Math.sqrt(1-r2),
      u[1]*Math.cos(r1)*r2s + v[1]*Math.sin(r1)*r2s + w[1]*Math.sqrt(1-r2),
      u[2]*Math.cos(r1)*r2s + v[2]*Math.sin(r1)*r2s + w[2]*Math.sqrt(1-r2)
    ]);
  }

  function closestHit(scene, ro, rd) {
    var best = Geom.exitRoom(ro, rd, scene.room.min, scene.room.max);
    var wall = best.n;
    var col = scene.room.wallMain;
    if (wall[0] === 1) col = scene.room.wallAccent;
    else if (wall[1] === 1) col = scene.room.floorCol;
    else if (wall[1] === -1) col = scene.room.ceilCol;
    var hit = { t: best.t, n: best.n, col: col, mat: 0 };
    scene.boxes.forEach(function (b) {
      var h = Geom.intersectBox(ro, rd, b.min, b.max);
      if (h && h.t < hit.t) hit = { t: h.t, n: h.n, col: b.col, mat: b.mat };
    });
    scene.spheres.forEach(function (s) {
      var t = Geom.intersectSphere(ro, rd, s.center, s.radius);
      if (t < hit.t) {
        var p = Geom.add(ro, Geom.scale(rd, t));
        hit = { t: t, n: Geom.norm(Geom.sub(p, s.center)), col: s.col, mat: s.mat };
      }
    });
    return hit;
  }

  function tracePhotonPath(scene, lampPos, rng) {
    var points = [lampPos.slice()];
    var colors = [CONFIG.LAMP.COLOR.slice()];
    var col = CONFIG.LAMP.COLOR.slice();
    var ro = lampPos.slice();
    var rd = sampleSphereDir(rng);
    for (var b = 0; b < CONFIG.PHOTONS.MAX_BOUNCES; b++) {
      var h = closestHit(scene, ro, rd);
      var p = Geom.add(ro, Geom.scale(rd, h.t));
      points.push(p);
      if (h.mat === 3) {
        // absorbed by window
        colors.push(col.slice());
        break;
      }
      if (h.mat === 1) {
        // mirror: no tinting
        colors.push(col.slice());
        rd = Geom.reflect(rd, h.n);
      } else if (h.mat === 2) {
        // glass: no tinting
        colors.push(col.slice());
        var entering = Geom.dot(rd, h.n) < 0;
        var n = entering ? h.n : Geom.scale(h.n, -1);
        var r = Geom.refract(rd, n, entering ? 1 / 1.5 : 1.5);
        rd = r ? Geom.norm(r) : Geom.reflect(rd, n);
        ro = Geom.add(p, Geom.scale(rd, 0.002));
        continue;
      } else {
        // diffuse: tint before pushing
        col = [col[0] * h.col[0], col[1] * h.col[1], col[2] * h.col[2]];
        colors.push(col.slice());
        rd = cosineDir(h.n, rng);
      }
      ro = Geom.add(p, Geom.scale(h.n, 0.002));
    }
    return { points: points, colors: colors };
  }

  var PhotonPath = { tracePhotonPath: tracePhotonPath };
  if (typeof window !== 'undefined') window.PhotonPath = PhotonPath;
  if (typeof module !== 'undefined') module.exports = PhotonPath;
})();
