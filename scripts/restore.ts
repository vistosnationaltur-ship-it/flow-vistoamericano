// Restaura um backup gerado por scripts/backup.ts (ou pelo botão
// "Baixar backup" / e-mail automático) num banco Postgres novo/vazio.
// Uso: npx tsx --env-file=.env scripts/restore.ts caminho/do/backup.json
//
// Ordem de inserção respeita as chaves estrangeiras: Usuario e Grupo
// primeiro (sem dependência), depois Cliente (depende de Grupo), depois
// HistoricoEtapa/Documento/Contrato (dependem de Cliente).
import { readFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";

function data(valor: unknown): Date | null {
  return valor ? new Date(valor as string) : null;
}

async function main() {
  const caminho = process.argv[2];
  if (!caminho) {
    console.error("Uso: npx tsx --env-file=.env scripts/restore.ts caminho/do/backup.json");
    process.exit(1);
  }

  const backup = JSON.parse(readFileSync(caminho, "utf-8"));

  const existentes = await prisma.cliente.count();
  if (existentes > 0) {
    console.error(
      `O banco já tem ${existentes} cliente(s). Esse script é pra restaurar num banco NOVO/VAZIO, ` +
        `pra evitar duplicar ou sobrescrever dados reais. Aborte, esvazie o banco (ou aponte ` +
        `DATABASE_URL pra um banco novo) e rode de novo.`,
    );
    process.exit(1);
  }

  console.log(`Restaurando backup gerado em ${backup.geradoEm}...`);

  for (const u of backup.usuarios ?? []) {
    await prisma.usuario.create({
      data: { ...u, criadoEm: data(u.criadoEm) },
    });
  }
  console.log(`${backup.usuarios?.length ?? 0} usuários restaurados.`);

  for (const g of backup.grupos ?? []) {
    await prisma.grupo.create({
      data: { ...g, dataPagamentoServico: data(g.dataPagamentoServico), criadoEm: data(g.criadoEm) },
    });
  }
  console.log(`${backup.grupos?.length ?? 0} famílias restauradas.`);

  for (const c of backup.clientes ?? []) {
    await prisma.cliente.create({
      data: {
        ...c,
        dataNascimento: data(c.dataNascimento),
        validadePassaporte: data(c.validadePassaporte),
        dataVencimentoVistoAtual: data(c.dataVencimentoVistoAtual),
        dataEntrevista: data(c.dataEntrevista),
        contratoEnviadoEm: data(c.contratoEnviadoEm),
        dataPagamentoMrv: data(c.dataPagamentoMrv),
        dataPagamentoServico: data(c.dataPagamentoServico),
        criadoEm: data(c.criadoEm),
        atualizadoEm: data(c.atualizadoEm),
      },
    });
  }
  console.log(`${backup.clientes?.length ?? 0} clientes restaurados.`);

  for (const h of backup.historico ?? []) {
    await prisma.historicoEtapa.create({
      data: { ...h, criadoEm: data(h.criadoEm) },
    });
  }
  console.log(`${backup.historico?.length ?? 0} registros de histórico restaurados.`);

  for (const doc of backup.documentos ?? []) {
    await prisma.documento.create({
      data: { ...doc, criadoEm: data(doc.criadoEm) },
    });
  }
  console.log(
    `${backup.documentos?.length ?? 0} registros de documento restaurados (só metadados — ` +
      `os arquivos em si precisam estar no Vercel Blob à parte, esse backup não os inclui).`,
  );

  for (const ct of backup.contratos ?? []) {
    await prisma.contrato.create({
      data: { ...ct, enviadoEm: data(ct.enviadoEm) },
    });
  }
  console.log(`${backup.contratos?.length ?? 0} contratos restaurados.`);

  console.log("Restauração concluída.");
}

main()
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
