import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { atualizarDadosCliente } from "@/app/actions";
import { CampoData } from "@/components/CampoData";
import { VoltarLink } from "@/components/VoltarLink";

export default async function EditarClientePage(props: PageProps<"/clientes/[id]/editar">) {
  const { id } = await props.params;

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  const atualizarComId = atualizarDadosCliente.bind(null, cliente.id);

  return (
    <div className="flex flex-col gap-6">
      <VoltarLink href={`/clientes/${cliente.id}`} label="Voltar pra ficha do cliente" />
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Editar cliente</h1>

      <form
        action={atualizarComId}
        className="flex flex-col gap-8 rounded-2xl border border-white/10 bg-zinc-900/60 p-7"
      >
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-500">Dados pessoais</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Nome completo" name="nome" defaultValue={cliente.nome} required />
            <Campo label="CPF" name="cpf" defaultValue={cliente.cpf ?? ""} />
            <Campo label="E-mail" name="email" type="email" defaultValue={cliente.email ?? ""} />
            <Campo label="Telefone" name="telefone" defaultValue={cliente.telefone ?? ""} />
            <CampoData
              label="Data de nascimento"
              name="dataNascimento"
              defaultValue={
                cliente.dataNascimento
                  ? new Date(cliente.dataNascimento).toISOString().slice(0, 10)
                  : ""
              }
            />
            <Campo label="Endereço" name="endereco" defaultValue={cliente.endereco ?? ""} />
          </div>
        </section>

        <section className="flex flex-col gap-4 border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold text-zinc-500">Passaporte</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              label="Número do passaporte"
              name="numeroPassaporte"
              defaultValue={cliente.numeroPassaporte ?? ""}
            />
            <CampoData
              label="Validade"
              name="validadePassaporte"
              defaultValue={
                cliente.validadePassaporte
                  ? new Date(cliente.validadePassaporte).toISOString().slice(0, 10)
                  : ""
              }
            />
            <CampoData
              label="Vencimento do visto atual (se for renovação)"
              name="dataVencimentoVistoAtual"
              defaultValue={
                cliente.dataVencimentoVistoAtual
                  ? new Date(cliente.dataVencimentoVistoAtual).toISOString().slice(0, 10)
                  : ""
              }
            />
          </div>
        </section>

        <button
          type="submit"
          className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Salvar alterações
        </button>
      </form>
    </div>
  );
}

function Campo({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-zinc-400">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30"
      />
    </label>
  );
}
