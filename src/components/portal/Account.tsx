import { useState, type FormEvent } from "react";
import { useNetwork } from "../../context/NetworkContext.tsx";
import { formatCOP, formatDate } from "../../lib/format.ts";
import { isVoucherCurrent } from "../../lib/voucher.ts";
import { Button } from "../ui/button.tsx";

export function Account() {
  const { accountName, signIn, signOut, payments, nodes } = useNetwork();
  const [name, setName] = useState(accountName ?? "");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) {
      signIn(name);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-xs tracking-[0.18em] text-emerald uppercase">Cuenta local</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">Acceso</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        El acceso no crea una cuenta en un servidor. El nombre queda en este navegador, junto con los
        vouchers y los reportes.
      </p>

      {accountName ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between border border-line bg-card px-4 py-3">
            <p className="text-sm">Sesión de {accountName}</p>
            <Button type="button" variant="quiet" size="sm" onClick={signOut}>
              Cerrar sesión
            </Button>
          </div>
          <h2 className="text-lg font-medium">Vouchers en este dispositivo</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay pagos simulados.</p>
          ) : (
            <ul className="divide-y divide-line border border-line">
              {payments.map((payment) => {
                const house = nodes.find((node) => node.id === payment.houseId)?.name ?? payment.houseId;
                const current = isVoucherCurrent(payment);
                return (
                  <li key={payment.id} className="space-y-1 px-4 py-3 text-sm">
                    <p className="font-medium">{payment.voucherCode}</p>
                    <p className="text-muted">
                      {house} · {payment.userName} · {formatCOP(payment.amountCOP)} · vence{" "}
                      {formatDate(payment.expiresAt)}
                    </p>
                    <p className="text-muted">
                      Clave {payment.wifiPassword} · {current ? "vigente" : "vencido"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <form className="mt-8 max-w-md space-y-4 border border-line bg-card p-5" onSubmit={onSubmit}>
          <label className="block text-sm">
            Nombre
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full border border-line bg-background px-3 py-2"
              placeholder="Cómo te conoce la junta"
            />
          </label>
          <Button type="submit">Entrar</Button>
        </form>
      )}
    </section>
  );
}
