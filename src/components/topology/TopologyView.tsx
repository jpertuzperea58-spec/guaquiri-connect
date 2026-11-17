import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import { useMemo } from "react";
import { useNetwork } from "../../context/NetworkContext.tsx";
import { GATEWAY_ID, ipv4For } from "../../data/community.ts";
import type { CommunityNode, NetworkEdge } from "../../types/network.ts";
import { isVoucherCurrent } from "../../lib/voucher.ts";
import { Button } from "../ui/button.tsx";
import { ClientNode, GatewayNode, RepeaterNode, type ClientNodeData, type GatewayNodeData, type RepeaterNodeData } from "./flowNodes.tsx";
import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = {
  gateway: GatewayNode,
  repeater: RepeaterNode,
  client: ClientNode,
};

export function TopologyView() {
  const network = useNetwork();
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => buildFlow(network), [network]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Topología de la red</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            El árbol instalado, visto desde la antena. Las aristas activas se animan. El repetidor muestra
            deg(v) frente a los puertos del switch.
          </p>
        </div>
        <Button type="button" variant="quiet" size="sm" data-testid="academic-open" onClick={() => network.setAcademicOpen(true)}>
          Ver modelo matemático
        </Button>
      </div>
      <div data-testid="topology" className="h-[72vh] border border-line">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.15}
          nodesDraggable={false}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
        >
          <Background color="#2a3832" gap={22} />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(12,18,16,0.72)"
            nodeColor={(node) =>
              node.type === "gateway" ? "#10b981" : node.type === "repeater" ? "#3d7ea6" : "#9ca3af"
            }
          />
        </ReactFlow>
      </div>
    </section>
  );
}

function buildFlow(network: ReturnType<typeof useNetwork>): { nodes: Node[]; edges: Edge[] } {
  const positions = layoutTree(network.nodes, network.mstEdges);

  const nodes: Node[] = network.nodes.map((node) => {
    const point = positions.get(node.id) ?? { x: 0, y: 0 };
    const x = point.x;
    const y = point.y;
    if (node.type === "gateway") {
      const data: GatewayNodeData = {
        title: node.name,
        ip: ipv4For(node),
        downlink: "Bajada comunitaria",
      };
      return { id: node.id, type: "gateway", position: { x, y }, data };
    }
    if (node.type === "repeater") {
      const data: RepeaterNodeData = {
        title: node.name,
        ip: ipv4For(node),
        degree: network.degreeOf(node.id),
        maxPorts: network.portLimit(node),
      };
      return { id: node.id, type: "repeater", position: { x, y }, data };
    }
    const voucher = network.voucherFor(node.id);
    const paid = voucher ? isVoucherCurrent(voucher) : false;
    const data: ClientNodeData = {
      title: node.name,
      paid,
      password: paid ? (voucher?.wifiPassword ?? "") : "",
      ssid: paid ? (voucher?.voucherCode ?? "") : "",
    };
    return { id: node.id, type: "client", position: { x, y }, data };
  });

  const edges: Edge[] = network.mstEdges.map((edge) => {
    const source = network.nodes.find((node) => node.id === edge.source);
    const target = network.nodes.find((node) => node.id === edge.target);
    const live = source?.status === "active" && target?.status === "active";
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: live,
      style: {
        stroke: live ? "#10b981" : "#6b7280",
        strokeWidth: 2,
      },
    };
  });

  return { nodes, edges };
}

function layoutTree(nodes: CommunityNode[], edges: NetworkEdge[]): Map<string, { x: number; y: number }> {
  const adjacent = new Map<string, string[]>();
  for (const node of nodes) {
    adjacent.set(node.id, []);
  }
  for (const edge of edges) {
    adjacent.get(edge.source)?.push(edge.target);
    adjacent.get(edge.target)?.push(edge.source);
  }
  const depthOf = new Map<string, number>([[GATEWAY_ID, 0]]);
  const parentOf = new Map<string, string>();
  const queue = [GATEWAY_ID];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    for (const next of adjacent.get(current) ?? []) {
      if (depthOf.has(next)) {
        continue;
      }
      depthOf.set(next, (depthOf.get(current) ?? 0) + 1);
      parentOf.set(next, current);
      queue.push(next);
    }
  }

  const buckets = new Map<number, CommunityNode[]>();
  for (const node of nodes) {
    const depth = depthOf.get(node.id) ?? 0;
    const list = buckets.get(depth) ?? [];
    list.push(node);
    buckets.set(depth, list);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const depths = [...buckets.keys()].sort((a, b) => a - b);
  for (const depth of depths) {
    const list = buckets.get(depth) ?? [];
    list.sort((a, b) => {
      const ax = positions.get(parentOf.get(a.id) ?? "")?.x ?? 0;
      const bx = positions.get(parentOf.get(b.id) ?? "")?.x ?? 0;
      return ax - bx || a.name.localeCompare(b.name, "es");
    });
    const gap = 240;
    const width = Math.max(list.length - 1, 0) * gap;
    list.forEach((node, index) => {
      positions.set(node.id, { x: index * gap - width / 2, y: depth * 180 });
    });
  }
  return positions;
}
