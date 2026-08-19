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
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Famílias</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {grupos.length} família{grupos.length === 1 ? "" : "s"} cadastrada
          {grupos.length === 1 ? "" : "s"}
        </p>
      </div>

      {grupos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 p-10 text-center text-sm text-zinc-500">
          Nenhuma família criada ainda. Pra criar uma, vá na página de um cliente e use a seção
          &quot;Grupo familiar&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => (
            <Link
              key={g.id}
              href={`/grupos/${g.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-5 transition-colors hover:border-indigo-500/40 hover:bg-zinc-900"
            >
              <span className="font-medium text-zinc-100">Família {g.nome}</span>
              <span className="text-sm text-zinc-500">
                {g.clientes.length} pessoa{g.clientes.length === 1 ? "" : "s"}
                {g.valorServico != null &&
                  ` · R$ ${g.valorServico.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </span>
              <span className="text-xs text-zinc-500">
                {g.clientes.map((c) => c.nome).join(", ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
