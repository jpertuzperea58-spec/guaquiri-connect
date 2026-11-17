export type NodeType = "gateway" | "repeater" | "house";

export type NodeStatus = "active" | "pending" | "offline";

export type EdgeType = "utp_outdoor" | "fiber" | "ptp_5ghz";

export type PaymentMethod = "nequi" | "daviplata" | "pse" | "cash";

export type PaymentStatus = "approved" | "pending";

export type TicketCategory = "signal" | "power" | "payment";

export type TicketStatus = "open" | "resolved";

/**
 * Origen de la coordenada.
 * `confirmed` sale del proyecto Google Earth.
 * `representative` es posición de prueba según la morfología, no un levantamiento.
 * `user` es un clic sobre el mapa.
 */
export type CoordinateSource = "confirmed" | "representative" | "user";

export interface CommunityNode {
  id: string;
  name: string;
  type: NodeType;
  lat: number;
  lng: number;
  isPerimeter: boolean;
  status: NodeStatus;
  coordinateSource: CoordinateSource;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  distanceMeters: number;
  costCOP: number;
  type: EdgeType;
  inMST: boolean;
}

export interface SubscriptionPayment {
  id: string;
  houseId: string;
  userName: string;
  amountCOP: 60000;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  voucherCode: string;
  wifiPassword: string;
  expiresAt: string;
}

export interface SupportTicket {
  id: string;
  houseId: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string;
}
