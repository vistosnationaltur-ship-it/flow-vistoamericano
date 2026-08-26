import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sessaoAtual } from "@/lib/auth";
import { criarUsuario, excluirUsuario } from "@/app/actions";
import { formatarDataBr } from "@/lib/formatar";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

const CARD = "rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-6";
const CARD_TITLE = "mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";
const SECTION_TITLE = "mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";
const INPUT =
  "rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-base-deep)] px-3 py-2 text-[var(--color-text)] outline-none transition-colors duration-150 ease-out focus:border-[var(--color-accent-focus)] focus:ring-2 focus:ring-[var(--color-accent-ring)]";
const LABEL = "flex flex-col gap-1.5 text-sm";
const LABEL_TEXT = "text-[var(--color-text-subtle)]";
const BTN_PRIMARY =
  "rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-[var(--shadow-accent-rest)] transition-shadow duration-150 ease-out hover:shadow-[var(--shadow-accent-hover)] motion-safe:hover:-translate-y-px motion-safe:transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
const BTN_OUTLINE =
  "inline-flex rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--color-text-subtle)] transition-colors duration-150 ease-out hover:bg-white/5 hover:text-[var(--color-text)]";

export default async function UsuariosPage() {
  const sessao = await sessaoAtual();
  if (sessao?.role !== "ADMIN") redirect("/painel");

  const usuarios = await prisma.usuario.findMany({ orderBy: { criadoEm: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display)] text-[var(--color-text)]">
        Usuários
      </h1>

      <section className={CARD}>
        <h2 className={CARD_TITLE}>Backup</h2>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          Baixa uma cópia de tudo (clientes, famílias, histórico, documentos, contratos e
          usuários) num arquivo JSON — guarde num lugar seguro fora da Vercel de vez em quando.
        </p>
        <a href="/admin/backup" className={BTN_OUTLINE}>
          Baixar backup
        </a>
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Cadastrar novo usuário</h2>
        <form action={criarUsuario} className="flex flex-wrap items-end gap-3">
          <label className={LABEL}>
            <span className={LABEL_TEXT}>Usuário</span>
            <input
              type="text"
              name="username"
              required
              autoCapitalize="off"
              autoCorrect="off"
              className={`w-48 ${INPUT}`}
            />
          </label>
          <label className={LABEL}>
            <span className={LABEL_TEXT}>Senha</span>
            <input type="password" name="senha" required minLength={6} className={`w-48 ${INPUT}`} />
          </label>
          <label className={LABEL}>
            <span className={LABEL_TEXT}>Permissão</span>
            <select name="role" defaultValue="USUARIO" className={`w-40 ${INPUT}`}>
              <option value="USUARIO">Usuário (sem excluir)</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            Cadastrar
          </button>
        </form>
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Usuários cadastrados</h2>
        <ul className="flex flex-col divide-y divide-[var(--color-border-subtle)]">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-[var(--color-text)]">{u.username}</span>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    u.role === "ADMIN"
                      ? "border-[var(--color-accent-border)] bg-[var(--color-accent-surface)] text-[var(--color-accent)]"
                      : "border-[var(--color-border-subtle)] text-[var(--color-text-subtle)]"
                  }`}
                >
                  {u.role === "ADMIN" ? "Administrador" : "Usuário"}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  desde {formatarDataBr(u.criadoEm)}
                </span>
                {u.id !== sessao.id && (
                  <form action={excluirUsuario.bind(null, u.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`Excluir o usuário "${u.username}"? Ele perde o acesso ao sistema imediatamente.`}
                      className="text-xs font-medium text-[var(--color-danger)] transition-colors duration-150 ease-out hover:underline"
                    >
                      Excluir
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
