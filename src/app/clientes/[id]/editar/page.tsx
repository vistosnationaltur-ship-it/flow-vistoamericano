import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { atualizarDadosCliente } from "@/app/actions";

export default async function EditarClientePage(props: PageProps<"/clientes/[id]/editar">) {
  const { id } = await props.params;

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  const atualizarComId = atualizarDadosCliente.bind(null, cliente.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Editar cliente</h1>

      <form
        action={atualizarComId}
        className="flex flex-col gap-6 rounded-md border border-zinc-200 bg-white p-6"
      >
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-500">Dados pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Nome completo" name="nome" defaultValue={cliente.nome} required />
            <Campo label="CPF" name="cpf" defaultValue={cliente.cpf ?? ""} />
            <Campo label="E-mail" name="email" type="email" defaultValue={cliente.email ?? ""} />
            <Campo label="Telefone" name="telefone" defaultValue={cliente.telefone ?? ""} />
            <Campo
              label="Data de nascimento"
              name="dataNascimento"
              type="date"
              defaultValue={
                cliente.dataNascimento
                  ? new Date(cliente.dataNascimento).toISOString().slice(0, 10)
                  : ""
              }
            />
            <Campo label="Endereço" name="endereco" defaultValue={cliente.endereco ?? ""} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-500">Passaporte</h2>
          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Número do passaporte"
              name="numeroPassaporte"
              defaultValue={cliente.numeroPassaporte ?? ""}
            />
            <Campo
              label="Validade"
              name="validadePassaporte"
              type="date"
              defaultValue={
                cliente.validadePassaporte
                  ? new Date(cliente.validadePassaporte).toISOString().slice(0, 10)
                  : ""
              }
            />
          </div>
        </section>

        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="rounded-md border border-zinc-300 px-3 py-2"
      />
    </label>
  );
}
