import { login } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <form
        action={login}
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-[#C9A34D]/30 bg-[#0B1D2E] p-8 shadow-2xl shadow-black/40"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C9A34D] text-xs font-semibold text-[#C9A34D]">
            2N
          </span>
          <h1 className="text-lg font-semibold text-[#F4EEE1]">Flow 2N Assessoria</h1>
          <p className="text-sm text-[#F4EEE1]/60">Acesso restrito à equipe</p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#F4EEE1]/70">Usuário</span>
          <input
            type="text"
            name="username"
            required
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            className="rounded-lg border border-white/10 bg-[#08141F] px-3 py-2.5 text-[#F4EEE1] outline-none transition-colors focus:border-[#C9A34D]/60 focus:ring-2 focus:ring-[#C9A34D]/30"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#F4EEE1]/70">Senha</span>
          <input
            type="password"
            name="senha"
            required
            className="rounded-lg border border-white/10 bg-[#08141F] px-3 py-2.5 text-[#F4EEE1] outline-none transition-colors focus:border-[#C9A34D]/60 focus:ring-2 focus:ring-[#C9A34D]/30"
          />
        </label>
        <button
          type="submit"
          className="rounded-full border border-[#C9A34D] bg-[#1E4258]/40 px-4 py-2.5 text-sm font-semibold text-[#C9A34D] shadow-[0_0_24px_rgba(201,163,77,0.25)] transition-shadow duration-150 ease-out hover:shadow-[0_0_32px_rgba(201,163,77,0.4)] motion-safe:hover:-translate-y-px motion-safe:transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A34D]"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
