// The fixed logical layout every layer (backdrop, structure, physics, water
// overlay) is drawn in. All values are scene pixels.
//
// The scene's HEIGHT never changes -- SCENE_H, and everything measured from
// it (DOMAIN.y/.h, BANK_TOP_Y, WATER_SURFACE_Y, RIVERBED_Y), is a fixed
// constant. The WIDTH can grow past BASE_SCENE_W: on a wall wider than 16:9,
// main.js's fitScene() calls setSceneWidth() with just enough width that
// fitting the window by height alone reaches its edges exactly, so the scene
// fills the window with no empty bars down the sides, instead of the
// letterboxing a fixed 16:9 canvas would otherwise leave. The design domain,
// and so the river between its supports, keeps its exact size -- it is just
// re-centered under the wider sky and cliffs, which are drawn generatively
// across whatever the current width is (backdrop.js) and so extend to the new
// edges on their own, needing no art of their own to fill.
export const SCENE_H = 1080;
export const BASE_SCENE_W = 1920; // the 16:9 width this layout was designed at; never shrinks below it
export let SCENE_W = BASE_SCENE_W;

// Where the FEM design domain sits: 2:1, matching the 2m x 1m bridge, with
// headroom above it so a weight resting on the apex stays on screen. w/h are
// fixed; x re-centers under the current SCENE_W (see setSceneWidth), y does
// not move, so the headroom above the apex is unaffected either way.
//
// x's BASE value, 382, is not arbitrary: at BASE_SCENE_W it clears a
// constraint that is not ours to change -- Footron's own launcher paints a
// "scan to control" QR card over the bottom-left corner, a fixed ~300x300px
// (+32px pad) that does NOT scale with the scene the way everything here
// does. At a small enough sceneScale that box can reach well into scene
// space, and the left support's corner cell -- the one a visitor must paint
// first in "beat the algorithm" -- sits close enough to that corner to be at
// risk of landing under it. w/h were shrunk from the domain's full 2:1
// span:rise (keeping the ratio, so cells stay square) so the supports clear a
// 332px keep-out at scale 1 -- a real margin, not a guarantee at every
// possible wall resolution, but better than the ~190px a larger domain left.
const BASE_DOMAIN_X = 382;
export const DOMAIN = { x: BASE_DOMAIN_X, y: 170, w: 1156, h: 578 };

// The bridge's two supports rest on cliffs whose tops are level with the
// bottom of the domain; between them is a river debris can fall into. Their
// span keeps the same 60px margin inside the domain that the original,
// unextended layout had; only DOMAIN.x moves, which both are measured from.
export const BANK_TOP_Y = DOMAIN.y + DOMAIN.h;
export let RIVER_LEFT_X = DOMAIN.x + 60;
export let RIVER_RIGHT_X = DOMAIN.x + DOMAIN.w - 60;
export const WATER_SURFACE_Y = 960;
export const RIVERBED_Y = 1040;

// How far DOMAIN.x (and so everything measured from it) has moved from its
// BASE_SCENE_W position -- what backdrop.js adds to its own fixed pixel
// positions (the moon, the pagoda, the mountain ridges' phase) so they stay
// exactly where they were relative to the bridge, with the newly added width
// reading as more sky and cliff on either side rather than a shifted scene.
export function domainOffset() {
  return DOMAIN.x - BASE_DOMAIN_X;
}

// Grows the scene to `width` scene-pixels (never below BASE_SCENE_W, the
// layout's minimum) and re-centers DOMAIN under it.
export function setSceneWidth(width) {
  SCENE_W = Math.max(BASE_SCENE_W, width);
  DOMAIN.x = Math.round((SCENE_W - DOMAIN.w) / 2);
  RIVER_LEFT_X = DOMAIN.x + 60;
  RIVER_RIGHT_X = DOMAIN.x + DOMAIN.w - 60;
}
