import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { EtapaProcesso, HistoricoEtapa } from "@/generated/prisma/client";
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
import { GerarAcessoDs160Form } from "@/components/GerarAcessoDs160Form";
import { AvancarEtapaButton, SeloSelarEffect } from "@/components/SelarEtapa";
import { Accordion } from "@/components/Accordion";
import { sessaoAtual } from "@/lib/auth";
import { CampoData } from "@/components/CampoData";
import { CampoMoeda } from "@/components/CampoMoeda";
import { VoltarLink } from "@/components/VoltarLink";

const TIPOS_DOCUMENTO_SUGERIDOS = [
  "Foto do passaporte",
  "Comprovante DS-160",
  "Comprovante financeiro",
  "Comprovante de vínculo (emprego/estudo)",
];

// Zona 3 (peso médio) e Zona 4 (peso baixo) — mesma "página do livro",
// card navy com borda sutil (o dourado fica reservado a selo/foco/CTA).
const CARD = "rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-6";
const CARD_TITLE = "mb-4 text-sm font-semibold text-[var(--color-text-muted)]";
const LABEL = "flex flex-col gap-1.5 text-sm";
const LABEL_TEXT = "text-[var(--color-text-subtle)]";
const INPUT =
  "rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-deep)] px-3 py-2 text-[var(--color-text)] outline-none transition-colors duration-150 ease-out focus:border-[var(--color-accent-focus)] focus:ring-2 focus:ring-[var(--color-accent-ring)]";
// CTA primário da página — reservado só pra "Avançar etapa" (o carimbo).
const BTN_PRIMARY =
  "rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-[var(--shadow-accent-rest)] transition-shadow duration-150 ease-out hover:shadow-[var(--shadow-accent-hover)] motion-safe:hover:-translate-y-px motion-safe:transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
// Ação secundária de "salvar" dentro de uma linha de etapa aberta —
// mesma família cromática do CTA, sem o glow (evita saturar o acento).
const BTN_SALVAR =
  "rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-surface)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors duration-150 ease-out hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
const BTN_OUTLINE =
  "rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--color-text-subtle)] transition-colors duration-150 ease-out hover:bg-white/5 hover:text-[var(--color-text)]";
// "Voltar etapa" quebra o selo — paleta de danger, nunca dourado (DESIGN.md §7).
const BTN_DANGER =
  "rounded-lg border border-[var(--color-danger-border)] px-4 py-2 text-sm font-medium text-[var(--color-danger)] transition-colors duration-150 ease-out hover:bg-[var(--color-danger-surface)]";
const BTN_DANGER_SM =
  "text-xs font-medium text-[var(--color-danger)] transition-colors duration-150 ease-out hover:underline";

type EstadoLinha = "selada" | "aberta" | "futura";

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
  const negado = cliente.etapaAtual === "VISTO_NEGADO";
  const atualIndex = ORDEM_ETAPAS.indexOf(cliente.etapaAtual);

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
    <div className="flex flex-col gap-8">
      <SeloSelarEffect />
      <VoltarLink href="/clientes" label="Voltar pra lista de clientes" />

      {/* Zona 1 — cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display)] text-[var(--color-text)]">
              {cliente.nome}
            </h1>
            <EtapaBadge etapa={cliente.etapaAtual} negado={negado} />
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            {cliente.email ?? "sem e-mail"} · {cliente.telefone ?? "sem telefone"}
            {cliente.dataNascimento && ` · nasc. ${formatarDataBr(cliente.dataNascimento)}`}
          </p>
          {cliente.endereco && (
            <p className="text-sm text-[var(--color-text-muted)]">{cliente.endereco}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/clientes/${cliente.id}/editar`} className={BTN_OUTLINE}>
            Editar dados
          </Link>
          {ehAdmin && (
            <form action={excluirComId}>
              <ConfirmSubmitButton
                confirmMessage={`Excluir ${cliente.nome} definitivamente? Isso apaga todo o histórico e documentos anexados. Essa ação não pode ser desfeita.`}
                className={BTN_DANGER}
              >
                Excluir cliente
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </div>

      {/* Zona 2 — peso máximo: o livro aberto */}
      <section className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-[length:var(--text-h1)] leading-[var(--leading-h1)] font-semibold tracking-[var(--tracking-h1)] text-[var(--color-text)]">
          Livro de registro
        </h2>
        <p className="mb-5 text-sm text-[var(--color-text-muted)]">
          Cada etapa selada com data. A etapa aberta é a única com formulário ativo.
        </p>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[var(--color-accent)]"
            style={{ width: `${progresso(cliente.etapaAtual)}%` }}
          />
        </div>

        <ol className="mt-5 flex flex-col">
          {ORDEM_ETAPAS.map((etapa, i) => {
            const estado: EstadoLinha = negado
              ? "selada"
              : i < atualIndex
                ? "selada"
                : i === atualIndex
                  ? "aberta"
                  : "futura";
            const data = dataPorEtapa.get(etapa);

            return (
              <li
                key={etapa}
                className={`flex flex-col gap-3 border-t border-[var(--color-border-subtle)] py-3 first:border-t-0 ${
                  estado === "aberta" ? "py-4" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <SeloCirculo etapa={etapa} estado={estado} numero={i + 1} />
                    <span
                      className={`text-sm ${
                        estado === "aberta"
                          ? "font-semibold text-[var(--color-accent)]"
                          : estado === "selada"
                            ? "font-medium text-[var(--color-text)]"
                            : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      {ETAPA_LABEL[etapa]}
                    </span>
                    {etapa === "RASCUNHO_DS160_SOLICITADO" && estado !== "futura" && (
                      <Link
                        href={`/clientes/${cliente.id}/ds160-rascunho`}
                        className="text-xs font-normal text-[var(--color-accent)] underline-offset-2 hover:underline"
                      >
                        ver rascunho →
                      </Link>
                    )}
                    {etapa === "DS160_PREENCHIDO" && estado !== "futura" && cliente.numeroDs160 && (
                      <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[var(--color-accent)]">
                        Nº {cliente.numeroDs160}
                      </span>
                    )}
                    {etapa === "AGENDAMENTO_ENTREVISTA" && estado !== "futura" && cliente.dataEntrevista && (
                      <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[var(--color-accent)]">
                        {new Date(cliente.dataEntrevista).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </span>
                  {data && (
                    <span className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                      {data.toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>

                {etapa === "RASCUNHO_DS160_SOLICITADO" &&
                  estado !== "futura" &&
                  cliente.rascunhoDs160ConcluidoEm && (
                    <p className="ml-8 rounded-lg bg-[var(--color-success-surface)] px-3 py-2 text-xs font-medium text-[var(--color-success)]">
                      ✓ Cliente concluiu o rascunho do DS-160 em{" "}
                      {formatarDataBr(cliente.rascunhoDs160ConcluidoEm)} — já dá pra rodar o robô.
                    </p>
                  )}

                {estado === "aberta" && (
                  <div className="ml-8 flex flex-col gap-4">
                    {etapa === "CADASTRO" && (
                      <form action={enviarContratoComId}>
                        <button type="submit" className={BTN_SALVAR}>
                          Enviar contrato (Authentique)
                        </button>
                      </form>
                    )}

                    {etapa === "CONTRATO_ENVIADO" && (
                      <GerarAcessoDs160Form clienteId={cliente.id} temCpf={Boolean(cliente.cpf)} />
                    )}

                    {etapa === "AGENDAMENTO_ENTREVISTA" && (
                      <form action={dataEntrevistaComId} className="flex flex-wrap items-end gap-3">
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
                        <button type="submit" className={BTN_SALVAR}>
                          Salvar data
                        </button>
                      </form>
                    )}

                    {etapa === "DS160_PREENCHIDO" && (
                      <form action={numeroDs160ComId} className="flex flex-wrap items-end gap-3">
                        <label className={LABEL}>
                          <span className={LABEL_TEXT}>Número do DS-160</span>
                          <input
                            type="text"
                            name="numeroDs160"
                            defaultValue={cliente.numeroDs160 ?? ""}
                            placeholder="Ex: AA00XXXXXX"
                            className={`w-56 ${INPUT}`}
                          />
                        </label>
                        <button type="submit" className={BTN_SALVAR}>
                          Salvar número
                        </button>
                      </form>
                    )}

                    {etapa === "PAGAMENTO_MRV" && (
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
                        <button type="submit" className={BTN_SALVAR}>
                          Salvar pagamento
                        </button>
                      </form>
                    )}

                    {etapa === "ENTREVISTA_REALIZADA" && (
                      <form action={negarComId}>
                        <input type="hidden" name="observacao" value="" />
                        <button type="submit" className={BTN_DANGER}>
                          Marcar visto negado
                        </button>
                      </form>
                    )}

                    {(proxima || anterior) && (
                      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border-subtle)] pt-4">
                        {proxima && (
                          <form action={avancarComId} className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              name="observacao"
                              placeholder="Observação (opcional)"
                              className={`${INPUT} text-sm`}
                            />
                            <AvancarEtapaButton etapaAtual={etapa} className={BTN_PRIMARY}>
                              Avançar para &quot;{ETAPA_LABEL[proxima]}&quot;
                            </AvancarEtapaButton>
                          </form>
                        )}

                        {anterior && (
                          <form action={voltarComId}>
                            <ConfirmSubmitButton
                              confirmMessage={`Voltar para "${ETAPA_LABEL[anterior]}"? Isso reabre uma página já selada. Confirmar?`}
                              className={BTN_OUTLINE}
                            >
                              Voltar para &quot;{ETAPA_LABEL[anterior]}&quot;
                            </ConfirmSubmitButton>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}

          {negado && (
            <li className="flex items-center gap-3 border-t border-[var(--color-border-subtle)] py-3">
              <span
                data-selo="VISTO_NEGADO"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-danger)] text-xs font-semibold text-[var(--color-danger)]"
              >
                ✕
              </span>
              <span className="text-sm font-medium text-[var(--color-danger)]">Visto negado</span>
            </li>
          )}
        </ol>
      </section>

      {/* Zona 3 — peso médio */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={CARD}>
          <h2 className={CARD_TITLE}>Documentos</h2>

          <form action={enviarDocumentoComId} className="flex flex-col gap-3">
            <label className={LABEL}>
              <span className={LABEL_TEXT}>Tipo</span>
              <input
                type="text"
                name="tipo"
                list="tipos-documento"
                required
                placeholder="Ex: Foto do passaporte"
                className={INPUT}
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
                className={`${INPUT} text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[var(--color-text)] file:hover:bg-white/15`}
              />
            </label>
            <button type="submit" className={`self-start ${BTN_SALVAR}`}>
              Enviar
            </button>
          </form>

          {cliente.documentos.length > 0 && (
            <ul className="mt-4 flex flex-col divide-y divide-[var(--color-border-subtle)]">
              {cliente.documentos.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <a
                    href={`/api/documentos/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-text)] hover:text-[var(--color-accent)] hover:underline"
                  >
                    {doc.tipo} — {doc.nomeArquivo}
                  </a>
                  {ehAdmin && (
                    <form action={removerDocumento.bind(null, doc.id)}>
                      <input type="hidden" name="clienteId" value={cliente.id} />
                      <button type="submit" className={BTN_DANGER_SM}>
                        Remover
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          {ehAdmin && cliente.etapaAtual === "VISTO_APROVADO" && cliente.documentos.length > 0 && (
            <form action={excluirDocumentosComId} className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
              <ConfirmSubmitButton
                confirmMessage="Excluir todos os documentos anexados deste cliente? O histórico do processo é mantido para relatórios, mas os arquivos não podem ser recuperados depois."
                className={BTN_DANGER_SM}
              >
                Excluir todos os documentos (visto já aprovado)
              </ConfirmSubmitButton>
            </form>
          )}
        </section>

        <section className={CARD}>
          <h2 className={CARD_TITLE}>Pagamento do serviço</h2>
          {cliente.grupo ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Esse cliente faz parte da família{" "}
              <Link
                href={`/grupos/${cliente.grupo.id}`}
                className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] hover:underline"
              >
                {cliente.grupo.nome}
              </Link>{" "}
              — o pagamento do serviço é gerenciado lá, não aqui.
            </p>
          ) : (
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
              <button type="submit" className={BTN_SALVAR}>
                Salvar
              </button>
            </form>
          )}
        </section>
      </div>

      {/* Zona 4 — peso baixo */}
      <section className={CARD}>
        <h2 className={CARD_TITLE}>Dados do cliente</h2>
        <dl className="flex flex-col gap-1.5 text-sm text-[var(--color-text-muted)] sm:flex-row sm:flex-wrap sm:gap-x-6">
          <div className="flex gap-1">
            <dt className="inline">CPF:</dt>
            <dd className="inline text-[var(--color-text)]">{cliente.cpf ?? "—"}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="inline">Passaporte:</dt>
            <dd className="inline text-[var(--color-text)]">{cliente.numeroPassaporte ?? "—"}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="inline">Cadastrado em</dt>
            <dd className="inline text-[var(--color-text)]">
              {new Date(cliente.criadoEm).toLocaleDateString("pt-BR")}
            </dd>
          </div>
        </dl>
        <Link
          href={`/clientes/${cliente.id}/editar`}
          className="mt-2 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline"
        >
          Ver / editar todos os dados →
        </Link>

        <div className="mt-5 flex flex-col gap-4 border-t border-[var(--color-border-subtle)] pt-4">
          <Accordion titulo="Grupo familiar" contador={cliente.grupo ? cliente.grupo.nome : undefined}>
            {cliente.grupo ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-[var(--color-text)]">
                  Faz parte da família{" "}
                  <Link
                    href={`/grupos/${cliente.grupo.id}`}
                    className="font-medium hover:text-[var(--color-accent)] hover:underline"
                  >
                    {cliente.grupo.nome}
                  </Link>{" "}
                  ({cliente.grupo.clientes.length} pessoa
                  {cliente.grupo.clientes.length === 1 ? "" : "s"})
                </p>
                <ul className="flex flex-col gap-1 text-sm text-[var(--color-text-muted)]">
                  {cliente.grupo.clientes
                    .filter((c) => c.id !== cliente.id)
                    .map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/clientes/${c.id}`}
                          className="hover:text-[var(--color-accent)] hover:underline"
                        >
                          {c.nome}
                        </Link>
                      </li>
                    ))}
                </ul>
                {ehAdmin && (
                  <form action={sairDoGrupoComId}>
                    <button type="submit" className={`self-start ${BTN_OUTLINE}`}>
                      Remover deste grupo
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <form action={criarGrupoComId} className="flex flex-wrap items-end gap-3">
                  <label className={LABEL}>
                    <span className={LABEL_TEXT}>Criar novo grupo familiar</span>
                    <input type="text" name="nomeGrupo" placeholder="Ex: Silva" required className={INPUT} />
                  </label>
                  <button type="submit" className={BTN_SALVAR}>
                    Criar
                  </button>
                </form>

                {outrosGrupos.length > 0 && (
                  <form action={entrarNoGrupoComId} className="flex flex-wrap items-end gap-3">
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
          </Accordion>

          <Accordion titulo="Observações">
            <form action={observacoesComId} className="flex flex-col gap-3">
              <label className={LABEL}>
                <span className={LABEL_TEXT}>Observações sobre o cliente</span>
                <textarea
                  name="observacoes"
                  rows={4}
                  defaultValue={cliente.observacoes ?? ""}
                  className={`${INPUT} text-sm`}
                />
              </label>
              <button type="submit" className={`self-start ${BTN_SALVAR}`}>
                Salvar observações
              </button>
            </form>
          </Accordion>
        </div>
      </section>

      {/* Zona 5 — peso mínimo, só leitura */}
      <section className="border-t border-[var(--color-border-subtle)] pt-6">
        <h2 className="mb-3 text-xs font-semibold text-[var(--color-text-muted)]">Histórico</h2>
        <ul className="flex flex-col gap-2.5">
          {cliente.historico.map((h: HistoricoEtapa) => (
            <li key={h.id} className="flex justify-between gap-4 text-xs text-[var(--color-text-muted)]">
              <span>
                {ETAPA_LABEL[h.etapa]}
                {h.observacao && <span> — {h.observacao}</span>}
              </span>
              <span className="shrink-0 font-mono">
                {new Date(h.criadoEm).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SeloCirculo({
  etapa,
  estado,
  numero,
}: {
  etapa: EtapaProcesso;
  estado: EstadoLinha;
  numero: number;
}) {
  if (estado === "selada") {
    return (
      <span
        data-selo={etapa}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-[var(--color-base)]"
      >
        ✓
      </span>
    );
  }

  if (estado === "aberta") {
    return (
      <span
        data-selo={etapa}
        className="selo-aberta flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-base-deep)] text-xs font-semibold text-[var(--color-accent)]"
      >
        {numero}
      </span>
    );
  }

  return (
    <span
      data-selo={etapa}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]"
    >
      {numero}
    </span>
  );
}

function EtapaBadge({ etapa, negado }: { etapa: EtapaProcesso; negado: boolean }) {
  if (negado) {
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--color-danger)] bg-[var(--color-danger-surface)] px-3 py-1 text-xs font-medium text-[var(--color-danger)]">
        Visto negado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-surface)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
      {ETAPA_LABEL[etapa]}
    </span>
  );
}
