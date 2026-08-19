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
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          + Novo cliente
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">Buscar (nome, CPF ou e-mail)</span>
          <input
            type="text"
            name="busca"
            defaultValue={busca}
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">Etapa</span>
          <select
            name="etapa"
            defaultValue={etapa}
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">Todas</option>
            {TODAS_ETAPAS.map((e) => (
              <option key={e} value={e}>
                {ETAPA_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Filtrar
        </button>
        {(etapa || busca) && (
          <Link href="/clientes" className="text-sm text-zinc-500 hover:text-zinc-300 hover:underline">
            Limpar filtros
          </Link>
        )}
        <a
          href={`/clientes/exportar${queryString ? `?${queryString}` : ""}`}
          className="ml-auto rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
        >
          Exportar Excel
        </a>
      </form>

      {clientes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 p-10 text-center text-sm text-zinc-500">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr className="border-b border-white/10">
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
                      className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/clientes/${cliente.id}`}
                          className="font-medium text-zinc-100 hover:text-indigo-300 hover:underline"
                        >
                          {cliente.nome}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              cliente.etapaAtual === "VISTO_NEGADO"
                                ? "bg-red-500/10 text-red-300"
                                : cliente.etapaAtual === "VISTO_APROVADO" ||
                                    cliente.etapaAtual === "PASSAPORTE_DEVOLVIDO"
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-zinc-500/15 text-zinc-300"
                            }`}
                          >
                            {ETAPA_LABEL[cliente.etapaAtual]}
                          </span>
                          {atrasado && (
                            <span
                              className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300"
                              title={`Parado nessa etapa desde ${dataEntrada?.toLocaleDateString("pt-BR")}`}
                            >
                              ⚠ {dias} dias parado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${progresso(cliente.etapaAtual)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">
                        {cliente.dataEntrevista ? (
                          <span className="flex items-center gap-2">
                            {formatarDataBr(cliente.dataEntrevista)}
                            {precisaLembrarEntrevista(
                              cliente.etapaAtual,
                              diasParaEntrevista(cliente.dataEntrevista),
                            ) && (
                              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                                📅 em breve
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
