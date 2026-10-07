// Node and degree-of-freedom numbering for a regular rectangular mesh.
//
// Column 0 is the left edge, row 0 is the bottom edge. Each element's 4
// corners are visited bottom-left, bottom-right, top-right, top-left, in the
// same order getElementStiffnessMatrix() assumes.

export function nodeId(col, row, numElemX) {
  const numNodesX = numElemX + 1;
  return row * numNodesX + col;
}

export function nodeDofs(node) {
  return [2 * node, 2 * node + 1];
}

export function elementDofs(elx, ely, numElemX) {
  const bottomLeft = nodeId(elx, ely, numElemX);
  const bottomRight = nodeId(elx + 1, ely, numElemX);
  const topRight = nodeId(elx + 1, ely + 1, numElemX);
  const topLeft = nodeId(elx, ely + 1, numElemX);
  return [bottomLeft, bottomRight, topRight, topLeft].flatMap(nodeDofs);
}

export function numNodes(numElemX, numElemY) {
  return (numElemX + 1) * (numElemY + 1);
}

export function numDofs(numElemX, numElemY) {
  return 2 * numNodes(numElemX, numElemY);
}
