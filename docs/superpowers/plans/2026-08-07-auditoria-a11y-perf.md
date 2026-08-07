# Auditoria de acessibilidade e performance — BChat Copilot landing (2026-08-07)

Tarefa 11 do plano `2026-08-07-landing-bchat-copilot-conversao.md`. Mede o que as Tarefas 1–9 ainda não tinham medido e corrige três problemas identificáveis por inspeção (favicon, `font-size` de 9 px, dois tokens de contraste). Ambiente: `npm run build && npm run preview` servindo em `http://localhost:4173`, Node v22.22.1, Chrome headless via `@axe-core/cli` e `lighthouse`.

## Correções de código aplicadas antes da medição

1. **Favicon** (`index.html:12`): `<link rel="icon" href="docs/logo.svg" type="image/svg+xml" />` + `<link rel="alternate icon" href="docs/logobchat.png" type="image/png" />`, exatamente como especificado no brief.
2. **`.signal-inner`** (`src/landing.css`): `font-size: 9px` → `11px`, `letter-spacing: .17em` → `.14em`.
3. **Tokens de contraste** (`src/landing.css`, ver seção abaixo): `--muted-2` de `#7d8d9e` para `#8595a6`; `--border-strong` de `rgba(174,205,235,.22)` para `rgba(174,205,235,.45)`.

**Achado crítico sobre o Passo 1 (favicon):** o brief assume que `docs/logo.svg` é mais leve que `docs/logobchat.png` (156 KB). Medido: `docs/logo.svg` tem **301,5 KB** em disco (o triplo do assumido) porque é um SVG exportado com uma imagem raster embutida em base64, não um vetor limpo. No build de produção ele vira `dist/assets/logo-*.svg` = **308,77 KB** (225 KB comprimido, medido via Lighthouse). Pior: como o HTML declara `rel="icon"` (SVG) **e** `rel="alternate icon"` (PNG), o Chrome de teste baixou **os dois arquivos** durante o carregamento (225 KB + 156 KB = 381 KB), quase 2,5× o peso original de 156 KB que o Passo 1 deveria reduzir. A troca foi aplicada por ser exatamente o que o brief pediu, mas **não** cumpre o objetivo de redução de peso — pelo contrário, piora. Ver pendência no fim do documento.

---

## 1. Contraste medido

Método: valores computados programaticamente em Node a partir dos hex/rgba de `src/landing.css`, aplicando a fórmula de luminância relativa do WCAG 2.x e alpha-blending manual para cores translúcidas sobre o fundo real (`--canvas`, `--canvas-soft`, gradientes de card). Script descartável, sem dependências externas. Não usei um color-picker de DevTools ao vivo porque o ambiente de browser disponível não expõe o painel de acessibilidade do Chrome DevTools diretamente — a matemática do WCAG é determinística e não sofre de imprecisão de amostragem de pixel, então o método é equivalente em precisão.

| Par | Contraste | Alvo | Status |
| --- | --- | --- | --- |
| `--muted` `#93a0b3` / `--canvas` `#080b10` | 7,43:1 | 4,5:1 | passa (baseline confirmada) |
| `--muted-2` (antigo `#7d8d9e`) / `--canvas` | 5,80:1 | 4,5:1 | passava, mas com pouca margem em superfícies mais claras |
| `--muted` / `.glass-panel` (`#151e2b`) | 6,32:1 | 4,5:1 | passa |
| `--muted-2` (antigo) / `.glass-panel` | 4,93:1 | 4,5:1 | passava |
| `--muted` / `.pricing-card` (`#0f141d`, bg blendado sobre `--canvas-soft`) | 6,94:1 | 4,5:1 | passa |
| `--muted-2` (antigo) / `.pricing-card` | 5,41:1 | 4,5:1 | passava |
| `--muted` / `.pricing-card.is-featured` (ponto mais claro do gradiente, `#1e2a28`) | 5,57:1 | 4,5:1 | passa |
| **`--muted-2` (antigo) / `.pricing-card.is-featured`** | **4,35:1** | 4,5:1 | **FALHOU** |
| Texto do `.button-ghost` (`var(--text)` `#f2f6fb`) / fundo próprio (`rgba(17,23,33,.65)` sobre `--canvas`) | 17,18:1 | 4,5:1 | passa com folga |
| Texto do `.button-ghost` / fundo próprio sobre `--surface-2` (pior fundo plausível) | 16,24:1 | 4,5:1 | passa com folga |
| **Borda do `.button-ghost` (antigo `--border-strong` `rgba(174,205,235,.22)`) / fundo adjacente** | **1,66:1** | 3:1 | **FALHOU** |
| `.demo-form-privacy` (`--muted-2`, valor antigo) / fundo do `.demo-form` (`#101620`) | 5,34:1 | 4,5:1 | passava |
| `.demo-error` (`--danger` `#ff9b7e`) / fundo do `.demo-form` | 8,86:1 | 4,5:1 | passa com folga |
| Anel de foco (`--lime` `#55dcd0`) / `--canvas`, `--canvas-soft`, `--surface`, `.glass-panel`, `.pricing-card`, fundo do `.demo-form`, fundo do input, fundo do `.button-ghost`, fundo do `.final-cta` | 10,0:1 a 11,8:1 em todas | 3:1 | passa com folga em todas as superfícies onde aparece |

### Correções aplicadas

- **`--muted-2`**: `#7d8d9e` → **`#8595a6`**. Motivo: no ponto mais claro do gradiente do card em destaque (`.pricing-card.is-featured`, usado por `.price-cycle` e outros textos pequenos de 9–11,5 px), o contraste medido era 4,35:1, abaixo do alvo de 4,5:1 para texto normal. Recalculado com o novo valor: 4,82:1 nesse mesmo ponto, 6,42:1 sobre `--canvas`, 6,00:1 sobre `.pricing-card` padrão, 5,47:1 sobre `.glass-panel` — todas as superfícies onde o token aparece passam com margem.
- **`--border-strong`**: `rgba(174,205,235,.22)` → **`rgba(174,205,235,.45)`**. Motivo: a borda do `.button-ghost` é o único indicador de limite do botão — o preenchimento próprio (`rgba(17,23,33,.65)` sobre `--canvas`) tem apenas 1,06:1 de contraste contra o fundo da página, ou seja, é visualmente imperceptível como "boundary". Isso caracteriza falha real do SC 1.4.11 (Non-Text Contrast): a borda é a única pista visual do componente e media 1,66:1, abaixo de 3:1. Com alpha `.45`: 3,19:1 sobre o fundo do header, 3,17:1 sobre um fundo mais claro alternativo — passa com margem pequena mas suficiente.
  - **Efeito colateral positivo, verificado**: `--border-strong` também é usada em `.demo-field input, .demo-field select` (borda dos campos do formulário de demonstração). Essa borda também falhava (1,63:1) e agora passa (3,18:1) — mesma causa raiz, mesma correção, sem edição adicional.
  - **Efeito colateral a observar**: o token também é usado em `.mini-button`, `.process-marker`, `.mobile-menu`, `.proof-quote`. Nenhum desses é um componente interativo primário (mini-button tem `tabindex="-1"` e é puramente decorativo dentro do mockup do hero; process-marker é decorativo; mobile-menu e proof-quote são contêineres, não controles). O aumento de opacidade os deixa com bordas mais visíveis, o que é uma melhoria visual incidental, não uma regressão — mas vale checar visualmente no merge se o peso da borda ficou pesado demais para o gosto do design.

---

## 2. axe-core

Comando: `npx @axe-core/cli http://localhost:4173 --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa` contra o build de produção (`npm run build && npm run preview`, porta 4173). Ferramenta disponível e executada normalmente (rede liberada, Chrome headless funcionando) — nenhuma substituição necessária aqui.

Resultado bruto: **6 violações relatadas em 2 regras**, mas a investigação ao vivo (ver abaixo) reclassifica a maior parte como falso positivo de temporização.

### `color-contrast` (5 ocorrências) — falso positivo confirmado

Elementos apontados: `.window-time`, `.floating-note-one > div > strong`, `.floating-note-one > div > small`, `.floating-note-two > div > strong`, `.floating-note-two > div > small` — todos dentro do mockup decorativo do hero (`.hero-visual`, `aria-hidden="true"`).

O JSON do axe mostra `fgColor` e `bgColor` praticamente idênticos (ex.: `#0a0d12` sobre `#080b10`, contraste 1,01:1) — impossível dado que essas cores no CSS são `var(--muted-2)`/`var(--text)` sobre `.glass-panel` (`#151e2b`), que calculei acima em 5,47:1–15,45:1. Verifiquei ao vivo: `.hero-visual` tem a classe `.reveal` (animação de entrada CSS, `opacity: 0 → 1` em 0,8 s com atraso de até 0,38 s). Inspecionei via `getComputedStyle` os mesmos nós após a animação assentar: `color: rgb(133, 149, 166)` (`#8595a6`, o `--muted-2` já corrigido) sobre `background: rgb(21, 30, 43)` (`#151e2b`, `--glass-solid`) — exatamente os valores esperados, contraste real 5,47:1, dentro do alvo. O axe-core CLI headless claramente amostrou os pixels **durante** a transição de opacidade da animação de entrada, antes dela terminar, capturando texto quase transparente sobre fundo quase transparente. **Conclusão: falso positivo de temporização, não um problema real de contraste.** Não requer correção de código.

### `aria-prohibited-attr` (1 ocorrência) — real, mas transiente

Uma execução apontou `:root` (seletor genérico, indicando que o nó específico já tinha sumido do DOM quando o axe formatou o relatório) e outra apontou precisamente `.pricing-loading`. Código-fonte confirma: `<div class="pricing-loading" aria-label="Carregando planos">…</div>` em `index.html` é um `<div>` sem `role`, portanto `role="generic"` implícito — a ARIA 1.2 proíbe computar nome acessível (`aria-label`) em elementos com `role="generic"`. Essa é a causa real da regra `aria-prohibited-attr`.

**É transiente**: o `<div>` só existe enquanto o carregamento inicial dos planos está pendente; assim que `src/landing.js` substitui o conteúdo (sucesso, vazio ou erro), o nó problemático desaparece. Por isso o Lighthouse (que aguarda a página assentar mais) não capturou essa violação em nenhuma das duas execuções (`aria-prohibited-attr` com `score: 1`, zero itens, tanto no preset desktop quanto mobile) — mas o axe-core CLI, que escaneia mais cedo, capturou a janela em que o `div` ainda estava no DOM.

**Correção recomendada, não aplicada nesta tarefa**: trocar `aria-label` por um elemento com `role` que suporte nome (`role="status"` é o mais correto semanticamente para um indicador de carregamento) — uma alteração de uma linha em `index.html`. Fora do escopo desta tarefa porque o brief e a seção "Code Organization" restringem edições em `index.html` apenas à linha do favicon; registrado como pendência abaixo.

### Verificação manual complementar (achados de código, não capturados por nenhuma ferramenta automatizada)

Fiz uma revisão manual guiada por WCAG além do que axe/Lighthouse cobrem (ambas as ferramentas juntas captam só 20–50% dos problemas de acessibilidade, aviso que o próprio axe-core CLI imprime). Três achados reais, verificados via inspeção de DOM/CSS computado ao vivo, nenhum corrigido nesta tarefa por estarem fora do escopo de arquivos autorizado (`index.html` só a linha do favicon; `landing.css` só `.signal-inner` e tokens de contraste):

1. **Links de `.benefit-card` inalcançáveis por teclado (WCAG 2.1.1 Keyboard).** `.benefit-card .card-link` (`"Ver contexto em ação ↗"`, `"Como funciona ↗"`, `"Onde ele ajuda mais ↗"`) tem `display: none` por padrão e só vira `display: inline-flex` via `:hover` ou `:focus-within` (`src/landing.css`, regra `.benefit-card .card-link` / `.benefit-card:hover .card-link, .benefit-card:focus-within .card-link`). Um elemento `display: none` não pode receber foco (nem clique programático, nem `Tab`), e o link é o **único** descendente focável do card — não existe outro elemento para disparar `:focus-within` primeiro. Resultado: usuários de teclado nunca conseguem alcançar esses três links; só existem para quem usa mouse/hover. Corrigir exige repensar o padrão de revelação (ex.: `visibility`/`opacity` em vez de `display`, ou tornar o link sempre focável com `tabindex` e estilo visualmente oculto até foco) — é um rework do componente, não um ajuste de token, por isso não foi alterado aqui.
2. **Skip link não move o foco para o conteúdo principal (SC 2.4.1, prática recomendada).** `<main id="conteudo">` não tem `tabindex="-1"`. Testado ao vivo: `document.querySelector('#conteudo').focus()` não move `document.activeElement`. Isso significa que ativar o skip link rola a viewport até `#conteudo`, mas **não** move o foco do teclado para lá — o próximo `Tab` do usuário continua a partir de onde estava antes (o próprio skip link), não a partir do conteúdo. O mecanismo de "pular blocos" funciona visualmente mas não funcionalmente para navegação sequencial por teclado. Correção de uma linha (`tabindex="-1"` em `<main id="conteudo">`), fora do escopo de arquivo autorizado.
3. **Header fixo cobre o topo das seções ao navegar por âncora.** Nenhuma seção-alvo (`#beneficios`, `#planos`, etc.) tem `scroll-margin-top`. Testado ao vivo: cliquei no link "Planos" da navegação com o header já em estado `.is-stuck` (fixo, 83 px de altura) — o topo de `#planos` ficou em `y≈0,16px` da viewport, exatamente atrás do header (que ocupa `0–83px`), cobrindo ~83px do início da seção (o eyebrow "PLANOS PUBLICADOS" e parte do H2). Isso vale para toda navegação por âncora (menu desktop, menu mobile, links internos do FAQ/rodapé) sempre que o usuário já rolou a página. Correção de uma regra CSS (`scroll-margin-top: ~96px` nos alvos de âncora ou num seletor compartilhado), fora do escopo de arquivo autorizado desta tarefa.

---

## 3. Teclado, reflow e zoom

### Teclado

Testado com o preview em `http://localhost:4173`, usando uma combinação de `Tab`/`Shift+Tab` reais via automação de browser e `focus()`/eventos de teclado programáticos para isolar comportamento de foco de um bug de mapeamento de coordenadas de clique da própria ferramenta de automação (documentado abaixo).

| Item do checklist | Resultado |
| --- | --- |
| Skip link é o primeiro foco | **Confirmado** por análise estática da ordem de foco real (offsetParent-based, filtrando elementos ocultos): índice 0 de 35 elementos focáveis genuínos na página. Ordem: skip-link → brand → 6 links de nav → CTA do header → botão primário do hero → link de texto do hero → tabs de funcionalidades → … |
| Skip link leva a `#conteudo` | Rola a viewport corretamente (`href="#conteudo"`), **mas não move o foco do teclado** — ver achado #2 acima. |
| Nenhum foco escondido atrás do header sticky | **Falha confirmada** — ver achado #3 acima (mede 83px de sobreposição real). |
| Tabs de funcionalidades respondem a setas, Home e End | **Confirmado ao vivo.** `ArrowRight` disparado no tab "01 Contexto" moveu corretamente o foco e `aria-selected`/`tabindex` para "02 Conhecimento" (roving tabindex implementado corretamente em `src/landing.js`, padrão WAI-ARIA APG). Código também trata `ArrowLeft`/`ArrowUp`/`Home`/`End` de forma simétrica — não testei cada tecla individualmente ao vivo, mas a implementação é uniforme para todas no mesmo handler. |
| `<details>` do FAQ abrem por Enter | Não testado ao vivo (a ferramenta de automação não permitiu foco confiável nessa seção antes do fim do tempo disponível), mas `<details>/<summary>` é um padrão HTML nativo — todo browser moderno abre/fecha por `Enter` (e `Espaço`) sem necessidade de JS, e o código não sobrescreve esse comportamento (`.faq-item summary::-webkit-details-marker { display: none; }` só esconde o marcador nativo, não intercepta teclado). Confiança alta por ser comportamento nativo garantido pela especificação HTML, não por código customizado sujeito a bugs. |
| Campos do formulário alcançáveis na ordem visual; erro move foco ao primeiro campo inválido | **Confirmado ao vivo.** Submeti o formulário vazio via `click()` no botão: `aria-invalid="true"` setado em `name`, `email`, `company`; mensagens de erro (`.demo-error`) visíveis para os três; `document.activeElement` após o submit = `#demo-name` (primeiro campo inválido), confirmando `firstInvalid?.focus()` (`src/landing.js:184`) funciona como esperado. |
| Card de sucesso recebe foco após envio | **Não testável ao vivo neste ambiente** — o endpoint `POST /public/api/v1/bchat/demo_requests` não está no ar (pendência #1 do plano geral), então o formulário sempre cai no caminho de erro (`"O envio automático está indisponível no momento."`, confirmado funcionando corretamente com `role="alert"` na região de status). Verificado por leitura de código: `src/landing.js:218` chama `success.focus()`, e `<div class="demo-success" … tabindex="-1">` tem o `tabindex="-1"` necessário para ser focável programaticamente, mais `.demo-success:focus-visible { outline: … }` no CSS. Implementação parece correta; carece de confirmação end-to-end quando o backend estiver no ar. |

**Nota sobre a ferramenta de automação:** durante os testes, uma única ação de tecla `Tab` na ferramenta de browser usada nesta sessão avançou o foco por ~12 paradas de uma vez (confirmado comparando a posição do elemento focado, índice 11 de 35, contra uma única invocação da ação). Isso é um artefato da ferramenta (não do site) — quando testei via `focus()`/`KeyboardEvent` programático, a ordem de tabulação e o comportamento de `:focus-visible`/CSS corresponderam exatamente ao esperado pela leitura do código. Recomendo uma passada manual real (teclado físico, browser comum) antes de considerar o checklist de teclado 100% fechado, especialmente para o item do `<details>`/Enter que não pude testar ao vivo por falta de tempo de sessão.

### Reflow (320px) e zoom (equivalente a 200%)

Método: em vez de zoom literal do browser (não exposto de forma confiável pela ferramenta de automação disponível), usei a técnica oficial do WCAG 1.4.10 (Reflow) — redimensionar a viewport CSS para 320px de largura, que é matematicamente equivalente a 400% de zoom numa tela de 1280px, um teste **mais rigoroso** que 200%. Complementei com uma segunda medição em 640px (equivalente a 200% numa tela de 1280px) para bater exatamente com o que o brief pediu.

- **320px**: `document.documentElement.scrollWidth === window.innerWidth` (320 = 320) em toda a página — **nenhum scroll horizontal**. `.proof-band`, `.scenarios-grid` (4 cards) e `.demo-form` (4 campos) todos sem overflow (`scrollWidth === clientWidth` em cada).
- **640px**: mesma verificação, `hasHScroll: false`.
- **Texto sobreposto — FALHA CONFIRMADA, medida com precisão.** Nos três `.benefit-card` (seção "Menos procura. Mais presença."), o `<h3>` e o `<p>` se sobrepõem visualmente em telas estreitas: card 1 com 40px de sobreposição vertical, card 2 com 40px, card 3 com 38px em 320px de largura (21px/40px/38px em 640px). Confirmado visualmente por screenshot e numericamente via `getBoundingClientRect()` dos dois elementos em cada card. Causa raiz: `.benefit-card h3` e `.benefit-card p` são posicionados com `position: absolute` ancorados só por `bottom` (sem `top`), e em telas estreitas / modo touch (`@media (hover: none) { .benefit-card p { bottom: 66px; } }`, que mantém o parágrafo sempre deslocado para cima para dar espaço ao link sempre visível) o parágrafo cresce para cima o suficiente para invadir a área do título. **Esse é o tipo de falha que exige reestruturar o esquema de posicionamento do componente (provavelmente trocar de `position: absolute` ancorado por `bottom` para um layout de fluxo normal/flex), não um ajuste de valor — não foi corrigido nesta tarefa** por estar fora do escopo de arquivo autorizado e por ser, na prática, um redesenho de componente, que o brief pede para reportar em vez de tentar sem direção.
- `.scenarios-grid` e `.demo-form`: nenhuma sobreposição ou corte detectado em nenhuma das duas larguras testadas.

---

## 4. Core Web Vitals

Comandos executados exatamente como no brief:
```
npx lighthouse http://localhost:4173 --preset=desktop --output=json --output-path=./lighthouse-desktop.json --chrome-flags="--headless"
npx lighthouse http://localhost:4173 --output=json --output-path=./lighthouse-mobile.json --chrome-flags="--headless"
```
Ambos rodaram sem substituição — Lighthouse disponível via `npx` e rede liberada.

| Métrica | Desktop | Mobile | Alvo (lab) |
| --- | --- | --- | --- |
| Performance score | 96 | 76 | — |
| **LCP** | **1,0 s** (1017 ms) | **4,8 s** (4803 ms) | ≤ 2,5 s |
| **CLS** | 0,0002 | 0,0002 | ≤ 0,1 |
| TBT | 0 ms | 0 ms | — |
| FCP | 1,0 s | 2,6 s | — |
| Speed Index | 1,2 s | 4,5 s | — |
| Peso total transferido | 616 KiB | 616 KiB | — |
| Accessibility (Lighthouse) | 100 | 100 | — |

**Desktop passa nos dois alvos de laboratório. Mobile falha o alvo de LCP por quase o dobro (4,8s vs 2,5s).** CLS passa com folga larga nos dois perfis — nenhum layout shift relevante detectado em nenhuma execução.

### Diagnóstico do LCP mobile — confirma a hipótese do brief

O elemento de LCP em mobile é o texto `"BCHATCOPILOT"` (`.brand-wordmark`, renderizado em `"Good Timing", "Manrope", sans-serif`). O breakdown do Lighthouse (`lcp-breakdown-insight`) mostra `timeToFirstByte: 1.7ms` (servidor local, irrelevante) e **`elementRenderDelay: 2289.9ms`** — quase 2,3 segundos apenas esperando o texto poder ser pintado, tipicamente causado por bloqueio de fonte web sob o throttling de CPU/rede simulado do preset mobile do Lighthouse.

O audit `render-blocking-insight` confirma exatamente os dois suspeitos que o brief já apontava:
- `https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&display=swap` — **1035ms de bloqueio estimado**, é um `<link rel="stylesheet">` síncrono no `<head>` (`index.html:15`), não usa `preload`/`media` assíncrono.
- `dist/assets/index-*.css` — 301ms de bloqueio adicional.
- Estimativa de economia total do Lighthouse: **1.500ms** se esses bloqueios forem removidos do caminho crítico.

**Verificação do peso 600 do Manrope**, exatamente como o brief pediu antes de mexer na query de fontes:
```
grep -n "font-weight: 600" src/landing.css
```
Encontra duas ocorrências: `.desktop-nav a, .mobile-menu a` e `.faq-item summary`. Analisei cada uma:
- `.desktop-nav a, .mobile-menu a` declara `font-family: "Good Timing", "Manrope", sans-serif; font-weight: 600`. Como `"Good Timing"` só define o peso 700 no `@font-face` (`src/landing.css:1-7`) e `font-synthesis: none` está setado globalmente, o algoritmo de casamento de fonte do CSS fica **dentro** da família "Good Timing" (usa o peso 700 disponível mais próximo) e nunca desce para "Manrope" só por causa do peso — a família "Manrope" nunca é usada por esse seletor.
- `.faq-item summary` não declara `font-family`, então herda a pilha padrão do `:root` (`ui-sans-serif, system-ui, …`), que **não inclui Manrope**.
- **Conclusão: nenhum elemento que efetivamente renderiza com a família Manrope usa o peso 600.** A query pode ser reduzida com segurança para `family=Manrope:wght@700;800`, exatamente como o brief sugeriu como fallback. **Não apliquei essa mudança** porque a seção "Code Organization" desta tarefa restringe a única edição permitida em `index.html` à linha do favicon — registrado como pendência abaixo, pronta para aplicar num commit seguinte.

### Peso por recurso (mobile, ordenado por tamanho)

| Recurso | Tamanho transferido |
| --- | --- |
| `assets/logo-*.svg` (favicon, novo) | 225 KB |
| `assets/logobchat-*.png` (favicon, alternate) | 156 KB |
| `assets/good timing bd-*.otf` (fonte custom, não subsetada) | 113 KB |
| `assets/index-*.js` | 66 KB |
| `fonts.gstatic.com/…manrope…woff2` | 24 KB |
| `app.bchat.com.br/public/api/v1/bchat/plans` (API real, respondeu) | 12 KB |
| `assets/index-*.css` | 10 KB |
| `/` (HTML) | 8 KB |
| `fonts.googleapis.com/css2?family=Manrope…` | 1 KB |
| **Total** | **616 KB** |

Note que **os dois arquivos de favicon somados (225 + 156 = 381 KB) são, sozinhos, 62% do peso total da página** — maiores que a fonte custom, o JS e o CSS somados. Isso é consequência direta do achado já registrado no topo deste documento sobre o Passo 1.

### O que foi otimizado nesta tarefa

- Nada relacionado a peso de fonte foi alterado (fora do escopo de arquivo autorizado — ver pendências).
- O único ganho de payload desta tarefa é indireto: nenhum.
- Os dois problemas que o brief antecipou como suspeitos de LCP (Manrope bloqueante, Good Timing não subsetado) foram **confirmados como reais pelos números do Lighthouse**, mas as correções (query de fonte reduzida, subsetting do OTF, ou `preload`/`font-display` mais agressivo) não foram aplicadas por estarem fora do escopo de arquivo desta tarefa. Ver pendências.

---

## Pendências que este documento não fecha

Segue o padrão do plano geral (`docs/superpowers/plans/2026-08-07-landing-bchat-copilot-conversao.md`, seção "Pendências que este plano não fecha") — itens que exigem dados de campo (RUM) ou decisão de escopo/design que este documento de auditoria não pode fechar sozinho:

1. **Favicon mais pesado, não mais leve.** `docs/logo.svg` (301,5 KB, com raster base64 embutido) é maior que `docs/logobchat.png` (156 KB), e com `rel="icon"` + `rel="alternate icon"` o Chrome de teste baixou os dois (381 KB combinados). Decisão necessária: (a) produzir um SVG vetorial real e leve do logo, (b) reverter para só o PNG até haver um SVG leve, ou (c) usar um `.ico`/PNG pequeno dedicado a favicon (16–32px) em vez de reaproveitar o logo de marketing.
2. **`.pricing-loading` com `aria-label` em elemento `role="generic"`** — violação real (não falso positivo) do axe-core, transiente (só existe durante o carregamento inicial dos planos). Fix de uma linha (`role="status"` no lugar de/junto com `aria-label`), fora do escopo de arquivo desta tarefa.
3. **Links de `.benefit-card` inalcançáveis por teclado** (`display: none` como mecanismo de revelação por hover/`:focus-within`) — falha real de WCAG 2.1.1, exige repensar o padrão de revelação do componente (não é ajuste de token).
4. **Skip link não move o foco** (`<main id="conteudo">` sem `tabindex="-1"`) — fix de uma linha, fora do escopo de arquivo desta tarefa.
5. **Header sticky cobre ~83px do topo de qualquer seção-alvo de âncora** — falta `scroll-margin-top` nos alvos. Fix de uma regra CSS, fora do escopo de arquivo desta tarefa.
6. **Texto sobreposto em `.benefit-card` a partir de ~640px de largura para baixo** (título e parágrafo colidem, até 40px de sobreposição medida) — exige reestruturar o posicionamento absoluto do componente, não um ajuste de token. É o achado de maior severidade visual desta auditoria.
7. **Manrope carregado com peso 600 não utilizado** — confirmado por análise de cascata que nenhum elemento renderiza Manrope em 600; query pode cair para `wght@700;800` com segurança. Não aplicado por escopo de arquivo.
8. **Fonte "Good Timing" (113 KB, OTF não subsetado)** segue sem subsetting; provável segunda causa do `elementRenderDelay` de 2,3s no LCP mobile, junto com o link de Manrope bloqueante. Requer ferramenta de subsetting de fonte (ex. `glyphhanger`/`fonttools`), fora do que este ambiente/tarefa cobre.
9. **LCP mobile de laboratório em 4,8s, acima do alvo de 2,5s** — os itens 1, 7 e 8 acima são as causas prováveis, mas nenhuma foi corrigida nesta tarefa por escopo. Precisa de um commit dedicado de performance de fontes/ícone antes de tráfego pago em mobile.
10. **RUM em produção** — LCP, INP e CLS de campo (a auditoria de laboratório usa Chrome headless com throttling simulado; comportamento real de usuários, redes e dispositivos variados não está coberto).
11. **`POST /public/api/v1/bchat/demo_requests`** ainda não está no ar (confirmado nesta sessão: o formulário preenchido corretamente caiu no caminho de erro `"O envio automático está indisponível no momento."`), então o teste ao vivo do foco no card de sucesso após envio bem-sucedido não pôde ser realizado — só verificado por leitura de código.
12. **Passada manual de teclado com dispositivo físico** — a ferramenta de automação de browser usada nesta auditoria mostrou um artefato de avanço de múltiplas paradas de foco por tecla pressionada (documentado na seção de teclado), o que impediu um percurso `Tab` a `Tab` inteiramente confiável em tempo real. A ordem lógica de foco foi verificada estaticamente e bate com o esperado, mas uma confirmação com teclado físico e um browser comum é recomendada antes de considerar o item fechado, especialmente o comportamento de `Enter` no FAQ.
