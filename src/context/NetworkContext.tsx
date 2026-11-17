import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BASE_NODE_IDS, BASE_NODES, GATEWAY_ID } from "../data/community.ts";
import { attenuationUnits, geodesicDistanceMeters } from "../math/spatial.ts";
import {
  buildCandidateEdges,
  countComponents,
  localDiscardedEdges,
  maxPortsFor,
  summarizeEdges,
} from "../math/graph.ts";
import { kruskalMST } from "../math/kruskal.ts";
import { primMST } from "../math/prim.ts";
import { dijkstra, pathEdges, reconstructPath } from "../math/dijkstra.ts";
import {
  cacheSupportDirectory,
  loadAccount,
  loadExtraNodes,
  loadPayments,
  loadStatusOverrides,
  loadTickets,
  parseNode,
  parsePayment,
  parseTicket,
  saveAccount,
  saveExtraNodes,
  savePayments,
  saveStatusOverrides,
  saveTickets,
} from "../lib/storage.ts";
import { downloadText, isRecord } from "../lib/utils.ts";
import { createSimulatedPayment, isVoucherCurrent } from "../lib/voucher.ts";
import type {
  CommunityNode,
  NetworkEdge,
  NodeStatus,
  PaymentMethod,
  SubscriptionPayment,
  SupportTicket,
  TicketCategory,
} from "../types/network.ts";

export type AlgorithmName = "kruskal" | "prim";

interface NetworkContextValue {
  nodes: CommunityNode[];
  edges: NetworkEdge[];
  mstEdges: NetworkEdge[];
  discardedEdges: NetworkEdge[];
  algorithm: AlgorithmName;
  setAlgorithm: (algorithm: AlgorithmName) => void;
  respectDegree: boolean;
  setRespectDegree: (value: boolean) => void;
  mstConnectsAll: boolean;
  mesh: { costCOP: number; meters: number; count: number };
  tree: { costCOP: number; meters: number; count: number };
  selectedId: string | null;
  select: (id: string | null) => void;
  selected: CommunityNode | null;
  routeNodeIds: string[];
  routeEdgeIds: string[];
  routeAttenuation: number | null;
  distanceToGateway: number | null;
  addMode: boolean;
  setAddMode: (value: boolean) => void;
  draftName: string;
  setDraftName: (value: string) => void;
  addHouse: (lat: number, lng: number) => void;
  resetLayout: () => void;
  degreeOf: (id: string) => number;
  portLimit: (node: CommunityNode) => number;
  payments: SubscriptionPayment[];
  pay: (input: { houseId: string; userName: string; method: PaymentMethod }) => SubscriptionPayment;
  voucherFor: (houseId: string) => SubscriptionPayment | null;
  tickets: SupportTicket[];
  addTicket: (input: {
    houseId: string;
    title: string;
    description: string;
    category: TicketCategory;
  }) => void;
  setTicketStatus: (id: string, status: SupportTicket["status"]) => void;
  accountName: string | null;
  signIn: (name: string) => void;
  signOut: () => void;
  exportJson: () => void;
  exportGeoJson: () => void;
  importJson: (raw: unknown) => string;
  academicOpen: boolean;
  setAcademicOpen: (open: boolean) => void;
  gateway: CommunityNode;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

function applyStatus(nodes: CommunityNode[], overrides: Record<string, NodeStatus>): CommunityNode[] {
  return nodes.map((node) => {
    const status = overrides[node.id];
    return status ? { ...node, status } : node;
  });
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [extraNodes, setExtraNodes] = useState<CommunityNode[]>(() => loadExtraNodes());
  const [statusOverrides, setStatusOverrides] = useState<Record<string, NodeStatus>>(() => loadStatusOverrides());
  const [payments, setPayments] = useState<SubscriptionPayment[]>(() => loadPayments());
  const [tickets, setTickets] = useState<SupportTicket[]>(() => loadTickets());
  const [accountName, setAccountName] = useState<string | null>(() => loadAccount());
  const [algorithm, setAlgorithm] = useState<AlgorithmName>("kruskal");
  const [respectDegree, setRespectDegree] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(GATEWAY_ID);
  const [addMode, setAddMode] = useState(false);
  const [draftName, setDraftName] = useState("Vivienda nueva");
  const [academicOpen, setAcademicOpen] = useState(false);

  useEffect(() => {
    cacheSupportDirectory();
  }, []);

  const nodes = useMemo(
    () => applyStatus([...BASE_NODES, ...extraNodes], statusOverrides),
    [extraNodes, statusOverrides],
  );

  const gateway = nodes.find((node) => node.id === GATEWAY_ID) ?? BASE_NODES[0]!;

  const candidate = useMemo(() => buildCandidateEdges(nodes), [nodes]);

  const mstEdges = useMemo(() => {
    const limit = respectDegree
      ? (id: string) => {
          const node = nodes.find((item) => item.id === id);
          return node ? maxPortsFor(node) : 1;
        }
      : undefined;
    if (algorithm === "prim") {
      return primMST(nodes, candidate, GATEWAY_ID, limit);
    }
    return kruskalMST(
      nodes.map((node) => node.id),
      candidate,
      limit ? { maxDegree: limit } : undefined,
    );
  }, [algorithm, candidate, nodes, respectDegree]);

  const edges = useMemo(() => {
    const chosen = new Set(mstEdges.map((edge) => edge.id));
    return candidate.map((edge) => ({ ...edge, inMST: chosen.has(edge.id) }));
  }, [candidate, mstEdges]);

  const discardedEdges = useMemo(() => localDiscardedEdges(edges), [edges]);
  const mesh = useMemo(() => summarizeEdges(candidate), [candidate]);
  const tree = useMemo(() => summarizeEdges(mstEdges), [mstEdges]);
  const mstConnectsAll = countComponents(
    nodes.map((node) => node.id),
    mstEdges,
  ) === 1;

  const selected = nodes.find((node) => node.id === selectedId) ?? null;

  const route = useMemo(() => {
    if (!selected || selected.id === GATEWAY_ID) {
      return { nodeIds: [] as string[], edgeIds: [] as string[], attenuation: null as number | null };
    }
    const result = dijkstra(nodes, candidate, GATEWAY_ID, attenuationUnits);
    const attenuation = result.dist.get(selected.id) ?? Number.POSITIVE_INFINITY;
    if (!Number.isFinite(attenuation)) {
      return { nodeIds: [], edgeIds: [], attenuation: null };
    }
    return {
      nodeIds: reconstructPath(result, selected.id),
      edgeIds: pathEdges(result, selected.id),
      attenuation,
    };
  }, [candidate, nodes, selected]);

  const distanceToGateway = useMemo(() => {
    if (!selected || selected.id === GATEWAY_ID) {
      return selected ? 0 : null;
    }
    return geodesicDistanceMeters(gateway, selected);
  }, [gateway, selected]);

  const persistExtras = useCallback((next: CommunityNode[]) => {
    setExtraNodes(next);
    saveExtraNodes(next);
  }, []);

  const addHouse = useCallback(
    (lat: number, lng: number) => {
      const name = draftName.trim() || "Vivienda nueva";
      const distance = geodesicDistanceMeters(gateway, { lat, lng });
      const node: CommunityNode = {
        id: `h-user-${crypto.randomUUID().slice(0, 8)}`,
        name,
        type: "house",
        lat,
        lng,
        isPerimeter: distance > 120,
        status: "pending",
        coordinateSource: "user",
      };
      persistExtras([...extraNodes, node]);
      setSelectedId(node.id);
    },
    [draftName, extraNodes, gateway, persistExtras],
  );

  const resetLayout = useCallback(() => {
    persistExtras([]);
    setStatusOverrides({});
    saveStatusOverrides({});
    setSelectedId(GATEWAY_ID);
  }, [persistExtras]);

  const pay = useCallback(
    (input: { houseId: string; userName: string; method: PaymentMethod }) => {
      const payment = createSimulatedPayment(input);
      const next = [payment, ...payments];
      setPayments(next);
      savePayments(next);
      const house = nodes.find((node) => node.id === input.houseId);
      if (house?.status === "pending") {
        const overrides = { ...statusOverrides, [house.id]: "active" as const };
        setStatusOverrides(overrides);
        saveStatusOverrides(overrides);
      }
      return payment;
    },
    [nodes, payments, statusOverrides],
  );

  const voucherFor = useCallback(
    (houseId: string) => {
      const list = payments
        .filter((payment) => payment.houseId === houseId && payment.status === "approved")
        .sort((a, b) => b.date.localeCompare(a.date));
      return list.find((payment) => isVoucherCurrent(payment)) ?? list[0] ?? null;
    },
    [payments],
  );

  const addTicket = useCallback(
    (input: { houseId: string; title: string; description: string; category: TicketCategory }) => {
      const ticket: SupportTicket = {
        id: crypto.randomUUID(),
        houseId: input.houseId,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      const next = [ticket, ...tickets];
      setTickets(next);
      saveTickets(next);
    },
    [tickets],
  );

  const setTicketStatus = useCallback(
    (id: string, status: SupportTicket["status"]) => {
      const next = tickets.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket));
      setTickets(next);
      saveTickets(next);
    },
    [tickets],
  );

  const signIn = useCallback((name: string) => {
    const trimmed = name.trim();
    setAccountName(trimmed);
    saveAccount(trimmed);
  }, []);

  const signOut = useCallback(() => {
    setAccountName(null);
    saveAccount(null);
  }, []);

  const exportJson = useCallback(() => {
    downloadText(
      "guaquiri-connect.json",
      JSON.stringify({ nodes, payments, tickets }, null, 2),
      "application/json",
    );
  }, [nodes, payments, tickets]);

  const exportGeoJson = useCallback(() => {
    const features = [
      ...nodes.map((node) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [node.lng, node.lat] },
        properties: { ...node },
      })),
      ...mstEdges.map((edge) => {
        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);
        return {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [source?.lng ?? 0, source?.lat ?? 0],
              [target?.lng ?? 0, target?.lat ?? 0],
            ],
          },
          properties: {
            id: edge.id,
            distanceMeters: edge.distanceMeters,
            costCOP: edge.costCOP,
            type: edge.type,
            inMST: true,
          },
        };
      }),
    ];
    downloadText(
      "guaquiri-connect.geojson",
      JSON.stringify({ type: "FeatureCollection", features }, null, 2),
      "application/geo+json",
    );
  }, [mstEdges, nodes]);

  const importJson = useCallback(
    (raw: unknown) => {
      if (!isRecord(raw) && !Array.isArray(raw)) {
        return "El archivo no es JSON de red ni GeoJSON.";
      }
      const document = isRecord(raw) ? raw : {};
      const importedNodes: CommunityNode[] = [];
      const nodeSource = Array.isArray(document.nodes)
        ? document.nodes
        : document.type === "FeatureCollection" && Array.isArray(document.features)
          ? document.features
          : [];

      for (const item of nodeSource) {
        if (isRecord(item) && item.type === "Feature" && isRecord(item.geometry) && isRecord(item.properties)) {
          const geometry = item.geometry;
          if (geometry.type !== "Point" || !Array.isArray(geometry.coordinates)) {
            continue;
          }
          const lng = geometry.coordinates[0];
          const lat = geometry.coordinates[1];
          const parsed = parseNode({ ...item.properties, lat, lng });
          if (parsed && !BASE_NODE_IDS.has(parsed.id) && parsed.id !== GATEWAY_ID) {
            importedNodes.push({ ...parsed, coordinateSource: parsed.coordinateSource });
          }
          continue;
        }
        const parsed = parseNode(item);
        if (parsed && !BASE_NODE_IDS.has(parsed.id)) {
          importedNodes.push(parsed);
        }
      }

      if (importedNodes.length > 0) {
        const known = new Set(extraNodes.map((node) => node.id));
        persistExtras([...extraNodes, ...importedNodes.filter((node) => !known.has(node.id))]);
      }

      if (Array.isArray(document.payments)) {
        const next = document.payments
          .map(parsePayment)
          .filter((item): item is SubscriptionPayment => item !== null);
        if (next.length > 0) {
          setPayments(next);
          savePayments(next);
        }
      }
      if (Array.isArray(document.tickets)) {
        const next = document.tickets
          .map(parseTicket)
          .filter((item): item is SupportTicket => item !== null);
        setTickets(next);
        saveTickets(next);
      }
      return importedNodes.length > 0
        ? `Se importaron ${importedNodes.length} viviendas. El centroide confirmado no se movió.`
        : "Archivo leído. No había viviendas nuevas fuera del dataset base.";
    },
    [extraNodes, persistExtras],
  );

  const degreeOf = useCallback(
    (id: string) => mstEdges.filter((edge) => edge.source === id || edge.target === id).length,
    [mstEdges],
  );

  const value: NetworkContextValue = {
    nodes,
    edges,
    mstEdges,
    discardedEdges,
    algorithm,
    setAlgorithm,
    respectDegree,
    setRespectDegree,
    mstConnectsAll,
    mesh,
    tree,
    selectedId,
    select: setSelectedId,
    selected,
    routeNodeIds: route.nodeIds,
    routeEdgeIds: route.edgeIds,
    routeAttenuation: route.attenuation,
    distanceToGateway,
    addMode,
    setAddMode,
    draftName,
    setDraftName,
    addHouse,
    resetLayout,
    degreeOf,
    portLimit: maxPortsFor,
    payments,
    pay,
    voucherFor,
    tickets,
    addTicket,
    setTicketStatus,
    accountName,
    signIn,
    signOut,
    exportJson,
    exportGeoJson,
    importJson,
    academicOpen,
    setAcademicOpen,
    gateway,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const value = useContext(NetworkContext);
  if (!value) {
    throw new Error("useNetwork debe usarse dentro de NetworkProvider");
  }
  return value;
}
