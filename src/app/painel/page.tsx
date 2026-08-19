import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ETAPA_LABEL,
  ORDEM_ETAPAS,
  LIMITE_DIAS_ALERTA,
  dataEntradaEtapa,
  diasParado,
  estaAtrasado,
  diasParaEntrevista,
  precisaLembrarEntrevista,
} from "@/lib/etapas";
import { formatarDataBr } from "@/lib/formatar";
import type { EtapaProcesso } from "@/generated/prisma/client";

const TODAS_ETAPAS: EtapaProcesso[] = [...ORDEM_ETAPAS, "VISTO_NEGADO"];

export default async function PainelPage() {
  const contagens = await prisma.cliente.groupBy({
    by: ["etapaAtual"],
    _count: { _all: true },
  });

  const total = contagens.reduce((soma, c) => soma + c._count._all, 0);
  const porEtapa = new Map(contagens.map((c) => [c.etapaAtual, c._count._all]));

  const etapasMonitoradas = Object.keys(LIMITE_DIAS_ALERTA) as EtapaProcesso[];
  const candidatos =
    etapasMonitoradas.length > 0
      ? await prisma.cliente.findMany({
          where: { etapaAtual: { in: etapasMonitoradas } },
          include: { historico: { orderBy: { criadoEm: "desc" } } },
        })
      : [];
  const atrasados = candidatos.filter((c) =>
    estaAtrasado(c.etapaAtual, diasParado(dataEntradaEtapa(c.historico, c.etapaAtual))),
  );

  const comEntrevistaProxima = await prisma.cliente.findMany({
    where: { dataEntrevista: { not: null } },
  });
  const entrevistasProximas = comEntrevistaProxima
    .filter((c) => precisaLembrarEntrevista(c.etapaAtual, diasParaEntrevista(c.dataEntrevista)))
    .sort((a, b) => (a.dataEntrevista as Date).getTime() - (b.dataEntrevista as Date).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Painel</h1>
        <p className="text-sm text-zinc-500">
          {total} cliente{total === 1 ? "" : "s"} no total
        </p>
      </div>

      {entrevistasProximas.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            📅 {entrevistasProximas.length} entrevista
            {entrevistasProximas.length === 1 ? "" : "s"} nos próximos dias
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {entrevistasProximas.map((c) => {
              const dias = diasParaEntrevista(c.dataEntrevista)!;
              const quando =
                dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;
              return (
                <li key={c.id} className="text-sm">
                  <Link href={`/clientes/${c.id}`} className="text-amber-800 hover:underline">
                    {c.nome}
                  </Link>
                  <span className="text-amber-700">
                    {" "}
                    — entrevista {quando} ({formatarDataBr(c.dataEntrevista)})
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {atrasados.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            ⚠ {atrasados.length} cliente{atrasados.length === 1 ? "" : "s"} parado
            {atrasados.length === 1 ? "" : "s"} há mais de {LIMITE_DIAS_ALERTA.RASCUNHO_DS160_SOLICITADO} dias
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {atrasados.map((c) => {
              const dias = diasParado(dataEntradaEtapa(c.historico, c.etapaAtual));
              return (
                <li key={c.id} className="text-sm">
                  <Link href={`/clientes/${c.id}`} className="text-red-700 hover:underline">
                    {c.nome}
                  </Link>
                  <span className="text-red-600">
                    {" "}
                    — {ETAPA_LABEL[c.etapaAtual]} há {dias} dias
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {TODAS_ETAPAS.map((etapa) => {
          const quantidade = porEtapa.get(etapa) ?? 0;
          const negativa = etapa === "VISTO_NEGADO";
          return (
            <Link
              key={etapa}
              href={`/clientes?etapa=${etapa}`}
              className={`flex flex-col gap-1 rounded-md border p-4 hover:border-zinc-400 ${
                negativa ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"
              }`}
            >
              <span
                className={`text-3xl font-semibold ${negativa ? "text-red-700" : "text-zinc-900"}`}
              >
                {quantidade}
              </span>
              <span className="text-sm text-zinc-600">{ETAPA_LABEL[etapa]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
