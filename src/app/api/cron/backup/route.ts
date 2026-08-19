import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.BACKUP_EMAIL_TO;
  if (!resendApiKey || !destinatario) {
    return new Response(
      "RESEND_API_KEY ou BACKUP_EMAIL_TO não configurados.",
      { status: 500 },
    );
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
  const conteudo = JSON.stringify(backup, null, 2);

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: "Flow Visto Americano <onboarding@resend.dev>",
    to: destinatario,
    subject: `Backup diário — Flow Visto Americano (${geradoEm.slice(0, 10)})`,
    text: `Backup automático gerado em ${geradoEm}.\n\n${clientes.length} clientes, ${grupos.length} famílias, ${historico.length} registros de histórico, ${documentos.length} documentos, ${contratos.length} contratos, ${usuarios.length} usuários.`,
    attachments: [
      {
        filename: `backup-flow-visto-americano-${geradoEm.slice(0, 10)}.json`,
        content: Buffer.from(conteudo).toString("base64"),
      },
    ],
  });

  if (error) {
    return new Response(`Erro ao enviar e-mail: ${JSON.stringify(error)}`, { status: 500 });
  }

  return new Response("Backup enviado.", { status: 200 });
}
