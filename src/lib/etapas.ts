import { EtapaProcesso } from "@/generated/prisma/client";

export const ORDEM_ETAPAS: EtapaProcesso[] = [
  "CADASTRO",
  "RASCUNHO_DS160_SOLICITADO",
  "DS160_PREENCHIDO",
  "BOLETO_MRV_GERADO",
  "PAGAMENTO_MRV",
  "AGENDAMENTO_ENTREVISTA",
  "INSTRUCOES_PASSADAS",
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
  INSTRUCOES_PASSADAS: "Instruções passadas",
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

// Quantos dias faltam pra data da entrevista (negativo se já passou).
// dataEntrevista é uma "data pura" salva como meia-noite UTC (ver
// src/lib/formatar.ts) — por isso lê o dia em UTC em vez de horário
// local, senão a conta erra por causa do fuso (Brasil é UTC-3).
export function diasParaEntrevista(dataEntrevista: Date | null): number | null {
  if (!dataEntrevista) return null;
  const hoje = new Date();
  const hojeUTC = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dia = new Date(dataEntrevista);
  const diaUTC = Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate());
  return Math.round((diaUTC - hojeUTC) / (1000 * 60 * 60 * 24));
}

export const DIAS_LEMBRETE_ENTREVISTA = 2;

// Etapas em que a entrevista ainda não aconteceu — só nessas faz
// sentido lembrar.
const ETAPAS_ANTES_DA_ENTREVISTA: EtapaProcesso[] = ORDEM_ETAPAS.slice(
  0,
  ORDEM_ETAPAS.indexOf("ENTREVISTA_REALIZADA"),
);

export function precisaLembrarEntrevista(
  etapa: EtapaProcesso,
  diasParaEntrevista: number | null,
): boolean {
  return (
    diasParaEntrevista != null &&
    diasParaEntrevista >= 0 &&
    diasParaEntrevista <= DIAS_LEMBRETE_ENTREVISTA &&
    ETAPAS_ANTES_DA_ENTREVISTA.includes(etapa)
  );
}

export const DIAS_LEMBRETE_INSTRUCOES = 15;

// Só faz sentido lembrar de passar instruções enquanto o cliente
// ainda estiver "esperando" pra isso, ou seja, na etapa logo antes de
// "Instruções passadas".
export function precisaLembrarInstrucoes(
  etapa: EtapaProcesso,
  diasParaEntrevista: number | null,
): boolean {
  return (
    etapa === "AGENDAMENTO_ENTREVISTA" &&
    diasParaEntrevista != null &&
    diasParaEntrevista >= 0 &&
    diasParaEntrevista <= DIAS_LEMBRETE_INSTRUCOES
  );
}
