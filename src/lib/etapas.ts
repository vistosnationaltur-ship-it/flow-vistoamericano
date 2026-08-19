import { EtapaProcesso } from "@/generated/prisma/client";

export const ORDEM_ETAPAS: EtapaProcesso[] = [
  "CADASTRO",
  "RASCUNHO_DS160_SOLICITADO",
  "DS160_PREENCHIDO",
  "BOLETO_MRV_GERADO",
  "PAGAMENTO_MRV",
  "AGENDAMENTO_ENTREVISTA",
  "ENTREVISTA_REALIZADA",
  "VISTO_APROVADO",
  "PASSAPORTE_DEVOLVIDO",
];

export const ETAPA_LABEL: Record<EtapaProcesso, string> = {
  CADASTRO: "Cadastro / dados recebidos",
  RASCUNHO_DS160_SOLICITADO: "Rascunho do DS-160 solicitado (português)",
  DS160_PREENCHIDO: "DS-160 preenchido no consulado",
  BOLETO_MRV_GERADO: "Entrada no consulado + boleto MRV gerado",
  PAGAMENTO_MRV: "Pagamento da taxa (MRV) confirmado",
  AGENDAMENTO_ENTREVISTA: "Entrevista agendada",
  ENTREVISTA_REALIZADA: "Entrevista realizada",
  VISTO_APROVADO: "Visto aprovado",
  VISTO_NEGADO: "Visto negado",
  PASSAPORTE_DEVOLVIDO: "Passaporte devolvido",
};

export function proximaEtapa(atual: EtapaProcesso): EtapaProcesso | null {
  const i = ORDEM_ETAPAS.indexOf(atual);
  if (i === -1 || i === ORDEM_ETAPAS.length - 1) return null;
  return ORDEM_ETAPAS[i + 1];
}

export function etapaAnterior(atual: EtapaProcesso): EtapaProcesso | null {
  const i = ORDEM_ETAPAS.indexOf(atual);
  if (i <= 0) return null;
  return ORDEM_ETAPAS[i - 1];
}

export function progresso(atual: EtapaProcesso): number {
  if (atual === "VISTO_NEGADO") return 100;
  const i = ORDEM_ETAPAS.indexOf(atual);
  if (i === -1) return 0;
  return Math.round(((i + 1) / ORDEM_ETAPAS.length) * 100);
}

// Quantos dias um cliente pode ficar parado numa etapa antes de virar
// alerta. Só as etapas listadas aqui são monitoradas.
export const LIMITE_DIAS_ALERTA: Partial<Record<EtapaProcesso, number>> = {
  RASCUNHO_DS160_SOLICITADO: 10,
};

// Assume que `historico` vem ordenado do mais novo pro mais antigo
// (mesma ordem usada nas páginas). Pega a entrada mais recente em que
// o cliente atingiu essa etapa.
export function dataEntradaEtapa(
  historico: { etapa: EtapaProcesso; criadoEm: Date }[],
  etapa: EtapaProcesso,
): Date | null {
  return historico.find((h) => h.etapa === etapa)?.criadoEm ?? null;
}

export function diasParado(dataEntrada: Date | null): number | null {
  if (!dataEntrada) return null;
  return Math.floor((Date.now() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24));
}

export function estaAtrasado(etapa: EtapaProcesso, dias: number | null): boolean {
  const limite = LIMITE_DIAS_ALERTA[etapa];
  return limite != null && dias != null && dias > limite;
}
