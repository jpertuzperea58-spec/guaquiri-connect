import { describe, expect, it } from "vitest";
import { materializeCommunity } from "../../data/community.ts";
import { dijkstra, reconstructPath } from "../dijkstra.ts";
import { buildCandidateEdges, countComponents, maxPortsFor, RuralGraph, summarizeEdges } from "../graph.ts";
import { kruskalMST } from "../kruskal.ts";
import { primMST } from "../prim.ts";
import { attenuationUnits, calculateEdgeWeight, geodesicDistanceMeters, offsetMeters } from "../spatial.ts";

describe("pesos y geometría", () => {
  it("cobra el UTP por metro y el par de radios como costo fijo", () => {
    expect(calculateEdgeWeight(10, false)).toBe(12_000);
    expect(calculateEdgeWeight(500, true)).toBe(280_000);
    expect(calculateEdgeWeight(80, true)).toBe(280_000);
  });

  it("un kilómetro al norte mueve la latitud y casi no la longitud", () => {
    const origin = { lat: 10.115711, lng: -74.924508 };
    const moved = offsetMeters(origin, 0, 1000);
    expect(moved.lat).toBeGreaterThan(origin.lat + 0.008);
    expect(moved.lat).toBeLessThan(origin.lat + 0.01);
    expect(Math.abs(moved.lng - origin.lng)).toBeLessThan(0.0001);
    const back = geodesicDistanceMeters(origin, moved);
    expect(back).toBeGreaterThan(990);
    expect(back).toBeLessThan(1010);
  });
});

describe("red de Guaquiri", () => {
  const nodes = materializeCommunity();
  const edges = buildCandidateEdges(nodes);
  const ids = nodes.map((node) => node.id);
  const mst = kruskalMST(ids, edges);

  it("el MST no tiene ciclos y conecta todas las viviendas de prueba", () => {
    expect(nodes.filter((node) => node.type === "house")).toHaveLength(20);
    expect(countComponents(ids, edges)).toBe(1);
    expect(mst).toHaveLength(nodes.length - 1);
    expect(countComponents(ids, mst)).toBe(1);
    expect(mst.length).toBe(nodes.length - countComponents(ids, mst));
  });

  it("Prim desde la antena cuesta lo mismo que Kruskal", () => {
    const gateway = nodes.find((node) => node.type === "gateway");
    expect(gateway?.coordinateSource).toBe("confirmed");
    const prim = primMST(nodes, edges, gateway?.id ?? "");
    const kruskalCost = mst.reduce((sum, edge) => sum + edge.costCOP, 0);
    const primCost = prim.reduce((sum, edge) => sum + edge.costCOP, 0);
    expect(primCost).toBe(kruskalCost);
    expect(prim).toHaveLength(mst.length);
  });

  it("usa UTP en el núcleo y radios hacia las casas alejadas", () => {
    const radios = mst.filter((edge) => edge.type === "ptp_5ghz");
    const cables = mst.filter((edge) => edge.type === "utp_outdoor");
    expect(radios.length).toBeGreaterThan(0);
    expect(cables.length).toBeGreaterThan(radios.length);
    for (const edge of mst) {
      const wireless = edge.type === "ptp_5ghz";
      expect(edge.costCOP).toBe(calculateEdgeWeight(edge.distanceMeters, wireless));
    }
  });

  it("la malla completa cuesta más metros y más pesos que el MST", () => {
    const mesh = summarizeEdges(edges);
    const tree = summarizeEdges(mst);
    expect(mesh.costCOP).toBeGreaterThan(tree.costCOP);
    expect(mesh.meters).toBeGreaterThan(tree.meters);
  });

  it("expone grado, lista y matriz simétrica", () => {
    const marked = edges.map((edge) => ({
      ...edge,
      inMST: mst.some((chosen) => chosen.id === edge.id),
    }));
    const graph = new RuralGraph(nodes, marked);
    const gateway = nodes.find((node) => node.type === "gateway");
    expect(gateway).toBeDefined();
    expect(graph.getDegree(gateway?.id ?? "", true)).toBeGreaterThan(0);
    expect(graph.getDegree(gateway?.id ?? "", true)).toBeLessThanOrEqual(maxPortsFor(gateway!));
    const matrix = graph.adjacencyMatrix();
    expect(matrix).toHaveLength(nodes.length);
    expect(matrix[0]?.[0]).toBe(0);
    expect(matrix[0]?.[1]).toBe(matrix[1]?.[0]);
    const list = graph.adjacencyList();
    expect(list.get(gateway?.id ?? "")?.length).toBe(nodes.length - 1);
  });

  it("Dijkstra llega de la antena a una casa alejada con peso finito", () => {
    const gateway = nodes.find((node) => node.type === "gateway");
    const far = nodes.find((node) => node.isPerimeter);
    expect(gateway).toBeDefined();
    expect(far).toBeDefined();
    if (!gateway || !far) {
      return;
    }
    const result = dijkstra(nodes, edges, gateway.id, attenuationUnits);
    const path = reconstructPath(result, far.id);
    expect(path[0]).toBe(gateway.id);
    expect(path.at(-1)).toBe(far.id);
    expect(result.dist.get(far.id)).toBeLessThan(Number.POSITIVE_INFINITY);
  });
});
