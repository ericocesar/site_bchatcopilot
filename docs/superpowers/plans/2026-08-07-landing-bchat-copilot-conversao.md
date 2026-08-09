# Landing BChat Copilot — Atualização de Conversão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a landing do BChat Copilot de vitrine institucional em página orientada a conversão, com um CTA dominante (`Solicitar demonstração`), captura real de lead, prova social autorizada, pricing coerente e correção dos dois bugs funcionais da seção de planos.

**Architecture:** A landing continua sendo uma composição HTML estática (`index.html`) com comportamento em `src/landing.js` e estilo em `src/landing.css`. A mudança arquitetural é extrair a lógica pura hoje presa dentro do IIFE de `landing.js` para módulos ES importáveis em `src/lib/`, tornando-a testável por unidade, e centralizar todo conteúdo dependente de autorização comercial em `src/content/landing-content.js`. O checkout direto sai da página; o funil passa a terminar em um formulário inline de demonstração que fala com um endpoint público novo do BChat.

**Tech Stack:** HTML + CSS + JavaScript ESM sob Vite 7. React 19 permanece apenas para a rota `/blog`. Testes com Vitest (ambiente `node`, sem jsdom — os módulos extraídos são puros e recebem `fetch` por injeção).

## Decisões de produto já tomadas (Fase 0 do spec — fechada)

| Decisão | Resposta |
| --- | --- |
| CTA principal | `Solicitar demonstração` — dominante em header, hero, cards de plano, FAQ e CTA final |
| Destino do lead | Formulário inline na própria página → `POST /public/api/v1/bchat/demo_requests` (endpoint novo, contrato definido na Tarefa 2) |
| Planos | **Todos os planos incluem o Copilot.** O diferencial comercial é a quantidade de créditos/documentos de Copilot inclusos. Não existe selo "Inclui Copilot" |
| Checkout direto | Removido da landing nesta versão |
| Prova social | Autorizados: **logos de clientes** e **depoimento com nome e cargo**. Arquivos e texto entram via `src/content/landing-content.js` |

## Global Constraints

Todas as tarefas herdam estas regras.

- Idioma de toda a copy visível: **pt-BR**.
- **Um único CTA dominante:** `Solicitar demonstração`. Nenhum outro rótulo de ação compete com ele (`Ir para checkout`, `Falar com o time` como CTA primário, `Começar teste` estão proibidos nesta versão).
- **Proibido publicar métrica, percentual, logo, nome de cliente, depoimento, selo ou garantia** que não venha de `src/content/landing-content.js`. Conteúdo ausente faz o bloco se ocultar — nunca preencher com exemplo fictício.
- **Nunca consumir `/super_admin/*`.** Somente `/public/api/v1/bchat/*`.
- Conteúdo vindo da API é renderizado como **texto escapado** via `escapeHtml`, nunca concatenado cru em `innerHTML`.
- **Limites iguais a `0` não têm semântica definida** (bloqueio registrado em `docs/landing_page_bchat_copilot.md` §4.3). Omitir o dado. Nunca exibir `0`, `ilimitado` ou `não incluído` a partir de um zero.
- Meta de acessibilidade: **WCAG 2.2 AA**.
- Metas de Core Web Vitals em campo (p75): **LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1**.
- **Sem urgência artificial:** nenhum countdown, "últimas vagas", "oferta expira" ou escassez fabricada.
- **Nenhuma dependência nova de runtime.** Apenas `devDependencies` de teste.
- Analytics **sem PII**: nunca enviar nome, e-mail, empresa, telefone ou conteúdo de conversa.
- Commits no padrão Conventional Commits, um por tarefa concluída.

## Pré-requisitos de conteúdo

Estes três itens são fornecidos pelo time (não pelo implementador). O código de cada tarefa funciona sem eles — os blocos se auto-ocultam — mas a tarefa só é considerada pronta para produção quando o conteúdo entra.

| Item | Onde entra | Bloqueia |
| --- | --- | --- |
| Logos de clientes autorizados (SVG ou PNG, altura ~32 px, fundo transparente) em `public/brand/clients/` | `clientLogos` em `src/content/landing-content.js` | Bloco de logos da Tarefa 7 |
| Depoimento autorizado: frase, nome, cargo, empresa | `testimonials` em `src/content/landing-content.js` | Citação da Tarefa 7 |
| Imagem Open Graph 1200×630 px, ≤ 200 KB, em `public/og/bchat-copilot-og.png` | `<meta property="og:image">` da Tarefa 10 | Tags OG da Tarefa 10 |

Enquanto a imagem OG dedicada não existir, a Tarefa 10 **não adiciona** `og:image` (uma tag apontando para arquivo inexistente é pior que a ausência dela).

## Dependência externa (time BChat)

A Tarefa 2 define o contrato de `POST /public/api/v1/bchat/demo_requests`. O endpoint **não existe hoje**. O frontend é implementado para degradar visivelmente quando ele responde `404`/`501`, então as Tarefas 2–4 podem ser concluídas e mergeadas antes do backend existir. Nenhum lead é perdido silenciosamente: o usuário vê um caminho alternativo. O endpoint precisa estar no ar antes de a página receber tráfego pago.

## Estrutura de arquivos

| Arquivo | Responsabilidade | Estado |
| --- | --- | --- |
| `index.html` | Composição semântica da página, `<head>` e metadata | modificado em quase todas as tarefas |
| `src/landing.js` | Orquestração: fetch de planos, render, listeners, analytics | modificado; encolhe conforme lógica sai para `src/lib/` |
| `src/landing.css` | Estilo completo da landing | modificado |
| `src/lib/pricing.js` | **Novo.** Funções puras de ciclo de cobrança, preço por card, créditos de Copilot e destaques de plano | Tarefas 1 e 6 |
| `src/lib/pricing.test.js` | **Novo.** Testes de `pricing.js` | Tarefas 1 e 6 |
| `src/lib/leads.js` | **Novo.** Validação, montagem de payload e envio do lead de demonstração | Tarefa 2 |
| `src/lib/leads.test.js` | **Novo.** Testes de `leads.js` | Tarefa 2 |
| `src/content/landing-content.js` | **Novo.** Todo conteúdo que depende de autorização comercial: logos, depoimentos, declarações de adequação, contatos de fallback | Tarefas 3 e 7 |
| `vite.config.js` | Configuração do Vite + bloco `test` do Vitest | Tarefa 1 |
| `package.json` | Script `test` e devDependency `vitest` | Tarefa 1 |

## Ordem de execução

**Sprint 1 — desbloqueio do funil:** Tarefas 1 → 2 → 3 → 4 → 5
**Sprint 2 — mensagem e prova:** Tarefas 6 → 7 → 8 → 9
**Sprint 3 — robustez:** Tarefas 10 → 11

> **Sobre os números de linha:** todas as referências do tipo `src/landing.js:71` apontam para o estado do arquivo **no commit `4a04d0f`**, antes de qualquer tarefa deste plano. Conforme as tarefas removem e inserem código, as linhas deslocam. Use o número como ponto de partida e confirme pelo nome da função ou pelo trecho citado, que são as âncoras confiáveis.

---

### Task 1: Regra de ciclo de cobrança por interseção (+ harness de testes)

O controle mensal/anual é montado hoje pela **união** dos ciclos de todos os planos (`activeCycles`, `src/landing.js:71`). Basta um plano ter anual para o toggle global aparecer, e ao selecionar "Anual" os demais cards caem no estado `Ciclo anual indisponível neste plano`. O spec técnico (§7.3) exige **interseção**. Há um segundo bug no mesmo bloco: quando existe um único ciclo, o texto é fixo em `· mensal` (`src/landing.js:85`), mesmo que o único ciclo publicado seja anual.

Esta tarefa também instala o harness de teste, porque é o primeiro comportamento que precisa dele.

**Files:**
- Modify: `package.json` (script `test`, devDependency `vitest`)
- Modify: `vite.config.js` (bloco `test`)
- Create: `src/lib/pricing.js`
- Test: `src/lib/pricing.test.js`
- Modify: `src/landing.js:71` (remover `activeCycles`), `src/landing.js:70` (remover `getPrice`), `src/landing.js:81-89` (`renderBillingControl`), `src/landing.js:90-105` (`renderPricing`)

**Interfaces:**
- Consumes: nada (primeira tarefa)
- Produces:
  - `CYCLE_ORDER: readonly ["monthly", "yearly"]`
  - `sharedCycles(plans: Plan[]) -> ("monthly"|"yearly")[]`
  - `cycleLabel(cycle: "monthly"|"yearly", form?: "noun"|"period") -> string`
  - `resolveCardPrice(plan: Plan, cycle: "monthly"|"yearly"|null) -> Price|null`
  - `state.billingCycle` passa a aceitar `null`, significando "sem ciclo global; cada card usa o próprio primeiro preço publicado"

- [ ] **Step 1: Instalar o Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Registrar o script de teste**

Em `package.json`, dentro de `"scripts"`, adicione a linha `test` logo após `"check"`:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "node --check src/landing.js",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Configurar o Vitest**

Substitua o conteúdo inteiro de `vite.config.js` por:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: { sourcemap: false },
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
});
```

- [ ] **Step 4: Escrever o teste que falha**

Crie `src/lib/pricing.test.js`:

```js
import { describe, expect, it } from "vitest";

import { CYCLE_ORDER, cycleLabel, resolveCardPrice, sharedCycles } from "./pricing.js";

const price = (billing_cycle, effective_amount) => ({
  billing_cycle,
  currency: "BRL",
  amount: effective_amount,
  promotional_amount: null,
  effective_amount,
  trial_days: 0,
  setup_fee: 0,
});

const plan = (slug, prices) => ({ slug, name: slug, prices, features: [], limits: { extra: {} } });

describe("CYCLE_ORDER", () => {
  it("keeps monthly before yearly", () => {
    expect(CYCLE_ORDER).toEqual(["monthly", "yearly"]);
  });
});

describe("sharedCycles", () => {
  it("returns both cycles when every priced plan publishes both", () => {
    const plans = [
      plan("essencial", [price("monthly", 99), price("yearly", 990)]),
      plan("profissional", [price("monthly", 249), price("yearly", 2490)]),
    ];

    expect(sharedCycles(plans)).toEqual(["monthly", "yearly"]);
  });

  it("returns only the intersection when one priced plan lacks yearly", () => {
    const plans = [
      plan("essencial", [price("monthly", 99), price("yearly", 990)]),
      plan("profissional", [price("monthly", 249)]),
    ];

    expect(sharedCycles(plans)).toEqual(["monthly"]);
  });

  it("ignores plans that publish no price at all", () => {
    const plans = [
      plan("essencial", [price("monthly", 99), price("yearly", 990)]),
      plan("enterprise", []),
    ];

    expect(sharedCycles(plans)).toEqual(["monthly", "yearly"]);
  });

  it("returns an empty list when priced plans share no cycle", () => {
    const plans = [plan("a", [price("monthly", 99)]), plan("b", [price("yearly", 990)])];

    expect(sharedCycles(plans)).toEqual([]);
  });

  it("returns an empty list when no plan has a price", () => {
    expect(sharedCycles([plan("enterprise", [])])).toEqual([]);
  });

  it("returns yearly alone when that is the only shared cycle", () => {
    const plans = [plan("a", [price("yearly", 990)]), plan("b", [price("yearly", 2490)])];

    expect(sharedCycles(plans)).toEqual(["yearly"]);
  });
});

describe("cycleLabel", () => {
  it("names the cycle for the billing control", () => {
    expect(cycleLabel("monthly")).toBe("Mensal");
    expect(cycleLabel("yearly")).toBe("Anual");
  });

  it("returns the period form used next to a price", () => {
    expect(cycleLabel("monthly", "period")).toBe("mês");
    expect(cycleLabel("yearly", "period")).toBe("ano");
  });
});

describe("resolveCardPrice", () => {
  it("returns the price for the requested cycle", () => {
    const target = plan("a", [price("monthly", 99), price("yearly", 990)]);

    expect(resolveCardPrice(target, "yearly").effective_amount).toBe(990);
  });

  it("returns null when the plan has no price at all", () => {
    expect(resolveCardPrice(plan("enterprise", []), "monthly")).toBeNull();
  });

  it("falls back to the first published cycle when there is no global cycle", () => {
    const target = plan("a", [price("yearly", 990)]);

    expect(resolveCardPrice(target, null).billing_cycle).toBe("yearly");
  });

  it("prefers monthly over yearly when no global cycle is set", () => {
    const target = plan("a", [price("yearly", 990), price("monthly", 99)]);

    expect(resolveCardPrice(target, null).billing_cycle).toBe("monthly");
  });
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

```bash
npm test
```

Esperado: FAIL com `Failed to resolve import "./pricing.js" from "src/lib/pricing.test.js"`.

- [ ] **Step 6: Escrever a implementação mínima**

Crie `src/lib/pricing.js`:

```js
export const CYCLE_ORDER = ["monthly", "yearly"];

const CYCLE_LABELS = {
  monthly: { noun: "Mensal", period: "mês" },
  yearly: { noun: "Anual", period: "ano" },
};

function hasPrice(plan) {
  return Array.isArray(plan?.prices) && plan.prices.length > 0;
}

function priceFor(plan, cycle) {
  return plan.prices.find((price) => price.billing_cycle === cycle) || null;
}

/**
 * Ciclos oferecidos por TODOS os planos que publicam algum preço.
 * Planos sem preço (Enterprise "sob consulta") não têm ciclo e por isso
 * não participam da interseção — caso contrário um único card sem preço
 * derrubaria o seletor para a página inteira.
 */
export function sharedCycles(plans) {
  const priced = (Array.isArray(plans) ? plans : []).filter(hasPrice);
  if (!priced.length) return [];
  return CYCLE_ORDER.filter((cycle) => priced.every((plan) => priceFor(plan, cycle)));
}

export function cycleLabel(cycle, form = "noun") {
  return CYCLE_LABELS[cycle]?.[form] || "";
}

/**
 * `cycle === null` significa que não existe ciclo global comparável.
 * Nesse caso cada card mostra o próprio primeiro preço publicado,
 * rotulado com o ciclo dele.
 */
export function resolveCardPrice(plan, cycle) {
  if (!hasPrice(plan)) return null;
  if (cycle) return priceFor(plan, cycle);
  return CYCLE_ORDER.map((item) => priceFor(plan, item)).find(Boolean) || null;
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

```bash
npm test
```

Esperado: PASS, 13 testes.

- [ ] **Step 8: Ligar o módulo ao `landing.js`**

No topo de `src/landing.js`, **antes** da linha `(() => {`, adicione:

```js
import { cycleLabel, resolveCardPrice, sharedCycles } from "./lib/pricing.js";
```

Remova a linha 70 inteira (`function getPrice(...)`) e a linha 71 inteira (`function activeCycles(...)`).

Substitua a função `renderBillingControl` (linhas 81-89) por:

```js
  function renderBillingControl() {
    const control = $("[data-billing-control]"); if (!control) return;
    const available = sharedCycles(state.plans);
    if (available.length < 2) {
      state.billingCycle = available[0] || null;
      control.innerHTML = state.billingCycle
        ? `<span class="billing-single">Valores publicados <span>· ${cycleLabel(state.billingCycle).toLowerCase()}</span></span>`
        : `<span class="billing-single">Valores publicados <span>· por plano</span></span>`;
      return;
    }
    if (!available.includes(state.billingCycle)) state.billingCycle = available[0];
    control.innerHTML = available.map((cycle) => `<button type="button" class="${cycle === state.billingCycle ? "is-active" : ""}" aria-pressed="${cycle === state.billingCycle}" data-cycle="${cycle}">${cycleLabel(cycle)}</button>`).join("");
    $$('[data-cycle]', control).forEach((button) => button.addEventListener("click", () => { if (state.billingCycle === button.dataset.cycle) return; const previous = state.billingCycle; state.billingCycle = button.dataset.cycle; emit("pricing_cycle_change", { from_cycle: previous, to_cycle: state.billingCycle }); renderBillingControl(); renderPricing(); }));
  }
```

Dentro de `renderPricing`, troque a linha `const price = getPrice(plan, state.billingCycle);` por:

```js
      const price = resolveCardPrice(plan, state.billingCycle);
```

e troque `${price.billing_cycle === "yearly" ? "ano" : "mês"}` por `${cycleLabel(price.billing_cycle, "period")}`.

Remova a linha do `unavailable` e sua interpolação no template. Com a interseção, todo plano com preço tem o ciclo selecionado, então esse estado virou inalcançável:

```js
      const unavailable = !price && plan.prices.length ? `<small class="price-unavailable">Ciclo anual indisponível neste plano</small>` : "";
```

e remova `${unavailable}` da string do card.

- [ ] **Step 9: Verificar o comportamento no navegador**

```bash
npm run dev
```

Abra `http://localhost:5173/#planos`. Com o snapshot atual da API (só o Essencial tem anual), o seletor mensal/anual **não deve aparecer**; no lugar dele deve ler-se `Valores publicados · mensal`. Nenhum card deve exibir `Ciclo anual indisponível`.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.js src/lib/pricing.js src/lib/pricing.test.js src/landing.js
git commit -m "fix(pricing): derive billing cycle control from cycle intersection

O controle global usava a união dos ciclos, então bastava um plano ter
anual para o seletor aparecer e os demais cards caírem em estado
inconsistente. Passa a usar a interseção entre os planos com preço,
conforme docs/landing_page_bchat_copilot.md 7.3. Corrige também o rótulo
fixo '· mensal' quando o único ciclo publicado é anual.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Módulo de captura de lead

Núcleo puro do novo funil: validar o formulário, montar o payload e falar com o endpoint. Isolado do DOM para ser testável, e com um resultado tipado que distingue "endpoint ainda não existe" de "erro de rede" — porque o endpoint de fato ainda não existe.

**Contrato definido para o time BChat:**

```
POST /public/api/v1/bchat/demo_requests
Content-Type: application/json

{
  "source": "landing_copilot",
  "contact": {
    "name":      string,          // obrigatório
    "email":     string,          // obrigatório
    "company":   string,          // obrigatório
    "team_size": string | null    // opcional
  }
}

201 Created  -> { "data": { "id": string } }
422          -> { "errors": { "<campo>": "<mensagem>" } }
404 | 501    -> endpoint não publicado; o frontend cai no caminho alternativo
5xx          -> indisponibilidade temporária; o frontend oferece retry
```

**Files:**
- Create: `src/lib/leads.js`
- Test: `src/lib/leads.test.js`

**Interfaces:**
- Consumes: nada de tarefas anteriores
- Produces:
  - `validateLead(input) -> { valid: boolean, errors: Record<"name"|"email"|"company", string> }`
  - `buildLeadPayload(input) -> { source: string, contact: { name, email, company, team_size } }`
  - `submitLead(endpoint, payload, options?) -> Promise<{ ok: true, id: string|null } | { ok: false, reason: "unavailable"|"invalid"|"network", message: string, errors?: Record<string,string> }>`
  - `options` aceita `{ fetchImpl, timeoutMs }`; ambos com default

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/lib/leads.test.js`:

```js
import { describe, expect, it, vi } from "vitest";

import { buildLeadPayload, submitLead, validateLead } from "./leads.js";

const valid = { name: "Larissa Mendes", email: "larissa@empresa.com.br", company: "Empresa", team_size: "11-50" };

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe("validateLead", () => {
  it("accepts a complete submission", () => {
    expect(validateLead(valid)).toEqual({ valid: true, errors: {} });
  });

  it("requires a name with at least two characters", () => {
    const result = validateLead({ ...valid, name: " L " });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("Informe seu nome.");
  });

  it("rejects a malformed email", () => {
    const result = validateLead({ ...valid, email: "larissa@empresa" });

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Informe um e-mail válido.");
  });

  it("requires a company", () => {
    const result = validateLead({ ...valid, company: "" });

    expect(result.valid).toBe(false);
    expect(result.errors.company).toBe("Informe o nome da empresa.");
  });

  it("treats team_size as optional", () => {
    expect(validateLead({ ...valid, team_size: "" }).valid).toBe(true);
  });

  it("reports every invalid field at once", () => {
    const result = validateLead({ name: "", email: "", company: "" });

    expect(Object.keys(result.errors).sort()).toEqual(["company", "email", "name"]);
  });

  it("survives missing keys", () => {
    expect(validateLead({}).valid).toBe(false);
  });
});

describe("buildLeadPayload", () => {
  it("trims and normalises the contact", () => {
    expect(buildLeadPayload({ name: "  Larissa  ", email: "  Larissa@Empresa.com.BR ", company: " Empresa ", team_size: " 11-50 " })).toEqual({
      source: "landing_copilot",
      contact: { name: "Larissa", email: "larissa@empresa.com.br", company: "Empresa", team_size: "11-50" },
    });
  });

  it("sends null when team_size is absent", () => {
    expect(buildLeadPayload({ name: "L", email: "l@e.com", company: "E" }).contact.team_size).toBeNull();
  });
});

describe("submitLead", () => {
  it("reports success and returns the created id", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(201, { data: { id: "lead_1" } }));

    await expect(submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).resolves.toEqual({ ok: true, id: "lead_1" });
  });

  it("succeeds even when the body carries no id", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(201, {}));

    await expect(submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).resolves.toEqual({ ok: true, id: null });
  });

  it("flags the endpoint as unavailable on 404", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(404, {}));
    const result = await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl });

    expect(result).toMatchObject({ ok: false, reason: "unavailable" });
  });

  it("flags the endpoint as unavailable on 501", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(501, {}));

    expect((await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).reason).toBe("unavailable");
  });

  it("surfaces field errors from a 422", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(422, { errors: { email: "E-mail já cadastrado." } }));
    const result = await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl });

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(result.errors).toEqual({ email: "E-mail já cadastrado." });
  });

  it("treats a 5xx as a retryable network failure", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(503, {}));

    expect((await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).reason).toBe("network");
  });

  it("treats a thrown fetch as a network failure", async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError("Failed to fetch"); });

    expect((await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).reason).toBe("network");
  });

  it("posts JSON to the given endpoint without credentials", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(201, {}));
    const payload = buildLeadPayload(valid);

    await submitLead("/api/demo", payload, { fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/demo");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("omit");
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npm test
```

Esperado: FAIL com `Failed to resolve import "./leads.js" from "src/lib/leads.test.js"`.

- [ ] **Step 3: Escrever a implementação mínima**

Crie `src/lib/leads.js`:

```js
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UNAVAILABLE_STATUSES = new Set([404, 501]);

const text = (value) => String(value ?? "").trim();

export function validateLead(input = {}) {
  const errors = {};
  if (text(input.name).length < 2) errors.name = "Informe seu nome.";
  if (!EMAIL_PATTERN.test(text(input.email))) errors.email = "Informe um e-mail válido.";
  if (text(input.company).length < 2) errors.company = "Informe o nome da empresa.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildLeadPayload(input = {}) {
  return {
    source: "landing_copilot",
    contact: {
      name: text(input.name),
      email: text(input.email).toLowerCase(),
      company: text(input.company),
      team_size: text(input.team_size) || null,
    },
  };
}

export async function submitLead(endpoint, payload, options = {}) {
  const { fetchImpl = globalThis.fetch, timeoutMs = 8000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "omit",
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    if (UNAVAILABLE_STATUSES.has(response.status)) {
      return { ok: false, reason: "unavailable", message: "O envio automático está indisponível no momento." };
    }

    const body = await response.json().catch(() => ({}));

    if (response.ok) return { ok: true, id: body?.data?.id ?? null };

    if (response.status === 422) {
      return {
        ok: false,
        reason: "invalid",
        message: "Revise os campos destacados e tente novamente.",
        errors: body?.errors && typeof body.errors === "object" ? body.errors : {},
      };
    }

    return { ok: false, reason: "network", message: "Não foi possível enviar agora. Tente novamente em instantes." };
  } catch {
    return { ok: false, reason: "network", message: "Não foi possível enviar agora. Tente novamente em instantes." };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
npm test
```

Esperado: PASS, 13 testes de `pricing.test.js` + 17 de `leads.test.js` = 30.

- [ ] **Step 5: Commit**

```bash
git add src/lib/leads.js src/lib/leads.test.js
git commit -m "feat(leads): add demo request validation and submit adapter

Módulo puro que valida o formulário de demonstração, monta o payload e
fala com POST /public/api/v1/bchat/demo_requests. O resultado distingue
'endpoint ainda não publicado' de falha de rede, para o formulário poder
oferecer um caminho alternativo em vez de perder o lead.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Formulário inline de demonstração no CTA final

Hoje o CTA final é circular: `src/index.html:181` tem `<a href="#contato">` dentro da própria `section#contato`. Clicar não avança nada. Esta tarefa substitui isso por um formulário real, com estado de sucesso que diz o que acontece depois do clique (Fase 5 do spec).

O arquivo de conteúdo criado aqui também guarda os contatos de fallback usados quando o endpoint responde `404`.

**Files:**
- Create: `src/content/landing-content.js`
- Modify: `index.html:181` (a `<section class="final-cta">` inteira)
- Modify: `src/landing.js` (novas funções `setupDemoForm`, chamada em `init`)
- Modify: `src/landing.css` (estilos do formulário, ao final do arquivo)

**Interfaces:**
- Consumes: `validateLead`, `buildLeadPayload`, `submitLead` de `src/lib/leads.js` (Tarefa 2)
- Produces:
  - `src/content/landing-content.js` exporta `contact: { salesEmail: string|null, salesWhatsappUrl: string|null }`
  - `data-demo-form`, `data-demo-status`, `data-demo-success`, `data-demo-submit`, `data-error-for="<campo>"` como contratos de DOM
  - Eventos de analytics `conversion_started` e `conversion_completed`, ambos com `{ flow_kind: "demo_request" }`

- [ ] **Step 1: Criar o arquivo de conteúdo**

Crie `src/content/landing-content.js`:

```js
// Conteúdo que depende de autorização comercial.
// Regra: bloco sem conteúdo se oculta. Nunca preencher com exemplo fictício.

/** Canais de contato usados quando o envio automático falha. `null` oculta a opção. */
export const contact = {
  salesEmail: null,
  salesWhatsappUrl: null,
};
```

- [ ] **Step 2: Escrever a nova seção de CTA final**

Em `index.html`, substitua a linha 181 inteira (a `<section class="final-cta" id="contato" ...>` de uma linha só) por:

```html
        <section class="final-cta" id="contato" aria-labelledby="final-cta-title">
          <div class="final-cta-grid" aria-hidden="true"></div>
          <div class="container final-cta-inner">
            <div class="final-cta-copy">
              <p class="eyebrow">PRÓXIMO PASSO <span class="eyebrow-line"></span></p>
              <h2 id="final-cta-title">Veja o Copilot<br /><em>na sua operação.</em></h2>
              <p class="final-cta-lead">Uma demonstração guiada por um especialista: mostramos o Copilot dentro do fluxo real de atendimento e indicamos qual plano faz sentido para o seu volume.</p>
              <ul class="final-cta-expectations">
                <li><span aria-hidden="true">✓</span> Demonstração conduzida por um especialista</li>
                <li><span aria-hidden="true">✓</span> Sem compromisso de contratação</li>
                <li><span aria-hidden="true">✓</span> Indicamos o plano adequado ao seu volume</li>
              </ul>
              <div class="final-cta-proof" data-final-proof hidden></div>
            </div>

            <div class="final-cta-action">
              <form class="demo-form" data-demo-form novalidate>
                <p class="demo-form-title">Solicitar demonstração</p>

                <div class="demo-field">
                  <label for="demo-name">Nome</label>
                  <input id="demo-name" name="name" type="text" autocomplete="name" aria-describedby="demo-name-error" required />
                  <p class="demo-error" id="demo-name-error" data-error-for="name" hidden></p>
                </div>

                <div class="demo-field">
                  <label for="demo-email">E-mail</label>
                  <input id="demo-email" name="email" type="email" autocomplete="email" inputmode="email" aria-describedby="demo-email-error" required />
                  <p class="demo-error" id="demo-email-error" data-error-for="email" hidden></p>
                </div>

                <div class="demo-field">
                  <label for="demo-company">Empresa</label>
                  <input id="demo-company" name="company" type="text" autocomplete="organization" aria-describedby="demo-company-error" required />
                  <p class="demo-error" id="demo-company-error" data-error-for="company" hidden></p>
                </div>

                <div class="demo-field">
                  <label for="demo-team-size">Pessoas no atendimento <span>(opcional)</span></label>
                  <select id="demo-team-size" name="team_size">
                    <option value="">Prefiro não informar</option>
                    <option value="1-10">1 a 10</option>
                    <option value="11-50">11 a 50</option>
                    <option value="51-200">51 a 200</option>
                    <option value="200+">Mais de 200</option>
                  </select>
                </div>

                <button class="button button-primary button-large" type="submit" data-demo-submit>Solicitar demonstração <span aria-hidden="true">↗</span></button>
                <p class="demo-form-privacy">Usamos seus dados apenas para entrar em contato sobre esta demonstração.</p>
                <p class="demo-form-status" data-demo-status role="alert" hidden></p>
              </form>

              <div class="demo-success glass-panel" data-demo-success hidden tabindex="-1">
                <span class="demo-success-mark" aria-hidden="true">✓</span>
                <h3>Solicitação recebida.</h3>
                <p>Um especialista vai entrar em contato pelo e-mail informado para combinar a demonstração. Enquanto isso, você pode continuar explorando a página.</p>
              </div>
            </div>
          </div>
        </section>
```

- [ ] **Step 3: Ligar o formulário**

No topo de `src/landing.js`, junto ao import da Tarefa 1, adicione:

```js
import { buildLeadPayload, submitLead, validateLead } from "./lib/leads.js";
import { contact } from "./content/landing-content.js";
```

Ainda dentro do IIFE, logo abaixo da constante `checkoutEndpoint` (linha 17-19), adicione:

```js
  const demoEndpoint = configuredApiUrl
    ? `${configuredApiUrl}/public/api/v1/bchat/demo_requests`
    : "/public/api/v1/bchat/demo_requests";
```

Adicione as funções abaixo logo antes de `function init()`:

```js
  function fallbackContactHtml() {
    const options = [];
    if (contact.salesEmail) options.push(`<a href="mailto:${escapeHtml(contact.salesEmail)}">${escapeHtml(contact.salesEmail)}</a>`);
    if (contact.salesWhatsappUrl) options.push(`<a href="${escapeHtml(contact.salesWhatsappUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp comercial</a>`);
    return options.length ? ` Fale direto com o time por ${options.join(" ou ")}.` : "";
  }

  function clearDemoErrors(form) {
    $$('[data-error-for]', form).forEach((element) => { element.textContent = ""; element.hidden = true; });
    $$('input, select', form).forEach((field) => field.removeAttribute("aria-invalid"));
    const status = $("[data-demo-status]", form);
    if (status) { status.textContent = ""; status.hidden = true; status.classList.remove("is-error"); }
  }

  function showDemoErrors(form, errors) {
    let firstInvalid = null;
    Object.entries(errors).forEach(([field, message]) => {
      const element = $(`[data-error-for="${field}"]`, form);
      const input = $(`[name="${field}"]`, form);
      if (element) { element.textContent = message; element.hidden = false; }
      if (input) { input.setAttribute("aria-invalid", "true"); firstInvalid = firstInvalid || input; }
    });
    firstInvalid?.focus();
  }

  function showDemoStatus(form, message) {
    const status = $("[data-demo-status]", form);
    if (!status) return;
    status.innerHTML = message;
    status.hidden = false;
    status.classList.add("is-error");
  }

  function setupDemoForm() {
    const form = $("[data-demo-form]"); const success = $("[data-demo-success]");
    if (!form || !success) return;
    const submit = $("[data-demo-submit]", form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearDemoErrors(form);

      const input = Object.fromEntries(new FormData(form).entries());
      const { valid, errors } = validateLead(input);
      if (!valid) { showDemoErrors(form, errors); return; }

      submit.disabled = true;
      submit.innerHTML = 'Enviando <span aria-hidden="true">…</span>';
      emit("conversion_started", { flow_kind: "demo_request" });

      const result = await submitLead(demoEndpoint, buildLeadPayload(input));

      if (result.ok) {
        emit("conversion_completed", { flow_kind: "demo_request" });
        form.hidden = true;
        success.hidden = false;
        success.focus();
        return;
      }

      submit.disabled = false;
      submit.innerHTML = 'Solicitar demonstração <span aria-hidden="true">↗</span>';
      if (result.reason === "invalid" && Object.keys(result.errors || {}).length) { showDemoErrors(form, result.errors); return; }
      showDemoStatus(form, `${escapeHtml(result.message)}${result.reason === "unavailable" ? fallbackContactHtml() : ""}`);
    });
  }
```

Em `init()`, adicione `setupDemoForm();` na cadeia de chamadas:

```js
    setupHeader(); setupFeatureTabs(); setupComparison(); setupAnalytics(); setupCheckout(); setupDemoForm(); loadPlans();
```

- [ ] **Step 4: Estilizar o formulário**

Acrescente ao final de `src/landing.css`:

```css
.final-cta-inner { display: grid; grid-template-columns: 1fr minmax(340px, 460px); gap: 80px; align-items: start; }
.final-cta-lead { max-width: 460px; margin: 26px 0 0; color: var(--muted); font-size: 15px; line-height: 1.7; }
.final-cta-expectations { display: grid; gap: 12px; margin: 30px 0 0; padding: 0; list-style: none; }
.final-cta-expectations li { display: flex; gap: 10px; align-items: baseline; color: var(--muted); font-size: 13px; line-height: 1.5; }
.final-cta-expectations span { color: var(--lime); font-size: 12px; }
.final-cta-proof { max-width: 430px; margin-top: 34px; padding-left: 18px; border-left: 2px solid rgb(var(--rgb-limebright), .4); }
.final-cta-proof p { margin: 0; color: var(--text); font-size: 14px; font-style: italic; line-height: 1.65; }
.final-cta-proof small { display: block; margin-top: 10px; color: var(--muted-2); font-size: 11px; letter-spacing: .04em; }

.demo-form { display: grid; gap: 18px; padding: 34px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: rgba(17, 23, 33, .72); }
.demo-form[hidden] { display: none; }
.demo-form-title { margin: 0; font-family: "Manrope", sans-serif; font-size: 19px; font-weight: 800; letter-spacing: -.03em; }
.demo-field { display: grid; gap: 7px; }
.demo-field label { color: var(--text); font-size: 12px; font-weight: 700; }
.demo-field label span { color: var(--muted-2); font-weight: 500; }
.demo-field input, .demo-field select { width: 100%; min-height: 48px; padding: 0 14px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: rgba(8, 11, 16, .7); color: var(--text); font: inherit; font-size: 14px; }
.demo-field input::placeholder { color: var(--muted-2); }
.demo-field input:focus-visible, .demo-field select:focus-visible { outline: 2px solid var(--lime); outline-offset: 2px; }
.demo-field [aria-invalid="true"] { border-color: var(--danger); }
.demo-error { margin: 0; color: var(--danger); font-size: 12px; }
.demo-form-privacy { margin: 0; color: var(--muted-2); font-size: 11px; line-height: 1.5; }
.demo-form-status { margin: 0; padding: 12px 14px; border-radius: var(--radius-sm); font-size: 13px; line-height: 1.55; }
.demo-form-status.is-error { border: 1px solid rgba(255, 155, 126, .4); background: rgba(255, 155, 126, .1); color: var(--text); }
.demo-form-status a { color: var(--lime); text-decoration: underline; }

.demo-success { display: grid; gap: 14px; padding: 40px 34px; border: 1px solid rgb(var(--rgb-limebright), .35); border-radius: var(--radius-md); }
.demo-success[hidden] { display: none; }
.demo-success:focus-visible { outline: 2px solid var(--lime); outline-offset: 3px; }
.demo-success-mark { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--lime); color: #08100a; font-size: 18px; font-weight: 700; }
.demo-success h3 { margin: 0; font-size: 24px; }
.demo-success p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.7; }

@media (max-width: 980px) {
  .final-cta-inner { grid-template-columns: 1fr; gap: 48px; }
  .final-cta-proof { max-width: none; }
}
@media (max-width: 600px) {
  .demo-form { padding: 26px 20px; }
  .demo-success { padding: 32px 20px; }
}
```

- [ ] **Step 5: Verificar os três caminhos no navegador**

```bash
npm run dev
```

Em `http://localhost:5173/#contato`:

1. Enviar vazio → três mensagens de erro, foco no campo Nome, nenhuma requisição de rede.
2. Preencher tudo e enviar → como o endpoint ainda não existe, o Vite devolve o HTML da página (não é `404`), então espera-se a mensagem de rede. Para exercitar o caminho `unavailable`, force `demoEndpoint` para uma URL 404 temporariamente e confirme o texto `O envio automático está indisponível no momento.`.
3. Preencher `contact.salesEmail` em `src/content/landing-content.js` e repetir o passo 2: a mensagem deve ganhar o link de e-mail.

Reverta qualquer alteração temporária antes do commit.

- [ ] **Step 6: Rodar a suíte**

```bash
npm test
```

Esperado: PASS, 30 testes (nenhum teste novo; a garantia de não-regressão é o objetivo).

- [ ] **Step 7: Commit**

```bash
git add index.html src/landing.js src/landing.css src/content/landing-content.js
git commit -m "feat(cta): replace circular final CTA with inline demo request form

O CTA final apontava para a própria seção (#contato dentro de
section#contato), sem avanço no funil. Passa a ser um formulário inline
de quatro campos com estado de sucesso explícito e caminho alternativo
de contato quando o endpoint de leads não está publicado.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Aposentar o checkout direto e unificar os CTAs

Com o CTA principal definido como demonstração, o modal de checkout deixa de fazer sentido na landing: ele pede e-mail e leva a pagamento no meio de uma jornada de descoberta. Esta tarefa remove o fluxo inteiro e faz todos os CTAs da página apontarem para o formulário da Tarefa 3, com foco movido para o primeiro campo — é isso que impede o CTA de continuar sendo "circular".

**Files:**
- Modify: `index.html:60` (CTA do menu mobile), `index.html:178` (link do FAQ), `index.html:186-200` (remover o bloco `.checkout-dialog` inteiro)
- Modify: `src/landing.js` (remover `checkoutEndpoint`, `setCheckoutError`, `getFocusable`, `trapFocus`, `closeCheckout`, `openCheckout`, `submitCheckout`, `setupCheckout` e o `state.checkout`; ajustar CTA do card de plano; adicionar `setupCtaFocus`)
- Modify: `src/landing.css:152-162` (remover as regras `.checkout-*`), `src/landing.css:71` (remover seletores de checkout da lista de `focus-visible`)

**Interfaces:**
- Consumes: `data-demo-form` e o id `demo-name` da Tarefa 3
- Produces: `setupCtaFocus()` — move o foco para `#demo-name` quando qualquer `a[href="#contato"]` é ativado

- [ ] **Step 1: Remover o markup do checkout**

Em `index.html`, apague as linhas 186 a 200 inteiras — do `<div class="checkout-dialog" data-checkout-dialog hidden>` até o `</div>` que o fecha, inclusive a `<section class="checkout-modal">` inteira. O `<div id="react-root"></div>` da linha 201 permanece.

- [ ] **Step 2: Unificar o rótulo dos CTAs restantes**

Em `index.html:60`, no menu mobile, troque:

```html
          <a class="button button-primary" href="#contato" data-menu-close>Falar com o time <span aria-hidden="true">↗</span></a>
```

por:

```html
          <a class="button button-primary" href="#contato" data-menu-close data-analytics="landing_primary_cta_click" data-placement="mobile_menu">Solicitar demonstração <span aria-hidden="true">↗</span></a>
```

Em `index.html:178`, dentro de `.faq-intro`, troque `>Falar com o time <span aria-hidden="true">↗</span></a>` por `>Solicitar demonstração <span aria-hidden="true">↗</span></a>`.

Em `index.html:173`, no `.pricing-footnote`, troque `Fale com o time para entender o plano ideal.` por `Solicite uma demonstração para entender o plano ideal.`.

- [ ] **Step 3: Remover o fluxo de checkout do JavaScript**

Em `src/landing.js`:

1. Apague as linhas 17-19 (`const checkoutEndpoint = ...`).
2. Na definição de `state` (linhas 4-11), apague a linha `checkout: { planSlug: null, billingCycle: null, previousFocus: null },`.
3. Apague as funções `setCheckoutError` (linha 134), `getFocusable` (135-137), `trapFocus` (138-145), `closeCheckout` (146), `openCheckout` (147-152), `submitCheckout` (153-175) e `setupCheckout` (176-180) por completo.
4. Em `init()`, remova a chamada `setupCheckout();`.

Dentro de `renderPricing`, substitua o bloco do CTA (linhas 99-101) por:

```js
      const cta = `<a class="button ${plan.featured ? "button-primary" : "button-ghost"} pricing-card-cta" href="#contato" data-analytics="landing_primary_cta_click" data-placement="pricing_card" data-plan-slug="${escapeHtml(plan.slug)}">Solicitar demonstração <span aria-hidden="true">↗</span></a>`;
```

O CTA agora é o mesmo para todo plano — com ou sem preço —, o que elimina a leitura de que planos com preço são "compráveis aqui" e planos sem preço são "consultivos".

- [ ] **Step 4: Adicionar o foco no primeiro campo**

Em `src/landing.js`, adicione esta função logo antes de `function init()`:

```js
  function setupCtaFocus() {
    const field = $("#demo-name");
    if (!field) return;
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href="#contato"]');
      if (!link) return;
      const form = $("[data-demo-form]");
      if (!form || form.hidden) return;
      // O scroll da âncora é do navegador; só assumimos o foco depois dele.
      window.setTimeout(() => field.focus({ preventScroll: true }), 400);
    });
  }
```

E registre em `init()`:

```js
    setupHeader(); setupFeatureTabs(); setupComparison(); setupAnalytics(); setupDemoForm(); setupCtaFocus(); loadPlans();
```

- [ ] **Step 5: Remover o CSS do checkout**

Em `src/landing.css`, apague as linhas 152 a 162 (de `.checkout-open { ... }` até o `@media (max-width: 600px) { .checkout-modal { ... } }`).

Na linha 71, remova os três seletores de checkout da lista de `focus-visible`, deixando-a assim:

```css
.button:focus-visible, .text-link:focus-visible, .feature-tab:focus-visible, .comparison-toggle:focus-visible, .mini-button:focus-visible, .menu-toggle:focus-visible, .billing-control button:focus-visible, .pricing-card-cta:focus-visible, .retry-button:focus-visible, .faq-item summary:focus-visible { outline: 2px solid var(--lime); outline-offset: 3px; }
```

> Preserve o restante da declaração exatamente como está no arquivo — só os seletores `.checkout-close:focus-visible` e `.checkout-form input:focus-visible` saem.

- [ ] **Step 6: Confirmar que nada restou**

```bash
grep -rn "checkout" index.html src/ --include=*.html --include=*.js --include=*.css
```

Esperado: nenhuma saída.

- [ ] **Step 7: Verificar no navegador**

```bash
npm run dev
```

Clique no CTA do header, no CTA do hero e no CTA de um card de plano. Cada um deve rolar até a seção de contato **e** deixar o cursor piscando no campo Nome. Nenhum modal deve abrir.

- [ ] **Step 8: Rodar a suíte e o build**

```bash
npm test && npm run build
```

Esperado: 30 testes PASS e build concluído sem erro.

- [ ] **Step 9: Commit**

```bash
git add index.html src/landing.js src/landing.css
git commit -m "refactor(cta): retire direct checkout and point every CTA at the demo form

A landing é jornada de descoberta; o checkout modal pedia e-mail e levava
a pagamento no meio dela. Todos os CTAs passam a apontar para o
formulário de demonstração, movendo o foco para o primeiro campo — o que
resolve o CTA circular em vez de apenas trocar o rótulo.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Reescrever o hero

O hero atual comunica atmosfera (`Contexto para cada conversa. Inteligência para cada resposta.`) mas não responde para quem é nem qual dor resolve. Fase 1 do spec pede headline objetiva, subtítulo benefício+contexto, uma linha de adequação e um CTA principal com consequência clara.

**Files:**
- Modify: `index.html:5` e `index.html:8-10` (title, description, Open Graph — message match com a nova headline)
- Modify: `index.html:71-78` (bloco `.hero-copy`)
- Modify: `index.html:112-114` (cards de capacidade)
- Modify: `src/landing.css` (regra `.hero-fit`, ao final do arquivo)

**Interfaces:**
- Consumes: nada
- Produces: classe `.hero-fit` no CSS; nenhuma nova API de JS

- [ ] **Step 1: Reescrever a copy do hero**

Em `index.html`, substitua as linhas 71 a 78 por:

```html
              <p class="eyebrow reveal">IA PARA ATENDIMENTO <span class="eyebrow-line"></span> BCHAT</p>
              <h1 id="hero-title" class="hero-title reveal reveal-delay-1">Mais contexto para atender.<br /><em>Mais confiança</em> para responder.</h1>
              <p class="hero-description reveal reveal-delay-2">O BChat Copilot apoia equipes de atendimento com resumos, sugestões e conhecimento conectado dentro da própria conversa.</p>
              <p class="hero-fit reveal reveal-delay-2">Para operações de suporte, vendas e pós-venda que lidam com volume, contexto e consistência.</p>
              <div class="hero-actions reveal reveal-delay-3">
                <a class="button button-primary" href="#contato" data-analytics="landing_primary_cta_click" data-placement="hero">Solicitar demonstração <span aria-hidden="true">↗</span></a>
                <a class="text-link" href="#funcionalidades" data-analytics="landing_secondary_cta_click" data-placement="hero">Conhecer funcionalidades <span aria-hidden="true">↓</span></a>
              </div>
              <div class="hero-meta reveal reveal-delay-4"><span class="status-dot"></span> Humano no controle · fontes visíveis em cada sugestão</div>
```

- [ ] **Step 2: Alinhar os cards de capacidade ao ganho operacional**

Substitua as linhas 112 a 114 por:

```html
              <div class="capability-card"><span>01</span><strong>Contexto pronto</strong><small>O resumo chega antes da resposta.</small></div>
              <div class="capability-card"><span>02</span><strong>Resposta com fonte</strong><small>A origem fica visível ao lado da sugestão.</small></div>
              <div class="capability-card capability-card-accent"><span>03</span><strong>Humano no loop</strong><small>A equipe decide o próximo passo.</small></div>
```

- [ ] **Step 3: Fazer o `<head>` combinar com a nova headline (message match)**

Em `index.html`, substitua a linha 5 e as linhas 8 a 10 por:

```html
    <title>BChat Copilot: mais contexto para atender, mais confiança para responder</title>
```

```html
    <meta name="description" content="O BChat Copilot apoia equipes de suporte, vendas e pós-venda com resumos, sugestões e conhecimento conectado dentro da conversa. Solicite uma demonstração." />
    <meta property="og:title" content="BChat Copilot: mais contexto para atender, mais confiança para responder" />
    <meta property="og:description" content="Resumos, sugestões e conhecimento conectado dentro da conversa, para operações que lidam com volume, contexto e consistência." />
```

- [ ] **Step 4: Estilizar a linha de adequação**

Acrescente ao final de `src/landing.css`:

```css
.hero-fit { max-width: 430px; margin: 18px 0 0; padding-left: 14px; border-left: 2px solid rgb(var(--rgb-limebright), .45); color: var(--muted-2); font-size: 13px; line-height: 1.6; }
@media (max-width: 820px) { .hero-fit { max-width: none; } }
```

- [ ] **Step 5: Verificar responsivamente**

```bash
npm run dev
```

Confira em 1440 px, 768 px e 375 px de largura: a headline não pode estourar em três linhas no desktop nem cortar palavra no mobile; a linha de adequação não pode encostar no mockup; os CTAs continuam legíveis em 320 px.

- [ ] **Step 6: Commit**

```bash
git add index.html src/landing.css
git commit -m "feat(hero): lead with the operational benefit and the target audience

A headline anterior funcionava como manifesto mas não dizia para quem a
solução é nem qual dor resolve. Passa a abrir com o ganho operacional,
ganha uma linha explícita de ICP e alinha title/description/OG à nova
mensagem para manter message match com o anúncio de origem.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Cards de plano que orientam decisão

Decisão de produto: **todos os planos incluem o Copilot**; o que muda é a quantidade de créditos e documentos. Hoje o card não mostra isso — mostra as três primeiras features na ordem em que a API devolve e um `+ N outros recursos` que não ajuda ninguém a decidir.

A allowlist de `limits.extra` já existe em `src/landing.js:20` e inclui `captain_credits` e `captain_documents`. Esta tarefa transforma esses números no diferencial visível, respeitando o bloqueio de semântica do zero: valor ausente ou `0` **omite a linha**, nunca imprime "0".

**Files:**
- Modify: `src/lib/pricing.js` (adicionar `CATEGORY_ORDER`, `copilotAllowance`, `planHighlights`)
- Modify: `src/lib/pricing.test.js` (novos testes)
- Modify: `src/landing.js` (remover `categoryOrder` local; usar os novos helpers em `renderPricing`; atualizar `demoPlans`)
- Modify: `src/landing.css` (estilos de allowance, ao final do arquivo)

**Interfaces:**
- Consumes: `CYCLE_ORDER`, `resolveCardPrice`, `cycleLabel` (Tarefa 1)
- Produces:
  - `CATEGORY_ORDER: string[]` — `["core","channels","productivity","reporting","enterprise","other"]`, movido de `landing.js`
  - `copilotAllowance(plan) -> Array<{ key: string, value: number, label: string }>`
  - `planHighlights(plan, allPlans, limit?) -> Feature[]`

- [ ] **Step 1: Escrever os testes que falham**

Acrescente ao final de `src/lib/pricing.test.js`:

```js
import { CATEGORY_ORDER, copilotAllowance, planHighlights } from "./pricing.js";

const feature = (code, name, category = "productivity") => ({ code, name, category, enabled: true });

describe("CATEGORY_ORDER", () => {
  it("ends with the bucket used for unknown categories", () => {
    expect(CATEGORY_ORDER).toEqual(["core", "channels", "productivity", "reporting", "enterprise", "other"]);
  });
});

describe("copilotAllowance", () => {
  it("returns credits and documents with their labels", () => {
    const target = { limits: { extra: { captain_credits: 500, captain_documents: 50 } } };

    expect(copilotAllowance(target)).toEqual([
      { key: "captain_credits", value: 500, label: "créditos de Copilot / mês" },
      { key: "captain_documents", value: 50, label: "documentos na base" },
    ]);
  });

  it("omits a zero value because zero has no defined meaning", () => {
    const target = { limits: { extra: { captain_credits: 0, captain_documents: 50 } } };

    expect(copilotAllowance(target).map((item) => item.key)).toEqual(["captain_documents"]);
  });

  it("omits absent keys", () => {
    expect(copilotAllowance({ limits: { extra: { captain_credits: 500 } } }).map((item) => item.key)).toEqual(["captain_credits"]);
  });

  it("accepts numeric strings, as seen in the API snapshot", () => {
    expect(copilotAllowance({ limits: { extra: { captain_credits: "500" } } })[0].value).toBe(500);
  });

  it("ignores non-numeric values", () => {
    expect(copilotAllowance({ limits: { extra: { captain_credits: "ilimitado" } } })).toEqual([]);
  });

  it("returns an empty list when the plan has no limits at all", () => {
    expect(copilotAllowance({})).toEqual([]);
    expect(copilotAllowance({ limits: {} })).toEqual([]);
  });
});

describe("planHighlights", () => {
  const essencial = { slug: "essencial", features: [feature("inboxes", "Canais"), feature("reports", "Relatórios", "reporting"), feature("captain", "BChat Copilot")] };
  const profissional = { slug: "profissional", features: [feature("inboxes", "Canais"), feature("reports", "Relatórios", "reporting"), feature("captain", "BChat Copilot"), feature("knowledge_base", "Base de conhecimento")] };
  const all = [essencial, profissional];

  it("puts features that not every plan has first", () => {
    expect(planHighlights(profissional, all, 3)[0].code).toBe("knowledge_base");
  });

  it("respects the requested limit", () => {
    expect(planHighlights(profissional, all, 2)).toHaveLength(2);
  });

  it("falls back to category order when every feature is shared", () => {
    expect(planHighlights(essencial, all, 3).map((item) => item.code)).toEqual(["inboxes", "captain", "reports"]);
  });

  it("returns an empty list for a plan with no features", () => {
    expect(planHighlights({ slug: "x", features: [] }, all, 3)).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
npm test
```

Esperado: FAIL com `No "CATEGORY_ORDER" export is defined on "./pricing.js"`.

- [ ] **Step 3: Implementar os helpers**

Acrescente ao final de `src/lib/pricing.js`:

```js
export const CATEGORY_ORDER = ["core", "channels", "productivity", "reporting", "enterprise", "other"];

const COPILOT_ALLOWANCE = [
  { key: "captain_credits", label: "créditos de Copilot / mês" },
  { key: "captain_documents", label: "documentos na base" },
];

/**
 * Números que diferenciam comercialmente os planos.
 * Todo plano inclui o Copilot; o que varia é a franquia.
 * Valores ausentes, zero ou não numéricos são omitidos: `0` não tem
 * semântica definida no contrato público (docs/landing_page_bchat_copilot.md 4.3).
 */
export function copilotAllowance(plan) {
  const extra = plan?.limits?.extra;
  if (!extra || typeof extra !== "object") return [];
  return COPILOT_ALLOWANCE
    .map(({ key, label }) => ({ key, label, value: Number(extra[key]) }))
    .filter(({ value }) => Number.isFinite(value) && value > 0);
}

/**
 * Destaques do card: primeiro o que nem todo plano tem (diferencial real),
 * depois a ordem de categoria, depois o nome. Determinístico.
 */
export function planHighlights(plan, allPlans, limit = 3) {
  const features = Array.isArray(plan?.features) ? plan.features : [];
  if (!features.length) return [];

  const plans = Array.isArray(allPlans) && allPlans.length ? allPlans : [plan];
  const occurrences = new Map();
  plans.forEach((item) => (item.features || []).forEach((entry) => occurrences.set(entry.code, (occurrences.get(entry.code) || 0) + 1)));

  const isShared = (entry) => (occurrences.get(entry.code) === plans.length ? 1 : 0);
  const categoryRank = (entry) => {
    const index = CATEGORY_ORDER.indexOf(entry.category);
    return index === -1 ? CATEGORY_ORDER.length : index;
  };

  return [...features]
    .sort((a, b) => isShared(a) - isShared(b) || categoryRank(a) - categoryRank(b) || a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, limit);
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
npm test
```

Esperado: PASS, 41 testes (13 de ciclo + 17 de leads + 11 novos).

- [ ] **Step 5: Usar os helpers no card**

Em `src/landing.js`, amplie o import da Tarefa 1:

```js
import { CATEGORY_ORDER, copilotAllowance, cycleLabel, planHighlights, resolveCardPrice, sharedCycles } from "./lib/pricing.js";
```

Apague a linha 21 (`const categoryOrder = [...]`) e substitua todas as ocorrências restantes de `categoryOrder` por `CATEGORY_ORDER` — elas estão em `normalizePlan`, `buildComparison` e `renderComparison`:

```bash
grep -n "categoryOrder" src/landing.js
```

Dentro de `renderPricing`, substitua a linha de `featureNames` por:

```js
      const allowance = copilotAllowance(plan);
      const allowanceMarkup = allowance.length
        ? `<ul class="pricing-card-allowance">${allowance.map((item) => `<li><strong>${new Intl.NumberFormat("pt-BR").format(item.value)}</strong> ${escapeHtml(item.label)}</li>`).join("")}</ul>`
        : "";
      const highlights = planHighlights(plan, state.plans, 3);
      const featureNames = highlights.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("");
      const remaining = plan.features.length - highlights.length;
```

E substitua o `return` do card por:

```js
      return `<article class="pricing-card ${plan.featured ? "is-featured" : ""}">${featured}<div class="pricing-card-top"><h3>${escapeHtml(plan.name)}</h3><span class="card-index">${String(state.plans.indexOf(plan) + 1).padStart(2, "0")}</span></div><p class="pricing-card-description">${escapeHtml(plan.short_description || "Plano BChat para sua operação de atendimento.")}</p>${priceMarkup}${allowanceMarkup}${cta}<ul class="pricing-card-features">${featureNames || "<li>Recursos conforme configuração publicada</li>"}</ul>${remaining > 0 ? `<button class="pricing-card-more" type="button" data-comparison-toggle-from-card>Ver os outros ${remaining} recursos <span aria-hidden="true">↓</span></button>` : ""}</article>`;
```

- [ ] **Step 6: Ligar o botão do card à tabela de comparação**

Em `src/landing.js`, dentro de `setupComparison`, extraia a abertura para uma função reutilizável e registre o novo gatilho. Substitua a função inteira por:

```js
  function setupComparison() {
    const button = $("[data-comparison-toggle]"); const comparison = $("[data-pricing-comparison]"); if (!button || !comparison) return;
    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      comparison.hidden = !open;
      button.innerHTML = open ? 'Ocultar comparação <span>↑</span>' : 'Ver comparação completa <span>↓</span>';
      if (open) emit("pricing_section_view", { plans_count: state.plans.length, cache_state: state.apiState });
    };
    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-comparison-toggle-from-card]")) return;
      setOpen(true);
      comparison.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
```

- [ ] **Step 7: Alinhar o fixture de demonstração à realidade comercial**

Em `src/landing.js`, o array `demoPlans` (linhas 23-27) só é usado no protocolo `file:`, mas hoje contradiz a decisão de produto: o plano Essencial não tem a feature `captain`. Corrija os dois pontos do objeto `demo-essencial`:

- em `limits.extra`, troque `{}` por `{ captain_credits: 100, captain_documents: 10 }`;
- em `features`, adicione `{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }` como primeiro item.

E no objeto `demo-enterprise`, troque `extra: {}` por `extra: { captain_credits: 5000, captain_documents: 500 }`.

- [ ] **Step 8: Estilizar a franquia**

Acrescente ao final de `src/landing.css`:

```css
.pricing-card-allowance { display: grid; gap: 7px; margin: 16px 0 22px; padding: 14px 0 0; border-top: 1px solid var(--border); list-style: none; }
.pricing-card-allowance li { color: var(--muted); font-size: 12.5px; line-height: 1.45; }
.pricing-card-allowance strong { color: var(--blue-bright); font-family: "Manrope", sans-serif; font-size: 15px; font-weight: 800; letter-spacing: -.02em; }
.pricing-card-more { display: inline-flex; gap: 7px; align-items: center; margin-top: 14px; padding: 0; border: 0; background: none; color: var(--muted-2); font-size: 11.5px; font-weight: 700; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.pricing-card-more:hover { color: var(--text); }
.pricing-card-more:focus-visible { outline: 2px solid var(--lime); outline-offset: 3px; }
```

> Já existe uma regra `.pricing-card-more { color: var(--muted-2); font-size: 9px; }` em `src/landing.css:133`, escrita para o antigo `<li>`. Como a nova regra tem a mesma especificidade e vem depois no arquivo, ela vence — inclusive no `font-size`, que sobe de 9 px para 11,5 px. Não apague a regra antiga neste passo; a Tarefa 11 revisa os tamanhos micro de uma vez só.

- [ ] **Step 9: Verificar no navegador**

```bash
npm run dev
```

Em `#planos`: cada card deve mostrar a franquia de créditos e documentos quando a API publicar esses números; nenhum card pode exibir `0 créditos`. Clicar em `Ver os outros N recursos` deve abrir a tabela comparativa e rolar até ela.

- [ ] **Step 10: Commit**

```bash
git add src/lib/pricing.js src/lib/pricing.test.js src/landing.js src/landing.css
git commit -m "feat(pricing): surface Copilot allowance as the real plan differentiator

Todo plano inclui o Copilot; o que muda é a franquia de créditos e
documentos. O card passa a mostrar esses números e a listar primeiro as
features que nem todo plano tem, no lugar do '+ N outros recursos' que
não orientava decisão. Valores zero ou ausentes são omitidos, porque o
contrato público não define semântica para zero.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Camada de prova

Fase 2 do spec. Logos e depoimento estão autorizados, mas os arquivos entram depois. O código renderiza a partir de `src/content/landing-content.js` e **oculta o bloco quando o conteúdo está vazio** — nunca inventa exemplo. As declarações de adequação, que não dependem de autorização externa (são descrição de produto), ficam sempre visíveis.

**Files:**
- Modify: `src/content/landing-content.js` (adicionar `clientLogos`, `testimonials`, `fitStatements`)
- Modify: `index.html` (nova `<section class="proof-band">` entre o hero e o `.signal-strip`, após a linha 118)
- Modify: `src/landing.js` (`renderProof`, chamada em `init`)
- Modify: `src/landing.css` (estilos, ao final)

**Interfaces:**
- Consumes: `.final-cta-proof` / `data-final-proof` da Tarefa 3; `escapeHtml` de `landing.js`
- Produces:
  - `clientLogos: Array<{ name: string, src: string, width: number, height: number }>`
  - `testimonials: Array<{ quote: string, author: string, role: string, company: string }>`
  - `fitStatements: string[]`

- [ ] **Step 1: Ampliar o arquivo de conteúdo**

Acrescente ao final de `src/content/landing-content.js`:

```js
/**
 * Logos de clientes autorizados. `src` precisa ser um caminho da própria
 * aplicação (ex.: "/brand/clients/acme.svg"), nunca uma URL de terceiro.
 * Lista vazia oculta o bloco inteiro.
 */
export const clientLogos = [];

/**
 * Depoimentos autorizados, com nome e cargo reais.
 * Lista vazia oculta o bloco inteiro.
 * Formato: { quote, author, role, company }
 */
export const testimonials = [];

/**
 * Adequação: descrição de produto, não claim de desempenho.
 * Sempre visível — não depende de autorização externa.
 */
export const fitStatements = [
  "Feito para operações com múltiplos canais",
  "Construído para o fluxo real do atendimento",
  "Humano no controle de cada decisão",
];
```

- [ ] **Step 2: Adicionar a seção de prova**

Em `index.html`, imediatamente após o `</section>` do hero (linha 118) e **antes** da `<section class="signal-strip">`, insira:

```html
        <section class="proof-band" aria-labelledby="proof-title">
          <div class="container proof-inner">
            <h2 id="proof-title" class="sr-only">Prova e adequação</h2>
            <ul class="proof-fit" data-proof-fit></ul>
            <div class="proof-clients" data-proof-clients hidden>
              <p class="proof-clients-label">Equipes que já atendem com o BChat</p>
              <ul class="proof-clients-list" data-proof-clients-list></ul>
            </div>
            <figure class="proof-quote glass-panel" data-proof-quote hidden>
              <blockquote data-proof-quote-text></blockquote>
              <figcaption><strong data-proof-quote-author></strong><span data-proof-quote-role></span></figcaption>
            </figure>
          </div>
        </section>
```

- [ ] **Step 3: Renderizar o conteúdo**

Em `src/landing.js`, amplie o import de conteúdo:

```js
import { clientLogos, contact, fitStatements, testimonials } from "./content/landing-content.js";
```

Adicione a função logo antes de `function init()`:

```js
  function renderProof() {
    const fit = $("[data-proof-fit]");
    if (fit) fit.innerHTML = fitStatements.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    const clients = $("[data-proof-clients]"); const clientsList = $("[data-proof-clients-list]");
    if (clients && clientsList) {
      clientsList.innerHTML = clientLogos
        .map((logo) => `<li><img src="${escapeHtml(logo.src)}" alt="${escapeHtml(logo.name)}" width="${Number(logo.width) || 120}" height="${Number(logo.height) || 32}" loading="lazy" decoding="async" /></li>`)
        .join("");
      clients.hidden = clientLogos.length === 0;
    }

    const quote = $("[data-proof-quote]"); const [primary] = testimonials;
    if (quote) {
      if (primary) {
        $("[data-proof-quote-text]", quote).textContent = `“${primary.quote}”`;
        $("[data-proof-quote-author]", quote).textContent = primary.author;
        $("[data-proof-quote-role]", quote).textContent = `${primary.role} · ${primary.company}`;
      }
      quote.hidden = !primary;
    }

    // Microprova junto ao CTA final: usa o segundo depoimento para não repetir
    // o primeiro; sem depoimento nenhum, cai nas declarações de adequação.
    const finalProof = $("[data-final-proof]");
    if (finalProof) {
      const near = testimonials[1] || testimonials[0];
      finalProof.innerHTML = near
        ? `<p>“${escapeHtml(near.quote)}”</p><small>${escapeHtml(near.author)} · ${escapeHtml(near.role)}, ${escapeHtml(near.company)}</small>`
        : `<p>${escapeHtml(fitStatements.join(" · "))}</p>`;
      finalProof.hidden = false;
    }
  }
```

Registre em `init()`:

```js
    setupHeader(); setupFeatureTabs(); setupComparison(); setupAnalytics(); setupDemoForm(); setupCtaFocus(); renderProof(); loadPlans();
```

- [ ] **Step 4: Estilizar**

Acrescente ao final de `src/landing.css`:

```css
.proof-band { border-top: 1px solid var(--border); background: rgba(17, 23, 33, .22); }
.proof-inner { display: grid; grid-template-columns: 1fr auto; gap: 44px 70px; align-items: center; padding: 44px 0; }
.proof-fit { display: flex; flex-wrap: wrap; gap: 10px 28px; margin: 0; padding: 0; list-style: none; }
.proof-fit li { display: flex; gap: 9px; align-items: center; color: var(--muted); font-size: 12.5px; }
.proof-fit li::before { content: ""; width: 5px; height: 5px; flex: 0 0 5px; border-radius: 50%; background: var(--blue-bright); }
.proof-clients { grid-column: 1 / -1; padding-top: 30px; border-top: 1px solid var(--border); }
.proof-clients[hidden] { display: none; }
.proof-clients-label { margin: 0 0 18px; color: var(--muted-2); font-size: 10px; font-weight: 700; letter-spacing: .17em; text-transform: uppercase; }
.proof-clients-list { display: flex; flex-wrap: wrap; gap: 24px 46px; align-items: center; margin: 0; padding: 0; list-style: none; }
.proof-clients-list img { height: 30px; width: auto; opacity: .72; filter: grayscale(1); transition: opacity .2s ease, filter .2s ease; }
.proof-clients-list img:hover { opacity: 1; filter: grayscale(0); }
.proof-quote { max-width: 420px; margin: 0; padding: 26px 28px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
.proof-quote[hidden] { display: none; }
.proof-quote blockquote { margin: 0; color: var(--text); font-size: 14px; font-style: italic; line-height: 1.65; }
.proof-quote figcaption { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 16px; font-size: 11.5px; }
.proof-quote figcaption strong { color: var(--text); }
.proof-quote figcaption span { color: var(--muted-2); }

@media (max-width: 980px) {
  .proof-inner { grid-template-columns: 1fr; gap: 30px; }
  .proof-quote { max-width: none; }
}
```

- [ ] **Step 5: Verificar os dois estados de conteúdo**

```bash
npm run dev
```

1. **Sem conteúdo (estado atual):** só a faixa de adequação aparece. Nenhum espaço vazio, nenhuma borda solta, nenhum bloco de logos ou citação renderizado.
2. **Com conteúdo:** preencha temporariamente `testimonials` com um objeto e confirme que a citação aparece na faixa e que a microprova do CTA final também. Reverta antes do commit — não commite conteúdo de exemplo.

- [ ] **Step 6: Commit**

```bash
git add index.html src/landing.js src/landing.css src/content/landing-content.js
git commit -m "feat(proof): add content-driven proof band and CTA micro-proof

Faixa de prova logo abaixo do hero e microprova junto ao CTA final. Logos
e depoimentos vêm de src/content/landing-content.js e cada bloco se
oculta quando a lista está vazia, então a página nunca publica prova
fabricada enquanto os assets autorizados não chegam.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Benefícios operacionais e cenários de uso

Fase 4 do spec. A copy atual é editorial (`Contexto sem caça ao tesouro`, `Agilidade com intenção`). Passa para a estrutura dor → ganho → efeito operacional, e ganha uma seção curta de cenários — o "onde ele ajuda mais" que hoje falta.

**Files:**
- Modify: `index.html:126` (intro da seção de benefícios), `index.html:128-130` (os três cards)
- Modify: `index.html` (nova `<section class="scenarios-section">` após o fecho de `#como-funciona`, linha 164)
- Modify: `index.html:54-58` e `index.html:39-43` (entrada de navegação para a nova seção)
- Modify: `src/landing.css` (estilos dos cenários, ao final)

**Interfaces:**
- Consumes: nada
- Produces: âncora `#cenarios`; classes `.scenarios-section`, `.scenarios-grid`, `.scenario-card`

- [ ] **Step 1: Reescrever a introdução dos benefícios**

Em `index.html`, na linha 126, substitua o parágrafo final da `.section-intro` — o trecho `<p>O Copilot organiza o que importa para que sua equipe possa estar presente na conversa, e não presa ao que veio antes dela.</p>` — por:

```html
<p>Três mudanças concretas no dia a dia de quem atende: o contexto chega pronto, a resposta vem apoiada em fonte e a decisão continua sendo humana.</p>
```

- [ ] **Step 2: Reescrever os três cards**

Substitua as linhas 128 a 130 por:

```html
              <article class="benefit-card benefit-card-large"><div class="card-index">01 <span>◒</span></div><div class="benefit-symbol symbol-context" aria-hidden="true"><span></span><span></span><span></span></div><h3>Retome o contexto sem reler a conversa inteira</h3><p>Quem assume o atendimento chega com o resumo e os pontos em aberto já organizados, em vez de rolar o histórico até entender o caso.</p><a href="#funcionalidades" class="card-link">Ver contexto em ação <span>↗</span></a></article>
              <article class="benefit-card"><div class="card-index">02 <span>◒</span></div><div class="benefit-symbol symbol-pulse" aria-hidden="true"><i></i><i></i><i></i><i></i></div><h3>Responda com apoio das fontes certas</h3><p>Cada sugestão vem com o documento que a originou ao lado, então a equipe confere a origem antes de enviar e mantém a resposta padronizada.</p><a href="#como-funciona" class="card-link">Como funciona <span>↗</span></a></article>
              <article class="benefit-card"><div class="card-index">03 <span>◒</span></div><div class="benefit-symbol symbol-stack" aria-hidden="true"><span>⌁</span><span>⌁</span><span>⌁</span></div><h3>Mantenha a equipe no controle das decisões</h3><p>Nada é enviado automaticamente por padrão. O Copilot propõe, e a pessoa escolhe usar, editar ou seguir outro caminho.</p><a href="#cenarios" class="card-link">Onde ele ajuda mais <span>↗</span></a></article>
```

- [ ] **Step 3: Adicionar a seção de cenários**

Em `index.html`, logo após o `</section>` que fecha `#como-funciona` (linha 164) e antes de `<section class="section pricing-section" id="planos" ...>`, insira:

```html
        <section class="section scenarios-section" id="cenarios" aria-labelledby="scenarios-title">
          <div class="container">
            <div class="section-intro split-intro"><div><span class="panel-kicker">ONDE ELE AJUDA MAIS</span><h2 id="scenarios-title">Quatro momentos<br /><em>que mudam de fato.</em></h2></div><p>O ganho aparece nos pontos em que a operação hoje perde tempo recompondo contexto.</p></div>
            <div class="scenarios-grid">
              <article class="scenario-card"><span class="scenario-index">01</span><h3>Picos de volume</h3><p>Quando a fila cresce, o resumo evita que cada atendimento comece do zero.</p></article>
              <article class="scenario-card"><span class="scenario-index">02</span><h3>Retomada de conversa</h3><p>Conversas que voltam depois de dias chegam com o histórico já sintetizado.</p></article>
              <article class="scenario-card"><span class="scenario-index">03</span><h3>Padronização entre turnos</h3><p>Times diferentes respondem a partir das mesmas fontes aprovadas.</p></article>
              <article class="scenario-card"><span class="scenario-index">04</span><h3>Transferência para uma pessoa</h3><p>A automação entrega o caso com contexto, em vez de recomeçar o atendimento.</p></article>
            </div>
          </div>
        </section>
```

- [ ] **Step 4: Registrar a seção na navegação**

Em `index.html:39-43` (`.desktop-nav`), insira após o link de `#como-funciona`:

```html
            <a href="#cenarios">Cenários</a>
```

Em `index.html:54-58` (`.mobile-menu nav`), insira após o item `Como funciona` e **renumere os contadores** para que a sequência continue correta:

```html
            <a href="#beneficios">Benefícios <span>01</span></a>
            <a href="#funcionalidades">Funcionalidades <span>02</span></a>
            <a href="#como-funciona">Como funciona <span>03</span></a>
            <a href="#cenarios">Cenários <span>04</span></a>
            <a href="#planos">Planos <span>05</span></a>
            <a href="#faq">FAQ <span>06</span></a>
```

- [ ] **Step 5: Estilizar os cenários**

Acrescente ao final de `src/landing.css`:

```css
.scenarios-section { padding: 110px 0; background: var(--canvas-soft); }
.scenarios-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 62px; }
.scenario-card { padding: 30px 26px 34px; border: 1px solid var(--border); border-radius: var(--radius-md); background: rgba(17, 23, 33, .5); }
.scenario-index { display: block; margin-bottom: 22px; color: var(--blue-bright); font-family: "Manrope", sans-serif; font-size: 11px; font-weight: 800; letter-spacing: .12em; }
.scenario-card h3 { margin: 0 0 12px; font-size: 18px; line-height: 1.2; }
.scenario-card p { margin: 0; color: var(--muted); font-size: 13.5px; line-height: 1.65; }

@media (max-width: 1100px) { .scenarios-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .scenarios-section { padding: 78px 0; } .scenarios-grid { grid-template-columns: 1fr; margin-top: 44px; } }
```

- [ ] **Step 6: Verificar**

```bash
npm run dev
```

Confira que `#cenarios` aparece entre "Como funciona" e "Planos", que os links de navegação desktop e mobile rolam até lá, e que o grid cai para 2 colunas em 1024 px e 1 coluna em 375 px.

- [ ] **Step 7: Commit**

```bash
git add index.html src/landing.css
git commit -m "feat(content): rewrite benefits in operational terms and add use scenarios

Os benefícios seguiam linguagem editorial e explicavam o mecanismo, não o
resultado. Passam para dor → ganho → efeito operacional. Nova seção curta
'Onde ele ajuda mais' cobre os quatro momentos em que a operação hoje
perde tempo recompondo contexto.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: FAQ de objeções de compra

O FAQ atual responde "o que é" e "como funciona". Fase 6 do spec pede as objeções que travam a decisão. Esta tarefa reordena o bloco pela jornada de compra, adiciona as perguntas comerciais e implementa o evento `faq_item_toggle`, que está no catálogo de analytics do spec técnico (§18) mas nunca foi implementado.

**Files:**
- Modify: `index.html:178` (a `.faq-list` inteira; adicionar `id` em cada `<details>`)
- Modify: `src/landing.js` (`setupFaqAnalytics`, chamada em `init`)

**Interfaces:**
- Consumes: `emit` de `landing.js`
- Produces: evento `faq_item_toggle` com `{ faq_id: string, expanded: boolean }` — sem PII, conforme §18

- [ ] **Step 1: Reescrever a lista de perguntas**

Em `index.html:178`, substitua todo o conteúdo de `<div class="faq-list"> ... </div>` por:

```html
<div class="faq-list">
  <details class="faq-item" id="faq-o-que-faz" open><summary>O que o BChat Copilot faz exatamente?<span></span></summary><div class="faq-answer"><p>O Copilot acompanha a conversa e oferece <strong>resumos</strong>, <strong>sugestões contextuais</strong> e <strong>conhecimento conectado</strong> à sua base de fontes. O time vê o contexto junto da mensagem, sem precisar procurar em outro lugar.</p></div></details>
  <details class="faq-item" id="faq-para-quem"><summary>Para que tipo de operação ele faz mais sentido?<span></span></summary><div class="faq-answer"><p>Para operações de <strong>suporte, vendas e pós-venda</strong> com múltiplos canais e volume crescente de conversas, principalmente quando várias pessoas atendem o mesmo cliente ao longo do tempo. Quanto mais contexto e conhecimento estiverem conectados, mais profundas ficam as sugestões.</p></div></details>
  <details class="faq-item" id="faq-planos"><summary>O que muda entre os planos?<span></span></summary><div class="faq-answer"><p><strong>Todos os planos publicados incluem o Copilot.</strong> O que varia entre eles é a franquia de créditos de Copilot e a quantidade de documentos que podem ficar conectados à base, além dos recursos gerais da plataforma. Os números de cada plano estão nos cards acima.</p></div></details>
  <details class="faq-item" id="faq-implantacao"><summary>Como funciona a implantação inicial?<span></span></summary><div class="faq-answer"><p>Você conecta o conhecimento que a equipe já usa — documentos PDF ou Markdown, páginas e referências — e o Copilot passa a usar esse material dentro do atendimento. Ajustes de automação e etiquetas ficam disponíveis conforme a operação amadurece.</p></div></details>
  <details class="faq-item" id="faq-time-tecnico"><summary>Preciso de time técnico para começar?<span></span></summary><div class="faq-answer"><p>Não para o uso básico. Conectar fontes e usar resumos e sugestões é configuração de produto. Integrações mais específicas do BChat podem envolver alguém técnico, e é justamente isso que a demonstração ajuda a mapear.</p></div></details>
  <details class="faq-item" id="faq-substitui-equipe"><summary>O Copilot responde no lugar da minha equipe?<span></span></summary><div class="faq-answer"><p>Não por padrão. O Copilot <strong>propõe</strong>, não decide. Sugestões aparecem como apoio e a equipe escolhe usar, editar ou seguir outro caminho. Automações só assumem parte da resposta quando você configura isso explicitamente.</p></div></details>
  <details class="faq-item" id="faq-fontes"><summary>De onde vêm as sugestões?<span></span></summary><div class="faq-answer"><p>Da conversa atual e das fontes que você conecta: <strong>documentos PDF e Markdown</strong>, conteúdo da web e a base de conhecimento da operação. As fontes ficam visíveis junto da sugestão para o time conferir a origem antes de enviar.</p></div></details>
  <details class="faq-item" id="faq-dados"><summary>Como funcionam privacidade, retenção e governança?<span></span></summary><div class="faq-answer"><p>As conversas são usadas como contexto para as sugestões da sua própria operação, seguindo as configurações de privacidade e <strong>etiquetas</strong> definidas no BChat. As opções de armazenamento e retenção disponíveis variam por plano — o time comercial detalha isso na demonstração.</p></div></details>
  <details class="faq-item" id="faq-ja-uso-bchat"><summary>O que muda para quem já usa o BChat?<span></span></summary><div class="faq-answer"><p>O Copilot entra <strong>ao lado</strong> do atendimento atual, sem substituir o fluxo. Contexto, resumos e sugestões aparecem como apoio, e o controle do próximo passo continua com quem atende.</p></div></details>
  <details class="faq-item" id="faq-falar-antes"><summary>Posso falar com alguém antes de contratar?<span></span></summary><div class="faq-answer"><p>Sim, e é o caminho recomendado. <a href="#contato">Solicite uma demonstração</a>: um especialista mostra o Copilot no fluxo real de atendimento e indica qual plano faz sentido para o seu volume, sem compromisso de contratação.</p></div></details>
</div>
```

- [ ] **Step 2: Ajustar a introdução do FAQ**

Ainda na linha 178, dentro de `.faq-intro`, troque o parágrafo `<p>O que o Copilot faz, o que ele não faz, e quem continua no comando da conversa.</p>` por:

```html
<p>O que ele faz, o que muda entre os planos, como é a implantação e quem continua no comando da conversa.</p>
```

- [ ] **Step 3: Instrumentar a abertura das perguntas**

Em `src/landing.js`, adicione a função logo antes de `function init()`:

```js
  function setupFaqAnalytics() {
    $$('.faq-item').forEach((item) => item.addEventListener("toggle", () => emit("faq_item_toggle", { faq_id: item.id || "unknown", expanded: item.open })));
  }
```

E registre em `init()`:

```js
    setupHeader(); setupFeatureTabs(); setupComparison(); setupAnalytics(); setupDemoForm(); setupCtaFocus(); setupFaqAnalytics(); renderProof(); loadPlans();
```

- [ ] **Step 4: Verificar o evento**

```bash
npm run dev
```

No console do navegador, execute `window.addEventListener("faq_item_toggle", (e) => console.log(e.detail))` e depois abra e feche duas perguntas. Espera-se `{ faq_id: "faq-para-quem", expanded: true }` seguido de `{ faq_id: "faq-para-quem", expanded: false }`. Nenhum evento pode conter texto da pergunta ou dado pessoal.

- [ ] **Step 5: Commit**

```bash
git add index.html src/landing.js
git commit -m "feat(faq): cover buying objections and instrument faq_item_toggle

O FAQ respondia uso, não compra. Ganha adequação por operação, o que muda
entre os planos, implantação, necessidade de time técnico, governança e o
convite explícito para falar com o time antes de contratar. Implementa o
evento faq_item_toggle já previsto no catálogo de analytics.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: SEO e dados estruturados

O básico está correto — `title`, `description`, Open Graph parcial, JSON-LD `SoftwareApplication`. Faltam canonical, `og:url`, `og:locale`, Twitter Card e a imagem social. O JSON-LD **não** ganha `offers`: o spec (§4.2, item 9) manda enriquecer os dados estruturados só quando o conteúdo comercial estabilizar, e os preços vêm de API em tempo de execução, então não estariam no HTML inicial que o Google lê.

**Files:**
- Modify: `index.html:11-25` (bloco de metadata e JSON-LD)

**Interfaces:**
- Consumes: a imagem OG listada nos Pré-requisitos de conteúdo
- Produces: nada consumido por outras tarefas

- [ ] **Step 1: Definir a URL canônica**

Confirme com o time qual é o domínio de produção da landing e substitua `https://SUBSTITUIR-PELO-DOMINIO` nos passos seguintes pelo valor real. Sem essa confirmação, **não faça esta tarefa** — uma canonical errada é pior que nenhuma canonical.

- [ ] **Step 2: Completar a metadata**

Em `index.html`, substitua as linhas 11 e 12 por:

```html
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://SUBSTITUIR-PELO-DOMINIO/" />
    <meta property="og:site_name" content="BChat" />
    <meta property="og:locale" content="pt_BR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="BChat Copilot: mais contexto para atender, mais confiança para responder" />
    <meta name="twitter:description" content="Resumos, sugestões e conhecimento conectado dentro da conversa, para operações que lidam com volume, contexto e consistência." />
    <link rel="canonical" href="https://SUBSTITUIR-PELO-DOMINIO/" />
    <link rel="icon" href="docs/logobchat.png" type="image/png" />
```

- [ ] **Step 3: Adicionar a imagem social — só se o asset existir**

Verifique primeiro:

```bash
ls -la public/og/bchat-copilot-og.png
```

Se o arquivo existir, adicione logo após a linha de `og:locale`:

```html
    <meta property="og:image" content="https://SUBSTITUIR-PELO-DOMINIO/og/bchat-copilot-og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="BChat Copilot: resumos, sugestões e conhecimento conectado dentro da conversa." />
    <meta name="twitter:image" content="https://SUBSTITUIR-PELO-DOMINIO/og/bchat-copilot-og.png" />
```

Se o arquivo **não** existir, pule este passo e registre a pendência. Uma tag `og:image` apontando para um 404 quebra o preview em todas as redes.

- [ ] **Step 4: Enriquecer o JSON-LD sem publicar preço**

Substitua o bloco `<script type="application/ld+json" id="structured-data">` (linhas 16-25) por:

```html
    <script type="application/ld+json" id="structured-data">
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "BChat Copilot",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Customer Service Software",
        "operatingSystem": "Web",
        "url": "https://SUBSTITUIR-PELO-DOMINIO/",
        "inLanguage": "pt-BR",
        "description": "Atendimento assistido por IA com resumos, sugestões contextuais e conhecimento conectado dentro da conversa, para equipes de suporte, vendas e pós-venda.",
        "publisher": {
          "@type": "Organization",
          "name": "BChat"
        }
      }
    </script>
```

> `offers`, `aggregateRating` e `review` ficam de fora deliberadamente: os preços chegam por fetch no cliente e não estão no HTML inicial, e não existe rating autorizado. Publicar qualquer um deles sem dado seria claim inventado.

- [ ] **Step 5: Validar**

```bash
npm run build && npm run preview
```

1. Cole o HTML de `dist/index.html` no [Rich Results Test](https://search.google.com/test/rich-results) e confirme zero erros no item `SoftwareApplication`.
2. Confirme que `<link rel="canonical">` aparece exatamente uma vez.
3. Se o `og:image` foi adicionado, confirme que a URL responde `200` no domínio de produção antes do deploy.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(seo): add canonical, social metadata and richer structured data

Canonical, og:url/locale/site_name e Twitter Card estavam ausentes. O
JSON-LD ganha url, idioma e publisher, mas segue sem offers: os preços
vêm de fetch no cliente e não estão no HTML inicial, então publicá-los
como dado estruturado seria alegar o que o crawler não vê.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Auditoria de acessibilidade e performance

Fase 7 do spec. A base já é boa — `lang="pt-BR"`, skip link, `aria-expanded` no menu, `prefers-reduced-motion` (`src/landing.css:142`) e fallback de glass sem blur em ≤600 px (`src/landing.css:143`). Esta tarefa mede o que ainda não foi medido e corrige três problemas já identificáveis por inspeção.

**Files:**
- Modify: `index.html:12` (favicon)
- Modify: `src/landing.css:127` (`.signal-inner`) e final do arquivo
- Create: `docs/superpowers/plans/2026-08-07-auditoria-a11y-perf.md` (relatório com os números medidos)

**Interfaces:**
- Consumes: a página completa das Tarefas 1–10
- Produces: relatório de auditoria versionado

- [ ] **Step 1: Trocar o favicon de 156 KB por SVG**

`docs/logobchat.png` tem 156 KB e é baixado em toda visita como ícone. O projeto já tem `docs/logo.svg`. Em `index.html:12`, substitua:

```html
    <link rel="icon" href="docs/logo.svg" type="image/svg+xml" />
    <link rel="alternate icon" href="docs/logobchat.png" type="image/png" />
```

- [ ] **Step 2: Corrigir o texto de 9 px**

`.signal-inner` usa `font-size: 9px` com `letter-spacing: .17em`, que fica ilegível e piora o reflow em zoom de 200%. Em `src/landing.css:127`, dentro da declaração `.signal-inner`, troque `font-size: 9px` por `font-size: 11px` e `letter-spacing: .17em` por `letter-spacing: .14em`.

- [ ] **Step 3: Medir contraste nas superfícies de risco**

Meça com o painel de acessibilidade do DevTools ou uma ferramenta de contraste, e registre no relatório. Alvo: **4,5:1** para texto normal, **3:1** para texto grande (≥24 px ou ≥19 px bold) e para bordas de componentes.

Baselines já calculados sobre `--canvas: #080b10`:

| Cor | Sobre | Contraste | Status |
| --- | --- | --- | --- |
| `--muted` `#93a0b3` | `--canvas` | 7,4:1 | passa AA e AAA |
| `--muted-2` `#7d8d9e` | `--canvas` | 5,8:1 | passa AA |

Meça e registre estes, que ainda não foram verificados:

- `--muted` e `--muted-2` sobre `.glass-panel` e sobre `.pricing-card`;
- texto do `.button-ghost` sobre o próprio fundo `rgba(17, 23, 33, .65)` **e** sobre o pior fundo possível atrás dele;
- borda de `.button-ghost` (`--border-strong`) contra o fundo adjacente;
- `.demo-form-privacy` e `.demo-error` dentro do formulário;
- o anel de foco `outline: 2px solid var(--lime)` sobre cada superfície onde ele aparece.

Corrija qualquer valor abaixo do alvo elevando o token, não aplicando exceção local.

- [ ] **Step 4: Rodar a auditoria automatizada**

```bash
npm run build && npm run preview
```

Em outro terminal:

```bash
npx @axe-core/cli http://localhost:4173 --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa
```

Esperado: zero violações. Registre no relatório qualquer item marcado como `incomplete` e a conclusão da verificação manual.

- [ ] **Step 5: Percorrer a página só pelo teclado**

Com a preview aberta, navegue exclusivamente por `Tab`, `Shift+Tab`, `Enter`, `Espaço` e setas. Confirme:

- o skip link é o primeiro foco e leva a `#conteudo`;
- nenhum foco fica escondido atrás do header sticky;
- as tabs de funcionalidades respondem a setas, `Home` e `End`;
- os `<details>` do FAQ abrem por `Enter`;
- os campos do formulário de demonstração são alcançáveis na ordem visual, e o erro de validação move o foco para o primeiro campo inválido;
- o card de sucesso recebe foco após o envio.

- [ ] **Step 6: Verificar reflow e zoom**

Em 320 px de largura e com zoom de 200%: nenhum conteúdo pode ser cortado, nenhum scroll horizontal pode surgir e nenhum texto pode sobrepor outro. Confira especialmente a faixa `.proof-band`, o grid `.scenarios-grid` e o formulário.

- [ ] **Step 7: Medir Core Web Vitals em laboratório**

```bash
npx lighthouse http://localhost:4173 --preset=desktop --output=json --output-path=./lighthouse-desktop.json --chrome-flags="--headless"
npx lighthouse http://localhost:4173 --output=json --output-path=./lighthouse-mobile.json --chrome-flags="--headless"
```

Registre LCP, CLS, TBT e o peso total no relatório. Alvos de laboratório: LCP ≤ 2,5 s, CLS ≤ 0,1. Se o LCP estourar, os dois suspeitos conhecidos são a fonte Manrope carregada por `<link>` bloqueante (`index.html:15`) e o `@font-face` de `Good Timing` (112,8 KB, OTF não subsetado, `src/landing.css:1-7`).

Antes de mexer nas fontes, confirme se o peso 600 do Manrope é usado:

```bash
grep -n "font-weight: 600" src/landing.css
```

Se não houver ocorrência em elemento que use a família Manrope, reduza a query para `family=Manrope:wght@700;800`.

- [ ] **Step 8: Escrever o relatório**

Crie `docs/superpowers/plans/2026-08-07-auditoria-a11y-perf.md` com quatro seções: **Contraste medido** (a tabela do passo 3 completa), **axe-core** (saída e conclusão dos `incomplete`), **Teclado, reflow e zoom** (checklist dos passos 5 e 6 com resultado), **Core Web Vitals** (números de laboratório mobile e desktop e o que foi otimizado). Liste ao final as pendências que exigem dados de campo (RUM) e não podem ser fechadas em laboratório.

- [ ] **Step 9: Limpar os artefatos**

```bash
rm -f lighthouse-desktop.json lighthouse-mobile.json
```

- [ ] **Step 10: Commit**

```bash
git add index.html src/landing.css docs/superpowers/plans/2026-08-07-auditoria-a11y-perf.md
git commit -m "fix(a11y,perf): lighten favicon, raise micro-copy size and record audit

Favicon passa a ser o SVG existente no lugar de um PNG de 156 KB baixado
em toda visita, e o texto de 9 px da faixa de sinais sobe para 11 px, que
sobrevive ao zoom de 200%. Relatório registra contraste medido, saída do
axe-core, percurso por teclado e Core Web Vitals de laboratório.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Verificação final antes do merge

Depois da Tarefa 11, rode a suíte completa e confira o checklist.

```bash
npm test && npm run build
```

- [ ] `npm test` passa com 41 testes
- [ ] `npm run build` conclui sem aviso
- [ ] `grep -rn "checkout" index.html src/` não retorna nada
- [ ] Só existe um rótulo de CTA primário na página: `Solicitar demonstração`
- [ ] Nenhuma métrica, logo, cliente ou depoimento aparece fora de `src/content/landing-content.js`
- [ ] Nenhum card de plano exibe `0` como franquia
- [ ] O selo do card destacado continua lendo `Em destaque` — nunca `Mais escolhido`, `Recomendado` ou `Mais vendido`, que exigiriam critério comercial que o payload não publica
- [ ] O seletor mensal/anual só aparece quando todos os planos com preço oferecem os dois ciclos
- [ ] Enviar o formulário vazio mostra erro por campo e move o foco; enviar preenchido leva ao estado de sucesso ou ao caminho alternativo de contato
- [ ] Nenhum evento de analytics carrega nome, e-mail, empresa ou conteúdo de conversa

## Pendências que este plano não fecha

Fora do escopo de código, mas necessárias antes de a página receber tráfego pago:

1. **`POST /public/api/v1/bchat/demo_requests` no ar** — contrato na Tarefa 2. Até lá o formulário cai no caminho alternativo, o que só funciona se `contact.salesEmail` ou `contact.salesWhatsappUrl` estiverem preenchidos.
2. **Assets de conteúdo** — logos, depoimento e imagem OG (tabela de Pré-requisitos).
3. **Domínio de produção confirmado** — bloqueia a canonical da Tarefa 10.
4. **Fornecedor de analytics e mecanismo de consentimento** — os eventos hoje são disparados como `CustomEvent` no `window` e ninguém escuta. Sem um adapter conectado, nenhum KPI da §9 do spec é medido.
5. **RUM em produção** — LCP, INP e CLS de campo, que laboratório não substitui.
6. **Experimentos da §8 do spec** — headline (A/B/C), rótulo do CTA e formulário inline vs. botão. Exigem ferramenta de teste e volume de tráfego; o formulário desta versão é a variante de controle.
7. **Comparação visual "antes e depois" do atendimento** (Fase 4, ação 3 do spec) — **deliberadamente adiada.** A seção de cenários da Tarefa 8 cobre o mesmo trabalho de comunicação em texto, com uma fração do custo. Um bloco comparativo com mockup lado a lado é um componente visual novo, com responsividade e acessibilidade próprias, e faz mais sentido depois que os experimentos de headline indicarem se a página precisa de mais peso argumentativo antes do pricing.
