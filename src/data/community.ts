import { offsetMeters } from "../math/spatial.ts";
import type { CommunityNode, NodeStatus } from "../types/network.ts";

/**
 * Centroide confirmado en el proyecto Google Earth
 * «senso para instalacion de internet», placemark «casa principal»:
 * 10°06'56.56" N, 74°55'28.23" W, elevación de terreno 11 m.
 * https://earth.google.com/earth/d/1QQawv6j_bPFvCKJAk9T8GAngEVMpxcQU?usp=sharing
 *
 * El resto de vértices NO son coordenadas levantadas. Son una red de prueba
 * de 20 viviendas: núcleo cercano y grupos alejados, según la morfología
 * del asentamiento (casa principal, viviendas nucleadas, casas periféricas).
 */
export const CONFIRMED_CENTROID = {
  lat: 10 + 6 / 60 + 56.56 / 3600,
  lng: -(74 + 55 / 60 + 28.23 / 3600),
};

export const CONFIRMED_CENTROID_DMS = '10°06\'56.56" N, 74°55\'28.23" W';

export const EARTH_PROJECT_URL =
  "https://earth.google.com/earth/d/1QQawv6j_bPFvCKJAk9T8GAngEVMpxcQU?usp=sharing";

export const EARTH_PROJECT_TITLE = "senso para instalacion de internet";

export const GATEWAY_ID = "gw-principal";

export const CENTROID_CONFIRMED = true;

interface Draft {
  id: string;
  name: string;
  type: CommunityNode["type"];
  east: number;
  north: number;
  isPerimeter: boolean;
  status: NodeStatus;
}

const drafts: Draft[] = [
  {
    id: GATEWAY_ID,
    name: "Casa Principal",
    type: "gateway",
    east: 0,
    north: 0,
    isPerimeter: false,
    status: "active",
  },
  {
    id: "rep-norte",
    name: "Repetidor Norte",
    type: "repeater",
    east: 0,
    north: 55,
    isPerimeter: false,
    status: "active",
  },
  {
    id: "rep-este",
    name: "Repetidor Este",
    type: "repeater",
    east: 60,
    north: -10,
    isPerimeter: false,
    status: "active",
  },
  {
    id: "rep-suroeste",
    name: "Repetidor Suroeste",
    type: "repeater",
    east: -45,
    north: -35,
    isPerimeter: false,
    status: "active",
  },
  { id: "h01", name: "Vivienda 01", type: "house", east: 18, north: 14, isPerimeter: false, status: "pending" },
  { id: "h02", name: "Vivienda 02", type: "house", east: -16, north: 20, isPerimeter: false, status: "offline" },
  { id: "h03", name: "Vivienda 03", type: "house", east: 24, north: -16, isPerimeter: false, status: "active" },
  { id: "h04", name: "Vivienda 04", type: "house", east: -22, north: -12, isPerimeter: false, status: "active" },
  { id: "h05", name: "Vivienda 05", type: "house", east: 12, north: 36, isPerimeter: false, status: "active" },
  { id: "h06", name: "Vivienda 06", type: "house", east: -8, north: 42, isPerimeter: false, status: "active" },
  { id: "h07", name: "Vivienda 07", type: "house", east: 36, north: 22, isPerimeter: false, status: "pending" },
  { id: "h08", name: "Vivienda 08", type: "house", east: -30, north: 8, isPerimeter: false, status: "active" },
  { id: "h09", name: "Vivienda 09", type: "house", east: 28, north: -32, isPerimeter: false, status: "active" },
  { id: "h10", name: "Vivienda 10", type: "house", east: -12, north: -28, isPerimeter: false, status: "active" },
  { id: "h11", name: "Vivienda 11", type: "house", east: 48, north: 6, isPerimeter: false, status: "active" },
  { id: "h12", name: "Vivienda 12", type: "house", east: -36, north: -22, isPerimeter: false, status: "active" },
  { id: "h13", name: "Vivienda alejada 01", type: "house", east: 8, north: 190, isPerimeter: true, status: "active" },
  { id: "h14", name: "Vivienda alejada 02", type: "house", east: 28, north: 210, isPerimeter: true, status: "active" },
  { id: "h15", name: "Vivienda alejada 03", type: "house", east: -12, north: 205, isPerimeter: true, status: "active" },
  { id: "h16", name: "Vivienda alejada 04", type: "house", east: 200, north: 0, isPerimeter: true, status: "active" },
  { id: "h17", name: "Vivienda alejada 05", type: "house", east: 220, north: 22, isPerimeter: true, status: "pending" },
  { id: "h18", name: "Vivienda alejada 06", type: "house", east: 195, north: -25, isPerimeter: true, status: "active" },
  { id: "h19", name: "Vivienda alejada 07", type: "house", east: -170, north: -130, isPerimeter: true, status: "active" },
  { id: "h20", name: "Vivienda alejada 08", type: "house", east: -150, north: -155, isPerimeter: true, status: "active" },
];

function roundCoord(value: number): number {
  return Math.round(value * 1e7) / 1e7;
}

export function materializeCommunity(): CommunityNode[] {
  return drafts.map((draft) => {
    const position = offsetMeters(CONFIRMED_CENTROID, draft.east, draft.north);
    return {
      id: draft.id,
      name: draft.name,
      type: draft.type,
      lat: roundCoord(position.lat),
      lng: roundCoord(position.lng),
      isPerimeter: draft.isPerimeter,
      status: draft.status,
      coordinateSource: draft.id === GATEWAY_ID ? "confirmed" : "representative",
    };
  });
}

export const BASE_NODES = materializeCommunity();

export const BASE_NODE_IDS = new Set(BASE_NODES.map((node) => node.id));

export function ipv4For(node: CommunityNode): string {
  if (node.id === GATEWAY_ID) {
    return "192.168.88.1";
  }
  if (node.id === "rep-norte") {
    return "192.168.88.11";
  }
  if (node.id === "rep-este") {
    return "192.168.88.12";
  }
  if (node.id === "rep-suroeste") {
    return "192.168.88.13";
  }
  const house = /^h(\d+)$/.exec(node.id);
  if (house?.[1]) {
    return `192.168.88.${100 + Number(house[1])}`;
  }
  if (node.type === "repeater") {
    return "192.168.88.19";
  }
  return "192.168.88.200";
}
