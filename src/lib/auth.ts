import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/client";

export const SESSION_COOKIE = "flow_visto_session";

const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export type Sessao = {
  id: string;
  username: string;
  role: Role;
};

function assinar(payload: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurada.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function criarTokenSessao(usuario: Sessao): string {
  const payload = JSON.stringify({ ...usuario, exp: Date.now() + DURACAO_SESSAO_MS });
  const payloadBase64 = Buffer.from(payload).toString("base64url");
  const assinatura = assinar(payloadBase64);
  return `${payloadBase64}.${assinatura}`;
}

export function lerTokenSessao(token: string | undefined): Sessao | null {
  if (!token) return null;
  const [payloadBase64, assinatura] = token.split(".");
  if (!payloadBase64 || !assinatura) return null;

  let assinaturaEsperada: string;
  try {
    assinaturaEsperada = assinar(payloadBase64);
  } catch {
    return null;
  }

  const a = Buffer.from(assinatura);
  const b = Buffer.from(assinaturaEsperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export async function sessaoAtual(): Promise<Sessao | null> {
  const cookieStore = await cookies();
  return lerTokenSessao(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function exigirAdmin(): Promise<void> {
  const sessao = await sessaoAtual();
  if (sessao?.role !== "ADMIN") {
    throw new Error("Apenas administradores podem fazer isso.");
  }
}
