"use client";

import { useState } from "react";

function isoParaBr(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function brParaIso(br: string): string {
  const digitos = br.replace(/\D/g, "");
  if (digitos.length !== 8) return "";
  const d = digitos.slice(0, 2);
  const m = digitos.slice(2, 4);
  const y = digitos.slice(4, 8);
  return `${y}-${m}-${d}`;
}

function formatarEnquantoDigita(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  const partes = [];
  if (digitos.length > 0) partes.push(digitos.slice(0, 2));
  if (digitos.length > 2) partes.push(digitos.slice(2, 4));
  if (digitos.length > 4) partes.push(digitos.slice(4, 8));
  return partes.join("/");
}

const INPUT_PADRAO =
  "rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30";

export function CampoData({
  label,
  name,
  required = false,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState(() => isoParaBr(defaultValue));

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-zinc-400">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={texto}
        onChange={(e) => setTexto(formatarEnquantoDigita(e.target.value))}
        required={required}
        pattern="\d{2}/\d{2}/\d{4}"
        title="Use o formato DD/MM/AAAA"
        maxLength={10}
        className={className ?? INPUT_PADRAO}
      />
      <input type="hidden" name={name} value={brParaIso(texto)} />
    </label>
  );
}
