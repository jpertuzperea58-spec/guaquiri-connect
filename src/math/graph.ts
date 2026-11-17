import type { CommunityNode, NetworkEdge } from "../types/network.ts";
import { DisjointSet } from "./kruskal.ts";
import { geodesicDistanceMeters, selectLink } from "./spatial.ts";

/**
 * G = (V, E, w). Lista y matriz de adyacencia del grafo no dirigido.
 * getDegree cuenta puertos ocupados; con onlyMST mide la red construida.
 */
export class RuralGraph {
  readonly nodes: CommunityNode[];
  readonly edges: NetworkEdge[];

  constructor(nodes: CommunityNode[], edges: NetworkEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  adjacencyList(): Map<string, Array<{ neighborId: string; edge: NetworkEdge }>> {
    const list = new Map<string, Array<{ neighborId: string; edge: NetworkEdge }>>();
    for (const node of this.nodes) {
      list.set(node.id, []);
    }
    for (const edge of this.edges) {
      list.get(edge.source)?.push({ neighborId: edge.target, edge });
      list.get(edge.target)?.push({ neighborId: edge.source, edge });
    }
    return list;
  }

  /** Matriz de costos COP. La diagonal es 0 (no hay lazo). Sin arista: Infinity. */
  adjacencyMatrix(): number[][] {
    const size = this.nodes.length;
    const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => Number.POSITIVE_INFINITY));
    const index = new Map(this.nodes.map((node, position) => [node.id, position]));
    for (let position = 0; position < size; position += 1) {
      const row = matrix[position];
      if (row) {
        row[position] = 0;
      }
    }
    for (const edge of this.edges) {
      const left = index.get(edge.source);
      const right = index.get(edge.target);
      if (left === undefined || right === undefined) {
        continue;
      }
      const rowL = matrix[left];
      const rowR = matrix[right];
      if (!rowL || !rowR) {
        continue;
      }
      rowL[right] = edge.costCOP;
      rowR[left] = edge.costCOP;
    }
    return matrix;
  }

  getDegree(id: string, onlyMST = false): number {
    return this.edges.filter((edge) => {
      const incident = edge.source === id || edge.target === id;
      return incident && (!onlyMST || edge.inMST);
    }).length;
  }
}

/** Puertos de referencia para no sobrecargar el router Starlink ni los switches PoE. */
export function maxPortsFor(node: CommunityNode): number {
  if (node.type === "gateway") {
    return 8;
  }
  if (node.type === "repeater") {
    return 8;
  }
  return 4;
}

export function edgeId(source: string, target: string): string {
  return [source, target].sort().join("__");
}

/**
 * Malla de candidatos: todo par de vértices.
 * Hasta 100 m el enlace es UTP; más lejos, un par de radios de 5 GHz.
 */
export function buildCandidateEdges(nodes: readonly CommunityNode[]): NetworkEdge[] {
  const edges: NetworkEdge[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const left = nodes[i];
    if (!left) {
      continue;
    }
    for (let j = i + 1; j < nodes.length; j += 1) {
      const right = nodes[j];
      if (!right) {
        continue;
      }
      const distanceMeters = geodesicDistanceMeters(left, right);
      const link = selectLink(distanceMeters);
      edges.push({
        id: edgeId(left.id, right.id),
        source: left.id,
        target: right.id,
        distanceMeters,
        costCOP: link.costCOP,
        type: link.type,
        inMST: false,
      });
    }
  }
  return edges;
}

export function countComponents(nodeIds: readonly string[], edges: readonly NetworkEdge[]): number {
  const index = new Map(nodeIds.map((id, position) => [id, position]));
  const sets = new DisjointSet(nodeIds.length);
  for (const edge of edges) {
    const left = index.get(edge.source);
    const right = index.get(edge.target);
    if (left === undefined || right === undefined) {
      continue;
    }
    sets.union(left, right);
  }
  return sets.componentCount();
}

export function summarizeEdges(edges: readonly NetworkEdge[]): { costCOP: number; meters: number; count: number } {
  return edges.reduce(
    (total, edge) => ({
      costCOP: total.costCOP + edge.costCOP,
      meters: total.meters + edge.distanceMeters,
      count: total.count + 1,
    }),
    { costCOP: 0, meters: 0, count: 0 },
  );
}

/** Aristas que se dibujan además del MST: alternativas locales, no toda la malla. */
export function localDiscardedEdges(edges: readonly NetworkEdge[], reachMeters = 160): NetworkEdge[] {
  return edges.filter((edge) => !edge.inMST && edge.distanceMeters <= reachMeters);
}
