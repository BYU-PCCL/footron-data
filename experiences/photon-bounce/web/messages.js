(function () {
  function fin(v) { return typeof v === 'number' && isFinite(v); }
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }

  function validateMove(body) {
    if (!body || body.type !== 'move') return null;
    if (!fin(body.x) || !fin(body.y) || !fin(body.h)) return null;
    return { x: clamp01(body.x), y: clamp01(body.y), h: clamp01(body.h) };
  }

  function createCoalescer() {
    var latest = null;
    return {
      push: function (m) { latest = m; },
      take: function () { var m = latest; latest = null; return m; }
    };
  }

  var Messages = { validateMove: validateMove, createCoalescer: createCoalescer };
  if (typeof window !== 'undefined') window.Messages = Messages;
  if (typeof module !== 'undefined') module.exports = Messages;
})();
