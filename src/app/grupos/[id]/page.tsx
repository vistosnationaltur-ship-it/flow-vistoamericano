import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ETAPA_LABEL } from "@/lib/etapas";
import {
  atualizarFinanceiroGrupo,
  adicionarMembroAoGrupo,
  criarMembroFamilia,
  excluirGrupo,
} from "@/app/actions";
import { CampoData } from "@/components/CampoData";
import { CampoMoeda } from "@/components/CampoMoeda";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { sessaoAtual } from "@/lib/auth";
import { VoltarLink } from "@/components/VoltarLink";

const CARD = "rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-6";
const CARD_TITLE = "mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";
const INPUT =
  "rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-deep)] px-3 py-2 text-[var(--color-text)] outline-none transition-colors duration-150 ease-out focus:border-[var(--color-accent-focus)] focus:ring-2 focus:ring-[var(--color-accent-ring)]";
const LABEL = "flex flex-col gap-1.5 text-sm";
const LABEL_TEXT = "text-[var(--color-text-subtle)]";
const BTN_PRIMARY =
  "rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-[var(--shadow-accent-rest)] transition-shadow duration-150 ease-out hover:shadow-[var(--shadow-accent-hover)] motion-safe:hover:-translate-y-px motion-safe:transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
const BTN_SALVAR =
  "rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-surface)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors duration-150 ease-out hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
const BTN_OUTLINE =
  "rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--color-text-subtle)] transition-colors duration-150 ease-out hover:bg-white/5 hover:text-[var(--color-text)]";
const BTN_DANGER =
  "rounded-lg border border-[var(--color-danger-border)] px-4 py-2 text-sm font-medium text-[var(--color-danger)] transition-colors duration-150 ease-out hover:bg-[var(--color-danger-surface)]";

export default async function GrupoDetalhePage(props: PageProps<"/grupos/[id]">) {
  const { id } = await props.params;

  const sessao = await sessaoAtual();
  const ehAdmin = sessao?.role === "ADMIN";

  const grupo = await prisma.grupo.findUnique({
    where: { id },
    include: { clientes: { orderBy: { criadoEm: "asc" } } },
  });

  if (!grupo) notFound();

  const candidatos = await prisma.cliente.findMany({
    where: { OR: [{ grupoId: null }, { grupoId: { not: grupo.id } }] },
    orderBy: { nome: "asc" },
  });

  const financeiroComId = atualizarFinanceiroGrupo.bind(null, grupo.id);
  const adicionarMembroComId = adicionarMembroAoGrupo.bind(null, grupo.id);
  const criarMembroComId = criarMembroFamilia.bind(null, grupo.id);
  const excluirGrupoComId = excluirGrupo.bind(null, grupo.id);
  const valorPorPessoa =
    grupo.valorServico && grupo.clientes.length > 0
      ? grupo.valorServico / grupo.clientes.length
      : null;

  return (
    <div className="flex flex-col gap-6">
      <VoltarLink href="/grupos" label="Voltar pra lista de famílias" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display)] text-[var(--color-text)]">
            Família {grupo.nome}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {grupo.clientes.length} pessoa{grupo.clientes.length === 1 ? "" : "s"} nesse grupo
          </p>
        </div>
        {ehAdmin && (
          <form action={excluirGrupoComId}>
            <ConfirmSubmitButton
              confirmMessage={`Excluir a família "${grupo.nome}"? Os clientes não são apagados, só deixam de fazer parte desse grupo (voltam a ter pagamento individual).`}
              className={BTN_DANGER}
            >
              Excluir família
            </ConfirmSubmitButton>
          </form>
        )}
      </div>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Membros da família</h2>
        <ul className="flex flex-col divide-y divide-[var(--color-border-subtle)]">
          {grupo.clientes.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3 text-sm">
              <Link
                href={`/clientes/${c.id}`}
                className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] hover:underline"
              >
                {c.nome}
              </Link>
              <span className="rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
                {ETAPA_LABEL[c.etapaAtual]}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-4 border-t border-[var(--color-border-subtle)] pt-4">
          <form action={criarMembroComId} className="flex flex-wrap items-end gap-3">
            <label className={LABEL}>
              <span className={LABEL_TEXT}>Cadastrar um membro novo nessa família</span>
              <input
                type="text"
                name="nome"
                required
                placeholder="Nome completo"
                className={`w-56 ${INPUT}`}
              />
            </label>
            <button type="submit" className={BTN_PRIMARY}>
              Criar e adicionar
            </button>
          </form>
          <p className="text-xs text-[var(--color-text-muted)]">
            Cria essa pessoa do zero, já vinculada a essa família, com o próprio pipeline de
            etapas — não precisa ter feito cadastro pelo site antes. Depois você completa os
            outros dados dela (CPF, e-mail, passaporte...) na página dela em &quot;Editar
            dados&quot;.
          </p>

          {candidatos.length > 0 && (
            <form
              action={adicionarMembroComId}
              className="flex flex-wrap items-end gap-3 border-t border-[var(--color-border-subtle)] pt-4"
            >
              <label className={LABEL}>
                <span className={LABEL_TEXT}>Ou adicionar alguém já cadastrado</span>
                <select
                  name="clienteId"
                  required
                  defaultValue=""
                  className={`w-56 ${INPUT}`}
                >
                  <option value="" disabled>
                    Selecione um cliente...
                  </option>
                  {candidatos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
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
      </section>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Pagamento do serviço (família toda)</h2>
        <form action={financeiroComId} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <CampoMoeda
              label="Valor total"
              name="valorServico"
              defaultValue={grupo.valorServico}
              className={`w-32 ${INPUT}`}
            />
            <CampoData
              label="Pago em"
              name="dataPagamentoServico"
              defaultValue={
                grupo.dataPagamentoServico
                  ? new Date(grupo.dataPagamentoServico).toISOString().slice(0, 10)
                  : ""
              }
              className={INPUT}
            />
          </div>

          <label className={LABEL}>
            <span className={LABEL_TEXT}>
              Observações financeiras (ex: por que o valor é maior)
            </span>
            <textarea
              name="observacoesFinanceiras"
              rows={2}
              defaultValue={grupo.observacoesFinanceiras ?? ""}
              className={`${INPUT} text-sm`}
            />
          </label>

          <button type="submit" className={`self-start ${BTN_SALVAR}`}>
            Salvar
          </button>
        </form>

        {valorPorPessoa != null && (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            ≈ R$ {valorPorPessoa.toFixed(2)} por pessoa ({grupo.clientes.length} pessoas)
          </p>
        )}
      </section>
    </div>
  );
}
