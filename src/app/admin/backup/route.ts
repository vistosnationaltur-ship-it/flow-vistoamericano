import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await exigirAdmin();
  } catch {
    return new Response("Apenas administradores podem baixar o backup.", { status: 403 });
  }

  const [grupos, clientes, historico, documentos, contratos, usuarios] = await Promise.all([
    prisma.grupo.findMany(),
    prisma.cliente.findMany(),
    prisma.historicoEtapa.findMany(),
    prisma.documento.findMany(),
    prisma.contrato.findMany(),
    prisma.usuario.findMany(),
  ]);

  const geradoEm = new Date().toISOString();
  const backup = { geradoEm, grupos, clientes, historico, documentos, contratos, usuarios };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="backup-flow-visto-americano-${geradoEm.replace(/[:.]/g, "-")}.json"`,
    },
  });
}
