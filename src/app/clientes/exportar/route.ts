import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { ETAPA_LABEL } from "@/lib/etapas";
import type { EtapaProcesso, Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const etapa = searchParams.get("etapa") ?? "";
  const busca = searchParams.get("busca")?.trim() ?? "";

  const where: Prisma.ClienteWhereInput = {};
  if (etapa) where.etapaAtual = etapa as EtapaProcesso;
  if (busca) {
    where.OR = [
      { nome: { contains: busca } },
      { cpf: { contains: busca } },
      { email: { contains: busca } },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { criadoEm: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Clientes");

  sheet.columns = [
    { header: "Nome", key: "nome", width: 30 },
    { header: "CPF", key: "cpf", width: 16 },
    { header: "E-mail", key: "email", width: 28 },
    { header: "Telefone", key: "telefone", width: 16 },
    { header: "Etapa atual", key: "etapa", width: 24 },
    { header: "Data da entrevista", key: "dataEntrevista", width: 18 },
    { header: "Valor taxa MRV", key: "valorTaxaMrv", width: 16 },
    { header: "Pagamento MRV em", key: "dataPagamentoMrv", width: 18 },
    { header: "Número passaporte", key: "numeroPassaporte", width: 18 },
    { header: "Validade passaporte", key: "validadePassaporte", width: 18 },
    { header: "Cadastrado em", key: "criadoEm", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const cliente of clientes) {
    sheet.addRow({
      nome: cliente.nome,
      cpf: cliente.cpf ?? "",
      email: cliente.email ?? "",
      telefone: cliente.telefone ?? "",
      etapa: ETAPA_LABEL[cliente.etapaAtual],
      dataEntrevista: cliente.dataEntrevista
        ? new Date(cliente.dataEntrevista).toLocaleDateString("pt-BR")
        : "",
      valorTaxaMrv: cliente.valorTaxaMrv ?? "",
      dataPagamentoMrv: cliente.dataPagamentoMrv
        ? new Date(cliente.dataPagamentoMrv).toLocaleDateString("pt-BR")
        : "",
      numeroPassaporte: cliente.numeroPassaporte ?? "",
      validadePassaporte: cliente.validadePassaporte
        ? new Date(cliente.validadePassaporte).toLocaleDateString("pt-BR")
        : "",
      criadoEm: new Date(cliente.criadoEm).toLocaleDateString("pt-BR"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="clientes-flow-visto-americano.xlsx"',
    },
  });
}
