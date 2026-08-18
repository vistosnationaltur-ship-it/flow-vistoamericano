import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Aceita variações de nome de campo porque o Fluent Forms pode mandar
// o "name" do input (ex: cpf_visto) ou o label (ex: "CPF Visto"),
// dependendo de como o webhook foi configurado no formulário.
function pick(payload: Record<string, unknown>, candidates: string[]): string | null {
  const normalizar = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
  const entradas = Object.entries(payload);

  for (const candidato of candidates) {
    const alvo = normalizar(candidato);
    const encontrada = entradas.find(([chave]) => normalizar(chave) === alvo);
    if (encontrada) {
      const valor = encontrada[1];
      const texto = (valor ?? "").toString().trim();
      if (texto !== "") return texto;
    }
  }
  return null;
}

// Fluent Forms manda data no formato brasileiro DD/MM/YYYY.
function parseDataBr(valor: string | null): Date | null {
  if (!valor) return null;
  const match = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição não é JSON válido." }, { status: 400 });
  }

  // Fluent Forms às vezes envelopa os dados em { data: {...} } ou { fields: {...} }.
  const payload =
    (body.data as Record<string, unknown>) ??
    (body.fields as Record<string, unknown>) ??
    body;

  const nome = pick(payload, ["Nome_Completo_Visto", "Nome Completo", "nome"]);
  if (!nome) {
    return NextResponse.json(
      {
        erro: "Campo de nome não encontrado no payload.",
        camposRecebidos: Object.keys(payload),
        payloadRecebido: payload,
      },
      { status: 400 },
    );
  }

  const cpf = pick(payload, ["cpf_visto", "cpf"]);
  const email = pick(payload, ["Email_Visto", "email"]);
  const telefone = pick(payload, ["Whatsapp", "whatsapp", "telefone"]);
  const endereco = pick(payload, ["Address", "endereco", "endereço"]);
  const dataNascimento = parseDataBr(pick(payload, ["Data de Nascimento", "dataNascimento"]));

  if (cpf) {
    const existente = await prisma.cliente.findUnique({ where: { cpf } });
    if (existente) {
      return NextResponse.json(
        { aviso: "Já existe cliente com esse CPF, nada foi criado.", clienteId: existente.id },
        { status: 200 },
      );
    }
  }

  const cliente = await prisma.cliente.create({
    data: {
      nome,
      cpf,
      email,
      telefone,
      endereco,
      dataNascimento,
      historico: { create: { etapa: "CADASTRO", observacao: "Cadastro automático via Fluent Forms" } },
    },
  });

  return NextResponse.json({ ok: true, clienteId: cliente.id }, { status: 201 });
}
