"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <p className="font-medium">Algo deu errado</p>
      <p className="mt-1">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-md border border-red-300 px-4 py-2 font-medium hover:bg-red-100"
      >
        Tentar de novo
      </button>
    </div>
  );
}
