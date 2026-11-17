import { describe, expect, it } from "vitest";
import type { CommunityNode, NetworkEdge } from "../../types/network.ts";
import { kruskalMST } from "../kruskal.ts";
import { primMST } from "../prim.ts";

function node(id: string): CommunityNode {
  return {
    id,
    name: id,
    type: "house",
    lat: 0,
    lng: 0,
    isPerimeter: false,
    status: "active",
    coordinateSource: "representative",
  };
}

function edge(source: string, target: string, costCOP: number): NetworkEdge {
  const [a, b] = [source, target].sort();
  return {
    id: `${a}__${b}`,
    source,
    target,
    distanceMeters: costCOP,
    costCOP,
    type: "utp_outdoor",
    inMST: false,
  };
}

describe("Prim", () => {
  it("desde el origen pesa igual que Kruskal en un grafo conexo", () => {
    const nodes = [node("a"), node("b"), node("c"), node("d")];
    const edges = [
      edge("a", "b", 1),
      edge("b", "c", 2),
      edge("a", "c", 3),
      edge("c", "d", 4),
      edge("a", "d", 10),
    ];
    const prim = primMST(nodes, edges, "a");
    const kruskal = kruskalMST(
      nodes.map((item) => item.id),
      edges,
    );
    expect(prim).toHaveLength(3);
    expect(prim.reduce((sum, item) => sum + item.costCOP, 0)).toBe(
      kruskal.reduce((sum, item) => sum + item.costCOP, 0),
    );
    expect(prim.some((item) => item.source === "a" || item.target === "a")).toBe(true);
  });

  it("no cruza a otra componente si el origen no la alcanza", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("a", "b", 4)];
    const prim = primMST(nodes, edges, "a");
    expect(prim).toHaveLength(1);
    expect(prim[0]?.source === "c" || prim[0]?.target === "c").toBe(false);
  });
});
