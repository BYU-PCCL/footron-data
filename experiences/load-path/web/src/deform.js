// Where the mesh nodes sit when the structure is drawn deformed under load.
// Pure geometry, no drawing, so it can be tested on its own.
import { nodeId, nodeDofs } from "./mesh.js";
import { DOMAIN } from "./scene.js";

// Scene position of node (col, row) displaced by u, times `scale` (scene
// pixels per model unit). The FEM's y axis points up but the canvas's points
// down, so a downward displacement (negative uy) must move the node to a
// LARGER canvas y — hence the minus sign.
export function nodePosition(col, row, numElemX, numElemY, u, scale) {
  const cellWidth = DOMAIN.w / numElemX;
  const cellHeight = DOMAIN.h / numElemY;
  const [dofX, dofY] = nodeDofs(nodeId(col, row, numElemX));
  return {
    x: DOMAIN.x + col * cellWidth + scale * u[dofX],
    y: DOMAIN.y + DOMAIN.h - row * cellHeight - scale * u[dofY],
  };
}

// The scale that draws the LARGEST displacement in u as `fraction` of the
// domain height. Computed once from the first iteration (the softest, most
// deformed state) and reused for every later one, so shrinking sag on screen
// is the real ratio between iterations, not re-normalized each frame.
export function deformScaleFor(u, fraction) {
  let largest = 0;
  for (const value of u) largest = Math.max(largest, Math.abs(value));
  return largest > 0 ? (fraction * DOMAIN.h) / largest : 0;
}
