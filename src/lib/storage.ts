import { SEEDED_TICKETS, SUPPORT_DIRECTORY } from "../data/support.ts";
import type {
  CommunityNode,
  CoordinateSource,
  NodeStatus,
  NodeType,
  PaymentMethod,
  SubscriptionPayment,
  SupportTicket,
  TicketCategory,
} from "../types/network.ts";
import { isRecord } from "./utils.ts";

const KEYS = {
  extras: "guaquiri.nodes.extra",
  status: "guaquiri.nodes.status",
  payments: "guaquiri.payments",
  tickets: "guaquiri.tickets",
  account: "guaquiri.account",
  support: "guaquiri.support",
} as const;

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function isNodeType(value: unknown): value is NodeType {
  return value === "gateway" || value === "repeater" || value === "house";
}

function isStatus(value: unknown): value is NodeStatus {
  return value === "active" || value === "pending" || value === "offline";
}

function isSource(value: unknown): value is CoordinateSource {
  return value === "confirmed" || value === "representative" || value === "user";
}

export function parseNode(value: unknown): CommunityNode | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }
  if (!isNodeType(value.type) || !isStatus(value.status)) {
    return null;
  }
  if (typeof value.lat !== "number" || typeof value.lng !== "number") {
    return null;
  }
  if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) {
    return null;
  }
  if (typeof value.isPerimeter !== "boolean") {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    type: value.type,
    lat: value.lat,
    lng: value.lng,
    isPerimeter: value.isPerimeter,
    status: value.status,
    coordinateSource: isSource(value.coordinateSource) ? value.coordinateSource : "user",
  };
}

function isMethod(value: unknown): value is PaymentMethod {
  return value === "nequi" || value === "daviplata" || value === "pse" || value === "cash";
}

export function parsePayment(value: unknown): SubscriptionPayment | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.id !== "string" ||
    typeof value.houseId !== "string" ||
    typeof value.userName !== "string" ||
    value.amountCOP !== 60000 ||
    typeof value.date !== "string" ||
    typeof value.voucherCode !== "string" ||
    typeof value.wifiPassword !== "string" ||
    typeof value.expiresAt !== "string" ||
    !isMethod(value.method) ||
    (value.status !== "approved" && value.status !== "pending")
  ) {
    return null;
  }
  return {
    id: value.id,
    houseId: value.houseId,
    userName: value.userName,
    amountCOP: 60000,
    date: value.date,
    method: value.method,
    status: value.status,
    voucherCode: value.voucherCode,
    wifiPassword: value.wifiPassword,
    expiresAt: value.expiresAt,
  };
}

function isCategory(value: unknown): value is TicketCategory {
  return value === "signal" || value === "power" || value === "payment";
}

export function parseTicket(value: unknown): SupportTicket | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.id !== "string" ||
    typeof value.houseId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.createdAt !== "string" ||
    !isCategory(value.category) ||
    (value.status !== "open" && value.status !== "resolved")
  ) {
    return null;
  }
  return {
    id: value.id,
    houseId: value.houseId,
    title: value.title,
    description: value.description,
    category: value.category,
    status: value.status,
    createdAt: value.createdAt,
  };
}

export function loadExtraNodes(): CommunityNode[] {
  const raw = readJson(KEYS.extras);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(parseNode).filter((node): node is CommunityNode => node !== null);
}

export function saveExtraNodes(nodes: CommunityNode[]): void {
  writeJson(KEYS.extras, nodes);
}

export function loadStatusOverrides(): Record<string, NodeStatus> {
  const raw = readJson(KEYS.status);
  if (!isRecord(raw)) {
    return {};
  }
  const overrides: Record<string, NodeStatus> = {};
  for (const [id, status] of Object.entries(raw)) {
    if (isStatus(status)) {
      overrides[id] = status;
    }
  }
  return overrides;
}

export function saveStatusOverrides(overrides: Record<string, NodeStatus>): void {
  writeJson(KEYS.status, overrides);
}

export function loadPayments(): SubscriptionPayment[] {
  const raw = readJson(KEYS.payments);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(parsePayment).filter((item): item is SubscriptionPayment => item !== null);
}

export function savePayments(payments: SubscriptionPayment[]): void {
  writeJson(KEYS.payments, payments);
}

export function loadTickets(): SupportTicket[] {
  const raw = readJson(KEYS.tickets);
  if (!Array.isArray(raw)) {
    writeJson(KEYS.tickets, SEEDED_TICKETS);
    return SEEDED_TICKETS;
  }
  const tickets = raw.map(parseTicket).filter((item): item is SupportTicket => item !== null);
  return tickets;
}

export function saveTickets(tickets: SupportTicket[]): void {
  writeJson(KEYS.tickets, tickets);
}

export function loadAccount(): string | null {
  const raw = readJson(KEYS.account);
  return typeof raw === "string" && raw.trim() ? raw : null;
}

export function saveAccount(name: string | null): void {
  if (!name) {
    localStorage.removeItem(KEYS.account);
    return;
  }
  writeJson(KEYS.account, name);
}

export function cacheSupportDirectory(): void {
  writeJson(KEYS.support, SUPPORT_DIRECTORY);
}
