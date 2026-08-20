import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint isolado, só-leitura, criado especificamente pro módulo separado
// "Rascunho DS160" (repo próprio, banco próprio) puxar nome/CPF/e-mail/
// telefone de um cliente que já existe aqui, evitando redigitação manual.
// Não é usado por nenhuma outra parte do Flow — não altera nada existente.
//
// Autenticação por segredo compartilhado (não é a sessão de staff do
// Flow): header "Authorization: Bearer <DS160_RASCUNHO_API_SECRET>".
export async function GET(request: NextRequest) {
  const secret = process.env.DS160_RASCUNHO_API_SECRET;
  if (!secret) {
    return NextResponse.json({ erro: "DS160_RASCUNHO_API_SECRET não configurada." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ erro: "Informe pelo menos 2 caracteres em ?q=" }, { status: 400 });
  }

  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { nome: { contains: q, mode: "insensitive" } },
        { cpf: { contains: q } },
      ],
    },
    select: { id: true, nome: true, cpf: true, email: true, telefone: true },
    take: 10,
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({ clientes });
}
