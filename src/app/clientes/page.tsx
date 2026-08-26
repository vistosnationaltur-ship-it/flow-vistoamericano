import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ETAPA_LABEL,
  ORDEM_ETAPAS,
  progresso,
  dataEntradaEtapa,
  diasParado,
  estaAtrasado,
  diasParaEntrevista,
  precisaLembrarEntrevista,
} from "@/lib/etapas";
import { formatarDataBr } from "@/lib/formatar";
import type { Cliente, EtapaProcesso, HistoricoEtapa, Prisma } from "@/generated/prisma/client";

const TODAS_ETAPAS: EtapaProcesso[] = [...ORDEM_ETAPAS, "VISTO_NEGADO"];

const INPUT =
  "rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-deep)] px-3 py-2 text-[var(--color-text)] outline-none transition-colors duration-150 ease-out focus:border-[var(--color-accent-focus)] focus:ring-2 focus:ring-[var(--color-accent-ring)]";
const BTN_PRIMARY =
  "rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-[var(--shadow-accent-rest)] transition-shadow duration-150 ease-out hover:shadow-[var(--shadow-accent-hover)] motion-safe:hover:-translate-y-px motion-safe:transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
const BTN_OUTLINE =
  "rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--color-text-subtle)] transition-colors duration-150 ease-out hover:bg-white/5 hover:text-[var(--color-text)]";

// Selo de etapa reutiliza o mesmo padrão do "selo" da ficha do cliente
// (DESIGN.md §7): dourado = etapa ativa/andamento, danger = negado,
// success = aprovado/finalizado. Nunca cor neutra genérica.
function EtapaBadge({ etapa }: { etapa: EtapaProcesso }) {
  if (etapa === "VISTO_NEGADO") {
    return (
      <span className="rounded-full border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]">
        {ETAPA_LABEL[etapa]}
      </span>
    );
  }
  if (etapa === "VISTO_APROVADO" || etapa === "PASSAPORTE_DEVOLVIDO") {
    return (
      <span className="rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-success)]">
        {ETAPA_LABEL[etapa]}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
      {ETAPA_LABEL[etapa]}
    </span>
  );
}

export default async function ClientesPage(props: PageProps<"/clientes">) {
  const searchParams = await props.searchParams;
  const etapa = typeof searchParams.etapa === "string" ? searchParams.etapa : "";
  const busca = typeof searchParams.busca === "string" ? searchParams.busca.trim() : "";

  const where: Prisma.ClienteWhereInput = {};
  if (etapa && (TODAS_ETAPAS as string[]).includes(etapa)) {
    where.etapaAtual = etapa as EtapaProcesso;
  }
  if (busca) {
    where.OR = [
      { nome: { contains: busca } },
      { cpf: { contains: busca } },
      { email: { contains: busca } },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: { historico: { orderBy: { criadoEm: "desc" } } },
  });

  const queryString = new URLSearchParams(
    Object.entries({ etapa, busca }).filter(([, v]) => v),
  ).toString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display)] text-[var(--color-text)]">
          Clientes
        </h1>
        <Link href="/clientes/novo" className={BTN_PRIMARY}>
          + Novo cliente
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[var(--color-text-subtle)]">Buscar (nome, CPF ou e-mail)</span>
          <input type="text" name="busca" defaultValue={busca} className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[var(--color-text-subtle)]">Etapa</span>
          <select name="etapa" defaultValue={etapa} className={INPUT}>
            <option value="">Todas</option>
            {TODAS_ETAPAS.map((e) => (
              <option key={e} value={e}>
                {ETAPA_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={BTN_OUTLINE}>
          Filtrar
        </button>
        {(etapa || busca) && (
          <Link
            href="/clientes"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:underline"
          >
            Limpar filtros
          </Link>
        )}
        <a
          href={`/clientes/exportar${queryString ? `?${queryString}` : ""}`}
          className={`ml-auto ${BTN_OUTLINE}`}
        >
          Exportar Excel
        </a>
      </form>

      {clientes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-base)]/60 p-10 text-center text-sm text-[var(--color-text-muted)]">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[var(--color-text-muted)]">
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Etapa atual</th>
                  <th className="px-5 py-3 font-medium">Progresso</th>
                  <th className="px-5 py-3 font-medium">Entrevista</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente: Cliente & { historico: HistoricoEtapa[] }) => {
                  const dataEntrada = dataEntradaEtapa(cliente.historico, cliente.etapaAtual);
                  const dias = diasParado(dataEntrada);
                  const atrasado = estaAtrasado(cliente.etapaAtual, dias);
                  return (
                    <tr
                      key={cliente.id}
                      className="border-t border-[var(--color-border-subtle)] transition-colors duration-150 ease-out hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/clientes/${cliente.id}`}
                          className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] hover:underline"
                        >
                          {cliente.nome}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <EtapaBadge etapa={cliente.etapaAtual} />
                          {atrasado && (
                            <span
                              className="rounded-full border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]"
                              title={`Parado nessa etapa desde ${dataEntrada?.toLocaleDateString("pt-BR")}`}
                            >
                              {dias} dias parado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)]"
                            style={{ width: `${progresso(cliente.etapaAtual)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--color-text-muted)]">
                        {cliente.dataEntrevista ? (
                          <span className="flex items-center gap-2">
                            {formatarDataBr(cliente.dataEntrevista)}
                            {precisaLembrarEntrevista(
                              cliente.etapaAtual,
                              diasParaEntrevista(cliente.dataEntrevista),
                            ) && (
                              <span className="rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
                                em breve
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
