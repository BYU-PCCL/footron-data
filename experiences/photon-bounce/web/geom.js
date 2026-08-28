(function () {
  var EPS = 1e-3;
  function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
  function scale(v, s) { return [v[0]*s, v[1]*s, v[2]*s]; }
  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function len(v) { return Math.sqrt(dot(v, v)); }
  function norm(v) { var l = len(v); return [v[0]/l, v[1]/l, v[2]/l]; }

  function intersectSphere(ro, rd, c, r) {
    var oc = sub(ro, c);
    var b = dot(oc, rd);
    var cc = dot(oc, oc) - r * r;
    var h = b * b - cc;
    if (h < 0) return Infinity;
    h = Math.sqrt(h);
    var t = -b - h;
    if (t > EPS) return t;
    t = -b + h;
    return t > EPS ? t : Infinity;
  }

  function intersectBox(ro, rd, bmin, bmax) {
    var tN = -Infinity, tF = Infinity, axis = 0, sign = 1;
    for (var i = 0; i < 3; i++) {
      var inv = 1 / rd[i];
      var t0 = (bmin[i] - ro[i]) * inv;
      var t1 = (bmax[i] - ro[i]) * inv;
      var s = -1;
      if (t0 > t1) { var tmp = t0; t0 = t1; t1 = tmp; s = 1; }
      if (t0 > tN) { tN = t0; axis = i; sign = s; }
      if (t1 < tF) tF = t1;
      if (tN > tF) return null;
    }
    if (tF < EPS) return null;
    var t = tN > EPS ? tN : tF;
    var n = [0, 0, 0];
    if (tN > EPS) { n[axis] = sign; }
    else { // hit from inside: recompute exit face
      var res = exitRoom(ro, rd, bmin, bmax);
      return { t: res.t, n: scale(res.n, -1) };
    }
    return { t: t, n: n };
  }

  function exitRoom(ro, rd, rmin, rmax) {
    var tF = Infinity, axis = 0, dir = 1;
    for (var i = 0; i < 3; i++) {
      var inv = 1 / rd[i];
      var t0 = (rmin[i] - ro[i]) * inv;
      var t1 = (rmax[i] - ro[i]) * inv;
      var tx = Math.max(t0, t1);
      if (tx < tF) { tF = tx; axis = i; dir = rd[i] > 0 ? -1 : 1; }
    }
    var n = [0, 0, 0];
    n[axis] = dir; // inward-facing
    return { t: tF, n: n };
  }

  function reflect(d, n) { return sub(d, scale(n, 2 * dot(d, n))); }

  function refract(d, n, eta) {
    var ci = -dot(d, n);
    var k = 1 - eta * eta * (1 - ci * ci);
    if (k < 0) return null;
    return add(scale(d, eta), scale(n, eta * ci - Math.sqrt(k)));
  }

  var Geom = { sub: sub, add: add, scale: scale, dot: dot, len: len, norm: norm,
    intersectSphere: intersectSphere, intersectBox: intersectBox, exitRoom: exitRoom,
    reflect: reflect, refract: refract };
  if (typeof window !== 'undefined') window.Geom = Geom;
  if (typeof module !== 'undefined') module.exports = Geom;
})();
