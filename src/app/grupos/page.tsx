import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function GruposPage() {
  const grupos = await prisma.grupo.findMany({
    include: { clientes: true },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display)] text-[var(--color-text)]">
          Famílias
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {grupos.length} família{grupos.length === 1 ? "" : "s"} cadastrada
          {grupos.length === 1 ? "" : "s"}
        </p>
      </div>

      {grupos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-base)]/60 p-10 text-center text-sm text-[var(--color-text-muted)]">
          Nenhuma família criada ainda. Pra criar uma, vá na página de um cliente e use a seção
          &quot;Grupo familiar&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => (
            <Link
              key={g.id}
              href={`/grupos/${g.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-5 transition-colors duration-150 ease-out hover:border-[var(--color-accent-border)]"
            >
              <span className="font-medium text-[var(--color-text)]">Família {g.nome}</span>
              <span className="text-sm text-[var(--color-text-muted)]">
                {g.clientes.length} pessoa{g.clientes.length === 1 ? "" : "s"}
                {g.valorServico != null &&
                  ` · R$ ${g.valorServico.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {g.clientes.map((c) => c.nome).join(", ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
