export const SESSION_COOKIE = "flow_visto_session";

export function senhaCorreta(senha: string): boolean {
  return senha === process.env.AUTH_PASSWORD;
}

export function sessaoValida(token: string | undefined): boolean {
  return !!token && !!process.env.AUTH_SECRET && token === process.env.AUTH_SECRET;
}
