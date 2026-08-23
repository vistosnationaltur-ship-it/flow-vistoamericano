import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint isolado pro robô de automação DS-160 (repo `automacao-ds160`)
// gravar o Application ID direto na ficha do cliente, assim que o
// operador confirma que o DS-160 foi enviado no CEAC — sem precisar
// digitar isso manualmente na tela do cliente depois.
//
// Autenticação por segredo compartilhado: header
// "Authorization: Bearer <ROBO_API_SECRET>" (mesmo valor configurado no
// projeto ds160-rascunho, o robô usa o mesmo segredo pras duas chamadas).
export async function POST(request: NextRequest) {
  const secret = process.env.ROBO_API_SECRET;
  if (!secret) {
    return NextResponse.json({ erro: "ROBO_API_SECRET não configurada." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clienteId = typeof body?.clienteId === "string" ? body.clienteId : null;
  const numeroDs160 = typeof body?.numeroDs160 === "string" ? body.numeroDs160.trim() : null;

  if (!clienteId || !numeroDs160) {
    return NextResponse.json({ erro: "Informe clienteId e numeroDs160." }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { numeroDs160 },
  });

  return NextResponse.json({ ok: true });
}
