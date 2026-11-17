import { describe, expect, it } from "vitest";
import type { NetworkEdge } from "../../types/network.ts";
import { countComponents } from "../graph.ts";
import { DisjointSet, kruskalMST } from "../kruskal.ts";

function edge(
  source: string,
  target: string,
  costCOP: number,
  distanceMeters = costCOP,
): NetworkEdge {
  const [a, b] = [source, target].sort();
  return {
    id: `${a}__${b}`,
    source,
    target,
    distanceMeters,
    costCOP,
    type: "utp_outdoor",
    inMST: false,
  };
}

function hasCycle(nodeIds: string[], edges: NetworkEdge[]): boolean {
  return edges.length > nodeIds.length - countComponents(nodeIds, edges);
}

describe("DisjointSet", () => {
  it("une componentes y comprime hasta una sola raíz", () => {
    const sets = new DisjointSet(4);
    expect(sets.union(0, 1)).toBe(true);
    expect(sets.union(2, 3)).toBe(true);
    expect(sets.union(1, 2)).toBe(true);
    expect(sets.union(0, 3)).toBe(false);
    expect(sets.find(0)).toBe(sets.find(3));
    expect(sets.componentCount()).toBe(1);
  });
});

describe("Kruskal", () => {
  const nodes = ["a", "b", "c", "d"];
  const edges = [
    edge("a", "b", 1),
    edge("b", "c", 2),
    edge("a", "c", 3),
    edge("c", "d", 4),
    edge("a", "d", 10),
  ];

  it("no tiene ciclos, conecta el grafo y pesa lo óptimo", () => {
    const mst = kruskalMST(nodes, edges);
    expect(mst).toHaveLength(nodes.length - 1);
    expect(hasCycle(nodes, mst)).toBe(false);
    expect(countComponents(nodes, mst)).toBe(1);
    expect(mst.reduce((sum, item) => sum + item.costCOP, 0)).toBe(7);
    expect(mst.every((item) => item.inMST)).toBe(true);
  });

  it("en un bosque conecta solo los nodos alcanzables", () => {
    const ids = ["a", "b", "c", "d"];
    const forest = [edge("a", "b", 1), edge("c", "d", 2)];
    const mst = kruskalMST(ids, forest);
    expect(mst).toHaveLength(2);
    expect(countComponents(ids, mst)).toBe(countComponents(ids, forest));
    expect(hasCycle(ids, mst)).toBe(false);
  });

  it("respeta un grado máximo y sigue sin ciclos", () => {
    const ids = ["a", "b", "c", "d"];
    const mesh = [
      edge("a", "b", 1),
      edge("a", "c", 1),
      edge("a", "d", 1),
      edge("b", "c", 2),
      edge("c", "d", 2),
      edge("b", "d", 3),
    ];
    const mst = kruskalMST(ids, mesh, {
      maxDegree: () => 2,
    });
    expect(countComponents(ids, mst)).toBe(1);
    expect(hasCycle(ids, mst)).toBe(false);
    const degree = new Map(ids.map((id) => [id, 0]));
    for (const item of mst) {
      degree.set(item.source, (degree.get(item.source) ?? 0) + 1);
      degree.set(item.target, (degree.get(item.target) ?? 0) + 1);
    }
    for (const value of degree.values()) {
      expect(value).toBeLessThanOrEqual(2);
    }
  });
});
