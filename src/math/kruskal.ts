import type { NetworkEdge } from "../types/network.ts";

/**
 * Unión-Find (Disjoint Set).
 * Compresión de caminos en find y unión por rango.
 * La complejidad amortizada por operación es O(α(n)), inversa de Ackermann,
 * prácticamente constante. Kruskal lo usa para rechazar aristas que cierran ciclo
 * (la propiedad de ciclo: la arista más pesada de un ciclo no entra al MST).
 */
export class DisjointSet {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = Array.from({ length: size }, () => 0);
  }

  find(x: number): number {
    const current = this.parent[x];
    if (current === undefined) {
      throw new Error(`Índice fuera del conjunto: ${x}`);
    }
    if (current !== x) {
      this.parent[x] = this.find(current);
    }
    return this.parent[x] ?? x;
  }

  union(a: number, b: number): boolean {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === rootB) {
      return false;
    }
    const rankA = this.rank[rootA] ?? 0;
    const rankB = this.rank[rootB] ?? 0;
    if (rankA < rankB) {
      const swap = rootA;
      rootA = rootB;
      rootB = swap;
    }
    this.parent[rootB] = rootA;
    if ((this.rank[rootA] ?? 0) === (this.rank[rootB] ?? 0)) {
      this.rank[rootA] = (this.rank[rootA] ?? 0) + 1;
    }
    return true;
  }

  componentCount(): number {
    const roots = new Set<number>();
    for (let index = 0; index < this.parent.length; index += 1) {
      roots.add(this.find(index));
    }
    return roots.size;
  }
}

export interface KruskalOptions {
  /** Si se define, una arista que superaría el grado máximo se omite (heurística voraz). */
  maxDegree?: (id: string) => number;
}

/**
 * Kruskal (1956). Ordena las aristas por peso y acepta la siguiente que no forma ciclo.
 * Sin restricción de grado el resultado es un MST óptimo: O(E log E) por el ordenamiento.
 * Con tope de puertos deja de ser óptimo y puede quedar un bosque si el grado no alcanza.
 */
export function kruskalMST(
  nodeIds: readonly string[],
  edges: readonly NetworkEdge[],
  options?: KruskalOptions,
): NetworkEdge[] {
  const index = new Map(nodeIds.map((id, position) => [id, position]));
  const sets = new DisjointSet(nodeIds.length);
  const degree = new Map(nodeIds.map((id) => [id, 0]));
  const sorted = [...edges].sort(
    (a, b) => a.costCOP - b.costCOP || a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id),
  );
  const chosen: NetworkEdge[] = [];

  for (const edge of sorted) {
    const left = index.get(edge.source);
    const right = index.get(edge.target);
    if (left === undefined || right === undefined) {
      continue;
    }
    if (sets.find(left) === sets.find(right)) {
      continue;
    }
    const degreeSource = degree.get(edge.source) ?? 0;
    const degreeTarget = degree.get(edge.target) ?? 0;
    if (options?.maxDegree) {
      const limitSource = options.maxDegree(edge.source);
      const limitTarget = options.maxDegree(edge.target);
      if (degreeSource >= limitSource || degreeTarget >= limitTarget) {
        continue;
      }
    }
    sets.union(left, right);
    degree.set(edge.source, degreeSource + 1);
    degree.set(edge.target, degreeTarget + 1);
    chosen.push({ ...edge, inMST: true });
  }

  return chosen;
}
