import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { HistoricoEtapa } from "@/generated/prisma/client";
import { ETAPA_LABEL, ORDEM_ETAPAS, progresso, proximaEtapa, etapaAnterior } from "@/lib/etapas";
import { formatarDataBr } from "@/lib/formatar";
import {
  avancarEtapa,
  voltarEtapa,
  marcarVistoNegado,
  definirDataEntrevista,
  definirPagamentoMrv,
  definirNumeroDs160,
  atualizarObservacoes,
} from "@/app/actions";

export default async function ClienteDetalhePage(props: PageProps<"/clientes/[id]">) {
  const { id } = await props.params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { historico: { orderBy: { criadoEm: "desc" } } },
  });

  if (!cliente) notFound();

  const proxima = proximaEtapa(cliente.etapaAtual);
  const anterior = etapaAnterior(cliente.etapaAtual);
  const finalizado =
    cliente.etapaAtual === "VISTO_NEGADO" || cliente.etapaAtual === "PASSAPORTE_DEVOLVIDO";

  const avancarComId = avancarEtapa.bind(null, cliente.id);
  const voltarComId = voltarEtapa.bind(null, cliente.id);
  const negarComId = marcarVistoNegado.bind(null, cliente.id);
  const dataEntrevistaComId = definirDataEntrevista.bind(null, cliente.id);
  const pagamentoMrvComId = definirPagamentoMrv.bind(null, cliente.id);
  const numeroDs160ComId = definirNumeroDs160.bind(null, cliente.id);
  const observacoesComId = atualizarObservacoes.bind(null, cliente.id);

  // Data em que cada etapa foi atingida, pela ocorrência mais recente
  // no histórico (que já vem ordenado do mais novo pro mais antigo).
  const dataPorEtapa = new Map<string, Date>();
  for (const h of cliente.historico) {
    if (!dataPorEtapa.has(h.etapa)) dataPorEtapa.set(h.etapa, h.criadoEm);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{cliente.nome}</h1>
          <p className="text-sm text-zinc-500">
            {cliente.email ?? "sem e-mail"} · {cliente.telefone ?? "sem telefone"}
            {cliente.dataNascimento &&
              ` · nasc. ${formatarDataBr(cliente.dataNascimento)}`}
          </p>
          {cliente.endereco && <p className="text-sm text-zinc-500">{cliente.endereco}</p>}
        </div>
        <Link
          href={`/clientes/${cliente.id}/editar`}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Editar dados
        </Link>
      </div>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Pipeline do processo</h2>

        <ol className="flex flex-col gap-2">
          {ORDEM_ETAPAS.map((etapa, i) => {
            const atual = ORDEM_ETAPAS.indexOf(cliente.etapaAtual);
            const concluida = i <= atual || cliente.etapaAtual === "VISTO_NEGADO";
            const ehAtual = etapa === cliente.etapaAtual;
            const data = dataPorEtapa.get(etapa);
            return (
              <li
                key={etapa}
                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                  ehAtual ? "bg-zinc-100 font-medium" : "text-zinc-500"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      concluida ? "bg-zinc-900 text-white" : "border border-zinc-300"
                    }`}
                  >
                    {concluida ? "✓" : ""}
                  </span>
                  {ETAPA_LABEL[etapa]}
                </span>
                {data && (
                  <span className="text-xs text-zinc-400">
                    {data.toLocaleDateString("pt-BR")}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full bg-zinc-900"
            style={{ width: `${progresso(cliente.etapaAtual)}%` }}
          />
        </div>

        {cliente.etapaAtual === "VISTO_NEGADO" && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Visto negado.
          </p>
        )}

        {!finalizado && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-100 pt-4">
            {proxima && (
              <form action={avancarComId} className="flex gap-2">
                <input
                  type="text"
                  name="observacao"
                  placeholder="Observação (opcional)"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Avançar para &quot;{ETAPA_LABEL[proxima]}&quot;
                </button>
              </form>
            )}

            {anterior && (
              <form action={voltarComId}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Voltar para &quot;{ETAPA_LABEL[anterior]}&quot;
                </button>
              </form>
            )}

            {cliente.etapaAtual === "ENTREVISTA_REALIZADA" && (
              <form action={negarComId}>
                <input type="hidden" name="observacao" value="" />
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Marcar visto negado
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Entrevista</h2>
        <form action={dataEntrevistaComId} className="flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">Data da entrevista</span>
            <input
              type="date"
              name="dataEntrevista"
              defaultValue={
                cliente.dataEntrevista
                  ? new Date(cliente.dataEntrevista).toISOString().slice(0, 10)
                  : ""
              }
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Salvar
          </button>
        </form>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">DS-160 preenchido no consulado</h2>
        <form action={numeroDs160ComId} className="flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">Número do DS-160</span>
            <input
              type="text"
              name="numeroDs160"
              defaultValue={cliente.numeroDs160 ?? ""}
              placeholder="Ex: AA00XXXXXX"
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Salvar
          </button>
        </form>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Pagamento da taxa (MRV)</h2>
        <form action={pagamentoMrvComId} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">Valor pago (R$)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="valorTaxaMrv"
              defaultValue={cliente.valorTaxaMrv ?? ""}
              className="w-32 rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">Pago em</span>
            <input
              type="date"
              name="dataPagamentoMrv"
              defaultValue={
                cliente.dataPagamentoMrv
                  ? new Date(cliente.dataPagamentoMrv).toISOString().slice(0, 10)
                  : ""
              }
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Salvar
          </button>
        </form>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Dados do cliente</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Info label="CPF" value={cliente.cpf} />
          <Info label="Passaporte" value={cliente.numeroPassaporte} />
          <Info
            label="Validade do passaporte"
            value={cliente.validadePassaporte ? formatarDataBr(cliente.validadePassaporte) : null}
          />
          <Info
            label="Cadastrado em"
            value={new Date(cliente.criadoEm).toLocaleDateString("pt-BR")}
          />
        </dl>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Observações</h2>
        <form action={observacoesComId} className="flex flex-col gap-3">
          <textarea
            name="observacoes"
            rows={4}
            defaultValue={cliente.observacoes ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Salvar observações
          </button>
        </form>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Histórico</h2>
        <ul className="flex flex-col gap-3">
          {cliente.historico.map((h: HistoricoEtapa) => (
            <li key={h.id} className="flex justify-between text-sm">
              <span>
                {ETAPA_LABEL[h.etapa]}
                {h.observacao && (
                  <span className="text-zinc-500"> — {h.observacao}</span>
                )}
              </span>
              <span className="text-zinc-400">
                {new Date(h.criadoEm).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-900">{value ?? "—"}</dd>
    </div>
  );
}
