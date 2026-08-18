import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { logout } from "@/app/login/actions";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/clientes" className="font-semibold tracking-tight">
              Flow Visto Americano
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-600">
              <Link href="/clientes" className="hover:text-zinc-900">
                Clientes
              </Link>
              <Link href="/clientes/novo" className="hover:text-zinc-900">
                Novo cliente
              </Link>
              <form action={logout}>
                <button type="submit" className="hover:text-zinc-900">
                  Sair
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
