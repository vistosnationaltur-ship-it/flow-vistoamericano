import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ETAPA_LABEL, progresso } from "@/lib/etapas";
import type { Cliente } from "@/generated/prisma/client";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Novo cliente
        </Link>
      </div>

      {clientes.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          Nenhum cliente cadastrado ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Etapa atual</th>
                <th className="px-4 py-3 font-medium">Progresso</th>
                <th className="px-4 py-3 font-medium">Entrevista</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente: Cliente) => (
                <tr key={cliente.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {cliente.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        cliente.etapaAtual === "VISTO_NEGADO"
                          ? "bg-red-100 text-red-700"
                          : cliente.etapaAtual === "VISTO_APROVADO" ||
                              cliente.etapaAtual === "PASSAPORTE_DEVOLVIDO"
                            ? "bg-green-100 text-green-700"
                            : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {ETAPA_LABEL[cliente.etapaAtual]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full bg-zinc-900"
                        style={{ width: `${progresso(cliente.etapaAtual)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {cliente.dataEntrevista
                      ? new Date(cliente.dataEntrevista).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
