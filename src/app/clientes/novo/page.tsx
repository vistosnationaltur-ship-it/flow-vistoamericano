import { criarCliente } from "@/app/actions";
import { CampoData } from "@/components/CampoData";
import { VoltarLink } from "@/components/VoltarLink";

const INPUT =
  "rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-deep)] px-3 py-2 text-[var(--color-text)] outline-none transition-colors duration-150 ease-out focus:border-[var(--color-accent-focus)] focus:ring-2 focus:ring-[var(--color-accent-ring)]";
const BTN_PRIMARY =
  "self-start rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-[var(--shadow-accent-rest)] transition-shadow duration-150 ease-out hover:shadow-[var(--shadow-accent-hover)] motion-safe:hover:-translate-y-px motion-safe:transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";

export default function NovoClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <VoltarLink href="/clientes" label="Voltar pra lista de clientes" />
      <h1 className="text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display)] text-[var(--color-text)]">
        Novo cliente
      </h1>

      <form
        action={criarCliente}
        className="flex flex-col gap-8 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-7"
      >
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Dados pessoais
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Nome completo" name="nome" required />
            <Campo label="CPF" name="cpf" />
            <Campo label="E-mail" name="email" type="email" />
            <Campo label="Telefone" name="telefone" />
            <CampoData label="Data de nascimento" name="dataNascimento" className={INPUT} />
            <Campo label="Endereço" name="endereco" />
          </div>
        </section>

        <section className="flex flex-col gap-4 border-t border-[var(--color-border-subtle)] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Passaporte
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Número do passaporte" name="numeroPassaporte" />
            <CampoData label="Validade" name="validadePassaporte" className={INPUT} />
            <CampoData
              label="Vencimento do visto atual (se for renovação)"
              name="dataVencimentoVistoAtual"
              className={INPUT}
            />
          </div>
        </section>

        <section className="flex flex-col gap-2 border-t border-[var(--color-border-subtle)] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Observações
          </h2>
          <textarea name="observacoes" rows={3} className={`${INPUT} text-sm`} />
        </section>

        <button type="submit" className={BTN_PRIMARY}>
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
      <span className="text-[var(--color-text-subtle)]">
        {label}
        {required && <span className="text-[var(--color-danger)]"> *</span>}
      </span>
      <input type={type} name={name} required={required} className={INPUT} />
    </label>
  );
}
