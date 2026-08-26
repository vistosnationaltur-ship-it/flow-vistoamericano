"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const LINK_BASE = "rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-out";

function NavLink({
  href,
  active,
  compact = false,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  compact?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`${LINK_BASE} ${compact ? "text-xs" : ""} ${
        active
          ? "bg-[var(--color-accent-surface)] font-medium text-[var(--color-accent)]"
          : "text-[var(--color-text-subtle)] hover:bg-white/5 hover:text-[var(--color-accent)]"
      }`}
    >
      {children}
    </Link>
  );
}

function Divisor({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return <span aria-hidden className="my-1 h-px w-full shrink-0 bg-[var(--color-border-subtle)]" />;
  }
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-[var(--color-border-subtle)]" />;
}

// Conteúdo dos links, compartilhado entre a barra desktop (inline) e o
// drawer mobile (empilhado) — os mesmos 4 grupos nos dois layouts.
function NavItems({
  role,
  vertical = false,
  onNavigate,
}: {
  role: string;
  vertical?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const emClientes = pathname === "/clientes" || pathname.startsWith("/clientes/");
  const wrapClass = vertical ? "flex flex-col items-stretch gap-1" : "flex items-center gap-1";

  return (
    <div className={wrapClass}>
      {/* grupo 1 — trabalho diário, peso maior */}
      <NavLink href="/painel" active={pathname === "/painel"} onClick={onNavigate}>
        Painel
      </NavLink>
      <NavLink href="/clientes" active={emClientes} onClick={onNavigate}>
        Clientes
      </NavLink>

      <Divisor vertical={vertical} />

      {/* grupo 2 — famílias, peso médio */}
      <NavLink href="/grupos" active={pathname.startsWith("/grupos")} onClick={onNavigate}>
        Famílias
      </NavLink>

      <Divisor vertical={vertical} />

      {/* grupo 3 — gestão, visualmente separado e menor */}
      <NavLink
        href="/financeiro"
        active={pathname.startsWith("/financeiro")}
        compact={!vertical}
        onClick={onNavigate}
      >
        Financeiro
      </NavLink>
      <NavLink
        href="/metricas"
        active={pathname.startsWith("/metricas")}
        compact={!vertical}
        onClick={onNavigate}
      >
        Métricas
      </NavLink>

      {role === "ADMIN" && (
        <>
          <Divisor vertical={vertical} />
          {/* grupo 4 — fora do fluxo operacional, só ADMIN */}
          <NavLink
            href="/usuarios"
            active={pathname.startsWith("/usuarios")}
            compact={!vertical}
            onClick={onNavigate}
          >
            Usuários
          </NavLink>
        </>
      )}
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
        <path
          d="M6 6L18 18M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// `sessaoExtra` carrega username + botão "Sair" (renderizados no server, em
// layout.tsx) pra dentro do drawer mobile — layout.tsx é Server Component e
// não pode ter estado, então quem decide abrir/fechar é este client component.
export function NavLinks({
  role,
  username,
  sessaoExtra,
}: {
  role: string;
  username: string;
  sessaoExtra: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // o fechamento ao navegar é feito via onNavigate em cada NavLink
  // (evento real de clique, não efeito reagindo à mudança de pathname).

  // fecha com Escape e ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      {/* desktop — nav inline, a partir de lg (1024px) */}
      <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
        <NavItems role={role} />
        <span className="ml-2 hidden text-xs text-[var(--color-text-muted)] xl:inline">
          {username}
        </span>
        {sessaoExtra}
      </nav>

      {/* mobile — hambúrguer abaixo de lg */}
      <div className="flex items-center gap-1 lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-[var(--color-text-subtle)] transition-colors duration-150 ease-out hover:bg-white/5 hover:text-[var(--color-accent)]"
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {open && (
        <div
          id="menu-mobile"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-3 shadow-[var(--shadow-card)] lg:hidden"
        >
          <NavItems role={role} vertical onNavigate={() => setOpen(false)} />
          <div className="mt-2 flex flex-col gap-1 border-t border-[var(--color-border-subtle)] pt-2">
            <span className="px-3 py-1 text-xs text-[var(--color-text-muted)]">{username}</span>
            {sessaoExtra}
          </div>
        </div>
      )}
    </div>
  );
}
