import { criarCliente } from "@/app/actions";
import { CampoData } from "@/components/CampoData";
import { VoltarLink } from "@/components/VoltarLink";

export default function NovoClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <VoltarLink href="/clientes" label="Voltar pra lista de clientes" />
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Novo cliente</h1>

      <form
        action={criarCliente}
        className="flex flex-col gap-8 rounded-2xl border border-white/10 bg-zinc-900/60 p-7"
      >
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-500">Dados pessoais</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Nome completo" name="nome" required />
            <Campo label="CPF" name="cpf" />
            <Campo label="E-mail" name="email" type="email" />
            <Campo label="Telefone" name="telefone" />
            <CampoData label="Data de nascimento" name="dataNascimento" />
            <Campo label="Endereço" name="endereco" />
          </div>
        </section>

        <section className="flex flex-col gap-4 border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold text-zinc-500">Passaporte</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Número do passaporte" name="numeroPassaporte" />
            <CampoData label="Validade" name="validadePassaporte" />
            <CampoData
              label="Vencimento do visto atual (se for renovação)"
              name="dataVencimentoVistoAtual"
            />
          </div>
        </section>

        <section className="flex flex-col gap-2 border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold text-zinc-500">Observações</h2>
          <textarea
            name="observacoes"
            rows={3}
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30"
          />
        </section>

        <button
          type="submit"
          className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
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
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-zinc-400">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30"
      />
    </label>
  );
}
