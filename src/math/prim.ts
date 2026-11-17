import type { NetworkEdge } from "../types/network.ts";
import { RuralGraph } from "./graph.ts";
import { MinHeap } from "./heap.ts";
import type { CommunityNode } from "../types/network.ts";

/**
 * Prim (1957). El árbol crece desde la antena Starlink.
 * Cada arista candidata entra una vez a la cola; no hay decrease-key.
 * Con un heap binario el costo es O(E log E). En un grafo conexo y sin
 * tope de grado, el peso total coincide con Kruskal.
 */
export function primMST(
  nodes: readonly CommunityNode[],
  edges: readonly NetworkEdge[],
  startId: string,
  maxDegree?: (id: string) => number,
): NetworkEdge[] {
  const graph = new RuralGraph([...nodes], [...edges]);
  const adjacent = graph.adjacencyList();
  const inTree = new Set<string>([startId]);
  const degree = new Map(nodes.map((node) => [node.id, 0]));
  const heap = new MinHeap<{ edge: NetworkEdge; next: string }>((a, b) => {
    if (a.edge.costCOP !== b.edge.costCOP) {
      return a.edge.costCOP < b.edge.costCOP;
    }
    if (a.edge.distanceMeters !== b.edge.distanceMeters) {
      return a.edge.distanceMeters < b.edge.distanceMeters;
    }
    return a.edge.id < b.edge.id;
  });

  const pushFrom = (id: string) => {
    for (const link of adjacent.get(id) ?? []) {
      if (!inTree.has(link.neighborId)) {
        heap.push({ edge: link.edge, next: link.neighborId });
      }
    }
  };

  pushFrom(startId);
  const chosen: NetworkEdge[] = [];

  while (heap.size > 0 && inTree.size < nodes.length) {
    const item = heap.pop();
    if (!item || inTree.has(item.next)) {
      continue;
    }
    const other = item.edge.source === item.next ? item.edge.target : item.edge.source;
    if (!inTree.has(other)) {
      continue;
    }
    const degreeNext = degree.get(item.next) ?? 0;
    const degreeOther = degree.get(other) ?? 0;
    if (maxDegree && (degreeNext >= maxDegree(item.next) || degreeOther >= maxDegree(other))) {
      continue;
    }
    inTree.add(item.next);
    degree.set(item.next, degreeNext + 1);
    degree.set(other, degreeOther + 1);
    chosen.push({ ...item.edge, inMST: true });
    pushFrom(item.next);
  }

  return chosen;
}
