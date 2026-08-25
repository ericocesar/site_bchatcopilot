# Scroll World Hero — Design Spec

**Date:** 2026-08-09
**Status:** Approved (brainstorming phase complete)
**Brief:** `docs/plan/lp_animada.md` (conceito "galáxia de conversas")

## Goal

Substituir o Hero atual da landing do BChat Copilot por um scroll world cinemático de 4 cenas (Chaos → Cluster → Copilot → Product), controlado por GSAP ScrollTrigger + Canvas2D, sem reescrever seções posteriores (Benefits, Features, Pricing, FAQ, Final CTA).

## Architecture

Componente único `<ScrollWorldHero>` montado no lugar do hero atual. Ocupa `100vh × 100vw`, fixo durante o scroll em ~3 viewports de altura via ScrollTrigger pin. Canvas2D em camada absoluta (`position: fixed`, `inset: 0`, `pointer-events: none`, `aria-hidden="true"`). Texto Hero + CTA permanecem em DOM normal acima do canvas (preserva SEO, a11y e clicabilidade).

```
scroll y
  → ScrollTrigger (gsap)
  → progress 0..1 (rAF throttled)
  → createScene.update(progress, dt)
  → canvas draw
```

`progress` é a única fonte de verdade visual. React só gerencia mount/unmount e o flag de reduced-motion.

## Scenes (progress mapping)

| Range | Scene | Behavior |
|-------|-------|----------|
| 0.00–0.20 | **Chaos** | 50 partículas (mensagens) com drift radial lento, opacidade baixa |
| 0.20–0.45 | **Cluster** | partículas agrupam em 4 clusters temáticos (cores distintas) |
| 0.45–0.70 | **Copilot** | linhas Bezier conectam clusters a um núcleo central pulsante |
| 0.70–1.00 | **Product** | núcleo expande, fade-out canvas, fade-in do "produto BChat" (silhueta SVG) |

Texto overlay:
- Headline: visível 0.00–0.45, fade-out 0.45–0.55
- Sub: visível 0.00–0.45, fade-out 0.45–0.55
- CTA "Solicitar demo": visível 0.00–1.00 (sempre clicável)
- Tagline final "Turn every conversation into action.": fade-in 0.85–1.00

## File Structure

```
src/scroll-world/
├── ScrollWorldHero.jsx
├── scrollWorld.css
├── ScrollWorldHero.test.jsx
├── useScrollProgress.js
├── useScrollProgress.test.js
├── useReducedMotion.js
├── useReducedMotion.test.js
├── canvasUtils.js
├── canvasUtils.test.js
└── scene/
    ├── createScene.js
    ├── createScene.test.js
    ├── particles.js
    └── theme.js
```

**Boundaries:**
- `useScrollProgress` → contrato: retorna `{ ref, progress }`, `progress` ∈ [0,1]
- `useReducedMotion` → contrato: retorna `boolean`, atualiza em media query change
- `createScene` → factory pura: `{ state, init, update(progress, dt), draw(ctx), resize(w, h, dpr) }`
- `theme.js` → constantes imutáveis (cores, easing presets, contagem de clusters)

## Tech Stack

- **GSAP 3.x** + `ScrollTrigger` plugin (timeline scroll-driven)
- **Canvas2D** nativo (sem R3F, sem Three.js — peso, LCP mobile)
- **React 19** (já no projeto) para shell
- **Vitest** + jsdom (já configurado) para testes unitários
- Sem novas dependências de build

## Constraints

- Vite + JS (sem TypeScript)
- `npm run check` continua passando (`node --check src/landing.js`)
- Canvas2D pausa quando fora do viewport (IntersectionObserver)
- DPR cap em 2 (evita canvas 4K)
- Resize debounce 150ms
- `pointer-events: none` no canvas (CTA clicável)
- Cleanup completo no unmount (ScrollTrigger.kill + cancelAnimationFrame)
- Sem regressão em Features, Benefits, Pricing, FAQ, Final CTA

## A11y / Performance

- `prefers-reduced-motion: reduce` → renderiza hero estático (logo + headline + CTA), Canvas2D nunca monta
- Canvas com `aria-hidden="true"`
- Headline + CTA em DOM real (leitores de tela leem texto normal)
- Foco do teclado atravessa canvas sem armadilha
- LCP alvo: < 2.5s mobile mid-range (canvas pausa fora do viewport; render inicial não bloqueia)

## Testing Strategy

- `useScrollProgress.test.js`: mock IntersectionObserver + `window.scrollY`, valida progress monotônico 0→1
- `useReducedMotion.test.js`: mock `window.matchMedia`, valida toggle
- `ScrollWorldHero.test.jsx`: valida que com reduced-motion=true não monta `<canvas>`, monta `<h1>`; com reduced-motion=false monta `<canvas>`
- `createScene.test.js`: factory pura — dado `progress=0.5`, posições determinísticas (RNG seeded)
- `canvasUtils.test.js`: `mulberry32(42)` retorna sequência fixa; `resizeCanvas` math correta

Sem testes visuais de pixels. Cobrimos contratos e estado.

## Error Handling

- `draw(ctx)` envolto em try/catch → log warning, para rAF loop, página continua funcional
- Falha ao registrar ScrollTrigger → fallback: render estático (mesmo path de reduced-motion)
- WebGL/Canvas indisponível → `canvas.getContext('2d')` retorna null → fallback estático

## Acceptance Criteria

1. `landing.js` renderiza `<ScrollWorldHero>` no lugar do hero atual
2. Scroll em 3vh de altura percorre as 4 cenas
3. CTA "Solicitar demo" permanece clicável e submete o form existente
4. `prefers-reduced-motion: reduce` → sem canvas, hero estático funcional
5. Canvas fora do viewport → 0 frames desenhados (verificável por spy)
6. `npm run check`, `npm test`, `npm run build` passam sem warnings novos
7. Lighthouse a11y ≥ 95 (a11y do hero não regride)

## Out of Scope

- Reescrita de Benefits, Features, Pricing, FAQ, Final CTA
- Migração para TypeScript
- R3F / Three.js / WebGL
- Versão mobile-first dedicada (mesmo componente, fallback de reduced-motion cobre)
- Analytics tracking do scroll progress (pode entrar em spec futura)
