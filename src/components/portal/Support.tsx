import { MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNetwork } from "../../context/NetworkContext.tsx";
import { FAQ, SUPPORT_DIRECTORY } from "../../data/support.ts";
import { CATEGORY_LABEL, formatDate, STATUS_LABEL } from "../../lib/format.ts";
import type { TicketCategory } from "../../types/network.ts";
import { Button } from "../ui/button.tsx";

export function Support() {
  const { nodes, tickets, addTicket, setTicketStatus } = useNetwork();
  const houses = nodes.filter((node) => node.type === "house" || node.type === "gateway");
  const [houseId, setHouseId] = useState(houses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("power");
  const [openFaq, setOpenFaq] = useState<string>(FAQ[0]?.id ?? "");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !houseId) {
      return;
    }
    addTicket({ houseId, title, description, category });
    setTitle("");
    setDescription("");
  }

  const whatsapp = `https://wa.me/${SUPPORT_DIRECTORY.phoneWa}?text=${encodeURIComponent(SUPPORT_DIRECTORY.whatsappText)}`;

  return (
    <section className="mx-auto max-w-6xl space-y-10 px-4 py-12 md:px-6">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.18em] text-emerald uppercase">Soporte local</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">Cuando la red se cae, la junta responde.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Las claves vigentes y este directorio quedan en el teléfono. Sin señal de datos, el portal
          instalado sigue mostrando el número de la junta.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          {FAQ.map((item) => {
            const open = openFaq === item.id;
            return (
              <article key={item.id} className="border border-line bg-card">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? "" : item.id)}
                >
                  {item.question}
                  <span className="text-muted">{open ? "–" : "+"}</span>
                </button>
                {open ? <p className="border-t border-line px-4 py-3 text-sm leading-relaxed text-muted">{item.answer}</p> : null}
              </article>
            );
          })}
          <a
            className="inline-flex items-center gap-2 border border-emerald px-4 py-3 text-sm text-emerald"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp a la junta
          </a>
          <p className="text-xs text-muted">
            {SUPPORT_DIRECTORY.juntaName} · {SUPPORT_DIRECTORY.phoneDisplay}. {SUPPORT_DIRECTORY.note}
          </p>
        </div>

        <form className="space-y-4 border border-line bg-card p-5" onSubmit={onSubmit}>
          <h2 className="text-lg font-medium">Reportar incidencia</h2>
          <label className="block text-sm">
            Lugar
            <select
              value={houseId}
              onChange={(event) => setHouseId(event.target.value)}
              className="mt-2 w-full border border-line bg-background px-3 py-2"
            >
              {houses.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Categoría
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as TicketCategory)}
              className="mt-2 w-full border border-line bg-background px-3 py-2"
            >
              <option value="signal">Señal</option>
              <option value="power">Energía</option>
              <option value="payment">Pago</option>
            </select>
          </label>
          <label className="block text-sm">
            Título
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Caída de energía"
              className="mt-2 w-full border border-line bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Descripción
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="La antena quedó desalineada después del viento."
              className="mt-2 min-h-28 w-full border border-line bg-background px-3 py-2"
            />
          </label>
          <Button type="submit">Enviar reporte</Button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-medium">Incidencias</h2>
        <ul className="mt-4 divide-y divide-line border border-line">
          {tickets.map((ticket) => {
            const place = nodes.find((node) => node.id === ticket.houseId)?.name ?? ticket.houseId;
            return (
              <li key={ticket.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{ticket.title}</p>
                  <p className="mt-1 text-muted">
                    {CATEGORY_LABEL[ticket.category]} · {place} · {formatDate(ticket.createdAt)}
                  </p>
                  <p className="mt-1 max-w-xl text-muted">{ticket.description}</p>
                </div>
                <button
                  type="button"
                  className="text-xs tracking-[0.14em] text-emerald uppercase"
                  onClick={() => setTicketStatus(ticket.id, ticket.status === "open" ? "resolved" : "open")}
                >
                  {STATUS_LABEL[ticket.status]}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
