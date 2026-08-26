import Link from "next/link";

export function VoltarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors duration-150 ease-out hover:text-[var(--color-accent)]"
    >
      ← {label}
    </Link>
  );
}
