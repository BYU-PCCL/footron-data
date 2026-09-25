// 8-connected (diagonal touches count) since the optimizer often produces
// thin diagonal "staircase" strips where consecutive solid cells only
// share a corner, not a full edge — those genuinely do transmit force
// through the real continuum FEM, so treating them as disconnected would
// be wrong.
const NEIGHBOR_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

// Breadth-first search over solid cells (density > threshold) from start
// to target. Returns null if no path connects them, or { path, minDensity }
// — minDensity is the density of the weakest (thinnest) cell found along
// that path, since a chain's strength is set by its weakest link, not its
// average.
export function findConnectedPath(densities, threshold, start, target) {
  const numElemY = densities.length;
  const numElemX = densities[0].length;
  const isSolid = (elx, ely) =>
    elx >= 0 && elx < numElemX && ely >= 0 && ely < numElemY && densities[ely][elx] > threshold;

  if (!isSolid(start.elx, start.ely) || !isSolid(target.elx, target.ely)) return null;

  const key = (elx, ely) => `${elx},${ely}`;
  const visited = new Set([key(start.elx, start.ely)]);
  const cameFrom = new Map();
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.elx === target.elx && current.ely === target.ely) {
      const path = [current];
      let node = current;
      while (cameFrom.has(key(node.elx, node.ely))) {
        node = cameFrom.get(key(node.elx, node.ely));
        path.push(node);
      }
      const minDensity = Math.min(...path.map((cell) => densities[cell.ely][cell.elx]));
      return { path, minDensity };
    }

    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const next = { elx: current.elx + dx, ely: current.ely + dy };
      const k = key(next.elx, next.ely);
      if (visited.has(k) || !isSolid(next.elx, next.ely)) continue;
      visited.add(k);
      cameFrom.set(k, current);
      queue.push(next);
    }
  }

  return null;
}
