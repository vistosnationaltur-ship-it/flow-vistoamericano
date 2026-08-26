import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { sessaoAtual } from "@/lib/auth";
import { SaveToast } from "@/components/SaveToast";
import { NavLinks } from "@/components/NavLinks";
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
  title: "Flow 2N Assessoria",
  description: "Acompanhamento do processo de assessoria de visto americano de turista",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const sessao = await sessaoAtual();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-base-deep)] text-[var(--color-text)]">
        <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-base-deep)]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <Link
              href="/painel"
              className="flex items-center gap-2 font-semibold tracking-tight text-[var(--color-text)]"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              Flow 2N Assessoria
            </Link>
            {sessao && (
              <NavLinks
                role={sessao.role}
                username={sessao.username}
                sessaoExtra={
                  <form action={logout} className="lg:ml-1">
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-subtle)] transition-colors duration-150 ease-out hover:bg-white/5 hover:text-[var(--color-accent)] lg:w-auto lg:text-center"
                    >
                      Sair
                    </button>
                  </form>
                }
              />
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
        <SaveToast />
      </body>
    </html>
  );
}
