import { login } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <form
        action={login}
        className="flex w-full max-w-sm flex-col gap-4 rounded-md border border-zinc-200 bg-white p-8"
      >
        <h1 className="text-lg font-semibold">Flow Visto Americano</h1>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Senha de acesso</span>
          <input
            type="password"
            name="senha"
            required
            autoFocus
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
