import L from "leaflet";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useNetwork } from "../../context/NetworkContext.tsx";
import {
  CENTROID_CONFIRMED,
  CONFIRMED_CENTROID,
  CONFIRMED_CENTROID_DMS,
  EARTH_PROJECT_TITLE,
  EARTH_PROJECT_URL,
} from "../../data/community.ts";
import { formatCOP, formatMeters, STATUS_LABEL } from "../../lib/format.ts";
import { isVoucherCurrent } from "../../lib/voucher.ts";
import type { CommunityNode, NetworkEdge } from "../../types/network.ts";
import { Button } from "../ui/button.tsx";
import "leaflet/dist/leaflet.css";

const ESRI =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

function markerColor(node: CommunityNode): string {
  if (node.type === "gateway") {
    return "#10b981";
  }
  if (node.type === "repeater") {
    return "#3d7ea6";
  }
  if (node.status === "offline") {
    return "#d16b5b";
  }
  if (node.status === "pending") {
    return "#d4a017";
  }
  return "#e8eeea";
}

function FitOnce({ nodes }: { nodes: CommunityNode[] }) {
  const map = useMap();
  useEffect(() => {
    if (nodes.length === 0) {
      return;
    }
    const bounds = L.latLngBounds(nodes.map((node) => [node.lat, node.lng]));
    map.fitBounds(bounds.pad(0.18));
  }, [map, nodes]);
  return null;
}

function ScaleBar() {
  const map = useMap();
  useEffect(() => {
    const control = L.control.scale({ imperial: false, metric: true });
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);
  return null;
}

function MapClick() {
  const { addMode, addHouse } = useNetwork();
  useMapEvents({
    click(event) {
      if (!addMode) {
        return;
      }
      addHouse(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function linePositions(edge: NetworkEdge, nodes: CommunityNode[]): [number, number][] | null {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) {
    return null;
  }
  return [
    [source.lat, source.lng],
    [target.lat, target.lng],
  ];
}

export function CoverageMap() {
  const { nodes, edges, mstEdges, discardedEdges, routeEdgeIds, select, selectedId } = useNetwork();
  const route = new Set(routeEdgeIds);

  return (
    <MapContainer
      center={[CONFIRMED_CENTROID.lat, CONFIRMED_CENTROID.lng]}
      zoom={17}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution="Teselas © Esri — Source: Esri, Maxar, Earthstar Geographics y la comunidad de usuarios GIS"
        url={ESRI}
      />
      <FitOnce nodes={nodes} />
      <ScaleBar />
      <MapClick />
      {discardedEdges.map((edge) => {
        const positions = linePositions(edge, nodes);
        if (!positions || route.has(edge.id)) {
          return null;
        }
        return (
          <Polyline
            key={`discard-${edge.id}`}
            positions={positions}
            pathOptions={{ color: "#9ca3af", weight: 1.5, opacity: 0.85, dashArray: "6 8" }}
          />
        );
      })}
      {edges
        .filter((edge) => route.has(edge.id) && !edge.inMST)
        .map((edge) => {
          const positions = linePositions(edge, nodes);
          if (!positions) {
            return null;
          }
          return (
            <Polyline
              key={`route-${edge.id}`}
              positions={positions}
              pathOptions={{ color: "#7eb6d6", weight: 5, opacity: 0.95 }}
            />
          );
        })}
      {mstEdges.map((edge) => {
        const positions = linePositions(edge, nodes);
        if (!positions) {
          return null;
        }
        const onRoute = route.has(edge.id);
        return (
          <Polyline
            key={`mst-${edge.id}`}
            positions={positions}
            pathOptions={{
              color: onRoute ? "#7eb6d6" : "#10b981",
              weight: onRoute ? 5 : 3.5,
              opacity: 0.95,
            }}
          />
        );
      })}
      {nodes.map((node) => (
        <CircleMarker
          key={node.id}
          center={[node.lat, node.lng]}
          radius={node.type === "gateway" ? 9 : node.type === "repeater" ? 7 : 5}
          pathOptions={{
            color: selectedId === node.id ? "#ffffff" : node.isPerimeter ? "#3d7ea6" : "#0c1210",
            weight: selectedId === node.id ? 3 : 1.5,
            fillColor: markerColor(node),
            fillOpacity: 0.95,
          }}
          eventHandlers={{
            click: (event) => {
              L.DomEvent.stopPropagation(event.originalEvent);
              select(node.id);
            },
          }}
        >
          <Popup>
            <NodePopup node={node} />
          </Popup>
        </CircleMarker>
      ))}
      <p className="sr-only">
        {CENTROID_CONFIRMED
          ? `Centroide confirmado ${CONFIRMED_CENTROID_DMS}`
          : "Centroide no confirmado"}
        {EARTH_PROJECT_TITLE} {EARTH_PROJECT_URL}
      </p>
    </MapContainer>
  );
}

function NodePopup({ node }: { node: CommunityNode }) {
  const { degreeOf, portLimit, voucherFor, distanceToGateway, routeAttenuation, gateway } = useNetwork();
  const voucher = node.type === "house" ? voucherFor(node.id) : null;
  const active = voucher ? isVoucherCurrent(voucher) : false;
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">{node.name}</p>
      <p>
        {node.type === "gateway" ? "Antena Starlink" : node.type === "repeater" ? "Repetidor" : "Vivienda"}
        {node.isPerimeter ? " · periférica" : ""} · {STATUS_LABEL[node.status]}
      </p>
      <p>
        Puertos {degreeOf(node.id)}/{portLimit(node)}
      </p>
      {node.id !== gateway.id ? <p>A la antena: {formatMeters(distanceToGateway ?? 0)}</p> : null}
      {routeAttenuation !== null && node.id !== gateway.id ? (
        <p>Atenuación Dijkstra: {routeAttenuation.toFixed(1)}</p>
      ) : null}
      {node.type === "house" ? (
        <p>{active ? `Suscripción vigente · ${voucher?.voucherCode}` : "Sin voucher vigente"}</p>
      ) : null}
      <p className="text-xs text-muted">
        {node.coordinateSource === "confirmed"
          ? "Coordenada confirmada en Google Earth."
          : "Posición de prueba, no es un levantamiento."}
      </p>
    </div>
  );
}

export function CoveragePage() {
  const network = useNetwork();
  const [message, setMessage] = useState("");

  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6">
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Consulta de cobertura</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Centroide confirmado en «{EARTH_PROJECT_TITLE}», placemark Casa Principal: {CONFIRMED_CENTROID_DMS}.
              Las otras 20 viviendas son posiciones representativas (núcleo y casas alejadas), no coordenadas
              inventadas como si fueran un censo.
            </p>
          </div>
          <Button type="button" variant="quiet" size="sm" data-testid="academic-open" onClick={() => network.setAcademicOpen(true)}>
            Ver modelo matemático
          </Button>
        </div>
        <div data-testid="coverage-map" className="h-[72vh] overflow-hidden border border-line">
          <CoverageMap />
        </div>
        <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
          <li className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-6 bg-emerald" /> MST en verde esmeralda
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-0 w-6 border-t border-dashed border-[#9ca3af]" /> Descartados
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-6 bg-satellite" /> Ruta Dijkstra
          </li>
        </ul>
      </div>
      <aside className="space-y-4 border border-line bg-card p-4 text-sm">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted uppercase">Árbol de expansión</p>
          <p data-testid="mst-cost" className="mt-1 text-2xl font-medium">
            {formatCOP(network.tree.costCOP)}
          </p>
          <p className="text-muted">{formatMeters(network.tree.meters)} · {network.tree.count} enlaces</p>
          <p className="mt-1 text-xs text-muted">
            {network.algorithm === "kruskal" ? "Kruskal" : "Prim desde la antena"}
            {network.respectDegree ? " · con tope de puertos" : ""}
            {network.mstConnectsAll ? " · conecta todos los nodos" : " · bosque incompleto"}
          </p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-xs tracking-[0.14em] text-muted uppercase">Algoritmo</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="algorithm"
              checked={network.algorithm === "kruskal"}
              onChange={() => network.setAlgorithm("kruskal")}
            />
            Kruskal
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="algorithm"
              checked={network.algorithm === "prim"}
              onChange={() => network.setAlgorithm("prim")}
            />
            Prim
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={network.respectDegree}
              onChange={(event) => network.setRespectDegree(event.target.checked)}
            />
            Restringir grado (puertos PoE)
          </label>
        </fieldset>
        {!network.mstConnectsAll ? (
          <p className="text-warn">
            Con el tope de puertos el bosque no alcanza a todas las viviendas. El MST clásico sí las conecta.
          </p>
        ) : null}
        <SelectedPanel />
        <div className="space-y-2 border-t border-line pt-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={network.addMode}
              onChange={(event) => network.setAddMode(event.target.checked)}
            />
            Agregar vivienda con el siguiente clic
          </label>
          <input
            value={network.draftName}
            onChange={(event) => network.setDraftName(event.target.value)}
            className="w-full border border-line bg-background px-2 py-2"
            aria-label="Nombre de la vivienda nueva"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="quiet" size="sm" onClick={network.exportJson}>
              Exportar JSON
            </Button>
            <Button type="button" variant="quiet" size="sm" onClick={network.exportGeoJson}>
              Exportar GeoJSON
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={network.resetLayout}>
              Restaurar
            </Button>
          </div>
          <label className="block text-xs text-muted">
            Importar JSON o GeoJSON
            <input
              type="file"
              accept="application/json,.json,.geojson"
              className="mt-1 block w-full text-xs"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                void file.text().then((text) => {
                  try {
                    setMessage(network.importJson(JSON.parse(text) as unknown));
                  } catch {
                    setMessage("No se pudo leer el archivo.");
                  }
                });
              }}
            />
          </label>
          {message ? <p className="text-xs text-muted">{message}</p> : null}
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Proyecto Earth:{" "}
          <a className="text-satellite underline" href={EARTH_PROJECT_URL} target="_blank" rel="noreferrer">
            {EARTH_PROJECT_TITLE}
          </a>
          . {CENTROID_CONFIRMED ? "Centroide confirmado." : "Centroide sin confirmar."}
        </p>
      </aside>
    </section>
  );
}

function SelectedPanel() {
  const network = useNetwork();
  const node = network.selected;
  if (!node) {
    return <p className="text-muted">Elige una vivienda en el mapa.</p>;
  }
  const voucher = node.type === "house" ? network.voucherFor(node.id) : null;
  const names = network.routeNodeIds.map(
    (id) => network.nodes.find((item) => item.id === id)?.name ?? id,
  );
  return (
    <div className="space-y-1 border-t border-line pt-3">
      <p className="font-medium">{node.name}</p>
      <p className="text-muted">
        {STATUS_LABEL[node.status]} · puertos {network.degreeOf(node.id)}/{network.portLimit(node)}
      </p>
      <p className="text-muted">
        {node.lat.toFixed(6)}, {node.lng.toFixed(6)}
      </p>
      {network.distanceToGateway !== null ? (
        <p>Distancia a la antena: {formatMeters(network.distanceToGateway)}</p>
      ) : null}
      {node.id === network.gateway.id ? (
        <p>Origen del enlace Starlink.</p>
      ) : names.length > 0 ? (
        <p>Ruta de menor atenuación: {names.join(" → ")}</p>
      ) : (
        <p>Sin ruta desde la antena.</p>
      )}
      {network.routeAttenuation !== null ? (
        <p className="text-muted">Atenuación relativa: {network.routeAttenuation.toFixed(1)}</p>
      ) : null}
      {node.type === "house" ? (
        <p>{voucher && isVoucherCurrent(voucher) ? `Pago al día · ${voucher.voucherCode}` : "Suscripción pendiente"}</p>
      ) : null}
    </div>
  );
}

