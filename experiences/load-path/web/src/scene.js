// The fixed logical layout every layer (backdrop, structure, physics, water
// overlay) is drawn in. The page scales this 16:9 scene uniformly to fit
// the screen, so nothing ever stretches. All values are scene pixels.
export const SCENE_W = 1920;
export const SCENE_H = 1080;

// Where the FEM design domain sits: 2:1, matching the 2m x 1m bridge, with
// headroom above it so a weight resting on the apex stays on screen.
//
// The bottom-left corner is not ours to use freely: Footron's own launcher
// paints a "scan to control" QR card over it, a fixed ~300x300px (+32px
// pad) that does NOT scale with the scene the way everything here does. At
// a small enough sceneScale that box can reach well into scene space, and
// the left support's corner cell -- the one a visitor must paint first in
// "beat the algorithm" -- sits close enough to that corner to be at risk of
// landing under it. h/w are shrunk (keeping the domain's real 2:1 span:rise
// ratio, so cells stay square) so the supports clear a 332px keep-out at
// scale 1 -- a real margin, not a guarantee at every possible wall
// resolution, but better than the ~190px the previous, larger domain left.
// x is centered under the now-narrower domain; y is untouched, so the
// headroom above the apex (the load arrow, the moon) is unaffected.
export const DOMAIN = { x: 382, y: 170, w: 1156, h: 578 };

// The bridge's two supports rest on cliffs whose tops are level with the
// bottom of the domain; between them is a river debris can fall into. The
// river/water positions are unmoved from the original design -- the domain
// shrinking just means taller cliff faces below the supports now, which
// reads as a deeper canyon, not an empty gap.
export const BANK_TOP_Y = DOMAIN.y + DOMAIN.h;
export const RIVER_LEFT_X = DOMAIN.x + 60;
export const RIVER_RIGHT_X = DOMAIN.x + DOMAIN.w - 60;
export const WATER_SURFACE_Y = 960;
export const RIVERBED_Y = 1040;
