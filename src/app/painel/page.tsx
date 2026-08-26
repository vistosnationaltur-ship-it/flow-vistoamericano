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

// Cartão de alerta — mesma "página do livro" (navy + borda sutil) em todos,
// o que muda é o peso: urgência ALTA (entrevista/vencimento) recebe borda e
// realce em --color-danger; urgência MÉDIA (instruções/parado) em
// --color-warning. Nunca cor de marca (dourado) num alerta — dourado é só
// selo/foco/CTA (DESIGN.md §3).
function CartaoAlerta({
  titulo,
  tom,
  children,
}: {
  titulo: string;
  tom: "alta" | "media";
  children: React.ReactNode;
}) {
  const corTexto = tom === "alta" ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]";
  const corBorda =
    tom === "alta" ? "border-[var(--color-danger-border)]" : "border-[var(--color-accent-border)]";
  const corFundo = tom === "alta" ? "bg-[var(--color-danger-surface)]" : "bg-[var(--color-accent-surface)]/40";

  return (
    <div className={`rounded-2xl border ${corBorda} ${corFundo} p-5`}>
      <p className={`text-sm font-semibold ${corTexto}`}>{titulo}</p>
      <ul className="mt-3 flex flex-col gap-1.5">{children}</ul>
    </div>
  );
}

function ItemAlerta({
  href,
  nome,
  tom,
  detalhe,
}: {
  href: string;
  nome: string;
  tom: "alta" | "media";
  detalhe: string;
}) {
  const corLink = tom === "alta" ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]";
  return (
    <li className="text-sm">
      <Link href={href} className={`font-medium ${corLink} hover:underline`}>
        {nome}
      </Link>
      <span className="text-[var(--color-text-muted)]"> — {detalhe}</span>
    </li>
  );
}

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

  const temAlertas =
    entrevistasProximas.length > 0 ||
    instrucoesPendentes.length > 0 ||
    vencimentosProximos.length > 0 ||
    atrasados.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display)] text-[var(--color-text)]">
          Painel
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {total} cliente{total === 1 ? "" : "s"} no total
        </p>
      </div>

      {temAlertas && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            O que precisa de atenção agora
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* urgência alta — entrevista com data marcada e vencimento de documento */}
            {entrevistasProximas.length > 0 && (
              <CartaoAlerta
                titulo={`📅 ${entrevistasProximas.length} entrevista${entrevistasProximas.length === 1 ? "" : "s"} nos próximos dias`}
                tom="alta"
              >
                {entrevistasProximas.map((c) => {
                  const dias = diasParaEntrevista(c.dataEntrevista)!;
                  const quando = dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;
                  return (
                    <ItemAlerta
                      key={c.id}
                      href={`/clientes/${c.id}`}
                      nome={c.nome}
                      tom="alta"
                      detalhe={`entrevista ${quando} (${formatarDataBr(c.dataEntrevista)})`}
                    />
                  );
                })}
              </CartaoAlerta>
            )}

            {vencimentosProximos.length > 0 && (
              <CartaoAlerta
                titulo={`🛂 ${vencimentosProximos.length} documento${vencimentosProximos.length === 1 ? "" : "s"} vencendo`}
                tom="alta"
              >
                {vencimentosProximos.map((v, i) => {
                  const situacao =
                    v.dias < 0 ? `vencido há ${Math.abs(v.dias)} dias` : `vence em ${v.dias} dias`;
                  return (
                    <ItemAlerta
                      key={`${v.id}-${i}`}
                      href={`/clientes/${v.id}`}
                      nome={v.nome}
                      tom="alta"
                      detalhe={`${v.documento} ${situacao} (${formatarDataBr(v.data)})`}
                    />
                  );
                })}
              </CartaoAlerta>
            )}

            {/* urgência média — instruções pendentes e cliente parado */}
            {instrucoesPendentes.length > 0 && (
              <CartaoAlerta
                titulo={`📋 ${instrucoesPendentes.length} cliente${instrucoesPendentes.length === 1 ? "" : "s"} precisa${instrucoesPendentes.length === 1 ? "" : "m"} receber instruções pra entrevista`}
                tom="media"
              >
                {instrucoesPendentes.map((c) => {
                  const dias = diasParaEntrevista(c.dataEntrevista)!;
                  return (
                    <ItemAlerta
                      key={c.id}
                      href={`/clientes/${c.id}`}
                      nome={c.nome}
                      tom="media"
                      detalhe={`entrevista em ${dias} dias (${formatarDataBr(c.dataEntrevista)})`}
                    />
                  );
                })}
              </CartaoAlerta>
            )}

            {atrasados.length > 0 && (
              <CartaoAlerta
                titulo={`⚠️ ${atrasados.length} cliente${atrasados.length === 1 ? "" : "s"} parado${atrasados.length === 1 ? "" : "s"} há mais de ${LIMITE_DIAS_ALERTA.RASCUNHO_DS160_SOLICITADO} dias`}
                tom="media"
              >
                {atrasados.map((c) => {
                  const dias = diasParado(dataEntradaEtapa(c.historico, c.etapaAtual));
                  return (
                    <ItemAlerta
                      key={c.id}
                      href={`/clientes/${c.id}`}
                      nome={c.nome}
                      tom="media"
                      detalhe={`${ETAPA_LABEL[c.etapaAtual]} há ${dias} dias`}
                    />
                  );
                })}
              </CartaoAlerta>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Clientes por etapa
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TODAS_ETAPAS.map((etapa) => {
            const quantidade = porEtapa.get(etapa) ?? 0;
            const negativa = etapa === "VISTO_NEGADO";
            return (
              <Link
                key={etapa}
                href={`/clientes?etapa=${etapa}`}
                className={`group flex flex-col gap-2 rounded-2xl border p-5 transition-colors duration-150 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:transition-[transform,border-color,background-color] ${
                  negativa
                    ? "border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] hover:border-[var(--color-danger)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-base)] hover:border-[var(--color-accent-border)]"
                }`}
              >
                <span
                  className={`text-3xl font-semibold tabular-nums ${
                    negativa ? "text-[var(--color-danger)]" : "text-[var(--color-text)]"
                  }`}
                >
                  {quantidade}
                </span>
                <span className="text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text-subtle)]">
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
