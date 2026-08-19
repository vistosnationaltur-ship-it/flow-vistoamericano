import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ETAPA_LABEL } from "@/lib/etapas";
import { formatarDataBr } from "@/lib/formatar";
import { atualizarFinanceiroGrupo } from "@/app/actions";

export default async function GrupoDetalhePage(props: PageProps<"/grupos/[id]">) {
  const { id } = await props.params;

  const grupo = await prisma.grupo.findUnique({
    where: { id },
    include: { clientes: { orderBy: { criadoEm: "asc" } } },
  });

  if (!grupo) notFound();

  const financeiroComId = atualizarFinanceiroGrupo.bind(null, grupo.id);
  const valorPorPessoa =
    grupo.valorServico && grupo.clientes.length > 0
      ? grupo.valorServico / grupo.clientes.length
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Família {grupo.nome}</h1>
        <p className="text-sm text-zinc-500">
          {grupo.clientes.length} pessoa{grupo.clientes.length === 1 ? "" : "s"} nesse grupo
        </p>
      </div>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Membros da família</h2>
        <ul className="flex flex-col divide-y divide-zinc-100">
          {grupo.clientes.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3 text-sm">
              <Link href={`/clientes/${c.id}`} className="font-medium text-zinc-900 hover:underline">
                {c.nome}
              </Link>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                {ETAPA_LABEL[c.etapaAtual]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Pagamento do serviço (família toda)</h2>
        <form action={financeiroComId} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">Valor total (R$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                name="valorServico"
                defaultValue={grupo.valorServico ?? ""}
                className="w-32 rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">Pago em</span>
              <input
                type="date"
                name="dataPagamentoServico"
                defaultValue={
                  grupo.dataPagamentoServico
                    ? new Date(grupo.dataPagamentoServico).toISOString().slice(0, 10)
                    : ""
                }
                className="rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">
              Observações financeiras (ex: por que o valor é maior)
            </span>
            <textarea
              name="observacoesFinanceiras"
              rows={2}
              defaultValue={grupo.observacoesFinanceiras ?? ""}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Salvar
          </button>
        </form>

        {valorPorPessoa != null && (
          <p className="mt-3 text-sm text-zinc-500">
            ≈ R$ {valorPorPessoa.toFixed(2)} por pessoa ({grupo.clientes.length} pessoas)
          </p>
        )}
      </section>
    </div>
  );
}
