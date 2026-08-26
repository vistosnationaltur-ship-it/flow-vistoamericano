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
  "rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-deep)] px-3 py-2 text-[var(--color-text)] outline-none transition-colors duration-150 ease-out focus:border-[var(--color-accent-focus)] focus:ring-2 focus:ring-[var(--color-accent-ring)]";

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
      <span className="text-[var(--color-text-subtle)]">{label}</span>
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
