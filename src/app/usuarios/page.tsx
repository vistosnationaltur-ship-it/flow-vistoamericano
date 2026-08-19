import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sessaoAtual } from "@/lib/auth";
import { criarUsuario, excluirUsuario } from "@/app/actions";
import { formatarDataBr } from "@/lib/formatar";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

const INPUT =
  "rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30";
const LABEL = "flex flex-col gap-1.5 text-sm";
const LABEL_TEXT = "text-zinc-400";

export default async function UsuariosPage() {
  const sessao = await sessaoAtual();
  if (sessao?.role !== "ADMIN") redirect("/painel");

  const usuarios = await prisma.usuario.findMany({ orderBy: { criadoEm: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Usuários</h1>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <h2 className="mb-1 text-sm font-semibold text-zinc-500">Backup</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Baixa uma cópia de tudo (clientes, famílias, histórico, documentos, contratos e
          usuários) num arquivo JSON — guarde num lugar seguro fora da Vercel de vez em quando.
        </p>
        <a
          href="/admin/backup"
          className="inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
        >
          Baixar backup
        </a>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Cadastrar novo usuário</h2>
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
            <input
              type="password"
              name="senha"
              required
              minLength={6}
              className={`w-48 ${INPUT}`}
            />
          </label>
          <label className={LABEL}>
            <span className={LABEL_TEXT}>Permissão</span>
            <select name="role" defaultValue="USUARIO" className={`w-40 ${INPUT}`}>
              <option value="USUARIO">Usuário (sem excluir)</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Cadastrar
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Usuários cadastrados</h2>
        <ul className="flex flex-col divide-y divide-white/5">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-zinc-200">{u.username}</span>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    u.role === "ADMIN"
                      ? "bg-indigo-500/15 text-indigo-300"
                      : "bg-zinc-500/15 text-zinc-300"
                  }`}
                >
                  {u.role === "ADMIN" ? "Administrador" : "Usuário"}
                </span>
                <span className="text-xs text-zinc-500">
                  desde {formatarDataBr(u.criadoEm)}
                </span>
                {u.id !== sessao.id && (
                  <form action={excluirUsuario.bind(null, u.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`Excluir o usuário "${u.username}"? Ele perde o acesso ao sistema imediatamente.`}
                      className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline"
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
