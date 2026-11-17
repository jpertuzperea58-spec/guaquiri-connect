import type { ReactNode } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export type GatewayNodeData = {
  title: string;
  ip: string;
  downlink: string;
};

export type RepeaterNodeData = {
  title: string;
  ip: string;
  degree: number;
  maxPorts: number;
};

export type ClientNodeData = {
  title: string;
  paid: boolean;
  password: string;
  ssid: string;
};

export type GatewayFlowNode = Node<GatewayNodeData, "gateway">;
export type RepeaterFlowNode = Node<RepeaterNodeData, "repeater">;
export type ClientFlowNode = Node<ClientNodeData, "client">;

function Shell({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <div className={`min-w-44 border bg-card px-3 py-2 text-xs ${tone}`}>
      <Handle type="target" position={Position.Top} className="!bg-emerald" />
      {children}
      <Handle type="source" position={Position.Bottom} className="!bg-emerald" />
    </div>
  );
}

export function GatewayNode({ data }: NodeProps<GatewayFlowNode>) {
  return (
    <Shell tone="border-emerald">
      <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Antena Starlink</p>
      <p className="mt-1 text-sm font-medium">{data.title}</p>
      <p className="text-muted">{data.ip}</p>
      <p className="text-muted">{data.downlink}</p>
    </Shell>
  );
}

export function RepeaterNode({ data }: NodeProps<RepeaterFlowNode>) {
  const hot = data.degree > data.maxPorts;
  return (
    <Shell tone="border-satellite">
      <p className="text-[10px] tracking-[0.16em] text-satellite uppercase">Repetidor</p>
      <p className="mt-1 text-sm font-medium">{data.title}</p>
      <p className={hot ? "text-danger" : "text-muted"}>
        deg(v) {data.degree} / {data.maxPorts} puertos
      </p>
      <p className="text-muted">{data.ip}</p>
    </Shell>
  );
}

export function ClientNode({ data }: NodeProps<ClientFlowNode>) {
  return (
    <Shell tone="border-line">
      <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Vivienda</p>
      <p className="mt-1 text-sm font-medium">{data.title}</p>
      <p className="text-muted">{data.paid ? "Pago de $60.000" : "Sin pago vigente"}</p>
      <p className="text-muted">{data.paid ? data.ssid : "Clave pendiente"}</p>
      {data.paid ? <p className="tracking-wider">{data.password}</p> : null}
    </Shell>
  );
}
