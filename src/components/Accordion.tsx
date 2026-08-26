"use client";

import { useState, type ReactNode } from "react";

export function Accordion({
  titulo,
  contador,
  children,
}: {
  titulo: string;
  contador?: string;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 py-1 text-left text-sm font-semibold text-[var(--color-text-muted)] transition-colors duration-150 ease-out hover:text-[var(--color-text)]"
      >
        <span className="flex items-center gap-2">
          {titulo}
          {contador && (
            <span className="text-xs font-normal text-[var(--color-text-muted)]">{contador}</span>
          )}
        </span>
        <svg
          data-open={aberto}
          className="accordion-chevron h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div data-open={aberto} className="accordion-panel">
        <div className="min-h-0 pt-3">{children}</div>
      </div>
    </div>
  );
}
