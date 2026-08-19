import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { sessaoAtual } from "@/lib/auth";
import { SaveToast } from "@/components/SaveToast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flow Visto Americano",
  description: "Acompanhamento do processo de assessoria de visto americano de turista",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const sessao = await sessaoAtual();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/painel"
              className="flex items-center gap-2 font-semibold tracking-tight text-zinc-100"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
              Flow Visto Americano
            </Link>
            {sessao && (
              <nav className="flex items-center gap-1 text-sm text-zinc-400">
                <Link
                  href="/painel"
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-zinc-100"
                >
                  Painel
                </Link>
                <Link
                  href="/clientes"
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-zinc-100"
                >
                  Clientes
                </Link>
                <Link
                  href="/clientes/novo"
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-zinc-100"
                >
                  Novo cliente
                </Link>
                <Link
                  href="/grupos"
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-zinc-100"
                >
                  Famílias
                </Link>
                <Link
                  href="/financeiro"
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-zinc-100"
                >
                  Financeiro
                </Link>
                <Link
                  href="/metricas"
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-zinc-100"
                >
                  Métricas
                </Link>
                {sessao.role === "ADMIN" && (
                  <Link
                    href="/usuarios"
                    className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-zinc-100"
                  >
                    Usuários
                  </Link>
                )}
                <span className="ml-2 hidden text-xs text-zinc-600 sm:inline">
                  {sessao.username}
                </span>
                <form action={logout} className="ml-1">
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-zinc-100"
                  >
                    Sair
                  </button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
        <SaveToast />
      </body>
    </html>
  );
}
