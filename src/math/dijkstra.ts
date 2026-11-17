import type { CommunityNode, NetworkEdge } from "../types/network.ts";
import { RuralGraph } from "./graph.ts";
import { MinHeap } from "./heap.ts";

/**
 * Dijkstra (1959). Camino de menor atenuación desde la antena.
 * Los pesos son no negativos (metros y saltos de radio), así que la primera
 * vez que se asienta un vértice su distancia es definitiva.
 * Con heap binario y entradas duplicadas: O((V + E) log V).
 */
export interface PathStep {
  nodeId: string;
  edgeId: string;
}

export interface DijkstraResult {
  dist: Map<string, number>;
  prev: Map<string, PathStep | null>;
}

export function dijkstra(
  nodes: readonly CommunityNode[],
  edges: readonly NetworkEdge[],
  sourceId: string,
  weight: (edge: NetworkEdge) => number,
): DijkstraResult {
  const adjacent = new RuralGraph([...nodes], [...edges]).adjacencyList();
  const dist = new Map<string, number>(nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const prev = new Map<string, PathStep | null>(nodes.map((node) => [node.id, null]));
  dist.set(sourceId, 0);
  const heap = new MinHeap<{ id: string; d: number }>((a, b) => a.d < b.d);
  heap.push({ id: sourceId, d: 0 });

  while (heap.size > 0) {
    const current = heap.pop();
    if (!current) {
      break;
    }
    const best = dist.get(current.id) ?? Number.POSITIVE_INFINITY;
    if (current.d > best) {
      continue;
    }
    for (const link of adjacent.get(current.id) ?? []) {
      const next = current.d + weight(link.edge);
      const known = dist.get(link.neighborId) ?? Number.POSITIVE_INFINITY;
      if (next < known) {
        dist.set(link.neighborId, next);
        prev.set(link.neighborId, { nodeId: current.id, edgeId: link.edge.id });
        heap.push({ id: link.neighborId, d: next });
      }
    }
  }

  return { dist, prev };
}

export function reconstructPath(result: DijkstraResult, targetId: string): string[] {
  const total = result.dist.get(targetId) ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(total)) {
    return [];
  }
  const path = [targetId];
  let cursor = targetId;
  for (let guard = 0; guard <= result.prev.size; guard += 1) {
    const step = result.prev.get(cursor);
    if (!step) {
      break;
    }
    path.push(step.nodeId);
    cursor = step.nodeId;
  }
  path.reverse();
  return path;
}

export function pathEdges(result: DijkstraResult, targetId: string): string[] {
  const edgeIds: string[] = [];
  let cursor = targetId;
  if (!Number.isFinite(result.dist.get(targetId) ?? Number.POSITIVE_INFINITY)) {
    return edgeIds;
  }
  for (let guard = 0; guard <= result.prev.size; guard += 1) {
    const step = result.prev.get(cursor);
    if (!step) {
      break;
    }
    edgeIds.push(step.edgeId);
    cursor = step.nodeId;
  }
  edgeIds.reverse();
  return edgeIds;
}
