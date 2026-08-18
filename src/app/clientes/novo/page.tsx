import { criarCliente } from "@/app/actions";

export default function NovoClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Novo cliente</h1>

      <form
        action={criarCliente}
        className="flex flex-col gap-6 rounded-md border border-zinc-200 bg-white p-6"
      >
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-500">Dados pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Nome completo" name="nome" required />
            <Campo label="CPF" name="cpf" />
            <Campo label="E-mail" name="email" type="email" />
            <Campo label="Telefone" name="telefone" />
            <Campo label="Data de nascimento" name="dataNascimento" type="date" />
            <Campo label="Endereço" name="endereco" />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-500">Passaporte</h2>
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Número do passaporte" name="numeroPassaporte" />
            <Campo label="Validade" name="validadePassaporte" type="date" />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-500">Observações</h2>
          <textarea
            name="observacoes"
            rows={3}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </section>

        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Cadastrar cliente
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        className="rounded-md border border-zinc-300 px-3 py-2"
      />
    </label>
  );
}
