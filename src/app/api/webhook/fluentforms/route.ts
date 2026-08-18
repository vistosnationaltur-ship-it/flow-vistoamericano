import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// O "Rótulo do campo administrativo" configurado no Fluent Forms (ex:
// "cpf_visto") NÃO é a chave usada no JSON do webhook — o Fluent manda
// sempre a chave interna do tipo de campo (ex: "names", "input_mask",
// "input_mask_1", "phone", "address_1"). Por isso aceitamos várias
// variações e, pros campos de máscara genéricos (CPF e data de
// nascimento usam o mesmo tipo de campo), detectamos qual é qual pelo
// formato do valor em vez de confiar no nome da chave.
function pick(payload: Record<string, unknown>, candidates: string[]): string | null {
  const normalizar = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
  const entradas = Object.entries(payload);

  for (const candidato of candidates) {
    const alvo = normalizar(candidato);
    const encontrada = entradas.find(([chave]) => normalizar(chave) === alvo);
    if (encontrada) {
      const texto = textoDeValor(encontrada[1]);
      if (texto !== "") return texto;
    }
  }
  return null;
}

function textoDeValor(valor: unknown): string {
  if (valor && typeof valor === "object") {
    const obj = valor as Record<string, unknown>;

    // Campo "Nome" (Name Fields): { first_name, last_name }
    const nome = [obj.first_name, obj.last_name].filter(Boolean);
    if (nome.length > 0) return nome.join(" ").trim();

    // Campo "Endereço" (Address Field): rua, bairro, cidade, estado, cep, país
    const endereco = [
      obj.address_line_1,
      obj.address_line_2,
      obj.city,
      obj.state,
      obj.zip,
      obj.country,
    ].filter((parte) => typeof parte === "string" && parte.trim() !== "");
    if (endereco.length > 0) return endereco.join(", ");

    return "";
  }
  return (valor ?? "").toString().trim();
}

// Fluent Forms manda data no formato brasileiro DD/MM/YYYY.
function parseDataBr(valor: string | null): Date | null {
  if (!valor) return null;
  const match = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

// Entre os campos de máscara genéricos (input_mask, input_mask_1, ...),
// acha o que parece CPF (11 dígitos) e o que parece data DD/MM/AAAA.
function detectarMascaras(payload: Record<string, unknown>): {
  cpf: string | null;
  dataNascimentoTexto: string | null;
} {
  let cpf: string | null = null;
  let dataNascimentoTexto: string | null = null;

  for (const [chave, valorBruto] of Object.entries(payload)) {
    if (!/^input_mask/i.test(chave)) continue;
    const texto = textoDeValor(valorBruto);
    if (!texto) continue;

    if (!dataNascimentoTexto && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(texto)) {
      dataNascimentoTexto = texto;
      continue;
    }

    const apenasDigitos = texto.replace(/\D/g, "");
    if (!cpf && apenasDigitos.length === 11) {
      cpf = texto;
    }
  }

  return { cpf, dataNascimentoTexto };
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

  const nome = pick(payload, ["names", "Nome_Completo_Visto", "Nome Completo", "nome"]);
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

  const { cpf: cpfDetectado, dataNascimentoTexto } = detectarMascaras(payload);

  const cpf = cpfDetectado ?? pick(payload, ["cpf_visto", "cpf"]);
  const email = pick(payload, ["email", "Email_Visto"]);
  const telefone = pick(payload, ["phone", "Whatsapp", "whatsapp", "telefone"]);
  const endereco = pick(payload, ["address_1", "Address", "endereco", "endereço"]);
  const dataNascimento = parseDataBr(
    dataNascimentoTexto ?? pick(payload, ["Data de Nascimento", "dataNascimento"]),
  );

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
