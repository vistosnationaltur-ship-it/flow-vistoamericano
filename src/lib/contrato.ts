// Dados fixos da CONTRATADA (assessoria de visto americano) — separados
// de propósito da razão social da 2N Travel/ASG Cruz, esse projeto usa
// outra empresa.
const CONTRATADA_NOME = "JANAINA PIRES DOS SANTOS CRUZ";
const CONTRATADA_CNPJ = "48.135.204/0001-66";

type ClienteParaContrato = {
  nome: string;
  cpf: string | null;
  email: string | null;
};

function formatarDataPorExtenso(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export function gerarContratoHtml(cliente: ClienteParaContrato): string {
  const dataAtual = formatarDataPorExtenso(new Date());

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 40px; color: #000; text-align: justify; font-size: 11pt; }
  .header { text-align: center; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
  .subheader { text-align: center; margin-bottom: 20px; }
  .parties-text { margin-bottom: 20px; }
  .clausula-title { font-weight: bold; margin-top: 20px; display: block; text-transform: uppercase; }
  p { margin: 10px 0; }
  .footer-area { margin-top: 40px; font-size: 10pt; color: #333; }
</style>
</head>
<body>
  <div class="header">Termos e Condições Gerais de Prestação de Serviços</div>
  <div class="subheader">Assessoria para Visto Americano</div>

  <div class="parties-text">
    Este documento estabelece as condições gerais aplicáveis à prestação de serviços de assessoria consular oferecida por <strong>${CONTRATADA_NOME}</strong>, inscrita no CNPJ: <strong>${CONTRATADA_CNPJ}</strong>, doravante denominada CONTRATADA, ao cliente <strong>${cliente.nome}</strong>${cliente.cpf ? `, CPF ${cliente.cpf}` : ""}, cujos dados foram qualificados no atendimento digital e vinculados à chave sistêmica desta contratação, doravante denominado CONTRATANTE.
  </div>

  <span class="clausula-title">Cláusula Primeira – Do Objeto e da Autonomia Consular</span>
  <p>1.1. O presente instrumento tem como objeto a prestação de serviços de assessoria e intermediação para a solicitação ou renovação de visto americano de turista. O serviço abrange o auxílio no preenchimento do formulário oficial (DS-160), conferência e organização documental, agendamento e orientações preparatórias.</p>
  <p>1.2. Limitação de Resultado: A CONTRATADA atua exclusivamente como intermediária. A concessão, negação ou exigência de novas entrevistas é de competência exclusiva e soberana das autoridades consulares. A CONTRATADA não possui qualquer poder de influência, interferência ou garantia sobre o resultado do pedido.</p>

  <span class="clausula-title">Cláusula Segunda – Dos Honorários e Taxas Consulares</span>
  <p>2.1. Pelos serviços de intermediação e assessoria consular, o CONTRATANTE pagará à CONTRATADA o valor de honorários previamente acordado e aprovado no orçamento formalizado através dos canais oficiais de comunicação (WhatsApp/E-mail).</p>
  <p>2.2. O pagamento deverá ser realizado via PIX (Chave CNPJ: ${CONTRATADA_CNPJ}), transferência bancária ou link de pagamento gerado em nome da CONTRATADA.</p>
  <p>2.3. O comprovante de pagamento efetivado pelo CONTRATANTE vincula-se automaticamente a este instrumento, servindo como recibo, validação do valor contratado e aceite irrestrito das condições financeiras e operacionais propostas.</p>
  <p>2.4. Irrevogabilidade dos Honorários: Por se tratar de prestação de serviço de meio (assessoria prestada, tempo dedicado e formulários preenchidos), não haverá devolução dos honorários em caso de desistência do CONTRATANTE, perda do agendamento, negativa do visto ou recusa na renovação.</p>
  <p>2.5. Taxas Consulares (MRV): As taxas oficiais recolhidas ao Departamento de Estado Americano são pessoais, intransferíveis e não reembolsáveis em nenhuma hipótese, possuindo validade de 365 dias a partir do pagamento.</p>

  <span class="clausula-title">Cláusula Terceira – Das Obrigações do Contratante</span>
  <p>3.1. É de inteira e exclusiva responsabilidade do CONTRATANTE fornecer informações verdadeiras, exatas e coerentes. A CONTRATADA isenta-se de qualquer responsabilidade criminal, cível ou consular advinda da apresentação de documentos falsos, adulterados ou omissão de dados por parte do solicitante.</p>
  <p>3.2. No dia da entrevista presencial (quando exigida), o CONTRATANTE deverá comparecer munido de todos os documentos ORIGINAIS orientados pela assessoria.</p>
  <p>3.3. Reagendamentos: Alterações de data no CASV ou Consulado devem respeitar o prazo estipulado no sistema oficial. Reagendamentos fora do prazo indicado deverão ser geridos diretamente pelo CONTRATANTE.</p>

  <span class="clausula-title">Cláusula Quarta – Excludentes de Responsabilidade</span>
  <p>4.1. Nos casos de renovação de visto em que há o envio de passaportes via Correios (SEDEX), a CONTRATADA não se responsabiliza por eventuais atrasos, furtos ou extravios, caracterizando-se fato de terceiro. Ocorrendo extravio, o valor do seguro postal será repassado ao CONTRATANTE para custear a emissão de novo passaporte, seguindo a política dos Correios.</p>
  <p>4.2. Caso o passaporte com visto vencido seja extraviado, as regras consulares exigirão nova entrevista presencial, sendo os custos logísticos de responsabilidade do solicitante.</p>
  <p>4.3. Riscos Terceirizados: A CONTRATADA não se responsabiliza por multas ou perdas decorrentes da emissão antecipada de passagens aéreas ou reservas de hotéis feitas pelo CONTRATANTE antes da aprovação final e recebimento físico do passaporte com o visto.</p>

  <span class="clausula-title">Cláusula Quinta – Diretrizes Consulares Específicas</span>
  <p>5.1. Solicitantes menores de 14 anos, mesmo acompanhando pais com visto válido ou em renovação, podem ser obrigados a comparecer presencialmente. Solicitantes com passaportes perdidos ou roubados não se qualificam para isenção de entrevista.</p>

  <span class="clausula-title">Cláusula Sexta – Proteção de Dados (LGPD)</span>
  <p>6.1. Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/18), a CONTRATADA compromete-se a utilizar os dados pessoais e sensíveis do CONTRATANTE única e exclusivamente para execução deste contrato, garantindo o sigilo das informações e o descarte seguro após a conclusão do serviço.</p>

  <span class="clausula-title">Cláusula Sétima – Do Foro e do Aceite Digital</span>
  <p>7.1. As partes elegem o foro da Comarca de São José do Rio Preto - SP, para dirimir quaisquer litígios oriundos deste contrato.</p>
  <p>7.2. O aceite das presentes condições ocorre de forma inequívoca através da confirmação digital nos canais oficiais de atendimento (WhatsApp) e posterior pagamento dos serviços.</p>

  <div class="footer-area">
    <p>Documento gerado eletronicamente em ${dataAtual} e enviado ao e-mail cadastrado (${cliente.email ?? "não informado"}).</p>
  </div>
</body>
</html>
`;
}
