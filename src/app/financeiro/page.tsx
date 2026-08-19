import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarDataBr } from "@/lib/formatar";

type Transacao = {
  id: string;
  label: string;
  href: string;
  valor: number;
  data: Date | null;
};

export default async function FinanceiroPage() {
  const [clientesSolo, grupos] = await Promise.all([
    prisma.cliente.findMany({
      where: { grupoId: null, valorServico: { not: null } },
      orderBy: { dataPagamentoServico: "desc" },
    }),
    prisma.grupo.findMany({
      where: { valorServico: { not: null } },
      include: { clientes: true },
      orderBy: { dataPagamentoServico: "desc" },
    }),
  ]);

  const transacoes: Transacao[] = [
    ...clientesSolo.map((c) => ({
      id: `cliente-${c.id}`,
      label: c.nome,
      href: `/clientes/${c.id}`,
      valor: c.valorServico as number,
      data: c.dataPagamentoServico,
    })),
    ...grupos.map((g) => ({
      id: `grupo-${g.id}`,
      label: `Família ${g.nome} (${g.clientes.length} pessoa${g.clientes.length === 1 ? "" : "s"})`,
      href: `/grupos/${g.id}`,
      valor: g.valorServico as number,
      data: g.dataPagamentoServico,
    })),
  ].sort((a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0));

  const totalGeral = transacoes.reduce((soma, t) => soma + t.valor, 0);

  const comData = transacoes.filter((t): t is Transacao & { data: Date } => t.data !== null);

  const hoje = new Date();
  const anoAtual = hoje.getUTCFullYear();
  const mesAtual = hoje.getUTCMonth();

  const totalAno = comData
    .filter((t) => t.data.getUTCFullYear() === anoAtual)
    .reduce((soma, t) => soma + t.valor, 0);

  const totalMes = comData
    .filter((t) => t.data.getUTCFullYear() === anoAtual && t.data.getUTCMonth() === mesAtual)
    .reduce((soma, t) => soma + t.valor, 0);

  const porMes = new Map<string, number>();
  for (const t of comData) {
    const chave = `${t.data.getUTCFullYear()}-${String(t.data.getUTCMonth() + 1).padStart(2, "0")}`;
    porMes.set(chave, (porMes.get(chave) ?? 0) + t.valor);
  }
  const mesesOrdenados = [...porMes.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const formatarReais = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Financeiro</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Valor do serviço de assessoria (não inclui taxa MRV)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <span className="text-2xl font-semibold tabular-nums text-zinc-100">
            {formatarReais(totalMes)}
          </span>
          <p className="mt-1 text-sm text-zinc-500">Faturado este mês</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <span className="text-2xl font-semibold tabular-nums text-zinc-100">
            {formatarReais(totalAno)}
          </span>
          <p className="mt-1 text-sm text-zinc-500">Faturado este ano</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-5">
          <span className="text-2xl font-semibold tabular-nums text-indigo-200">
            {formatarReais(totalGeral)}
          </span>
          <p className="mt-1 text-sm text-zinc-500">Faturado no total</p>
        </div>
      </div>

      {mesesOrdenados.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-500">Por mês</h2>
          <table className="w-full text-sm">
            <tbody>
              {mesesOrdenados.map(([chave, valor]) => {
                const [ano, mes] = chave.split("-");
                const nomeMesBruto = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString(
                  "pt-BR",
                  { month: "long", year: "numeric" },
                );
                const nomeMes = nomeMesBruto.charAt(0).toUpperCase() + nomeMesBruto.slice(1);
                return (
                  <tr key={chave} className="border-t border-white/5">
                    <td className="py-2.5 text-zinc-400">{nomeMes}</td>
                    <td className="py-2.5 text-right font-medium text-zinc-100">
                      {formatarReais(valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Transações</h2>
        {transacoes.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum pagamento de serviço registrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="pb-2 font-medium">Cliente / família</th>
                  <th className="pb-2 font-medium">Pago em</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map((t) => (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="py-2.5">
                      <Link
                        href={t.href}
                        className="text-zinc-100 hover:text-indigo-300 hover:underline"
                      >
                        {t.label}
                      </Link>
                    </td>
                    <td className="py-2.5 text-zinc-500">
                      {t.data ? formatarDataBr(t.data) : "sem data"}
                    </td>
                    <td className="py-2.5 text-right font-medium text-zinc-100">
                      {formatarReais(t.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
