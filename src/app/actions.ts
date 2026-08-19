"use server";

import { prisma } from "@/lib/prisma";
import { EtapaProcesso } from "@/generated/prisma/client";
import { proximaEtapa, etapaAnterior } from "@/lib/etapas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function stringOrNull(value: FormDataEntryValue | null): string | null {
  const v = (value ?? "").toString().trim();
  return v === "" ? null : v;
}

function dateOrNull(value: FormDataEntryValue | null): Date | null {
  const v = stringOrNull(value);
  return v ? new Date(v) : null;
}

export async function criarCliente(formData: FormData) {
  const nome = stringOrNull(formData.get("nome"));
  if (!nome) {
    throw new Error("Nome é obrigatório.");
  }

  const cpf = stringOrNull(formData.get("cpf"));
  if (cpf) {
    const existente = await prisma.cliente.findUnique({ where: { cpf } });
    if (existente) {
      throw new Error("Já existe um cliente cadastrado com esse CPF.");
    }
  }

  const cliente = await prisma.cliente.create({
    data: {
      nome,
      cpf,
      email: stringOrNull(formData.get("email")),
      telefone: stringOrNull(formData.get("telefone")),
      dataNascimento: dateOrNull(formData.get("dataNascimento")),
      endereco: stringOrNull(formData.get("endereco")),
      numeroPassaporte: stringOrNull(formData.get("numeroPassaporte")),
      validadePassaporte: dateOrNull(formData.get("validadePassaporte")),
      dataVencimentoVistoAtual: dateOrNull(formData.get("dataVencimentoVistoAtual")),
      observacoes: stringOrNull(formData.get("observacoes")),
      historico: {
        create: { etapa: "CADASTRO" },
      },
    },
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${cliente.id}`);
}

export async function atualizarDadosCliente(clienteId: string, formData: FormData) {
  const nome = stringOrNull(formData.get("nome"));
  if (!nome) {
    throw new Error("Nome é obrigatório.");
  }

  const cpf = stringOrNull(formData.get("cpf"));
  if (cpf) {
    const existente = await prisma.cliente.findUnique({ where: { cpf } });
    if (existente && existente.id !== clienteId) {
      throw new Error("Já existe outro cliente cadastrado com esse CPF.");
    }
  }

  await prisma.cliente.update({
    where: { id: clienteId },
    data: {
      nome,
      cpf,
      email: stringOrNull(formData.get("email")),
      telefone: stringOrNull(formData.get("telefone")),
      dataNascimento: dateOrNull(formData.get("dataNascimento")),
      endereco: stringOrNull(formData.get("endereco")),
      numeroPassaporte: stringOrNull(formData.get("numeroPassaporte")),
      validadePassaporte: dateOrNull(formData.get("validadePassaporte")),
      dataVencimentoVistoAtual: dateOrNull(formData.get("dataVencimentoVistoAtual")),
    },
  });

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
  redirect(`/clientes/${clienteId}`);
}

export async function avancarEtapa(clienteId: string, formData: FormData) {
  const cliente = await prisma.cliente.findUniqueOrThrow({
    where: { id: clienteId },
  });

  const proxima = proximaEtapa(cliente.etapaAtual);
  if (!proxima) {
    throw new Error("Este cliente já está na última etapa do processo.");
  }

  const observacao = stringOrNull(formData.get("observacao"));

  await prisma.cliente.update({
    where: { id: clienteId },
    data: {
      etapaAtual: proxima,
      historico: { create: { etapa: proxima, observacao } },
    },
  });

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
}

export async function voltarEtapa(clienteId: string) {
  const cliente = await prisma.cliente.findUniqueOrThrow({
    where: { id: clienteId },
  });

  const anterior = etapaAnterior(cliente.etapaAtual);
  if (!anterior) {
    throw new Error("Este cliente já está na primeira etapa do processo.");
  }

  await prisma.cliente.update({
    where: { id: clienteId },
    data: {
      etapaAtual: anterior,
      historico: { create: { etapa: anterior, observacao: "Etapa revertida" } },
    },
  });

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
}

export async function marcarVistoNegado(clienteId: string, formData: FormData) {
  const observacao = stringOrNull(formData.get("observacao"));

  await prisma.cliente.update({
    where: { id: clienteId },
    data: {
      etapaAtual: "VISTO_NEGADO",
      historico: { create: { etapa: "VISTO_NEGADO", observacao } },
    },
  });

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
}

export async function definirDataEntrevista(clienteId: string, formData: FormData) {
  const data = dateOrNull(formData.get("dataEntrevista"));

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { dataEntrevista: data },
  });

  revalidatePath(`/clientes/${clienteId}`);
}

export async function definirPagamentoMrv(clienteId: string, formData: FormData) {
  const valorRaw = stringOrNull(formData.get("valorTaxaMrv"));
  const valorTaxaMrv = valorRaw ? Number(valorRaw.replace(",", ".")) : null;
  const dataPagamentoMrv = dateOrNull(formData.get("dataPagamentoMrv"));

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { valorTaxaMrv, dataPagamentoMrv },
  });

  revalidatePath(`/clientes/${clienteId}`);
}

export async function definirNumeroDs160(clienteId: string, formData: FormData) {
  const numeroDs160 = stringOrNull(formData.get("numeroDs160"));

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { numeroDs160 },
  });

  revalidatePath(`/clientes/${clienteId}`);
}

export async function atualizarObservacoes(clienteId: string, formData: FormData) {
  const observacoes = stringOrNull(formData.get("observacoes"));

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { observacoes },
  });

  revalidatePath(`/clientes/${clienteId}`);
}

export async function criarGrupoComCliente(clienteId: string, formData: FormData) {
  const nome = stringOrNull(formData.get("nomeGrupo"));
  if (!nome) {
    throw new Error("Nome da família é obrigatório.");
  }

  const grupo = await prisma.grupo.create({
    data: { nome, clientes: { connect: { id: clienteId } } },
  });

  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/grupos/${grupo.id}`);
}

export async function entrarNoGrupo(clienteId: string, formData: FormData) {
  const grupoId = stringOrNull(formData.get("grupoId"));
  if (!grupoId) {
    throw new Error("Selecione uma família.");
  }

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { grupoId },
  });

  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/grupos/${grupoId}`);
}

export async function sairDoGrupo(clienteId: string) {
  await prisma.cliente.update({
    where: { id: clienteId },
    data: { grupoId: null },
  });

  revalidatePath(`/clientes/${clienteId}`);
}

export async function atualizarFinanceiroGrupo(grupoId: string, formData: FormData) {
  const valorRaw = stringOrNull(formData.get("valorServico"));
  const valorServico = valorRaw ? Number(valorRaw.replace(",", ".")) : null;
  const dataPagamentoServico = dateOrNull(formData.get("dataPagamentoServico"));
  const observacoesFinanceiras = stringOrNull(formData.get("observacoesFinanceiras"));

  await prisma.grupo.update({
    where: { id: grupoId },
    data: { valorServico, dataPagamentoServico, observacoesFinanceiras },
  });

  revalidatePath(`/grupos/${grupoId}`);
}

export type { EtapaProcesso };
