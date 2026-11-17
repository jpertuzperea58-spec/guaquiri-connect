import { destination, distance, point } from "@turf/turf";
import type { NetworkEdge } from "../types/network.ts";

/**
 * Tarifas de referencia del diseño (datos de prueba del brief, no una cotización).
 * Cable UTP exterior: COP 1.200 por metro.
 * Radioenlace Ubiquiti: COP 280.000 por par, costo fijo del salto.
 * El UTP de exteriores se limita a 100 m, el alcance práctico de Ethernet.
 */
export const UTP_COP_PER_METER = 1200;
export const PTP_PAIR_COP = 280_000;
export const UTP_MAX_METERS = 100;
export const FIBER_COP_PER_METER = 8000;

export interface LngLat {
  lat: number;
  lng: number;
}

/**
 * Distancia geodésica en metros. Turf usa Haversine sobre WGS84;
 * no es distancia euclidiana en el plano del mapa.
 */
export function geodesicDistanceMeters(a: LngLat, b: LngLat): number {
  const meters = distance(point([a.lng, a.lat]), point([b.lng, b.lat]), {
    units: "meters",
  });
  return meters;
}

/**
 * Desplaza un punto en metros hacia el este y el norte (proyección local).
 * Sirve para la red de prueba alrededor del centroide confirmado.
 */
export function offsetMeters(origin: LngLat, eastMeters: number, northMeters: number): LngLat {
  const distanceMeters = Math.hypot(eastMeters, northMeters);
  if (distanceMeters === 0) {
    return { lat: origin.lat, lng: origin.lng };
  }
  const bearing = (Math.atan2(eastMeters, northMeters) * 180) / Math.PI;
  const moved = destination(point([origin.lng, origin.lat]), distanceMeters / 1000, bearing, {
    units: "kilometers",
  });
  const [lng, lat] = moved.geometry.coordinates;
  return { lat: lat ?? origin.lat, lng: lng ?? origin.lng };
}

/**
 * Peso w(e) en pesos colombianos.
 * Si el enlace es inalámbrico, el peso es el par de radios.
 * Si es cableado, el peso es la longitud por la tarifa del UTP.
 */
export function calculateEdgeWeight(distanceMeters: number, isWireless: boolean): number {
  if (isWireless) {
    return PTP_PAIR_COP;
  }
  return Math.round(distanceMeters * UTP_COP_PER_METER);
}

export function selectLink(distanceMeters: number): {
  type: NetworkEdge["type"];
  costCOP: number;
  wireless: boolean;
} {
  if (distanceMeters <= UTP_MAX_METERS) {
    return {
      type: "utp_outdoor",
      costCOP: calculateEdgeWeight(distanceMeters, false),
      wireless: false,
    };
  }
  return {
    type: "ptp_5ghz",
    costCOP: calculateEdgeWeight(distanceMeters, true),
    wireless: true,
  };
}

/**
 * Costo de Dijkstra: unidades relativas de atenuación, no una medición de campo.
 * El radio paga un salto fijo; el UTP crece con la longitud.
 * La fibra queda modelada por si una arista importada la usa.
 */
export function attenuationUnits(edge: NetworkEdge): number {
  if (edge.type === "ptp_5ghz") {
    return 12 + edge.distanceMeters * 0.02;
  }
  if (edge.type === "fiber") {
    return 0.5 + edge.distanceMeters * 0.005;
  }
  return edge.distanceMeters * 0.04;
}
