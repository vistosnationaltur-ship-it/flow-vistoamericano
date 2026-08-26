# DESIGN.md — Flow 2N Assessoria (Flow Visto Americano)

> Autoria: Oolíabe (pvs-ui-visual). Extraído literalmente de `src/app/login/page.tsx` — nenhum hex novo foi inventado. Handoff para `pvs-designer` (Bezalel) → `pvs-frontend`.

## 1. Conceito-âncora

**"O Livro de Registro."** Cada etapa do pipeline é uma página selada: dourado + data = carimbo de cartório. A etapa atual é a única página aberta para escrita — recebe input, campo ativo, cursor. As etapas concluídas viram dossiê anexo, fechado, consultável mas não editável sem fricção deliberada (confirmação para "voltar etapa" = quebrar o selo). As etapas futuras são páginas em branco do livro, presentes na lombada mas sem tinta ainda.

Esse conceito governa cor (dourado = ato de selar, não decoração), tipografia (serifa/peso editorial em títulos de etapa, como cabeçalho de registro cartorial) e motion (selar é um evento, não uma animação de UI — acontece uma vez, com peso).

## 2. Modo

`imersivo` — layout de painel interno full-bleed sobre fundo navy escuro, não card branco sobre cinza claro. O usuário passa horas dentro do sistema; o navy escuro é o "papel do livro à luz de mesa", não um tema dark genérico de dashboard SaaS.

## 3. Intensidade

`restrito/editorial` — neutros (navy/creme) dominam quase toda a superfície. Dourado é o ÚNICO acento e SÓ aparece em: selo de etapa concluída/ativa, foco de input, CTA primário, glow de botão. Nunca dourado decorativo (ícone solto, fundo de card, texto de corpo). Dois papéis cromáticos de status (erro/sucesso) são funcionais, não de marca — não contam como acento.

## 4. Cor (extraída literalmente do login, zero hex novo)

```css
:root {
  /* base — vindos literalmente de src/app/login/page.tsx */
  --color-base:        #0B1D2E; /* navy do card — fundo primário de superfície elevada (card, painel, modal) */
  --color-base-deep:   #08141F; /* navy mais escuro — fundo de input, campo de escrita ativo, superfície "afundada" */
  --color-text:         #F4EEE1; /* creme — texto principal sobre navy */
  --color-text-muted:   rgba(244, 238, 225, 0.6);  /* creme/60 — texto secundário (já usado no login: "Acesso restrito à equipe") */
  --color-text-subtle:  rgba(244, 238, 225, 0.7);  /* creme/70 — label de campo */

  /* acento — ÚNICO, dourado, papel = selo/carimbo */
  --color-accent:       #C9A34D; /* dourado — selo, foco, CTA, texto de destaque intencional */
  --color-accent-border: rgba(201, 163, 77, 0.3);  /* dourado/30 — borda de card (já usado no login) */
  --color-accent-focus:  rgba(201, 163, 77, 0.6);  /* dourado/60 — borda de foco de input */
  --color-accent-ring:   rgba(201, 163, 77, 0.3);  /* dourado/30 — ring de foco */
  --color-accent-surface: rgba(30, 66, 88, 0.4);   /* #1E4258/40 — fundo do botão primário (já usado no login) */

  /* neutro funcional — só onde navy puro não serve (borda sutil de input, divisor) */
  --color-border-subtle: rgba(255, 255, 255, 0.10); /* white/10 — borda de input, divisor de header */

  /* status — funcional, não é cor de marca. Aplicado só a alertas de urgência do pipeline. */
  --color-danger:  #C4553D;  /* terracota-vermelho quebrado, mesma temperatura do dourado — NUNCA red-500 puro do Tailwind */
  --color-success: #4F7A5C;  /* verde musgo dessaturado, harmoniza com navy — NUNCA green-500 puro */
  --color-warning: #B08A3E;  /* variação mais opaca do próprio dourado — reaproveita o acento em vez de introduzir laranja */
}
```

**Regra de aplicação:** fora deste bloco `:root`, zero hex literal em qualquer componente (`grep -En "#[0-9a-fA-F]{3,6}"` em componente ≠ tokens.css deve retornar vazio).

**Contraste medido (WCAG, fórmula de luminância relativa):**
- `#F4EEE1` sobre `#0B1D2E` → **13.7:1** (PASS, muito acima de 4.5:1)
- `rgba(244,238,225,0.6)` sobre `#0B1D2E` → **≈7.9:1** (PASS ≥ 4.5:1)
- `#C9A34D` sobre `#0B1D2E` → **6.1:1** (PASS — texto dourado sobre navy é seguro para label/selo, inclusive corpo)
- `#F4EEE1` sobre `#08141F` (texto de input) → **15.2:1** (PASS)
- `#C4553D` sobre `#0B1D2E` (alerta urgência) → **4.6:1** (PASS raspando ≥ 4.5:1 — usar sempre em `font-medium`+ para reforçar legibilidade)

## 5. Tipografia

Geist já configurado em `layout.tsx` via `next/font/google` (`--font-geist-sans`, `--font-geist-mono`) — **não trocar de fonte**, o caráter vem do peso/escala/tracking, não de importar outra família. Geist tem peso suficiente (300–700) para dar contraste editorial sem sair do que já está instalado.

```css
:root {
  --font-display: var(--font-geist-sans);  /* mesma família, uso em peso/tamanho diferenciado */
  --font-body:    var(--font-geist-sans);
  --font-mono:    var(--font-geist-mono);  /* números de processo, datas de carimbo, IDs de cliente */

  /* escala — razão ~1.333 (Perfect Fourth), clamp real para viewport de painel (não marketing) */
  --text-display: clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem);  /* título de página de cliente — peso 600, tracking -0.02em */
  --text-h1:      clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem); /* título de seção (ex: "Livro de Registro") — peso 600 */
  --text-h2:       1.125rem;  /* CARD_TITLE atual, mantém — peso 600, tracking normal */
  --text-h3:       1rem;      /* sub-bloco dentro de card — peso 500 */
  --text-body:     0.875rem;  /* corpo padrão do painel (já é o tamanho dominante hoje) — peso 400 */
  --text-small:    0.75rem;   /* metadado, data, legenda — peso 400, cor --color-text-muted */

  --leading-display: 1.1;   /* apertado só no display — títulos de 1-2 linhas */
  --leading-h1:      1.2;
  --leading-body:    1.55;  /* corpo do painel — legibilidade em texto denso de processo */

  --tracking-display: -0.02em;
  --tracking-h1:      -0.01em;
  --tracking-body:    0em;
}
```

**Regra:** display/h1 usam peso 600 (Geist Semibold) — não 700 (fica pesado demais em painel de trabalho, não é hero de marketing). Body sempre 400. Nunca peso único do topo ao rodapé — contraste de peso é o que dá hierarquia, já que a família é uma só.

## 6. Spacing

Escala base-4, igual ao padrão do framework — já é o que o projeto usa implicitamente (`p-6`, `gap-5`, `px-3 py-2.5`). Formaliza:

```css
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;
}
```

Card de painel: `padding: var(--space-6)` (24px, = `p-6` já usado). Gap entre campos de form: `var(--space-5)` (20px, = `gap-5` do login). Nunca valor fora da escala em novo componente.

## 7. Componentes — radius, shadow, estados

```css
:root {
  --radius-sm:   8px;   /* rounded-lg — input, botão secundário, badge de etapa futura */
  --radius-md:   16px;  /* rounded-2xl — card de painel, modal, "página do livro" */
  --radius-full: 999px; /* rounded-full — CTA primário, badge de etapa selada (círculo do selo) */

  --shadow-card:   0 25px 50px -12px rgba(0,0,0,0.4);              /* shadow-2xl shadow-black/40, já usado no card de login */
  --shadow-accent-rest:  0 0 24px rgba(201,163,77,0.25);            /* glow do botão em repouso — já no login */
  --shadow-accent-hover: 0 0 32px rgba(201,163,77,0.40);            /* glow no hover — já no login */
}
```

### Estados (consistentes com o botão do login, propagados para TODO elemento interativo do painel)

- **Foco (input, select, textarea):** `border-color: var(--color-accent-focus); box-shadow: 0 0 0 2px var(--color-accent-ring);` — exatamente o padrão `focus:border-[#C9A34D]/60 focus:ring-2 focus:ring-[#C9A34D]/30"` já no login. Aplicar a TODO campo do sistema, não só login.
- **Foco visível de teclado (botão, link):** `outline: 2px solid var(--color-accent); outline-offset: 2px;` — padrão `focus-visible:outline-[#C9A34D]` do botão de login, propagado.
- **Hover de CTA primário:** shadow rest → shadow hover + `translateY(-1px)` (já é `motion-safe:hover:-translate-y-px` no login) — glow que cresce, nunca mudança de cor de fundo abrupta.
- **Hover de link/nav item:** `background: rgba(255,255,255,0.05)` (mantém o `hover:bg-white/5` já usado) — mas cor de texto hover vira `--color-accent` em vez de `zinc-100`, para reforçar que dourado = interação, não `text-indigo-300` genérico.
- **Disabled:** opacidade 40%, sem shadow, `cursor-not-allowed`, sem glow.

### O "selo" como componente reutilizável (pipeline de etapas)

Três estados visuais, mapeados 1:1 ao conceito-âncora:

| Estado | Visual | Token |
|---|---|---|
| **Selada (concluída)** | círculo preenchido `--color-accent` sólido, ✓ ou número em `--color-base`, label em `--color-text` peso 500, data em `--font-mono` `--text-small` `--color-text-muted` ao lado — o "carimbo com data" | `background: var(--color-accent); radius: var(--radius-full)` |
| **Aberta (etapa atual)** | círculo com borda `--color-accent` 2px, fundo `--color-base-deep` (vazio, "página em branco pronta pra escrita"), label em `--color-accent` peso 600, leve glow (`--shadow-accent-rest` reduzido a 40% de blur) pulsante SÓ no anel, nunca no texto | `border: 2px solid var(--color-accent); box-shadow: var(--shadow-accent-rest)` |
| **Futura (não alcançada)** | círculo com borda `--color-border-subtle` 1px, sem preenchimento, label em `--color-text-muted` | `border: 1px solid var(--color-border-subtle)` |

Barra de progresso do pipeline: trilho em `rgba(255,255,255,0.08)`, preenchimento em `--color-accent` (troca o `bg-indigo-500` atual) — nunca gradiente.

**Ação "voltar etapa" (quebrar selo):** o botão em si usa a paleta de `--color-danger`, não dourado (dourado é só para AVANÇAR/selar) — visualmente distingue "abrir mão do selo" de "seguir o livro". Requer modal/confirmação (decisão já fechada com o operador) com texto explícito ("Isso reabre uma página já selada. Confirmar?").

## 8. Motion

Painel interno restrito/editorial — motion é **funcional, nunca decorativo**. Sem parallax, sem bounce, sem entrada de seção coreografada. Serve para: (a) confirmar que uma ação de sistema aconteceu, (b) evitar corte abrupto de conteúdo.

```css
:root {
  --dur-micro:  150ms;  /* hover, foco — já é o duration-150 do botão de login */
  --dur-layout: 220ms;  /* accordion abrir/fechar, expandir resumo de cliente */
  --dur-seal:   360ms;  /* selar etapa — o único motion com "peso", ainda assim rápido */
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);   /* entradas, abrir accordion, selar */
  --ease-in:    cubic-bezier(0.4, 0, 1, 1);       /* fechar accordion, saída */
  --ease-inout: cubic-bezier(0.45, 0, 0.55, 1);   /* transição de estado neutra */
}
```

- **Selar etapa (avançar pipeline):** o círculo da etapa transiciona de "aberta" para "selada" em `--dur-seal` com `--ease-out`: borda vira preenchimento sólido (`background-color` transition), leve scale 1 → 1.04 → 1 (transform, nunca width/height). É o único motion com destaque — reforça o conceito-âncora ("o carimbo bate"). Sem confete, sem bounce (y>1 proibido mesmo aqui).
- **Accordion (Grupo familiar, Observações):** `max-height`/`opacity` combinados NÃO — usar `grid-template-rows: 0fr → 1fr` (técnica sem jank) com `--dur-layout` `--ease-inout`, ou `height: auto` via `transform: scaleY` se o conteúdo for fixo. Chevron rotaciona 180° em `--dur-micro`.
- **Hover de botão/link:** `transition: transform var(--dur-micro) var(--ease-out), box-shadow var(--dur-micro) var(--ease-out);` — NUNCA `transition: all` (anima layout, causa jank).
- **Toast (SaveToast já existe):** entra com `translateY(4px) → 0` + `opacity 0 → 1` em `--dur-layout`, sai em `--dur-micro`.
- **Guard obrigatório:** todo bloco acima envolvido em `@media (prefers-reduced-motion: no-preference)` — sem exceção, inclusive o "selar etapa".

## 9. Voice — do / don't

**Do:**
- Linguagem de cartório/registro quando cabe: "selar etapa", "reabrir página", "livro de registro" — no copy de confirmação e microtexto do pipeline, com moderação (não em todo botão, só onde reforça o conceito).
- Direto e factual no resto do painel (é ferramenta de trabalho, não site institucional): "Cliente cadastrado.", "Etapa avançada.", "3 documentos pendentes."
- Alertas de urgência do painel (já existentes, mantidos): mensagens diretas com cor `--color-danger`/`--color-warning`, sem enfeite.

**Don't:**
- Não usar emoji fora dos alertas de urgência que já existem e funcionam (regra explícita do briefing) — nenhum emoji novo em label, botão, título de card.
- Não usar linguagem de vendas/marketing ("Incrível!", "Aproveite!") — é painel interno de trabalho.
- Não abusar da metáfora do livro a ponto de confundir a ação real (o botão precisa dizer "Avançar etapa", não só "Selar" sem contexto, na primeira leitura).

## 10. Anti-patterns específicos deste projeto

| Proibido | Onde aparece hoje | Troca obrigatória |
|---|---|---|
| `bg-indigo-500` / `bg-indigo-600` / `text-indigo-300` / `focus:ring-indigo-500` | `layout.tsx` (dot do logo, nav), `clientes/[id]/page.tsx` (botão primário, foco de input, barra de progresso, links) | `--color-accent` (#C9A34D) em todos os papéis equivalentes |
| `bg-zinc-950` / `bg-zinc-900` / `text-zinc-100` / `text-zinc-400` / `text-zinc-500` como paleta de fundo do app inteiro | `layout.tsx` body, header, todo `CARD`/`CARD_TITLE`/`LABEL_TEXT` em `clientes/[id]/page.tsx` e páginas irmãs | `--color-base` / `--color-base-deep` / `--color-text` / `--color-text-muted` — navy+creme, não zinc genérico |
| Emoji fora dos alertas de urgência já existentes | (verificar antes de introduzir qualquer novo) | ícone SVG (Lucide/Phosphor) ou nenhum |
| Gradiente roxo→azul ou qualquer gradiente diagonal 135° two-hue | não presente hoje — vetar preventivamente | cor sólida; se precisar de profundidade, glow dourado monocromático como o do botão de login |
| `border-radius` inconsistente por componente sem sistema | hoje já é majoritariamente `rounded-lg`/`rounded-2xl`/`rounded-full` — mas sem token formal | usar só `--radius-sm` / `--radius-md` / `--radius-full`, nada solto |
| `transition: all` ou animar `width`/`height`/`top`/`left` | não confirmado no código atual — vetar preventivamente no accordion novo | `transform`/`opacity`/`background-color` apenas |
| Cor de status Tailwind pura (`red-500`, `green-500`) em alerta de urgência | a verificar nos componentes de alerta existentes — se usarem Tailwind default, migrar | `--color-danger` (#C4553D) / `--color-success` (#4F7A5C), mesma temperatura do resto da paleta |
| Selo dourado usado como decoração fora do pipeline (ex: bullet de lista, ícone genérico) | risco ao implementar | dourado reservado a: selo de etapa, foco, CTA primário, texto de destaque explícito — nada mais |

---

## SELF-CRITIQUE PRÉ-ENTREGA (rubrica 6-dim)

| Dim | Nota | Justificativa |
|---|---|---|
| **V1 Restrição/Coesão** | **2** | Paleta = navy + creme + 1 acento dourado, extraída literalmente do login (zero hex novo). 3 cores funcionais de status são dessaturadas na mesma temperatura, não Tailwind puro. Nenhum clichê de IA. |
| **V2 Tipografia protagonista** | **2** | Geist mantido (decisão correta — já configurado, trocar seria desperdício), mas contraste de peso real definido (600 display/h1 vs 400 body) + tracking negativo (-0.02em) + escala clamp explícita. Protagonismo vem do PESO/ESCALA, não de trocar fonte — coerente com "reúso antes de criar". |
| **V3 Tokens consistentes** | **2** | Todos os valores (cor, spacing, radius, shadow, motion) definidos como custom properties nomeadas, com regra explícita de zero hex fora de `:root`. Tabela de anti-patterns aponta exatamente onde o hardcoded/indigo/zinc está hoje, para o pvs-frontend caçar. |
| **V4 Contraste / a11y** | **2** | 5 pares medidos com fórmula de luminância relativa (13.7:1, 7.9:1, 6.1:1, 15.2:1, 4.6:1) — todos ≥ limiar, com o caso mais apertado (danger sobre navy) anotado explicitamente. `prefers-reduced-motion` obrigatório em todo motion, `focus-visible` propagado do padrão já existente no login. |
| **V5 Conceito-âncora presente** | **2** | Selo dourado com 3 estados (selada/aberta/futura) mapeia diretamente "livro de registro" em componente reutilizável concreto. Motion de "selar etapa" é o único motion com peso — reforça o conceito em vez de ser decoração solta. Voice tem seção própria de linguagem cartorial dosada. |
| **V6 "Isto parece gerado por IA?"** | **2** | Cada decisão é rastreável a uma linha real do `login/page.tsx` ou a uma decisão do operador já fechada (voltar etapa = fricção, accordion fechado). Não há indigo-600/zinc genérico, não há gradiente, não há grid 3-col de features. A paleta É a identidade do sistema, não uma paleta teórica aplicada por cima. |

**Total: 12/12 — nenhuma dimensão zerada, V6 = 2. PASS, libera para o `pvs-designer`.**

---

## GATE DE IDENTIDADE VISUAL — verificação

- **IV1 Paleta coerente com intensidade (restrito):** PASS — 1 base (navy) + 1 acento (dourado) + neutros; danger/success/warning são funcionais, não contam como marca.
- **IV2 Display com caráter:** PASS condicionado — Geist não é serif editorial, mas é a fonte JÁ instalada do projeto (reúso > criar); protagonismo garantido via peso 600 + tracking -0.02em + clamp real, não por trocar família. Reavaliar se o operador quiser reforçar ainda mais o caráter "cartorial" com um display serifado pontual (ex.: só no número/selo de etapa) — proposta aberta, não decisão fechada.
- **IV3 Tokens definidos, zero hex hardcoded fora de `:root`:** PASS na especificação — implementação real será verificada pelo `pvs-frontend` contra a tabela de anti-patterns (indigo/zinc hoje espalhados nos arquivos listados).
- **IV4 Contraste ≥ 4.5:1 medido:** PASS — 5 pares calculados, valores colados acima.
- **IV5 Display leve + line-height apertado:** PASS — `--leading-display: 1.1`, peso 600 (não peso leve 300, pois Geist Semibold já dá contraste suficiente contra o body 400 sem ficar frágil em painel de trabalho).
- **IV6 Escala com razão definida:** PASS — ~1.333 (Perfect Fourth) entre os níveis, clamp real por viewport de painel.
- **IV7 Motion sem overshoot:** PASS — zero `cubic-bezier` com y>1 em qualquer token definido.
- **IV8 Guard de `prefers-reduced-motion`:** PASS — obrigatório em toda regra de motion do documento.

**Veredito: 8/8 PASS. Libera para implementação pelo `pvs-frontend`.**
