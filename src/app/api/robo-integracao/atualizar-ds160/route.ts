import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ORDEM_ETAPAS } from "@/lib/etapas";

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

  // Avança pra "aguardando revisão" — mas só pra frente. O robô e o
  // consultor que revisa depois costumam ser pessoas diferentes, então o
  // preenchimento automático não pode pular direto pra "DS-160
  // preenchido" (isso fica pra quando o consultor confirmar manualmente).
  // Se o cliente já estiver mais adiante no pipeline por algum motivo,
  // não mexe na etapa — só grava o número mesmo.
  const indiceAtual = ORDEM_ETAPAS.indexOf(cliente.etapaAtual);
  const indiceRevisao = ORDEM_ETAPAS.indexOf("DS160_AGUARDANDO_REVISAO");
  const dados: { numeroDs160: string; etapaAtual?: "DS160_AGUARDANDO_REVISAO" } = { numeroDs160 };
  if (indiceAtual !== -1 && indiceAtual < indiceRevisao) {
    dados.etapaAtual = "DS160_AGUARDANDO_REVISAO";
  }

  await prisma.cliente.update({
    where: { id: clienteId },
    data: dados,
  });

  return NextResponse.json({ ok: true });
}
