-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "conteudoHtml" TEXT NOT NULL,
    "authentiqueDocumentId" TEXT,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contrato_clienteId_idx" ON "Contrato"("clienteId");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
