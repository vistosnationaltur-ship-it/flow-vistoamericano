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
  definirPagamentoServico,
  definirNumeroDs160,
  atualizarObservacoes,
  criarGrupoComCliente,
  entrarNoGrupo,
  sairDoGrupo,
  enviarDocumento,
  removerDocumento,
  enviarContrato,
  excluirCliente,
  excluirDocumentosCliente,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { sessaoAtual } from "@/lib/auth";
import { CampoData } from "@/components/CampoData";
import { CampoMoeda } from "@/components/CampoMoeda";

const TIPOS_DOCUMENTO_SUGERIDOS = [
  "Foto do passaporte",
  "Comprovante DS-160",
  "Comprovante financeiro",
  "Comprovante de vínculo (emprego/estudo)",
];

const CARD = "rounded-2xl border border-white/10 bg-zinc-900/60 p-6";
const CARD_TITLE = "mb-4 text-sm font-semibold text-zinc-500";
const LABEL = "flex flex-col gap-1.5 text-sm";
const LABEL_TEXT = "text-zinc-400";
const INPUT =
  "rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30";
const BTN_PRIMARY =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500";
const BTN_OUTLINE =
  "rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5";

export default async function ClienteDetalhePage(props: PageProps<"/clientes/[id]">) {
  const { id } = await props.params;

  const sessao = await sessaoAtual();
  const ehAdmin = sessao?.role === "ADMIN";

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      historico: { orderBy: { criadoEm: "desc" } },
      grupo: { include: { clientes: true } },
      documentos: { orderBy: { criadoEm: "desc" } },
    },
  });

  if (!cliente) notFound();

  const outrosGrupos = await prisma.grupo.findMany({
    where: cliente.grupoId ? { id: { not: cliente.grupoId } } : {},
    orderBy: { criadoEm: "desc" },
  });

  const proxima = proximaEtapa(cliente.etapaAtual);
  const anterior = etapaAnterior(cliente.etapaAtual);
  const finalizado =
    cliente.etapaAtual === "VISTO_NEGADO" || cliente.etapaAtual === "PASSAPORTE_DEVOLVIDO";

  const enviarDocumentoComId = enviarDocumento.bind(null, cliente.id);
  const avancarComId = avancarEtapa.bind(null, cliente.id);
  const voltarComId = voltarEtapa.bind(null, cliente.id);
  const negarComId = marcarVistoNegado.bind(null, cliente.id);
  const dataEntrevistaComId = definirDataEntrevista.bind(null, cliente.id);
  const pagamentoMrvComId = definirPagamentoMrv.bind(null, cliente.id);
  const pagamentoServicoComId = definirPagamentoServico.bind(null, cliente.id);
  const numeroDs160ComId = definirNumeroDs160.bind(null, cliente.id);
  const observacoesComId = atualizarObservacoes.bind(null, cliente.id);
  const criarGrupoComId = criarGrupoComCliente.bind(null, cliente.id);
  const entrarNoGrupoComId = entrarNoGrupo.bind(null, cliente.id);
  const sairDoGrupoComId = sairDoGrupo.bind(null, cliente.id);
  const enviarContratoComId = enviarContrato.bind(null, cliente.id);
  const excluirComId = excluirCliente.bind(null, cliente.id);
  const excluirDocumentosComId = excluirDocumentosCliente.bind(null, cliente.id);

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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{cliente.nome}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {cliente.email ?? "sem e-mail"} · {cliente.telefone ?? "sem telefone"}
            {cliente.dataNascimento &&
              ` · nasc. ${formatarDataBr(cliente.dataNascimento)}`}
          </p>
          {cliente.endereco && <p className="text-sm text-zinc-500">{cliente.endereco}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/clientes/${cliente.id}/editar`} className={BTN_OUTLINE}>
            Editar dados
          </Link>
          {ehAdmin && (
            <form action={excluirComId}>
              <ConfirmSubmitButton
                confirmMessage={`Excluir ${cliente.nome} definitivamente? Isso apaga todo o histórico e documentos anexados. Essa ação não pode ser desfeita.`}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
              >
                Excluir cliente
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </div>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Pipeline do processo</h2>

        <ol className="flex flex-col gap-1.5">
          {ORDEM_ETAPAS.map((etapa, i) => {
            const atual = ORDEM_ETAPAS.indexOf(cliente.etapaAtual);
            const concluida = i <= atual || cliente.etapaAtual === "VISTO_NEGADO";
            const ehAtual = etapa === cliente.etapaAtual;
            const data = dataPorEtapa.get(etapa);
            return (
              <li
                key={etapa}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                  ehAtual ? "bg-indigo-500/10 font-medium text-indigo-200" : "text-zinc-500"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      concluida ? "bg-indigo-500 text-white" : "border border-white/15"
                    }`}
                  >
                    {concluida ? "✓" : ""}
                  </span>
                  {ETAPA_LABEL[etapa]}
                </span>
                {data && (
                  <span className="text-xs text-zinc-500">
                    {data.toLocaleDateString("pt-BR")}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${progresso(cliente.etapaAtual)}%` }}
          />
        </div>

        {cliente.etapaAtual === "VISTO_NEGADO" && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Visto negado.
          </p>
        )}

        {cliente.contratoEnviadoEm && (
          <p className="mt-4 text-xs text-zinc-500">
            Contrato enviado em {formatarDataBr(cliente.contratoEnviadoEm)}
          </p>
        )}

        {!finalizado && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-white/5 pt-5">
            {cliente.etapaAtual === "CADASTRO" && (
              <form action={enviarContratoComId}>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  Enviar contrato (WhatsApp)
                </button>
              </form>
            )}

            {proxima && (
              <form action={avancarComId} className="flex gap-2">
                <input
                  type="text"
                  name="observacao"
                  placeholder="Observação (opcional)"
                  className={`${INPUT} text-sm`}
                />
                <button type="submit" className={BTN_PRIMARY}>
                  Avançar para &quot;{ETAPA_LABEL[proxima]}&quot;
                </button>
              </form>
            )}

            {anterior && (
              <form action={voltarComId}>
                <button type="submit" className={BTN_OUTLINE}>
                  Voltar para &quot;{ETAPA_LABEL[anterior]}&quot;
                </button>
              </form>
            )}

            {cliente.etapaAtual === "ENTREVISTA_REALIZADA" && (
              <form action={negarComId}>
                <input type="hidden" name="observacao" value="" />
                <button
                  type="submit"
                  className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
                >
                  Marcar visto negado
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Entrevista</h2>
        <form action={dataEntrevistaComId} className="flex items-end gap-3">
          <CampoData
            label="Data da entrevista"
            name="dataEntrevista"
            defaultValue={
              cliente.dataEntrevista
                ? new Date(cliente.dataEntrevista).toISOString().slice(0, 10)
                : ""
            }
            className={INPUT}
          />
          <button type="submit" className={BTN_PRIMARY}>
            Salvar
          </button>
        </form>
      </section>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>DS-160 preenchido no consulado</h2>
        <form action={numeroDs160ComId} className="flex items-end gap-3">
          <label className={LABEL}>
            <span className={LABEL_TEXT}>Número do DS-160</span>
            <input
              type="text"
              name="numeroDs160"
              defaultValue={cliente.numeroDs160 ?? ""}
              placeholder="Ex: AA00XXXXXX"
              className={INPUT}
            />
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            Salvar
          </button>
        </form>
      </section>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Pagamento da taxa (MRV)</h2>
        <form action={pagamentoMrvComId} className="flex flex-wrap items-end gap-3">
          <CampoMoeda
            label="Valor pago"
            name="valorTaxaMrv"
            defaultValue={cliente.valorTaxaMrv}
            className={`w-32 ${INPUT}`}
          />
          <CampoData
            label="Pago em"
            name="dataPagamentoMrv"
            defaultValue={
              cliente.dataPagamentoMrv
                ? new Date(cliente.dataPagamentoMrv).toISOString().slice(0, 10)
                : ""
            }
            className={INPUT}
          />
          <button type="submit" className={BTN_PRIMARY}>
            Salvar
          </button>
        </form>
      </section>

      {cliente.grupo ? (
        <section className={CARD}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">Pagamento do serviço</h2>
          <p className="text-sm text-zinc-500">
            Esse cliente faz parte da família{" "}
            <Link
              href={`/grupos/${cliente.grupo.id}`}
              className="font-medium text-zinc-300 hover:text-indigo-300 hover:underline"
            >
              {cliente.grupo.nome}
            </Link>{" "}
            — o pagamento do serviço é gerenciado lá, não aqui.
          </p>
        </section>
      ) : (
        <section className={CARD}>
          <h2 className={CARD_TITLE}>Pagamento do serviço</h2>
          <form action={pagamentoServicoComId} className="flex flex-wrap items-end gap-3">
            <CampoMoeda
              label="Valor pago"
              name="valorServico"
              defaultValue={cliente.valorServico}
              className={`w-32 ${INPUT}`}
            />
            <CampoData
              label="Pago em"
              name="dataPagamentoServico"
              defaultValue={
                cliente.dataPagamentoServico
                  ? new Date(cliente.dataPagamentoServico).toISOString().slice(0, 10)
                  : ""
              }
              className={INPUT}
            />
            <button type="submit" className={BTN_PRIMARY}>
              Salvar
            </button>
          </form>
        </section>
      )}

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Documentos</h2>

        <form action={enviarDocumentoComId} className="flex flex-wrap items-end gap-3">
          <label className={LABEL}>
            <span className={LABEL_TEXT}>Tipo</span>
            <input
              type="text"
              name="tipo"
              list="tipos-documento"
              required
              placeholder="Ex: Foto do passaporte"
              className={`w-56 ${INPUT}`}
            />
            <datalist id="tipos-documento">
              {TIPOS_DOCUMENTO_SUGERIDOS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <label className={LABEL}>
            <span className={LABEL_TEXT}>Arquivo (até 10MB)</span>
            <input
              type="file"
              name="arquivo"
              required
              accept="image/*,application/pdf"
              className={`${INPUT} text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-zinc-200 file:hover:bg-white/15`}
            />
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            Enviar
          </button>
        </form>

        {cliente.documentos.length > 0 && (
          <ul className="mt-4 flex flex-col divide-y divide-white/5">
            {cliente.documentos.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <a
                  href={`/api/documentos/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-200 hover:text-indigo-300 hover:underline"
                >
                  {doc.tipo} — {doc.nomeArquivo}
                </a>
                {ehAdmin && (
                  <form action={removerDocumento.bind(null, doc.id)}>
                    <input type="hidden" name="clienteId" value={cliente.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline"
                    >
                      Remover
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {ehAdmin && cliente.etapaAtual === "VISTO_APROVADO" && cliente.documentos.length > 0 && (
          <form action={excluirDocumentosComId} className="mt-4 border-t border-white/5 pt-4">
            <ConfirmSubmitButton
              confirmMessage="Excluir todos os documentos anexados deste cliente? O histórico do processo é mantido para relatórios, mas os arquivos não podem ser recuperados depois."
              className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline"
            >
              Excluir todos os documentos (visto já aprovado)
            </ConfirmSubmitButton>
          </form>
        )}
      </section>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Dados do cliente</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Info label="CPF" value={cliente.cpf} />
          <Info label="Passaporte" value={cliente.numeroPassaporte} />
          <Info
            label="Validade do passaporte"
            value={cliente.validadePassaporte ? formatarDataBr(cliente.validadePassaporte) : null}
          />
          <Info
            label="Vencimento do visto atual"
            value={
              cliente.dataVencimentoVistoAtual
                ? formatarDataBr(cliente.dataVencimentoVistoAtual)
                : null
            }
          />
          <Info
            label="Cadastrado em"
            value={new Date(cliente.criadoEm).toLocaleDateString("pt-BR")}
          />
        </dl>
      </section>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Grupo familiar</h2>

        {cliente.grupo ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-300">
              Faz parte da família{" "}
              <Link
                href={`/grupos/${cliente.grupo.id}`}
                className="font-medium text-zinc-100 hover:text-indigo-300 hover:underline"
              >
                {cliente.grupo.nome}
              </Link>{" "}
              ({cliente.grupo.clientes.length} pessoa
              {cliente.grupo.clientes.length === 1 ? "" : "s"})
            </p>
            <ul className="flex flex-col gap-1 text-sm text-zinc-400">
              {cliente.grupo.clientes
                .filter((c) => c.id !== cliente.id)
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clientes/${c.id}`}
                      className="hover:text-indigo-300 hover:underline"
                    >
                      {c.nome}
                    </Link>
                  </li>
                ))}
            </ul>
            {ehAdmin && (
              <form action={sairDoGrupoComId}>
                <button
                  type="submit"
                  className="self-start rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5"
                >
                  Remover deste grupo
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <form action={criarGrupoComId} className="flex items-end gap-3">
              <label className={LABEL}>
                <span className={LABEL_TEXT}>Criar novo grupo familiar</span>
                <input
                  type="text"
                  name="nomeGrupo"
                  placeholder="Ex: Silva"
                  required
                  className={INPUT}
                />
              </label>
              <button type="submit" className={BTN_PRIMARY}>
                Criar
              </button>
            </form>

            {outrosGrupos.length > 0 && (
              <form action={entrarNoGrupoComId} className="flex items-end gap-3">
                <label className={LABEL}>
                  <span className={LABEL_TEXT}>Ou adicionar a uma família existente</span>
                  <select name="grupoId" required className={INPUT}>
                    <option value="">Selecione...</option>
                    {outrosGrupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className={BTN_OUTLINE}>
                  Adicionar
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Observações</h2>
        <form action={observacoesComId} className="flex flex-col gap-3">
          <textarea
            name="observacoes"
            rows={4}
            defaultValue={cliente.observacoes ?? ""}
            className={`${INPUT} text-sm`}
          />
          <button type="submit" className={`self-start ${BTN_PRIMARY}`}>
            Salvar observações
          </button>
        </form>
      </section>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Histórico</h2>
        <ul className="flex flex-col gap-3">
          {cliente.historico.map((h: HistoricoEtapa) => (
            <li key={h.id} className="flex justify-between gap-4 text-sm">
              <span className="text-zinc-300">
                {ETAPA_LABEL[h.etapa]}
                {h.observacao && (
                  <span className="text-zinc-500"> — {h.observacao}</span>
                )}
              </span>
              <span className="shrink-0 text-zinc-500">
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
      <dd className="font-medium text-zinc-100">{value ?? "—"}</dd>
    </div>
  );
}
