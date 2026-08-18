# Flow Visto Americano

Sistema de acompanhamento do processo de assessoria de visto americano de
turista: cadastro de cliente e pipeline de etapas (Cadastro → DS-160 →
Pagamento MRV → Agendamento → Entrevista → Resultado → Passaporte devolvido).

Projeto separado do [2ntravel-crm](../2ntravel-crm) — mesma stack (Next.js +
Prisma), mas base de código e banco independentes.

## Rodando localmente

```bash
npm install
npx prisma migrate dev   # cria/atualiza dev.db (SQLite local)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O banco (`dev.db`) é
local e não sincroniza entre computadores (mesmo padrão do 2ntravel-crm).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Prisma 7 (novo client generator `prisma-client`) + adapter
  `@prisma/adapter-better-sqlite3` — SQLite local por enquanto, decisão de
  deploy/nuvem fica pra depois.
