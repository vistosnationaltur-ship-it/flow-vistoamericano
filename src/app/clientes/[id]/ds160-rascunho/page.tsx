import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VoltarLink } from "@/components/VoltarLink";

const CARD = "rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-6";
const CARD_TITLE = "mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";

type RespostaResolvida = {
  label: string;
  tipo: string;
  valor: string | Record<string, string>;
  explicacao?: string;
};

type RespostaDs160Rascunho = {
  nome: string;
  cpf: string | null;
  status: string;
  ordem: string[];
  respostas: Record<string, RespostaResolvida>;
};

function formatarValor(r: RespostaResolvida): string {
  if (typeof r.valor === "string") return r.valor;
  return Object.entries(r.valor)
    .map(([label, v]) => `${label}: ${v}`)
    .join(" · ");
}

export default async function Ds160RascunhoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  const apiUrl = process.env.DS160_RASCUNHO_API_URL;
  const secret = process.env.ROBO_API_SECRET;

  let dados: RespostaDs160Rascunho | null = null;
  let erro: string | null = null;

  if (!cliente.cpf) {
    erro = "Esse cliente não tem CPF cadastrado — sem CPF não dá pra buscar o rascunho.";
  } else if (!apiUrl || !secret) {
    erro = "DS160_RASCUNHO_API_URL ou ROBO_API_SECRET não configuradas.";
  } else {
    try {
      const resp = await fetch(`${apiUrl}/api/robo-integracao/clientes/${cliente.cpf}`, {
        headers: { Authorization: `Bearer ${secret}` },
        cache: "no-store",
      });
      if (resp.status === 404) {
        erro = "Esse cliente ainda não tem rascunho DS-160 cadastrado.";
      } else if (!resp.ok) {
        erro = `Erro ${resp.status} ao buscar o rascunho.`;
      } else {
        dados = await resp.json();
      }
    } catch {
      erro = "Não consegui falar com o ds160-rascunho agora.";
    }
  }

  // Usa `ordem` (sequência real das páginas do formulário) em vez de
  // Object.entries: chaves numéricas puras reordenam sozinhas em ordem
  // crescente de valor, o que embaralhava a exibição (ex.: pergunta de
  // segurança, id baixo, aparecendo antes de pergunta de página anterior
  // com id mais alto).
  const itens: [string, RespostaResolvida][] = dados
    ? dados.ordem.map((campoId) => [campoId, dados.respostas[campoId]])
    : [];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <VoltarLink href={`/clientes/${id}`} label="Voltar pra ficha do cliente" />

      <h1 className="text-[length:var(--text-h1)] leading-[var(--leading-h1)] font-semibold tracking-[var(--tracking-h1)] text-[var(--color-text)]">
        Rascunho do DS-160 — {cliente.nome}
      </h1>

      {erro && (
        <p className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {erro}
        </p>
      )}

      {dados && (
        <>
          <p className="text-sm text-[var(--color-text-muted)]">
            Status: <span className="text-[var(--color-text-subtle)]">{dados.status}</span> —{" "}
            {itens.length} pergunta(s) respondida(s)
          </p>
          <section className={CARD}>
            <h2 className={CARD_TITLE}>Respostas</h2>
            <dl className="flex flex-col gap-3">
              {itens.map(([campoId, r]) => (
                <div
                  key={campoId}
                  className="border-b border-[var(--color-border-subtle)] pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-xs font-medium text-[var(--color-text-muted)]">{r.label}</dt>
                  <dd className="text-sm text-[var(--color-text-subtle)]">{formatarValor(r)}</dd>
                  {r.explicacao && (
                    <dd className="mt-1 text-xs italic text-[var(--color-warning)]">
                      Explicação: {r.explicacao}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </main>
  );
}
