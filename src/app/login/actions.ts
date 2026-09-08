"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, criarTokenSessao } from "@/lib/auth";
import { senhaConfere } from "@/lib/senha";

export type LoginState = { erro?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = (formData.get("username") ?? "").toString().trim();
  const senha = (formData.get("senha") ?? "").toString();

  if (!username || !senha) {
    return { erro: "Preencha usuário e senha." };
  }

  let usuario;
  try {
    usuario = await prisma.usuario.findUnique({ where: { username } });
  } catch {
    return { erro: "Falha ao conectar. Tente novamente em instantes." };
  }

  if (!usuario || !senhaConfere(senha, usuario.senhaHash)) {
    return { erro: "Usuário ou senha incorretos." };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    criarTokenSessao({ id: usuario.id, username: usuario.username, role: usuario.role }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );

  redirect("/painel");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
