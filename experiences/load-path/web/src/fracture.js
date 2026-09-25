// Splits a set of solid grid cells into a handful of convex shards, so a
// collapse can shatter the REAL optimized shape instead of a single rigid
// approximation of it.
//
// A proper Voronoi fracture computes seed cells' regions via a Delaunay
// triangulation and clips the source mesh against them. That machinery
// exists to handle an arbitrary vector mesh — our source shape is already a
// raster (the density grid), so the same result falls out of a much
// simpler raster shortcut: assign every solid cell to its nearest seed
// cell (a "raster Voronoi diagram"), then take the convex hull of each
// seed's cluster of cells as that shard's polygon. A true Voronoi cell is
// convex, so this raster approximation of one is too — no Delaunay
// triangulation or polygon clipping required.
function distanceSquared(a, b) {
  return (a.elx - b.elx) ** 2 + (a.ely - b.ely) ** 2;
}

// Deterministic seed placement: striding evenly through the cell list
// (which callers populate in row-major order) spreads seeds across the
// shape without needing randomness, which keeps shard layout reproducible
// and testable.
function pickSeeds(cells, seedCount) {
  const count = Math.min(seedCount, cells.length);
  const seeds = [];
  for (let i = 0; i < count; i++) {
    seeds.push(cells[Math.floor((i * cells.length) / count)]);
  }
  return seeds;
}

// Partitions cells into clusters by nearest seed. A seed can end up with no
// cells (another seed was strictly closer to all of them); such empty
// groups are dropped, so the number of shards returned can be less than
// seedCount.
export function groupCellsBySeed(cells, seedCount) {
  const seeds = pickSeeds(cells, seedCount);
  const groups = seeds.map(() => []);
  for (const cell of cells) {
    let bestIndex = 0;
    let bestDist = Infinity;
    for (let i = 0; i < seeds.length; i++) {
      const dist = distanceSquared(cell, seeds[i]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    groups[bestIndex].push(cell);
  }
  return groups.filter((group) => group.length > 0);
}

function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// Standard Andrew's monotone chain convex hull. Returns vertices in
// counter-clockwise order, with collinear points on an edge dropped.
export function convexHull(points) {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 2) return pts;

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// Area-weighted polygon centroid (the standard shoelace-formula centroid,
// not a plain average of the vertices) — matches Matter.js's own
// Vertices.centre exactly, on purpose: collapse.js passes this as the
// (x, y) Bodies.fromVertices positions a shard at, and Bodies.fromVertices
// positions a body by shifting its vertices so ITS notion of centroid lands
// on that point. Using any other definition of "center" here would leave
// every shard offset from where its vertices actually are by the gap
// between the two definitions.
export function polygonCentroid(vertices) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const cross = a.x * b.y - b.x * a.y;
    area += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  area /= 2;
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

// Turns a half's solid cells into shard polygons. cellCorners(cell) maps a
// single cell to its 4 corner points in whatever coordinate space the
// caller wants (grid space for testing, real canvas/physics pixels from
// collapse.js) — this module has no idea about canvases or FEM grids.
export function buildShards(cells, seedCount, cellCorners) {
  return groupCellsBySeed(cells, seedCount).map((group) => {
    const corners = group.flatMap(cellCorners);
    return { cells: group, vertices: convexHull(corners) };
  });
}
