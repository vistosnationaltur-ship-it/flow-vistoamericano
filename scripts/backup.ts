import { writeFileSync, mkdirSync } from "node:fs";
import { prisma } from "@/lib/prisma";

async function main() {
  const [grupos, clientes, historico, documentos, contratos, usuarios] = await Promise.all([
    prisma.grupo.findMany(),
    prisma.cliente.findMany(),
    prisma.historicoEtapa.findMany(),
    prisma.documento.findMany(),
    prisma.contrato.findMany(),
    prisma.usuario.findMany(),
  ]);

  const backup = {
    geradoEm: new Date().toISOString(),
    grupos,
    clientes,
    historico,
    documentos,
    contratos,
    usuarios,
  };

  mkdirSync("backups", { recursive: true });
  const nomeArquivo = `backups/backup-${backup.geradoEm.replace(/[:.]/g, "-")}.json`;
  writeFileSync(nomeArquivo, JSON.stringify(backup, null, 2));

  console.log(`Backup salvo em ${nomeArquivo}`);
  console.log(
    `grupos: ${grupos.length}, clientes: ${clientes.length}, historico: ${historico.length}, documentos: ${documentos.length}, contratos: ${contratos.length}, usuarios: ${usuarios.length}`,
  );
}

main()
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
