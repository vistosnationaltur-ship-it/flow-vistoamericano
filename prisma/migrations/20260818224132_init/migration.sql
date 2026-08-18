-- CreateEnum
CREATE TYPE "EtapaProcesso" AS ENUM ('CADASTRO', 'RASCUNHO_DS160_SOLICITADO', 'DS160_PREENCHIDO', 'BOLETO_MRV_GERADO', 'PAGAMENTO_MRV', 'AGENDAMENTO_ENTREVISTA', 'ENTREVISTA_REALIZADA', 'VISTO_APROVADO', 'VISTO_NEGADO', 'PASSAPORTE_DEVOLVIDO');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "endereco" TEXT,
    "numeroPassaporte" TEXT,
    "validadePassaporte" TIMESTAMP(3),
    "etapaAtual" "EtapaProcesso" NOT NULL DEFAULT 'CADASTRO',
    "dataEntrevista" TIMESTAMP(3),
    "valorTaxaMrv" DOUBLE PRECISION,
    "dataPagamentoMrv" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoEtapa" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "etapa" "EtapaProcesso" NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpf_key" ON "Cliente"("cpf");

-- CreateIndex
CREATE INDEX "HistoricoEtapa_clienteId_idx" ON "HistoricoEtapa"("clienteId");

-- AddForeignKey
ALTER TABLE "HistoricoEtapa" ADD CONSTRAINT "HistoricoEtapa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
