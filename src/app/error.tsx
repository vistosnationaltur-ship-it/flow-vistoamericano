"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-6 text-sm text-[var(--color-danger)]">
      <p className="font-medium">Algo deu errado</p>
      <p className="mt-1 text-[var(--color-danger)]/80">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg border border-[var(--color-danger-border)] px-4 py-2 font-medium text-[var(--color-danger)] transition-colors duration-150 ease-out hover:bg-[var(--color-danger-surface)]"
      >
        Tentar de novo
      </button>
    </div>
  );
}
