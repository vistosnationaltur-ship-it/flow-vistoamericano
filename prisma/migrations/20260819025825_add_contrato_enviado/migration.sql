-- AlterEnum
ALTER TYPE "EtapaProcesso" ADD VALUE 'CONTRATO_ENVIADO';

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "contratoEnviadoEm" TIMESTAMP(3);
