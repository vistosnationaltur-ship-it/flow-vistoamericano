import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Documentos são privados no Vercel Blob (dado sensível: passaporte,
// comprovantes) — essa rota serve o arquivo pra quem já está logado
// no Flow (proxy.ts protege tudo exceto /login e /api/webhook/*).
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const documento = await prisma.documento.findUnique({ where: { id } });
  if (!documento) {
    return new NextResponse("Documento não encontrado.", { status: 404 });
  }

  const resultado = await get(documento.url, { access: "private" });
  if (!resultado) {
    return new NextResponse("Arquivo não encontrado no armazenamento.", { status: 404 });
  }

  return new NextResponse(resultado.stream, {
    headers: {
      "Content-Type": resultado.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${documento.nomeArquivo}"`,
    },
  });
}
