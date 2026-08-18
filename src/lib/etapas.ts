import { EtapaProcesso } from "@/generated/prisma/client";

export const ORDEM_ETAPAS: EtapaProcesso[] = [
  "CADASTRO",
  "DS160_PREENCHIDO",
  "PAGAMENTO_MRV",
  "AGENDAMENTO_ENTREVISTA",
  "ENTREVISTA_REALIZADA",
  "VISTO_APROVADO",
  "PASSAPORTE_DEVOLVIDO",
];

export const ETAPA_LABEL: Record<EtapaProcesso, string> = {
  CADASTRO: "Cadastro / dados recebidos",
  DS160_PREENCHIDO: "DS-160 preenchido",
  PAGAMENTO_MRV: "Pagamento da taxa (MRV)",
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

export function progresso(atual: EtapaProcesso): number {
  if (atual === "VISTO_NEGADO") return 100;
  const i = ORDEM_ETAPAS.indexOf(atual);
  if (i === -1) return 0;
  return Math.round(((i + 1) / ORDEM_ETAPAS.length) * 100);
}
