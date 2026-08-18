import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ETAPA_LABEL, ORDEM_ETAPAS } from "@/lib/etapas";
import type { EtapaProcesso } from "@/generated/prisma/client";

const TODAS_ETAPAS: EtapaProcesso[] = [...ORDEM_ETAPAS, "VISTO_NEGADO"];

export default async function PainelPage() {
  const contagens = await prisma.cliente.groupBy({
    by: ["etapaAtual"],
    _count: { _all: true },
  });

  const total = contagens.reduce((soma, c) => soma + c._count._all, 0);
  const porEtapa = new Map(contagens.map((c) => [c.etapaAtual, c._count._all]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Painel</h1>
        <p className="text-sm text-zinc-500">
          {total} cliente{total === 1 ? "" : "s"} no total
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {TODAS_ETAPAS.map((etapa) => {
          const quantidade = porEtapa.get(etapa) ?? 0;
          const negativa = etapa === "VISTO_NEGADO";
          return (
            <Link
              key={etapa}
              href={`/clientes?etapa=${etapa}`}
              className={`flex flex-col gap-1 rounded-md border p-4 hover:border-zinc-400 ${
                negativa ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"
              }`}
            >
              <span
                className={`text-3xl font-semibold ${negativa ? "text-red-700" : "text-zinc-900"}`}
              >
                {quantidade}
              </span>
              <span className="text-sm text-zinc-600">{ETAPA_LABEL[etapa]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
