import { describe, expect, it } from "vitest";
import type { CommunityNode, NetworkEdge } from "../../types/network.ts";
import { dijkstra, reconstructPath } from "../dijkstra.ts";
import { calculateEdgeWeight } from "../spatial.ts";

function node(id: string): CommunityNode {
  return {
    id,
    name: id,
    type: id === "antena" ? "gateway" : "house",
    lat: 0,
    lng: 0,
    isPerimeter: false,
    status: "active",
    coordinateSource: "representative",
  };
}

function edge(source: string, target: string, distanceMeters: number, wireless = false): NetworkEdge {
  const [a, b] = [source, target].sort();
  return {
    id: `${a}__${b}`,
    source,
    target,
    distanceMeters,
    costCOP: calculateEdgeWeight(distanceMeters, wireless),
    type: wireless ? "ptp_5ghz" : "utp_outdoor",
    inMST: false,
  };
}

describe("Dijkstra", () => {
  it("elige el camino de menor peso y no el atajo más caro", () => {
    const nodes = [node("antena"), node("b"), node("c"), node("casa")];
    const edges = [
      edge("antena", "b", 1),
      edge("b", "c", 2),
      edge("c", "casa", 4),
      edge("antena", "casa", 10),
    ];
    const result = dijkstra(nodes, edges, "antena", (item) => item.distanceMeters);
    expect(result.dist.get("casa")).toBe(7);
    expect(reconstructPath(result, "casa")).toEqual(["antena", "b", "c", "casa"]);
  });

  it("deja en infinito un nodo inalcanzable", () => {
    const nodes = [node("antena"), node("b"), node("lejana")];
    const edges = [edge("antena", "b", 3)];
    const result = dijkstra(nodes, edges, "antena", (item) => item.distanceMeters);
    expect(result.dist.get("b")).toBe(3);
    expect(result.dist.get("lejana")).toBe(Number.POSITIVE_INFINITY);
    expect(reconstructPath(result, "lejana")).toEqual([]);
  });

  it("penaliza el salto de radio frente a un tramo de cable", () => {
    const nodes = [node("antena"), node("casa")];
    const cable = edge("antena", "casa", 40, false);
    const radio = edge("antena", "casa", 40, true);
    const byCable = dijkstra(nodes, [cable], "antena", (item) =>
      item.type === "ptp_5ghz" ? 12 + item.distanceMeters * 0.02 : item.distanceMeters * 0.04,
    );
    const byRadio = dijkstra(nodes, [radio], "antena", (item) =>
      item.type === "ptp_5ghz" ? 12 + item.distanceMeters * 0.02 : item.distanceMeters * 0.04,
    );
    expect(byCable.dist.get("casa") ?? 0).toBeLessThan(byRadio.dist.get("casa") ?? 0);
  });
});
