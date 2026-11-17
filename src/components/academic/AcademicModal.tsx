import { useMemo } from "react";
import { useNetwork } from "../../context/NetworkContext.tsx";
import { CONFIRMED_CENTROID_DMS } from "../../data/community.ts";
import { RuralGraph } from "../../math/graph.ts";
import { formatCOP, formatMeters } from "../../lib/format.ts";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog.tsx";

export function AcademicModal() {
  const network = useNetwork();
  const graph = useMemo(
    () => new RuralGraph(network.nodes, network.edges),
    [network.edges, network.nodes],
  );
  const matrix = useMemo(() => graph.adjacencyMatrix(), [graph]);
  const list = useMemo(() => graph.adjacencyList(), [graph]);
  const savingsCop = network.mesh.costCOP - network.tree.costCOP;
  const savingsMeters = network.mesh.meters - network.tree.meters;

  return (
    <Dialog open={network.academicOpen} onOpenChange={network.setAcademicOpen}>
      <DialogContent data-testid="academic-modal">
        <DialogTitle className="pr-8 text-2xl font-medium tracking-tight">Modelo matemático</DialogTitle>
        <DialogDescription className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          G = (V, E, w) es el grafo no dirigido de la red. V son la antena, los repetidores y las
          viviendas. E son los enlaces posibles. w(e) es el costo en pesos: 1.200 COP por metro de UTP
          hasta 100 m, o 280.000 COP por un par de radios si la vivienda queda más lejos.
        </DialogDescription>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Vértices" value={String(network.nodes.length)} />
          <Stat label="Aristas de la malla" value={String(network.mesh.count)} />
          <Stat label="Aristas del MST" value={String(network.tree.count)} />
        </dl>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="border border-line p-4">
            <h3 className="text-sm tracking-[0.14em] text-muted uppercase">Malla completa</h3>
            <p className="mt-2 text-xl">{formatCOP(network.mesh.costCOP)}</p>
            <p className="text-sm text-muted">{formatMeters(network.mesh.meters)}</p>
          </article>
          <article className="border border-emerald p-4">
            <h3 className="text-sm tracking-[0.14em] text-emerald uppercase">MST · ahorro</h3>
            <p className="mt-2 text-xl">{formatCOP(network.tree.costCOP)}</p>
            <p className="text-sm text-muted">
              Se ahorran {formatCOP(savingsCop)} y {formatMeters(savingsMeters)} frente a tender todos los pares.
            </p>
          </article>
        </div>

        <h3 className="mt-8 text-sm tracking-[0.14em] text-muted uppercase">Complejidad</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 font-medium">Algoritmo</th>
              <th className="py-2 font-medium">Costo</th>
              <th className="py-2 font-medium">Papel en la red</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <td className="py-2">Kruskal + Union-Find</td>
              <td className="py-2">O(E log E)</td>
              <td className="py-2 text-muted">MST por la propiedad de ciclo. Find es casi O(1).</td>
            </tr>
            <tr className="border-t border-line">
              <td className="py-2">Prim</td>
              <td className="py-2">O(E log E)</td>
              <td className="py-2 text-muted">Crece desde la antena con cola de prioridad.</td>
            </tr>
            <tr className="border-t border-line">
              <td className="py-2">Dijkstra</td>
              <td className="py-2">O((V + E) log V)</td>
              <td className="py-2 text-muted">Menor atenuación desde la antena hasta la vivienda.</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">
          La restricción deg(v) ≤ puertos es una heurística voraz: ya no garantiza el MST óptimo y, si el
          switch es chico, puede dejar viviendas fuera. El centroide de la Casa Principal está confirmado
          ({CONFIRMED_CENTROID_DMS}). El resto del grafo es una red de prueba.
        </p>

        <h3 className="mt-8 text-sm tracking-[0.14em] text-muted uppercase">Matriz de adyacencia (COP)</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="p-1" />
                {network.nodes.map((node) => (
                  <th key={node.id} className="p-1 font-normal text-muted">
                    {node.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIndex) => (
                <tr key={network.nodes[rowIndex]?.id ?? rowIndex}>
                  <th className="p-1 text-left font-normal text-muted">{network.nodes[rowIndex]?.id}</th>
                  {row.map((value, columnIndex) => (
                    <td key={`${rowIndex}-${columnIndex}`} className="p-1 text-right text-foreground/80">
                      {rowIndex === columnIndex || !Number.isFinite(value) ? "·" : Math.round(value / 1000)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">Cifras en miles de pesos. La diagonal no es un enlace.</p>
        </div>

        <h3 className="mt-8 text-sm tracking-[0.14em] text-muted uppercase">Lista de adyacencia del MST</h3>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {network.nodes.map((node) => {
            const neighbors = (list.get(node.id) ?? []).filter((link) => link.edge.inMST);
            return (
              <li key={node.id}>
                <span className="text-emerald">{node.name}</span>
                <span className="text-muted">
                  {" "}
                  · deg {network.degreeOf(node.id)}/{network.portLimit(node)} ·{" "}
                  {neighbors.length === 0
                    ? "sin enlaces del árbol"
                    : neighbors
                        .map((link) => {
                          const other = network.nodes.find((item) => item.id === link.neighborId);
                          return `${other?.name ?? link.neighborId} (${Math.round(link.edge.distanceMeters)} m, ${formatCOP(link.edge.costCOP)})`;
                        })
                        .join("; ")}
                </span>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-3 py-3">
      <p className="text-xs tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="mt-1 text-2xl">{value}</p>
    </div>
  );
}
