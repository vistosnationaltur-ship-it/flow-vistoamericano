// Integração direta com a API GraphQL do Authentique pra criar o
// documento de assinatura do contrato. Baseado no padrão usado no
// workflow n8n de referência da 2N Travel (createDocument com upload
// multipart), só que chamado direto do Next.js em vez de via n8n.

const AUTHENTIQUE_URL = "https://api.autentique.com.br/v2/graphql";

type CriarDocumentoAssinaturaParams = {
  nomeDocumento: string;
  nomeArquivo: string;
  html: string;
  nomeSignatario: string;
  emailSignatario: string;
};

export async function criarDocumentoAssinatura({
  nomeDocumento,
  nomeArquivo,
  html,
  nomeSignatario,
  emailSignatario,
}: CriarDocumentoAssinaturaParams): Promise<string> {
  const token = process.env.AUTHENTIQUE_API_TOKEN;
  if (!token) {
    throw new Error(
      "Variável AUTHENTIQUE_API_TOKEN não configurada — peça pro administrador do sistema configurar isso.",
    );
  }

  const query = `mutation ($file: Upload!) {
    createDocument(
      document: { name: "${nomeDocumento.replace(/"/g, '\\"')}" }
      signers: [{ name: "${nomeSignatario.replace(/"/g, '\\"')}", email: "${emailSignatario}", action: SIGN }]
      file: $file
    ) { id name }
  }`;

  const operations = JSON.stringify({ query, variables: { file: null } });
  const map = JSON.stringify({ "0": ["variables.file"] });

  const formData = new FormData();
  formData.append("operations", operations);
  formData.append("map", map);
  formData.append(
    "0",
    new Blob([html], { type: "text/html" }),
    `${nomeArquivo}.html`,
  );

  const resposta = await fetch(AUTHENTIQUE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const json = await resposta.json();

  if (!resposta.ok || json.errors) {
    throw new Error(
      `Authentique retornou erro ao criar o documento: ${JSON.stringify(json.errors ?? json)}`,
    );
  }

  return json.data.createDocument.id as string;
}
