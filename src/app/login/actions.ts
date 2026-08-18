"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, senhaCorreta } from "@/lib/auth";

export async function login(formData: FormData) {
  const senha = (formData.get("senha") ?? "").toString();

  if (!senhaCorreta(senha)) {
    throw new Error("Senha incorreta.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, process.env.AUTH_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/painel");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
