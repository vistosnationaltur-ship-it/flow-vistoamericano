import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, lerTokenSessao } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (lerTokenSessao(token)) {
    return NextResponse.next();
  }

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api/webhook|_next/static|_next/image|favicon.ico).*)"],
};
