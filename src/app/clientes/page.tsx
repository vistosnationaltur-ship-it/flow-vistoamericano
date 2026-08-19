import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ETAPA_LABEL,
  ORDEM_ETAPAS,
  progresso,
  dataEntradaEtapa,
  diasParado,
  estaAtrasado,
} from "@/lib/etapas";
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
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Novo cliente
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Buscar (nome, CPF ou e-mail)</span>
          <input
            type="text"
            name="busca"
            defaultValue={busca}
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Etapa</span>
          <select
            name="etapa"
            defaultValue={etapa}
            className="rounded-md border border-zinc-300 px-3 py-2"
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
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Filtrar
        </button>
        {(etapa || busca) && (
          <Link href="/clientes" className="text-sm text-zinc-500 hover:underline">
            Limpar filtros
          </Link>
        )}
        <a
          href={`/clientes/exportar${queryString ? `?${queryString}` : ""}`}
          className="ml-auto rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Exportar Excel
        </a>
      </form>

      {clientes.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Etapa atual</th>
                <th className="px-4 py-3 font-medium">Progresso</th>
                <th className="px-4 py-3 font-medium">Entrevista</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente: Cliente & { historico: HistoricoEtapa[] }) => {
                const dataEntrada = dataEntradaEtapa(cliente.historico, cliente.etapaAtual);
                const dias = diasParado(dataEntrada);
                const atrasado = estaAtrasado(cliente.etapaAtual, dias);
                return (
                  <tr key={cliente.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {cliente.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            cliente.etapaAtual === "VISTO_NEGADO"
                              ? "bg-red-100 text-red-700"
                              : cliente.etapaAtual === "VISTO_APROVADO" ||
                                  cliente.etapaAtual === "PASSAPORTE_DEVOLVIDO"
                                ? "bg-green-100 text-green-700"
                                : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {ETAPA_LABEL[cliente.etapaAtual]}
                        </span>
                        {atrasado && (
                          <span
                            className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                            title={`Parado nessa etapa desde ${dataEntrada?.toLocaleDateString("pt-BR")}`}
                          >
                            ⚠ {dias} dias parado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full bg-zinc-900"
                          style={{ width: `${progresso(cliente.etapaAtual)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {cliente.dataEntrevista
                        ? new Date(cliente.dataEntrevista).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
