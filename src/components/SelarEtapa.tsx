"use client";

import { useEffect, type ButtonHTMLAttributes } from "react";

// Sinaliza (via sessionStorage, mesmo padrão do SaveToast) qual etapa
// estava aberta no momento do clique. Depois do reload, SeloSelarEffect
// lê a flag e toca a animação de "selar" no círculo que virou selada —
// o carimbo bate uma vez, com peso (DESIGN.md §8).
const FLAG_KEY = "flow:etapa-selando";

export function AvancarEtapaButton({
  etapaAtual,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { etapaAtual: string }) {
  return (
    <button
      {...props}
      type="submit"
      className={className}
      onClick={(e) => {
        try {
          sessionStorage.setItem(FLAG_KEY, etapaAtual);
        } catch {
          // sessionStorage indisponível — só perde o efeito de selar, não trava o avanço.
        }
        props.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}

export function SeloSelarEffect() {
  useEffect(() => {
    let etapa: string | null = null;
    try {
      etapa = sessionStorage.getItem(FLAG_KEY);
      if (etapa) sessionStorage.removeItem(FLAG_KEY);
    } catch {
      return;
    }
    if (!etapa) return;

    const el = document.querySelector<HTMLElement>(`[data-selo="${etapa}"]`);
    if (!el) return;

    el.classList.add("selo-selando");
    const limpar = () => el.classList.remove("selo-selando");
    el.addEventListener("animationend", limpar, { once: true });
    return () => el.removeEventListener("animationend", limpar);
  }, []);

  return null;
}
