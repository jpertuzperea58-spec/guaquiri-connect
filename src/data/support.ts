import type { SupportTicket } from "../types/network.ts";

/** Teléfono de demostración de la junta. No es una línea real. */
export const SUPPORT_DIRECTORY = {
  juntaName: "Junta de Acción Comunal de Guaquiri",
  phoneDisplay: "+57 300 555 0148",
  phoneWa: "573005550148",
  note: "Número de demostración. No corresponde a una línea real.",
  whatsappText:
    "Hola, Junta de Guaquiri. Escribo desde Guaquiri Connect por una novedad en el servicio de internet comunitario.",
};

export const SEEDED_TICKETS: SupportTicket[] = [
  {
    id: "ticket-energia",
    houseId: "h02",
    title: "Caída de energía",
    description: "Se fue la luz en la casa principal y el repetidor norte quedó sin PoE.",
    category: "power",
    status: "open",
    createdAt: "2024-11-02T14:10:00.000Z",
  },
  {
    id: "ticket-antena",
    houseId: "gw-principal",
    title: "Antena desalineada",
    description: "Después del viento la antena Starlink perdió señal y el soporte local la reorientó.",
    category: "signal",
    status: "resolved",
    createdAt: "2024-10-18T09:40:00.000Z",
  },
];

export const FAQ = [
  {
    id: "starlink",
    question: "¿Cómo funciona Starlink?",
    answer:
      "La antena de la Casa Principal es el gateway. Una suscripción comunitaria de Starlink baja internet al pueblo y de ahí se reparte por cable UTP y por radios cortos hacia las viviendas. No hay una antena en cada casa.",
  },
  {
    id: "luz",
    question: "¿Qué hacer si no hay luz?",
    answer:
      "La antena y los switches PoE necesitan energía. Sin luz no hay servicio, aunque el cielo esté despejado. Reporta la incidencia en Energía. El fondo de repuestos cubre fusibles, inyectores y cable dañado; no reemplaza la acometida de la vivienda.",
  },
  {
    id: "clave",
    question: "¿Cómo renuevo mi clave?",
    answer:
      "El voucher dura 30 días. Para renovar, registra otro pago simulado de $60.000 en Planes: se emite un SSID nuevo y otra clave. La anterior deja de ser la vigente en cuanto vence.",
  },
] as const;
