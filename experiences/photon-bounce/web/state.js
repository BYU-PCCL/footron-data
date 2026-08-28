(function () {
  function createExhibitState(config, attractPath, captions) {
    var connected = false;
    var disconnectAt = null;
    var lastMoveAt = null;
    var lastMove = null;
    var epoch = null; // attract-mode clock start
    var heldTarget = null; // frozen attract target while connected-but-not-yet-moved

    function attractState(nowMs) {
      if (epoch === null) epoch = nowMs;
      var el = nowMs - epoch;
      var per = config.ATTRACT.PAUSE_MS + config.ATTRACT.TRAVEL_MS;
      var seg = Math.floor(el / per);
      var inSeg = el - seg * per;
      var idx = seg % attractPath.length;
      var next = (idx + 1) % attractPath.length;
      var target = inSeg < config.ATTRACT.PAUSE_MS ? attractPath[idx] : attractPath[next];
      var cap = captions[Math.floor(el / config.ATTRACT.CAPTION_MS) % captions.length];
      return { mode: 'attract', lampTarget: target.slice(), caption: cap };
    }

    return {
      onConnect: function (nowMs) {
        connected = true; disconnectAt = null; lastMoveAt = nowMs; lastMove = null;
      },
      onDisconnect: function (nowMs) {
        // Ignore disconnects with no session in progress (e.g. the router
        // socket dropping during attract): starting a grace window here would
        // briefly resurrect a *previous* visitor's lastMove as the lamp target.
        if (!connected) return;
        connected = false; disconnectAt = nowMs; heldTarget = null;
      },
      onMove: function (nowMs, lampWorld) {
        lastMoveAt = nowMs; lastMove = lampWorld.slice(); heldTarget = null;
      },
      tick: function (nowMs) {
        var interactive = false;
        if (connected) {
          interactive = lastMoveAt === null || (nowMs - lastMoveAt) < config.INTERACTIVE_IDLE_MS;
        } else if (disconnectAt !== null && (nowMs - disconnectAt) < config.DISCONNECT_GRACE_MS) {
          interactive = lastMove !== null;
        }
        if (interactive && lastMove) {
          epoch = null; // restart attract clock next time
          return { mode: 'interactive', lampTarget: lastMove.slice(), caption: null };
        }
        if (interactive) { // connected but hasn't moved yet: freeze the attract target where it stood at
          // the moment of connect (or first tick thereafter) so the lamp doesn't keep advancing
          // along the attract path — and snapping — while nobody has taken control yet.
          if (heldTarget === null) {
            heldTarget = attractState(nowMs).lampTarget.slice();
          }
          return { mode: 'interactive', lampTarget: heldTarget.slice(), caption: null };
        }
        return attractState(nowMs);
      }
    };
  }

  var ExhibitState = { createExhibitState: createExhibitState };
  if (typeof window !== 'undefined') window.ExhibitState = ExhibitState;
  if (typeof module !== 'undefined') module.exports = ExhibitState;
})();
