(function () {
  var CONFIG = {
    WALL_W: 2736, WALL_H: 1216,
    ROUTER_URL: 'ws://localhost:8089',
    ROOM: { MIN: [0, 0, 0], MAX: [4, 3, 3.6], MARGIN: 0.15 }, // MARGIN: lamp clamp inset
    CAMERA: { POS: [2.0, 2.0, 3.45], TARGET: [2.0, 0.95, 0.0], FOV_DEG: 62 },
    LAMP: { RADIUS: 0.09, COLOR: [1.0, 0.75, 0.45], INTENSITY: 14, EASE_MS: 300 },
    PT: {
      // Internal path-trace resolution, upscaled into the 1368x1216 pane.
      //
      // Measured on an RTX 2080 Super, cost of one sample (both NEE lobes, the
      // caustic shadow test and the bloom passes included). Timing used
      // readPixels as a sync point -- gl.finish() does not reliably drain on
      // ANGLE and reports absurdly low numbers:
      //
      //    684 x 608   2.34 ms/sample   14% of a 60fps frame   7.1x headroom
      //    972 x 864   4.63 ms/sample   28% of a 60fps frame   3.6x headroom
      //   1368 x 1216  8.99 ms/sample   54% of a 60fps frame   1.8x headroom
      //
      // Cost scales linearly with pixel count, as expected. 972x864 is chosen
      // over full native because the wall's GPU is a different and probably
      // weaker part than the one these numbers came from: at 3.6x headroom it
      // could be three times slower and still hold 60fps at 1 sample/frame,
      // whereas full native leaves almost no margin. It still halves the
      // upscale factor (2.0x -> 1.41x), which is a visible sharpness gain on
      // the mirror, window and desk edges.
      //
      // If the wall turns out to have headroom to spare, 1368x1216 is the next
      // step up and needs no other change.
      INTERNAL_W: 972, INTERNAL_H: 864,
      MAX_BOUNCES: 5, PREVIEW_BOUNCES: 3, PREVIEW_HOLD_MS: 250,
      MAX_SAMPLES: 4096,   // stop accumulating once converged (resumes on any reset)
      FIREFLY_CLAMP: 20.0, // per-sample radiance bound; keep above LAMP intensity
      // Radiance multiplier on the emissive window pane. Balances the cool
      // dusk fill against the lamp: high enough that unlit corners stay
      // readable, low enough that the visitor's lamp still dominates.
      // Consumed by BOTH the trace loop and the NEE constants in scene.js,
      // which must agree or direct and indirect window light diverge.
      WINDOW_GAIN: 2.0,
      // Carafe caustic. A ball lens concentrates light on its axis, so a
      // shadow ray passing near the sphere centre is brightened and one
      // near the rim is attenuated (that light is deviated away and lands
      // elsewhere). GAIN is the on-axis boost, WIDTH the falloff in units
      // of the sphere radius. See glassShadow() in pathtracer.js -- this is
      // an authored approximation, not a derivation.
      CAUSTIC: { GAIN: 2.6, WIDTH: 0.38 },
      // Bloom runs in HDR, before tone mapping, so the lamp reads as a light
      // source instead of a flat white disc. THRESHOLD sits above every
      // diffuse surface in the room (all well under 1.0) and below the lamp's
      // emitted radiance, so only genuine light sources bleed.
      // STRENGTH is deliberately restrained: at 0.85 the lamp and its mirror
      // reflection merge into one shapeless glare that swallows the mirror
      // frame, destroying the "mirrors re-throw light" lesson beat. Verified
      // against a bloom-off control at matched sample counts.
      BLOOM: { THRESHOLD: 1.6, STRENGTH: 0.30, RADIUS: 1.8, DOWNSCALE: 4 }
    },
    PHOTONS: { COUNT: 40, SPEED: 2.2, MAX_BOUNCES: 5, RESPAWN_DELAY_MS: 400 },
    ATTRACT: { PAUSE_MS: 20000, TRAVEL_MS: 4000, CAPTION_MS: 8000 },
    DISCONNECT_GRACE_MS: 3000,
    INTERACTIVE_IDLE_MS: 90000,
    // NOTE: not read by the experience. The controller throttles its own
    // sends, and it is a separately-built app that cannot import this file,
    // so the value that actually applies is THROTTLE_MS in
    // controls/src/App.tsx. Kept here only to document the rate the
    // experience is designed to receive; change both together.
    MOVE_THROTTLE_MS: 33,
    STATS_INTERVAL_MS: 500
  };
  // Resolve the router URL from the page URL.
  //
  // Footron launches an experience with its router address in `?ftMsgUrl=`
  // (URL-encoded, and pointing at the experience endpoint, e.g.
  // ws://host:port/out). That parameter name is set by the platform, not by
  // us, so it is the one that matters in production -- verified against
  // NeuralNetVis/src/input/phone.ts and its tests, which read the same key.
  //
  // `?router=` is kept as a local-development alias for pointing a browser
  // at the bundled dev relay by hand.
  function routerUrlFrom(search, fallback) {
    var m = /[?&]ftMsgUrl=([^&]*)/.exec(search || '');
    if (!m) m = /[?&]router=([^&]*)/.exec(search || '');
    if (!m || !m[1]) return fallback;
    try { return decodeURIComponent(m[1]); } catch (e) { return fallback; }
  }
  CONFIG.routerUrlFrom = routerUrlFrom;
  if (typeof window !== 'undefined' && window.location) {
    CONFIG.ROUTER_URL = routerUrlFrom(window.location.search, CONFIG.ROUTER_URL);
  }
  if (typeof window !== 'undefined') window.CONFIG = CONFIG;
  if (typeof module !== 'undefined') module.exports = CONFIG;
})();
