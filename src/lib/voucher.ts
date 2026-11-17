import QRCode from "qrcode";
import type { PaymentMethod, SubscriptionPayment } from "../types/network.ts";
import { formatCOP, formatDate, METHOD_LABEL } from "./format.ts";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomPassword(length: number): string {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  let password = "";
  for (let index = 0; index < length; index += 1) {
    const value = bytes[index] ?? 0;
    password += ALPHABET[value % ALPHABET.length] ?? "X";
  }
  return password;
}

export function wifiQrPayload(ssid: string, password: string): string {
  const escape = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:WPA;S:${escape(ssid)};P:${escape(password)};;`;
}

export function createSimulatedPayment(input: {
  houseId: string;
  userName: string;
  method: PaymentMethod;
}): SubscriptionPayment {
  const sample = crypto.getRandomValues(new Uint32Array(1));
  const suffix = 1000 + ((sample[0] ?? 0) % 9000);
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: crypto.randomUUID(),
    houseId: input.houseId,
    userName: input.userName.trim(),
    amountCOP: 60000,
    date: now.toISOString(),
    method: input.method,
    status: "approved",
    voucherCode: `GUAQUIRI-WIFI-${suffix}`,
    wifiPassword: randomPassword(8),
    expiresAt: expires.toISOString(),
  };
}

export function isVoucherCurrent(payment: SubscriptionPayment, now = Date.now()): boolean {
  return payment.status === "approved" && new Date(payment.expiresAt).getTime() > now;
}

export async function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 280,
    color: { dark: "#0c1210", light: "#ffffff" },
  });
}

export async function downloadReceipt(
  payment: SubscriptionPayment,
  houseName: string,
): Promise<void> {
  const qr = await qrDataUrl(wifiQrPayload(payment.voucherCode, payment.wifiPassword));
  const image = await loadImage(qr);
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1040;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  context.fillStyle = "#0c1210";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#10b981";
  context.lineWidth = 4;
  context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  context.fillStyle = "#e8eeea";
  context.font = "600 28px Outfit, sans-serif";
  context.fillText("Guaquiri Connect", 56, 88);
  context.fillStyle = "#95a59c";
  context.font = "16px Outfit, sans-serif";
  context.fillText("Comprobante de pago simulado", 56, 120);
  context.fillStyle = "#10b981";
  context.font = "600 42px Outfit, sans-serif";
  context.fillText(formatCOP(payment.amountCOP), 56, 190);
  context.fillStyle = "#e8eeea";
  context.font = "18px Outfit, sans-serif";
  const lines = [
    `Titular: ${payment.userName}`,
    `Vivienda: ${houseName}`,
    `Medio: ${METHOD_LABEL[payment.method] ?? payment.method}`,
    `Estado: Aprobado (simulación)`,
    `Fecha: ${formatDate(payment.date)}`,
    `Vigencia: ${formatDate(payment.expiresAt)}`,
    `SSID: ${payment.voucherCode}`,
    `Clave WiFi: ${payment.wifiPassword}`,
  ];
  lines.forEach((line, index) => {
    context.fillText(line, 56, 250 + index * 36);
  });
  context.drawImage(image, 250, 560, 300, 300);
  context.fillStyle = "#95a59c";
  context.font = "14px Outfit, sans-serif";
  context.fillText("Escanea el QR para unirte a la red. No es un cobro real.", 56, 920);
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = `comprobante-${payment.voucherCode}.png`;
  anchor.click();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo dibujar el QR"));
    image.src = src;
  });
}
