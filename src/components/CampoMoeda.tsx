"use client";

import { useState } from "react";

function centavosParaBr(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function centavosParaIso(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

const INPUT_PADRAO =
  "rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30";

export function CampoMoeda({
  label,
  name,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: number | null;
  className?: string;
}) {
  const [centavos, setCentavos] = useState(() => Math.round((defaultValue ?? 0) * 100));
  const [tocado, setTocado] = useState(false);

  const vazio = !tocado && (defaultValue == null || defaultValue === 0);
  const valorHidden = !tocado && defaultValue == null ? "" : centavosParaIso(centavos);

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={vazio ? "" : `R$ ${centavosParaBr(centavos)}`}
        onChange={(e) => {
          setTocado(true);
          const digitos = e.target.value.replace(/\D/g, "");
          setCentavos(digitos ? parseInt(digitos, 10) : 0);
        }}
        className={className ?? `w-32 ${INPUT_PADRAO}`}
      />
      <input type="hidden" name={name} value={valorHidden} />
    </label>
  );
}
