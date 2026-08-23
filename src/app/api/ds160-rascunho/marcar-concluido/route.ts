import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Chamado pelo ds160-rascunho quando o cliente clica "Concluído" no
// rascunho web — marca rascunhoDs160ConcluidoEm na ficha do cliente
// aqui, pra a equipe ver na hora que já dá pra rodar o robô, sem
// precisar checar o admin do ds160-rascunho manualmente.
//
// Mesmo segredo compartilhado já usado na busca Flow<->ds160-rascunho
// existente: header "Authorization: Bearer <DS160_RASCUNHO_API_SECRET>".
export async function POST(request: NextRequest) {
  const secret = process.env.DS160_RASCUNHO_API_SECRET;
  if (!secret) {
    return NextResponse.json({ erro: "DS160_RASCUNHO_API_SECRET não configurada." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clienteId = typeof body?.clienteId === "string" ? body.clienteId : null;
  if (!clienteId) {
    return NextResponse.json({ erro: "Informe clienteId." }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { rascunhoDs160ConcluidoEm: new Date() },
  });

  return NextResponse.json({ ok: true });
}
