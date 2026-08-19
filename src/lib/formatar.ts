// Campos como data de nascimento, validade de passaporte e data da
// entrevista são "datas puras" (sem hora) — salvos a partir de um
// <input type="date"> como meia-noite UTC. Se formatar com o fuso
// local (Brasil é UTC-3), a data volta um dia (20/08 vira 19/08).
// Formatando em UTC, o dia exibido é sempre o mesmo que foi digitado.
export function formatarDataBr(data: Date | string | null | undefined): string {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
