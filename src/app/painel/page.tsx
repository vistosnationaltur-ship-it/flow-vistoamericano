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
  diasParaData,
  precisaLembrarEntrevista,
  precisaLembrarInstrucoes,
  precisaAlertarVencimento,
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

  const instrucoesPendentes = comEntrevistaProxima
    .filter((c) => precisaLembrarInstrucoes(c.etapaAtual, diasParaEntrevista(c.dataEntrevista)))
    .sort((a, b) => (a.dataEntrevista as Date).getTime() - (b.dataEntrevista as Date).getTime());

  const comDocumentoParaChecar = await prisma.cliente.findMany({
    where: {
      OR: [{ validadePassaporte: { not: null } }, { dataVencimentoVistoAtual: { not: null } }],
    },
  });
  type AlertaVencimento = { id: string; nome: string; documento: string; dias: number; data: Date };
  const vencimentosProximos: AlertaVencimento[] = [];
  for (const c of comDocumentoParaChecar) {
    const diasPassaporte = diasParaData(c.validadePassaporte);
    if (precisaAlertarVencimento(diasPassaporte)) {
      vencimentosProximos.push({
        id: c.id,
        nome: c.nome,
        documento: "Passaporte",
        dias: diasPassaporte!,
        data: c.validadePassaporte as Date,
      });
    }
    const diasVisto = diasParaData(c.dataVencimentoVistoAtual);
    if (precisaAlertarVencimento(diasVisto)) {
      vencimentosProximos.push({
        id: c.id,
        nome: c.nome,
        documento: "Visto atual",
        dias: diasVisto!,
        data: c.dataVencimentoVistoAtual as Date,
      });
    }
  }
  vencimentosProximos.sort((a, b) => a.dias - b.dias);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Painel</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total} cliente{total === 1 ? "" : "s"} no total
        </p>
      </div>

      {(entrevistasProximas.length > 0 ||
        instrucoesPendentes.length > 0 ||
        vencimentosProximos.length > 0 ||
        atrasados.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {entrevistasProximas.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
              <p className="text-sm font-medium text-amber-300">
                📅 {entrevistasProximas.length} entrevista
                {entrevistasProximas.length === 1 ? "" : "s"} nos próximos dias
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {entrevistasProximas.map((c) => {
                  const dias = diasParaEntrevista(c.dataEntrevista)!;
                  const quando =
                    dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;
                  return (
                    <li key={c.id} className="text-sm">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-amber-200 hover:underline"
                      >
                        {c.nome}
                      </Link>
                      <span className="text-amber-400/80">
                        {" "}
                        — entrevista {quando} ({formatarDataBr(c.dataEntrevista)})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {instrucoesPendentes.length > 0 && (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
              <p className="text-sm font-medium text-blue-300">
                📋 {instrucoesPendentes.length} cliente
                {instrucoesPendentes.length === 1 ? "" : "s"} precisa
                {instrucoesPendentes.length === 1 ? "" : "m"} receber instruções pra entrevista
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {instrucoesPendentes.map((c) => {
                  const dias = diasParaEntrevista(c.dataEntrevista)!;
                  return (
                    <li key={c.id} className="text-sm">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-blue-200 hover:underline"
                      >
                        {c.nome}
                      </Link>
                      <span className="text-blue-400/80">
                        {" "}
                        — entrevista em {dias} dias ({formatarDataBr(c.dataEntrevista)})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {vencimentosProximos.length > 0 && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-5">
              <p className="text-sm font-medium text-orange-300">
                🛂 {vencimentosProximos.length} documento
                {vencimentosProximos.length === 1 ? "" : "s"} vencendo (passaporte/visto)
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {vencimentosProximos.map((v, i) => {
                  const situacao =
                    v.dias < 0 ? `vencido há ${Math.abs(v.dias)} dias` : `vence em ${v.dias} dias`;
                  return (
                    <li key={`${v.id}-${i}`} className="text-sm">
                      <Link
                        href={`/clientes/${v.id}`}
                        className="font-medium text-orange-200 hover:underline"
                      >
                        {v.nome}
                      </Link>
                      <span className="text-orange-400/80">
                        {" "}
                        — {v.documento} {situacao} ({formatarDataBr(v.data)})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {atrasados.length > 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5">
              <p className="text-sm font-medium text-red-300">
                ⚠ {atrasados.length} cliente{atrasados.length === 1 ? "" : "s"} parado
                {atrasados.length === 1 ? "" : "s"} há mais de{" "}
                {LIMITE_DIAS_ALERTA.RASCUNHO_DS160_SOLICITADO} dias
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {atrasados.map((c) => {
                  const dias = diasParado(dataEntradaEtapa(c.historico, c.etapaAtual));
                  return (
                    <li key={c.id} className="text-sm">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-red-200 hover:underline"
                      >
                        {c.nome}
                      </Link>
                      <span className="text-red-400/80">
                        {" "}
                        — {ETAPA_LABEL[c.etapaAtual]} há {dias} dias
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Clientes por etapa</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TODAS_ETAPAS.map((etapa) => {
            const quantidade = porEtapa.get(etapa) ?? 0;
            const negativa = etapa === "VISTO_NEGADO";
            return (
              <Link
                key={etapa}
                href={`/clientes?etapa=${etapa}`}
                className={`group flex flex-col gap-2 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                  negativa
                    ? "border-red-500/20 bg-red-500/[0.05] hover:border-red-500/40"
                    : "border-white/10 bg-zinc-900/60 hover:border-indigo-500/40 hover:bg-zinc-900"
                }`}
              >
                <span
                  className={`text-3xl font-semibold tabular-nums ${
                    negativa ? "text-red-400" : "text-zinc-100"
                  }`}
                >
                  {quantidade}
                </span>
                <span className="text-sm text-zinc-400 group-hover:text-zinc-300">
                  {ETAPA_LABEL[etapa]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
