"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "flow:toast-salvo";
const DURACAO_MS = 2500;

export function SaveToast() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function mostrar() {
      clearTimeout(timeoutId);
      setVisivel(true);
      timeoutId = setTimeout(() => setVisivel(false), DURACAO_MS);
    }

    if (sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.removeItem(STORAGE_KEY);
      mostrar();
    }

    function aoEnviar(event: SubmitEvent) {
      const submitter = event.submitter as HTMLElement | null;
      const texto = submitter?.textContent?.trim().toLowerCase() ?? "";
      if (!texto.startsWith("salvar")) return;

      sessionStorage.setItem(STORAGE_KEY, "1");
      mostrar();
    }

    document.addEventListener("submit", aoEnviar, true);
    return () => {
      document.removeEventListener("submit", aoEnviar, true);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed bottom-5 right-5 z-50 transition-all duration-300 ${
        visivel ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-300 shadow-lg backdrop-blur-md">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Salvo com sucesso
      </div>
    </div>
  );
}
