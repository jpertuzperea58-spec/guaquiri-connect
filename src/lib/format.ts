const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const meters = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

export function formatCOP(value: number): string {
  return cop.format(value);
}

export function formatMeters(value: number): string {
  return `${meters.format(value)} m`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return dateFormat.format(date);
}

export const METHOD_LABEL: Record<string, string> = {
  nequi: "Nequi",
  daviplata: "Daviplata",
  pse: "PSE",
  cash: "Efectivo",
};

export const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  pending: "Pendiente",
  offline: "Sin servicio",
  open: "Abierta",
  resolved: "Resuelta",
  approved: "Aprobado",
};

export const CATEGORY_LABEL: Record<string, string> = {
  signal: "Señal",
  power: "Energía",
  payment: "Pago",
};
