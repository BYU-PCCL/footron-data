(function () {
  var CONFIG = (typeof module !== 'undefined') ? require('./config.js') : window.CONFIG;

  // mat: 0 diffuse, 1 mirror, 2 glass, 3 emissive-window
  var WOOD = [0.45, 0.29, 0.17];
  var WOOD_DARK = [0.32, 0.20, 0.12];
  var FABRIC = [0.25, 0.35, 0.32];

  function createScene() {
    var boxes = [
      // Desk (against accent wall, left)
      { min: [0.15, 0.85, 0.50], max: [1.45, 0.95, 1.60], mat: 0, col: WOOD },
      { min: [0.18, 0.00, 0.55], max: [0.28, 0.85, 1.55], mat: 0, col: WOOD_DARK },
      { min: [1.32, 0.00, 0.55], max: [1.42, 0.85, 1.55], mat: 0, col: WOOD_DARK },
      // Low bookshelf (back wall, right)
      { min: [2.60, 0.00, 0.00], max: [3.90, 1.10, 0.35], mat: 0, col: WOOD_DARK },
      // Books standing on the shelf
      { min: [2.75, 1.10, 0.05], max: [2.95, 1.48, 0.30], mat: 0, col: [0.55, 0.25, 0.20] },
      { min: [2.98, 1.10, 0.05], max: [3.16, 1.42, 0.30], mat: 0, col: [0.22, 0.30, 0.45] },
      { min: [3.19, 1.10, 0.05], max: [3.40, 1.52, 0.30], mat: 0, col: [0.60, 0.50, 0.30] },
      // Armchair (cozy reading corner in front of the bookshelf, facing left, backrest on +x side)
      { min: [2.55, 0.15, 0.55], max: [3.45, 0.50, 1.35], mat: 0, col: FABRIC },
      { min: [3.25, 0.50, 0.55], max: [3.45, 1.20, 1.35], mat: 0, col: FABRIC },
      { min: [2.55, 0.50, 0.55], max: [3.25, 0.65, 0.70], mat: 0, col: FABRIC },
      { min: [2.55, 0.50, 1.20], max: [3.25, 0.65, 1.35], mat: 0, col: FABRIC },
      // Armchair base/plinth (support under seat)
      { min: [2.65, 0.00, 0.65], max: [3.35, 0.15, 1.25], mat: 0, col: WOOD_DARK },
      // Rug
      { min: [1.55, 0.00, 0.45], max: [3.15, 0.02, 1.65], mat: 0, col: [0.50, 0.42, 0.36] },
      // Wall mirror (back wall, center): frame then plate proud of frame
      { min: [1.70, 1.20, 0.00], max: [2.50, 2.20, 0.05], mat: 0, col: WOOD_DARK },
      { min: [1.75, 1.25, 0.00], max: [2.45, 2.15, 0.07], mat: 1, col: [0.92, 0.94, 0.96] },
      // Window (back wall, left): wood frame, emissive dusk pane proud of frame
      { min: [0.44, 1.44, 0.00], max: [1.46, 2.56, 0.05], mat: 0, col: WOOD_DARK },
      { min: [0.50, 1.50, 0.00], max: [1.40, 2.50, 0.06], mat: 3, col: [0.18, 0.30, 0.60] }
    ];
    var spheres = [
      // Glass carafe on the desk (desk top y=0.95)
      { center: [0.80, 1.13, 1.05], radius: 0.18, mat: 2, col: [0.97, 0.99, 1.0] }
    ];
    var room = {
      min: CONFIG.ROOM.MIN.slice(), max: CONFIG.ROOM.MAX.slice(),
      wallAccent: [0.72, 0.36, 0.25],  // terracotta, x=0 wall
      wallMain: [0.82, 0.78, 0.72],
      floorCol: [0.42, 0.30, 0.20],
      ceilCol: [0.80, 0.77, 0.73]
    };
    var camera = { pos: CONFIG.CAMERA.POS.slice(), target: CONFIG.CAMERA.TARGET.slice(), fovDeg: CONFIG.CAMERA.FOV_DEG };
    var attractPath = [
      [0.55, 1.40, 1.05],  // over the desk, clear of the carafe (center [0.80,1.13,1.05] r 0.18)
      [0.95, 2.30, 0.60],  // high by the window
      [2.10, 1.70, 0.55],  // in front of the mirror
      [3.00, 0.55, 1.60],  // beside the armchair
      [2.00, 2.10, 1.80]   // high room center
    ];
    return { boxes: boxes, spheres: spheres, room: room, camera: camera, attractPath: attractPath };
  }

  function lampFromNormalized(nx, nz, nh) {
    var m = CONFIG.ROOM.MARGIN;
    var mn = CONFIG.ROOM.MIN, mx = CONFIG.ROOM.MAX;
    function map(t, lo, hi) {
      var v = lo + t * (hi - lo);
      return Math.min(hi - m, Math.max(lo + m, v));
    }
    return [map(nx, mn[0], mx[0]), map(nh, mn[1], mx[1]), map(nz, mn[2], mx[2])];
  }

  function f(x) { var s = x.toFixed(4); return s; }
  function v3(v) { return 'vec3(' + f(v[0]) + ',' + f(v[1]) + ',' + f(v[2]) + ')'; }

  // The emissive window pane, found by material rather than index so that
  // reordering the box list cannot silently point next-event estimation at
  // the wrong surface. Its front face is the sampled area light.
  function windowPane(s) {
    for (var i = 0; i < s.boxes.length; i++) {
      if (s.boxes[i].mat === 3) return s.boxes[i];
    }
    return null;
  }

  function sceneToGLSL(s) {
    var n = s.boxes.length;
    var mins = s.boxes.map(function (b) { return v3(b.min); }).join(',');
    var maxs = s.boxes.map(function (b) { return v3(b.max); }).join(',');
    var cols = s.boxes.map(function (b) { return v3(b.col); }).join(',');
    var mats = s.boxes.map(function (b) { return String(b.mat); }).join(',');
    var car = s.spheres[0];
    var win = windowPane(s);
    if (!win) throw new Error('sceneToGLSL: no emissive window pane (mat 3) in scene');
    // WINDOW_EMIT must match the radiance the trace loop adds when a path
    // lands on the pane, or direct and indirect light through the window
    // would disagree.
    var winEmit = win.col.map(function (c) { return c * CONFIG.PT.WINDOW_GAIN; });
    var winArea = (win.max[0] - win.min[0]) * (win.max[1] - win.min[1]);
    return [
      'const int NUM_BOXES = ' + n + ';',
      'const vec3 boxMin[' + n + '] = vec3[' + n + '](' + mins + ');',
      'const vec3 boxMax[' + n + '] = vec3[' + n + '](' + maxs + ');',
      'const vec3 boxCol[' + n + '] = vec3[' + n + '](' + cols + ');',
      'const int boxMat[' + n + '] = int[' + n + '](' + mats + ');',
      'const vec3 ROOM_MIN = ' + v3(s.room.min) + ';',
      'const vec3 ROOM_MAX = ' + v3(s.room.max) + ';',
      'const vec3 WALL_ACCENT = ' + v3(s.room.wallAccent) + ';',
      'const vec3 WALL_MAIN = ' + v3(s.room.wallMain) + ';',
      'const vec3 FLOOR_COL = ' + v3(s.room.floorCol) + ';',
      'const vec3 CEIL_COL = ' + v3(s.room.ceilCol) + ';',
      'const vec3 CARAFE_C = ' + v3(car.center) + ';',
      'const float CARAFE_R = ' + f(car.radius) + ';',
      'const vec3 CARAFE_COL = ' + v3(car.col) + ';',
      'const vec3 WINDOW_MIN = ' + v3(win.min) + ';',
      'const vec3 WINDOW_MAX = ' + v3(win.max) + ';',
      'const vec3 WINDOW_EMIT = ' + v3(winEmit) + ';',
      'const float WINDOW_AREA = ' + f(winArea) + ';'
    ].join('\n');
  }

  var SceneDef = { createScene: createScene, lampFromNormalized: lampFromNormalized, sceneToGLSL: sceneToGLSL };
  if (typeof window !== 'undefined') window.SceneDef = SceneDef;
  if (typeof module !== 'undefined') module.exports = SceneDef;
})();
