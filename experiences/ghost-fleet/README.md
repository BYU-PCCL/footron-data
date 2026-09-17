# Ghost Fleet

Four men-o'-war built out of 3D Gaussians, trading broadsides on an endless
sea. Runs at 60 fps on roughly 235,000 splats.

## What it is showing

Gaussian splatting represents a scene as a cloud of soft, anisotropic
ellipsoids rather than as surfaces. It is the technique behind most recent
photoreal 3D capture, and it is nearly always presented as a frozen scan.

These ships are the same primitive, authored instead of photographed — the hull
is a parametric surface sampled into dense sheets of overlapping Gaussians, the
masts and cordage are swept tubes of them, the sails are billowing sheets.
Because every Gaussian is ours, a hit can delete the ones inside the blast and
hand the rest to a physics pool carrying their exact colour, size and
orientation, so the hull comes apart into the cloud it was made of.

Two moments exist to make that legible:

- **The opening**, about sixty-six seconds, nine beats. It builds the
  primitive up before using it: a round 2D Gaussian; stretched into an ellipse;
  turned edge-on, where it nearly vanishes and being flat becomes undeniable;
  given a third radius so it is an ellipsoid in space; cycled through the
  ship's own palette to show colour and opacity belong to the Gaussian rather
  than to any surface; multiplied outward; fifty-eight thousand of them; each
  taking its own colour; then flown into formation as a ship. From the cloud
  onward it interpolates the lead ship's real splat data — nothing is faked for
  the animation. A progress rule runs under the captions so a visitor can see
  it is finite.
- **Anatomy of a hit**: the battle ramps down to as little as a thirtieth
  speed, the camera pushes in close enough to resolve individual fragments, the
  powder smoke thins out of the way, and a panel gives the count of Gaussians
  struck out of that hull. Both the hold and the depth of the slow motion scale
  with how much the shot tore loose — nine seconds up to fifteen. Under the
  cinematic camera it comes round about every half minute.

Both are skipped instantly by touching the screen.

## Layout

```
web/                 Vite project; build_experiences.py runs `npm run build`
  index.html         wall page
  src/               renderer, ship generation, simulation, UI
  public/vendor/     footron-messaging.min.js, copied verbatim into dist/
controls/lib/        phone controls
```

`package.json` sets `directories.footronStatic` to `dist`, so the build runner
picks up the Vite output without special casing.

## Requirements

**WebGL 2** — the splat renderer needs float textures and GLSL ES 3.0. There is
no fallback; on a context loss the page recovers itself rather than going black,
since the wall runs unattended.

## Phone controls

Optional, and the wall never waits on them. Give fire to either fleet, mark a
ship for the other side to engage, change camera, summon a squall, replay the
opening, raise a fresh fleet. The wall pushes the fleet's condition to the
phone every second and a half so the ship list stays honest. Message formats
are documented in `web/src/footron.js` and `controls/lib/index.js`; keep the two
in sync.

## Notes for whoever picks this up

- Ships sail rather than drive: `src/sim/wind.js` holds the wind and a
  square-rig polar curve, and `Ship.update` turns that into speed, momentum and
  heel. `maxSpeed` is her best on a beam reach, not what she makes.
- The guns are in ports and traverse about 25°, so ships manoeuvre for a firing
  solution. Player commands go through `orderBroadside`, which puts the helm
  over when the battery cannot bear — a command that silently does nothing is
  indistinguishable from a broken button.
- Gunnery, collision and depth occlusion all test against the analytic hull in
  `src/build/hull.js`, never against the surviving splat cloud. A wrecked ship
  is mostly gaps; testing the cloud made damaged ships literally harder to hit
  and stalled the battle.
- Adaptive resolution scaling holds the frame budget between 0.62x and 1.5x
  device pixel ratio. It has been exercised in headless Chrome but not yet on
  the wall's own GPU.
