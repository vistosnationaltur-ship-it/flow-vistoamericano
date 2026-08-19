import { prisma } from "@/lib/prisma";
import { ETAPA_LABEL, ORDEM_ETAPAS, dataEntradaEtapa, diasParado } from "@/lib/etapas";
import type { EtapaProcesso, HistoricoEtapa } from "@/generated/prisma/client";

// Primeira vez (mais antiga) que o cliente atingiu essa etapa — usado
// pra medir "quanto tempo levou de A pra B" ignorando idas e vindas
// (etapa revertida e alcançada de novo depois).
function primeiraDataEtapa(
  historicoAsc: { etapa: EtapaProcesso; criadoEm: Date }[],
  etapa: EtapaProcesso,
): Date | null {
  return historicoAsc.find((h) => h.etapa === etapa)?.criadoEm ?? null;
}

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

export default async function MetricasPage() {
  const clientes = await prisma.cliente.findMany({
    include: { historico: { orderBy: { criadoEm: "asc" } } },
  });

  const duracoesPorTransicao = new Map<string, number[]>();
  for (const c of clientes) {
    for (let i = 0; i < ORDEM_ETAPAS.length - 1; i++) {
      const atual = ORDEM_ETAPAS[i];
      const proxima = ORDEM_ETAPAS[i + 1];
      const dataAtual = primeiraDataEtapa(c.historico, atual);
      const dataProxima = primeiraDataEtapa(c.historico, proxima);
      if (dataAtual && dataProxima && dataProxima.getTime() > dataAtual.getTime()) {
        const dias = (dataProxima.getTime() - dataAtual.getTime()) / (1000 * 60 * 60 * 24);
        const chave = `${atual}->${proxima}`;
        const lista = duracoesPorTransicao.get(chave) ?? [];
        lista.push(dias);
        duracoesPorTransicao.set(chave, lista);
      }
    }
  }

  const transicoes = ORDEM_ETAPAS.slice(0, -1).map((etapa, i) => {
    const proxima = ORDEM_ETAPAS[i + 1];
    const chave = `${etapa}->${proxima}`;
    return {
      de: etapa,
      para: proxima,
      mediaDias: media(duracoesPorTransicao.get(chave) ?? []),
      amostras: (duracoesPorTransicao.get(chave) ?? []).length,
    };
  });

  const dataCadastro = new Map<string, Date>();
  const dataEntrevistaRealizada = new Map<string, Date>();
  for (const c of clientes) {
    const dc = primeiraDataEtapa(c.historico, "CADASTRO");
    const de = primeiraDataEtapa(c.historico, "ENTREVISTA_REALIZADA");
    if (dc) dataCadastro.set(c.id, dc);
    if (de) dataEntrevistaRealizada.set(c.id, de);
  }
  const duracoesTotais: number[] = [];
  for (const [id, dc] of dataCadastro) {
    const de = dataEntrevistaRealizada.get(id);
    if (de && de.getTime() > dc.getTime()) {
      duracoesTotais.push((de.getTime() - dc.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  const mediaTotal = media(duracoesTotais);

  const aprovados = clientes.filter((c) => c.etapaAtual === "VISTO_APROVADO").length;
  const negados = clientes.filter((c) => c.etapaAtual === "VISTO_NEGADO").length;
  const totalFinalizados = aprovados + negados;
  const taxaAprovacao = totalFinalizados > 0 ? (aprovados / totalFinalizados) * 100 : null;

  // Gargalo: entre quem está parado numa etapa agora, qual etapa tem a
  // maior média de dias parado.
  type ClienteComHistorico = { id: string; etapaAtual: EtapaProcesso; historico: HistoricoEtapa[] };
  const diasParadosPorEtapaAtual = new Map<string, number[]>();
  for (const c of clientes as ClienteComHistorico[]) {
    if (!ORDEM_ETAPAS.includes(c.etapaAtual)) continue;
    const historicoDesc = [...c.historico].reverse();
    const dias = diasParado(dataEntradaEtapa(historicoDesc, c.etapaAtual));
    if (dias != null) {
      const lista = diasParadosPorEtapaAtual.get(c.etapaAtual) ?? [];
      lista.push(dias);
      diasParadosPorEtapaAtual.set(c.etapaAtual, lista);
    }
  }
  const gargalos = [...diasParadosPorEtapaAtual.entries()]
    .map(([etapa, dias]) => ({
      etapa: etapa as EtapaProcesso,
      mediaDias: media(dias)!,
      quantidade: dias.length,
    }))
    .sort((a, b) => b.mediaDias - a.mediaDias);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Métricas</h1>
        <p className="mt-1 text-sm text-zinc-500">Funil e tempo médio do processo</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <span className="text-2xl font-semibold tabular-nums text-zinc-100">
            {mediaTotal != null ? `${mediaTotal.toFixed(0)} dias` : "—"}
          </span>
          <p className="mt-1 text-sm text-zinc-500">Cadastro até entrevista realizada (média)</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-5">
          <span className="text-2xl font-semibold tabular-nums text-indigo-200">
            {taxaAprovacao != null ? `${taxaAprovacao.toFixed(0)}%` : "—"}
          </span>
          <p className="mt-1 text-sm text-zinc-500">
            Taxa de aprovação ({aprovados} aprovados / {negados} negados)
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <span className="text-2xl font-semibold tabular-nums text-zinc-100">
            {clientes.length}
          </span>
          <p className="mt-1 text-sm text-zinc-500">Clientes no total</p>
        </div>
      </div>

      {gargalos.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-500">
            Gargalo agora (média de dias parado, por etapa atual)
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {gargalos.map((g) => (
                <tr key={g.etapa} className="border-t border-white/5">
                  <td className="py-2.5 text-zinc-400">{ETAPA_LABEL[g.etapa]}</td>
                  <td className="py-2.5 text-zinc-500">
                    {g.quantidade} cliente{g.quantidade === 1 ? "" : "s"}
                  </td>
                  <td className="py-2.5 text-right font-medium text-zinc-100">
                    {g.mediaDias.toFixed(1)} dias
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">
          Tempo médio de cada etapa (histórico)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr className="border-b border-white/10">
                <th className="pb-2 font-medium">Transição</th>
                <th className="pb-2 font-medium">Amostras</th>
                <th className="pb-2 text-right font-medium">Média</th>
              </tr>
            </thead>
            <tbody>
              {transicoes.map((t) => (
                <tr key={`${t.de}-${t.para}`} className="border-t border-white/5">
                  <td className="py-2.5 text-zinc-300">
                    {ETAPA_LABEL[t.de]} → {ETAPA_LABEL[t.para]}
                  </td>
                  <td className="py-2.5 text-zinc-500">{t.amostras}</td>
                  <td className="py-2.5 text-right font-medium text-zinc-100">
                    {t.mediaDias != null ? `${t.mediaDias.toFixed(1)} dias` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
