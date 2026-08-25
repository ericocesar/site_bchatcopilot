# Audit — BChat Copilot Landing

> Relatório gerado por `/impeccable audit` em 2026-08-11, contra o HEAD de `develop` (7dacd7c). Escopo: [landing.js](src/landing.js), [landing.css](src/landing.css), [index.html](index.html), [App.jsx](src/App.jsx), [motion-footer.jsx](src/components/ui/motion-footer.jsx), [motion-footer.css](src/components/ui/motion-footer.css), [react-shell.css](src/react-shell.css), [landing-content.js](src/content/landing-content.js).
>
> Nota de integridade: os dois achados mais severos (P0 crash de runtime, P1 hero vazio) foram confirmados ao vivo no browser, não só por leitura de código. Build (`npm run build`), `node --check` e 41 testes Vitest passam.

## Anti-Patterns Verdict

**Fail (2/4) — traços pesados de estética de IA.** O design não é um template regurgitado, mas carrega 3 traços notáveis e 1 problema crítico:

1. **O hero não tem nenhum visual.** O CSS da cena `.hero-product-*` (linhas 261–523) **não tem markup correspondente** em `index.html`. O lado direito do fold é preto vazio. Este é o modo de falha de [brand imagery](reference/brand.md) — o elemento mais visível da landing lê como "inacabado", não desenhado.
2. **Grid de cards homogênea** (ban compartilhado): benefícios (3 cards), cenários (4 cards), planos (3 cards) usam a mesma receita símbolo + título + parágrafo + link.
3. **Kickers em caps minúsculos repetidos** (ban de brand): "ENTENDE/ORIENTA/EXECUTA", "COMO FUNCIONA", "ONDE ELE AJUDA MAIS", "PLANOS PUBLICADOS", "DÚVIDAS FREQUENTES", "PRÓXIMO PASSO", além do "O PRÓXIMO PASSO" do footer — usados como gramática de seção.
4. **Travessões (em dashes) por todo o copy** (ban compartilhado): `landing.js:75,97,101`, `index.html:101`, vários itens de FAQ. A skill impeccable bane `—` explicitamente.

O sistema de cores (teal/lime sobre grafite), a combinação Manrope + Good Timing e a textura deliberada de micro-tipografia são genuinamente distintivos — esses não são traços de IA.

---

## Audit Health Score

| # | Dimensão | Nota | Achado-chave |
|---|-----------|-------|-------------|
| 1 | Acessibilidade | 1/4 | Dialog de cenário: sem mover foco para dentro, sem focus trap, dialog nunca anunciado; sem anel de foco nos cards de cenário |
| 2 | Performance | 1/4 | `renderProof()` lança `ReferenceError` → **planos presos no skeleton para sempre**; hero sem visual; footer `position:fixed` em viewport cheia sobre a página; 335,8 KB de JS (116 KB gzip) para uma landing |
| 3 | Responsive | 2/4 | Sobreposição de 42px de texto nos benefit cards em mobile (pior que a auditoria anterior); várias violações de touch target de 44px; sem scroll horizontal |
| 4 | Theming | 3/4 | Sistema de tokens sólido + dark mode + reduced-motion; valores hard-coded vazam no footer, `#7d8d9e`/`#3b4757` nos window dots do hero, `#08100a` nas pills do footer |
| 5 | Anti-Patterns | 2/4 | 3 traços de IA + em dashes + falha de imagery no hero (ver veredito) |
| **Total** | | **9/20** | **Poor (major overhaul)** |

Faixa de nota: 6–9 = Poor (major overhaul). Duas dimensões em 1/4 e juntas produzem o pior sintoma: o núcleo interativo da página está quebrado.

---

## Executive Summary

- **Audit Health Score: 9/20 (Poor)**
- **Issues encontradas: 12** (P0×1, P1×6, P2×4, P3×1)
- **Issues críticas (top 5):**
  1. **[P0] Crash de runtime no load da página** — `fitStatements is not defined` em [landing.js:268](src/landing.js:268) lança dentro de `renderProof()`, chamada antes de `loadPlans()` em `init()` → a **seção de planos nunca renderiza**. Verificado ao vivo: grid preso no skeleton "Carregando planos" para sempre.
  2. **[P1] Dialog de cenário falha WCAG 4.1.2 + 2.1.2** — ao abrir, o foco permanece no card de fundo; não há focus trap, então Tab escapa para a página atrás de um modal inerte.
  3. **[P1] Hero vazio** — o visual de produto do lado direito inteiro está sem markup, deixando metade do fold em preto.
  4. **[P1] Footer cinemático cobre a página** — `.cinematic-footer` é `position: fixed; height: 100vh`; apenas o clip-path do wrapper o mantém no lugar. O footer também desenha texto gigante de `17rem` + marquee de `38s` + animações infinitas de câmera/drop-shadow no load, mesmo estando ~6000px abaixo do fold.
  5. **[P1] Cards de cenário sem indicador de foco visível** — `role="button"` + `tabindex="0"` mas `outline: none` no `:focus` → usuários de teclado não veem onde o foco está.
- **Próximos passos recomendados:** corrigir o bug de import primeiro (fix de maior alavancagem: destrava a seção de planos inteira), depois o foco do dialog, depois o hero vazio, depois o restante.

---

## Detailed Findings

### [P0] `fitStatements` is not defined — planos nunca renderizam
- **Local**: [landing.js:268](src/landing.js:268); import em [landing.js:3](src/landing.js:3)
- **Categoria**: Performance (funcional)
- **Impacto**: `renderProof()` lança em todo load, então `init()` morre antes de `loadPlans()`. A seção inteira de planos, o toggle de billing e os cards ficam em branco para sempre (verificado: `.pricing-loading` skeleton persiste indefinidamente). Esta é a superfície de conversão principal para compradores B2B.
- **Padrão**: n/a (correção de runtime)
- **Recomendação**: adicionar `fitStatements` ao import de `landing-content.js` na linha 3.
- **Nota**: regressão desde a auditoria de 2026-08-07 — a página costumava renderizar planos corretamente.

### [P1] Dialog de cenário falha WCAG 4.1.2 (Name, Role, Value) + 2.1.2 (No Keyboard Trap)
- **Local**: [landing.js:277-312](src/landing.js:277); markup em [index.html:153-169](index.html:153)
- **Categoria**: Acessibilidade
- **Impacto**: Ao abrir, o foco permanece no card gatilho (verificado). O foco do teclado pode passar para trás do modal (sem trap). Leitores de tela não são informados de que o foco mudou (o `aria-modal` está setado, mas nada recebe foco dentro do dialog). Fechar + CTA são os únicos elementos focáveis; os 4 itens de cenário são `<article>` inertes. Escape funciona (verificado).
- **WCAG**: 4.1.2 (name/role/value — o foco deve entrar em um dialog modal), 2.1.2 (no keyboard trap — a falha inversa aqui: nada prende o foco *dentro* do dialog)
- **Recomendação**: em `openDialog`, chamar `closeBtn.focus()` (ou o painel do dialog com `tabindex="-1"`); adicionar um trap de Tab/Shift+Tab (nativo via `inert` no fundo quando suportado, ou handler de keydown); restaurar o foco no gatilho ao fechar (já feito); dar a cada item de cenário um `tabindex="0"` + `role="button"` de verdade (ou um botão real) para que as 4 seções do dialog sejam alcançáveis.
- **Comando sugerido**: `/impeccable craft scenario-dialog-a11y` ou `/impeccable harden`

### [P1] Cards de cenário sem indicador de foco visível
- **Local**: [landing.css:227](src/landing.css:227) (`.scenario-card` — `outline: none`), JS em [landing.js:300-307](src/landing.js:300)
- **Categoria**: Acessibilidade
- **Impacto**: Verificado: o foco pousa no card (`activeElement` = `.scenario-card`), mas `getComputedStyle` mostra `outline: none`, sem `box-shadow`. Usuários de teclado ficam com foco invisível — falha WCAG 2.4.7 (Focus Visible).
- **WCAG**: 2.4.7
- **Recomendação**: `.scenario-card:focus-visible { outline: 2px solid var(--lime); outline-offset: 3px; }` (segue a linguagem de foco existente do site).
- **Comando sugerido**: `/impeccable adapt`

### [P1] Hero vazio — nenhum visual de produto renderizado
- **Local**: [index.html:67-84](index.html:67) (seção hero), vs. CSS órfão [landing.css:261-523](src/landing.css:261)
- **Categoria**: Anti-Pattern (imagery / performance)
- **Impacto**: Verificado: `heroHasAnyVisual: false`. A cena `.hero-product-*`, órbitas, shots, sheens — ~260 linhas de CSS animado — não têm DOM correspondente. A metade direita do fold é `--canvas` vazio. O register de brand exige imagery nesta superfície. Além disso, o plano do hero em canvas scroll-world em `docs/` não está implementado, então não há conceito ativo de hero.
- **Padrão**: Requisito de imagery do register de brand
- **Recomendação**: (a) restaurar o markup `.hero-product-*` para o qual o CSS foi escrito (chat window + product shot + sheen), ou (b) remover o CSS morto. De qualquer forma, o fold precisa de um visual real. Nota: `.hero-copy` fica sobre espaço vazio a 51% de largura ≤1100px; o texto corre longo contra nada.
- **Comando sugerido**: `/impeccable shape hero` → `/impeccable craft hero`

### [P1] Footer cinemático cobre a página; camada fixa em viewport cheia carrega com animação pesada
- **Local**: [motion-footer.css:12-28](src/components/ui/motion-footer.css:12) (`position: fixed; inset: auto 0 0; height: 100vh`)
- **Categoria**: Performance
- **Impacto**: O elemento `.cinematic-footer` mede `height: 100vh` e está no topo da viewport mesmo em scrollY 0; apenas o `clip-path: polygon(...)` do wrapper o mascara. Texto gigante de `17rem`, marquee de `38s`, heartbeat infinito e animações scrub de GSAP são criados no load mesmo com o footer ~6000px abaixo do fold. Custo invisível em toda visita, e uma fragilidade: qualquer ancestral com `overflow` (ex.: `react-shell` `.is-blog-route .page-shell`) tira o clip. Também confirmado: `cinematic-footer-giant-text` usa gradiente de texto — ban absoluto do impeccable ([motion-footer.css:68-71](src/components/ui/motion-footer.css:68)).
- **Padrão**: n/a (perf)
- **Recomendação**: restringir a camada fixa ao próprio wrapper (`overflow: clip` no wrapper não funciona para `position: fixed`; usar `position: sticky; bottom: 0` ou `position: absolute` dentro de um bloco `position: relative` de altura cheia, deixando o wrapper cuidar do layout). Condicionar a entrada/marquee/beat a `prefers-reduced-motion` (parcialmente feito) e adiar a criação até o footer chegar perto da viewport.
- **Comando sugerido**: `/impeccable optimize` depois `/impeccable harden`

### [P1] Sobreposição título/parágrafo nos benefit cards em mobile (42px)
- **Local**: [landing.css:140](src/landing.css:140) (`.benefit-card h3 { bottom: 130px }` + `@media (hover: none) { .benefit-card p { bottom: 80px } }`); layout absoluto ancorado só por `bottom`
- **Categoria**: Responsive
- **Impacto**: Verificado a 375px: a borda inferior do título e o topo do parágrafo se sobrepõem em **42px** (pior que os 40px registrados na auditoria de 08-07). Texto ilegível. É o rework apontado na auditoria anterior, ainda não tratado.
- **Padrão**: WCAG 1.4.10 (Reflow, texto sem sobreposição)
- **Recomendação**: converter `.benefit-card` de posicionamento absoluto ancorado por `bottom` para coluna flex (kicker → título → símbolo → parágrafo → link) para que o card cresça naturalmente em larguras estreitas.
- **Comando sugerido**: `/impeccable adapt`

### [P2] Dialog modal nunca é anunciado a leitores de tela
- **Local**: [index.html:153](index.html:153) + [landing.js:285-291](src/landing.js:285)
- **Categoria**: Acessibilidade
- **Impacto**: `role="dialog"` + `aria-modal="true"` existem, mas o foco nunca entra no dialog, então o nome acessível computado (`aria-labelledby="scenario-dialog-title"`) nunca é realmente anunciado ao abrir. Usuários de leitor de tela não percebem que um modal abriu. O overlay começa `hidden` e o `aria-hidden` é alternado com rAF — mas nada recebe foco no dialog, então o SR lê como nada.
- **WCAG**: 4.1.2
- **Recomendação**: mover o foco para dentro do dialog ao abrir (ver P1 do dialog); considerar `aria-describedby` para o painel. O `aria-label="Fechar"` do botão de fechar está ok.
- **Comando sugerido**: `/impeccable harden`

### [P2] Header sticky cobre alvos de âncora (~83px)
- **Local**: [landing.css:45](src/landing.css:45) `scroll-behavior: smooth`; nenhum `scroll-margin-top` em lugar algum
- **Categoria**: Acessibilidade / Responsive
- **Impacto**: Verificado: todos os 5 alvos de âncora reportam `scroll-margin-top: 0px`, com o header fixo a 83px. Navegar via menu, links do footer ou `#contato` enterra o eyebrow + heading da seção sob o header. (Achado da auditoria anterior ainda aberto.)
- **WCAG**: 2.4.1 (bypass blocks, boa prática)
- **Recomendação**: adicionar `scroll-margin-top: ~96px` nos alvos `[id]` de seção (ou numa regra compartilhada `.section[id], .final-cta[id]`).
- **Comando sugerido**: `/impeccable adapt`

### [P2] `<main id="conteudo">` sem `tabindex="-1"` — skip link não move o foco
- **Local**: [index.html:66](index.html:66)
- **Categoria**: Acessibilidade
- **Impacto**: O skip link rola até `#conteudo` mas não move o foco do teclado (verificado: `tabindex` é `null`); o próximo Tab continua do skip link, não do conteúdo. Achado da auditoria anterior ainda aberto.
- **WCAG**: 2.4.1
- **Recomendação**: adicionar `tabindex="-1"` em `<main id="conteudo">`.
- **Comando sugerido**: `/impeccable adapt`

### [P2] Texto minúsculo abaixo do conforto WCAG: 8–10px em vários elementos
- **Local**: [landing.css:105](src/landing.css:105) (`visual-label` 10px), [landing.css:140](src/landing.css:140) (`capability-card > span` 8px/7px em mobile, `pricing-footnote` 8px, `feature-tab span` 9px), [motion-footer.css](src/components/ui/motion-footer.css) (`kicker` 10px)
- **Categoria**: Acessibilidade / Responsive
- **Impacto**: Embora as taxas de contraste passem (verificado pela auditoria de 08-07 com os tokens atualizados `--muted-2`/`--border-strong`), texto de 8–10px está no piso (ou abaixo) da legibilidade para muitos usuários, especialmente os labels de 7px dos capability cards em mobile. Não é falha dura de WCAG (contraste é o critério mensurável), mas é uma lacuna real de legibilidade na superfície de marketing.
- **Recomendação**: elevar a micro-tipografia para ≥11px em labels interativos/essenciais; footnote de 8px é aceitável apenas como genuinamente terciário.
- **Comando sugerido**: `/impeccable typeset`

### [P3] CSS `.hero-product-*` morto se não for reaproveitado
- **Local**: [landing.css:261-523](src/landing.css:261)
- **Categoria**: Performance / Theming
- **Impacto**: ~260 linhas de CSS animado sem markup correspondente. Se o visual não for restaurado, é peso morto (e fonte de confusão — o plano do scroll-world em docs referencia arquivos diferentes). Liga ao P1 do hero vazio.
- **Recomendação**: restaurar o visual do hero OU remover o CSS. De qualquer forma, o hero precisa de um conceito implementado.
- **Comando sugerido**: `/impeccable optimize`

---

## Patterns & Systemic Issues

1. **Três modais/overlays de navegação, cada um feito à mão, nenhum completo.** Menu mobile, comparação de planos, dialog de cenário reimplementam foco/`hidden`/scroll-lock em `landing.js`. Apenas a comparação de planos e o dialog de cenário setam `aria-expanded`/`aria-hidden`; o dialog é o único que perde o gerenciamento de foco por completo. Esta é a lacuna sistêmica de a11y.
2. **Dois footers construídos de forma independente.** O `site-footer` do `index.html` tem CSS morto em `landing.css` (`.site-footer`, `.footer-*` nunca aplicados desde que `App.jsx` renderiza apenas o footer cinemático). Dois sistemas de footer duplicados = tokens de theming inconsistentes e CSS não usado.
3. **Layout baseado em posicionamento que resiste mal à escala de texto.** `.benefit-card` e os visuais do hero dependem de âncoras absolutas `bottom:`; essa é a raiz da falha de sobreposição e é frágil sob `prefers-reduced-motion`/zoom.
4. **Conteúdo oculto atrás de autorização, mas caminhos de código assumem que existe.** `clientLogos`/`testimonials` estão vazios e `final-cta-proof` fica `hidden`, mas `fitStatements` (o fallback) não é importado — o caminho de conteúdo vazio é o que de fato crasha.

---

## Positive Findings

- **Sistema de tokens forte**: tokens de design consistentes, tema escuro com `--canvas` em `#080b10` (não preto puro), bordas tingidas, anéis de foco-visible em `--lime` em tudo que é interativo. `prefers-reduced-motion` é tratado em `landing.css` e no footer.
- **Contraste genuinamente sólido**: os fixes de tokens da auditoria de 08-07 se sustentam (`--muted-2 #8595a6`, `--border-strong .45`); o anel de foco mede 10–11,8:1 em todas as superfícies onde aparece.
- **O JS de planos em vanilla é defensivo e bem estruturado**: `validatePlansPayload`, `normalizePlan`, `escapeHtml`, cache com stale-while-revalidate, timeout de `AbortController`. Quando o crash for corrigido, esta seção é de nível de produção.
- **Tabs com roving tabindex, `<details>` nativo, `role="alert"` no status do formulário, `aria-invalid` + foco no primeiro erro no formulário de demonstração**: tudo implementado corretamente e verificado na auditoria anterior.
- **Build/testes limpos**: `node --check`, 41 testes Vitest e `vite build` passam.

---

## Recommended Actions

1. **[P0] Corrigir o import de `fitStatements`** — uma linha; destrava a seção de planos inteira. Corrigir direto (adicionar `fitStatements` em [landing.js:3](src/landing.js:3)).
2. **[P1] `/impeccable harden`** — gerenciamento de foco do dialog de cenário (mover foco para dentro, trap de Tab, manter retorno de foco), anel focus-visible nos cards de cenário, `<main tabindex="-1">`, `scroll-margin-top`.
3. **[P1] `/impeccable shape` → `/impeccable craft hero`** — restaurar ou reconceber o hero vazio (e reconciliar o CSS `.hero-product-*` morto com o plano do scroll-world em docs).
4. **[P1] `/impeccable optimize`** — footer cinemático (destravar a camada de viewport cheia, condicionar a animação pesada do load), depois re-rodar Lighthouse para LCP/CLS em mobile.
5. **[P1] `/impeccable adapt`** — reestruturar `.benefit-card` de absoluto para flex para eliminar a sobreposição de 42px; verificar touch targets ≥44px nos botões pequenos/links de footnote.
6. **[P2] `/impeccable typeset`** — elevar micro-tipografia de 8–10px para ≥11px.
7. **`/impeccable polish`** — passada final após o acima (repetição de kickers, varredura de travessões, limpeza do `site-footer`/`footer-*` morto).

> Re-rodar `/impeccable audit` após os fixes para ver a nota subir.
