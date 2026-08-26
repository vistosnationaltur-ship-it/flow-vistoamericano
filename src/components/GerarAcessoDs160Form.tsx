"use client";

import { useActionState } from "react";
import { gerarAcessoDs160 } from "@/app/actions";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

export function GerarAcessoDs160Form({ clienteId, temCpf }: { clienteId: string; temCpf: boolean }) {
  const acaoComId = gerarAcessoDs160.bind(null, clienteId);
  const [estado, formAction, pendente] = useActionState(acaoComId, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <ConfirmSubmitButton
        confirmMessage={
          temCpf
            ? "Gerar acesso ao Rascunho DS160 e enviar o link por WhatsApp? A senha de login do cliente vai ser o CPF dele."
            : "Esse cliente não tem CPF cadastrado — o CPF é a senha de login do Rascunho DS160. Cadastre o CPF antes de gerar o acesso."
        }
        disabled={pendente}
        className="w-fit rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-surface)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors duration-150 ease-out hover:border-[var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        {pendente ? "Gerando..." : "Gerar acesso Rascunho DS160"}
      </ConfirmSubmitButton>
      {estado?.erro && <p className="text-sm text-[var(--color-danger)]">{estado.erro}</p>}
      {estado?.aviso && <p className="text-sm text-[var(--color-warning)]">{estado.aviso}</p>}
    </form>
  );
}
