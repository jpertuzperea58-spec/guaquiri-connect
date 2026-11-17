import confetti from "canvas-confetti";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNetwork } from "../../context/NetworkContext.tsx";
import { formatCOP, formatDate, METHOD_LABEL } from "../../lib/format.ts";
import { downloadReceipt, isVoucherCurrent, wifiQrPayload } from "../../lib/voucher.ts";
import type { PaymentMethod, SubscriptionPayment } from "../../types/network.ts";
import { Button } from "../ui/button.tsx";
import { QrImage } from "./QrImage.tsx";

const METHODS: PaymentMethod[] = ["nequi", "daviplata", "pse", "cash"];

export function Plans() {
  const { nodes, pay, voucherFor } = useNetwork();
  const houses = nodes.filter((node) => node.type === "house");
  const defaultHouse = houses.find((house) => house.status === "pending")?.id ?? houses[0]?.id ?? "";
  const [houseId, setHouseId] = useState(defaultHouse);
  const [userName, setUserName] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("nequi");
  const [issued, setIssued] = useState<SubscriptionPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const houseName = useMemo(
    () => houses.find((house) => house.id === houseId)?.name ?? "Vivienda",
    [houseId, houses],
  );
  const current = issued ?? (houseId ? voucherFor(houseId) : null);

  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userName.trim() || !houseId) {
      setError("Escribe el nombre y elige la vivienda.");
      return;
    }
    const payment = pay({ houseId, userName, method });
    setIssued(payment);
    setError("");
    setCopied(false);
    void confetti({
      particleCount: 24,
      spread: 36,
      ticks: 40,
      gravity: 1.8,
      decay: 0.9,
      scalar: 0.65,
      startVelocity: 16,
      origin: { y: 0.75 },
      zIndex: 20,
      disableForReducedMotion: true,
      colors: ["#10b981", "#3d7ea6", "#e8eeea"],
    });
  }

  async function copyPassword(password: string) {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("No se pudo copiar. Selecciona la clave manualmente.");
    }
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="border border-line bg-card p-6 md:p-8">
        <p className="text-xs tracking-[0.18em] text-emerald uppercase">Plan comunitario</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">Plan Hogar Guaquiri</h1>
        <p data-testid="plan-price" className="mt-4 text-4xl font-medium text-white">
          {formatCOP(60000)}
          <span className="ml-2 text-base font-normal text-muted">/ mes</span>
        </p>
        <ul className="mt-6 space-y-3 text-sm text-foreground/90">
          <li>Conexión ilimitada vía Starlink comunitario.</li>
          <li>Soporte local de la junta.</li>
          <li>Mantenimiento de cableado.</li>
        </ul>
        <p className="mt-6 border-t border-line pt-6 text-sm leading-relaxed text-muted">
          Los $60.000 financian el abono satelital (Starlink Colombia, COP $160.000/mes) y el fondo
          de repuestos. Hardware de referencia: kit Starlink COP $64.990 promocional. Cable UTP
          exterior COP $1.200/m. Radioenlace Ubiquiti COP $280.000/par. El pago de esta pantalla es
          una simulación: no pide credenciales ni mueve dinero.
        </p>
      </article>

      <div className="border border-line bg-card p-6 md:p-8">
        {issued ? (
          <VoucherCard
            payment={issued}
            houseName={houseName}
            copied={copied}
            onCopy={() => void copyPassword(issued.wifiPassword)}
            onDownload={() => void downloadReceipt(issued, houseName)}
          />
        ) : (
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <h2 className="text-xl font-medium">Pago simulado</h2>
              <p className="mt-1 text-sm text-muted">Confirma $60.000 COP y se emite el voucher de 30 días.</p>
            </div>
            <label className="block text-sm">
              Nombre de quien paga
              <input
                data-testid="pay-name"
                required
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                className="mt-2 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-emerald"
                placeholder="Nombre del vecino"
              />
            </label>
            <label className="block text-sm">
              Vivienda
              <select
                data-testid="pay-house"
                required
                value={houseId}
                onChange={(event) => setHouseId(event.target.value)}
                className="mt-2 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-emerald"
              >
                {houses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.name}
                    {house.isPerimeter ? " · alejada" : ""}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="text-sm">Medio de pago</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {METHODS.map((item) => (
                  <label
                    key={item}
                    className={`cursor-pointer border px-3 py-3 text-sm ${
                      method === item ? "border-emerald text-emerald" : "border-line text-muted"
                    }`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="method"
                      value={item}
                      checked={method === item}
                      data-testid={`pay-method-${item}`}
                      onChange={() => setMethod(item)}
                    />
                    {METHOD_LABEL[item]}
                  </label>
                ))}
              </div>
            </fieldset>
            {current && isVoucherCurrent(current) ? (
              <p className="text-sm text-muted">
                Esta vivienda ya tiene un voucher vigente ({current.voucherCode}). Un pago nuevo lo renueva.
              </p>
            ) : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" data-testid="pay-confirm">
              Confirmar pago de $60.000
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function VoucherCard({
  payment,
  houseName,
  copied,
  onCopy,
  onDownload,
}: {
  payment: SubscriptionPayment;
  houseName: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <div data-testid="voucher-card" className="space-y-4">
      <p className="text-xs tracking-[0.18em] text-emerald uppercase">Voucher emitido</p>
      <h2 className="text-xl font-medium">WiFi por 30 días</h2>
      <p className="text-sm text-muted">
        {houseName} · {formatCOP(payment.amountCOP)} · {METHOD_LABEL[payment.method]} · hasta{" "}
        {formatDate(payment.expiresAt)}
      </p>
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3 border border-line px-3 py-2">
          <dt className="text-muted">SSID</dt>
          <dd data-testid="voucher-ssid" className="font-medium">
            {payment.voucherCode}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border border-line px-3 py-2">
          <dt className="text-muted">Clave</dt>
          <dd data-testid="voucher-password" className="font-medium tracking-wider">
            {payment.wifiPassword}
          </dd>
        </div>
      </dl>
      <QrImage value={wifiQrPayload(payment.voucherCode, payment.wifiPassword)} testId="voucher-qr" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="quiet" onClick={onCopy}>
          {copied ? "Clave copiada" : "Copiar clave"}
        </Button>
        <Button type="button" variant="outline" onClick={onDownload}>
          Descargar comprobante
        </Button>
      </div>
    </div>
  );
}
