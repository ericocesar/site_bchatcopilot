# Landing Page de Planos — guia de consumo da API pública

Guia para construir a página `/planos` (ou `/pricing`) do site institucional consumindo a API
pública do BChat. Cobre os endpoints, o contrato JSON, uma receita de layout em colunas com
Tailwind, o handoff para o checkout e armadilhas conhecidas.

> Idioma de UI: `pt-BR`. Todo texto visível da LP deve passar por i18n da própria LP — esta
> documentação é técnica e fica em português neutro.

## Visão geral

A LP consome dois endpoints do namespace público `public/api/v1/bchat/`:

| Recurso | Endpoint | Método | Auth |
| --- | --- | --- | --- |
| Listar planos | `/public/api/v1/bchat/plans` | `GET` | nenhuma |
| Detalhe de um plano | `/public/api/v1/bchat/plans/:slug` | `GET` | nenhuma |
| Criar sessão de checkout | `/public/api/v1/bchat/checkout_sessions` | `POST` | nenhuma (rate-limited) |
| Criar cadastro de trial | `/public/api/v1/bchat/trial_signups` | `POST` | nenhuma (Turnstile + rate-limited) |

CORS: o `config/initializers/cors.rb` libera `origins '*'` para `/public/api/*` com `methods: :any`
e `headers: :any`. A LP pode chamar a API de qualquer domínio (inclusive localhost) sem proxy.

Somente planos com `status: published` e `is_public: true` aparecem nos endpoints públicos. O
escopo `Bchat::Plan.active_for_public` ordena por `sort_order ASC, id ASC` — preserve essa ordem
na LP. `featured` controla o destaque visual do card, mas não altera a ordenação do payload.

## Fonte de verdade: Super Admin → BChat → Planos

O catálogo usado pela LP é mantido em **Super Admin → BChat → Planos**. A página pública não
possui uma cópia local de nomes, preços, limites ou features: ela consulta o cadastro salvo em
`Bchat::Plan` por meio de `/public/api/v1/bchat/plans`.

Na edição de um plano (`app/views/super_admin/bchat/plans/edit.html.erb`), o administrador
controla:

- **Dados básicos**: nome interno/slug, nome público, descrição curta, descrição longa, status,
  ordem, destaque e exposição pública (`is_public`).
- **Preços**: ciclos mensal e anual, valor cheio, valor promocional, período de trial e flag
  `active`. Preços inativos não são enviados no payload público.
- **Limites**: usuários, caixas de entrada, contatos e campos extras do Copilot. O checkbox
  `Ilimitado` grava `0`; a LP pública apresenta esse valor como `Ilimitado`.
- **Features**: habilitação por plano, visibilidade pública e exibição no resumo reduzido do
  card. Recursos marcados como incluídos em todos os planos entram automaticamente na apresentação.

Depois de salvar, o plano precisa estar publicado e público para aparecer em `/planos`. A
atualização passa por `SuperAdmin::Bchat::PlansController` e
`Bchat::Plans::UpdateService`; publicação e arquivamento são operações separadas.

### Apresentação atual da LP

`app/javascript/entrypoints/plans_lp.js` transforma o cadastro administrativo em cards com:

- valor mensal centralizado e CTA em formato pill depois do painel de limites;
- painel de limites claro, com altura alinhada entre os cards;
- descrição curta e preço posicionados em linhas consistentes entre os planos;
- destaque visual para o plano `featured` e suporte ao toggle mensal/anual;
- cabeçalho com retorno ao início por ícone e aviso de teste gratuito.

Na configuração atual, a descrição curta pública do Enterprise é:

> Para operações complexas, múltiplos departamentos, franquias e redes com governança avançada.

### Dialog de trial

Quando o preço selecionado tem `trial_days > 0`, o CTA abre a dialog de criação de conta em três
passos. O fluxo usa os dados do plano e do preço selecionados, e o terceiro passo valida a senha
antes do envio:

- `Enter` valida e avança para o próximo passo; no último passo, envia o formulário.
- `Esc` cancela e fecha a dialog.
- Os campos `Senha` e `Confirme sua senha` ficam lado a lado em telas maiores.
- Após cinco segundos no passo de senha, cada requisito pendente recebe um destaque suave em
  vermelho e com aumento de 20% até ser atendido.

### Como montar os recursos presentes em todos os planos

Há duas apresentações diferentes para esses recursos e elas não devem ser misturadas:

1. A lista-resumo da coluna lateral é carregada pelo controller da página, sem depender de um
   plano específico:

   ```ruby
   @all_plans_features = Bchat::Feature
     .where(all_plans: true, is_public: true)
     .order(:category, :sort_order, :id)
   ```

2. Os recursos exibidos dentro de cada card vêm de `plan.features[]`. O método
   `Bchat::Plan#public_plan_features` já incorpora os recursos com `all_plans: true`; portanto,
   o frontend não deve acrescentar essa lista novamente, sob risco de duplicar itens.

Na view Rails, renderize a lista lateral somente quando houver itens e preserve a ordem retornada:

```erb
<% if @all_plans_features.present? %>
  <div>
    <p><%= t('bchat.public_plans.all_plans_include') %></p>
    <ul>
      <% @all_plans_features.each do |feature| %>
        <li><%= feature.name %></li>
      <% end %>
    </ul>
  </div>
<% end %>
```

Para incluir um novo recurso em todos os planos, cadastre ou edite o item no catálogo de features
do Super Admin e marque `all_plans: true` e `is_public: true`. Não é necessário alterar cada
plano nem hardcodar o nome na LP. Na próxima requisição, o controller o incluirá na lista lateral
e o serializer público o incluirá nos `features[]` dos planos publicados.

### Como montar o botão de testar o plano trial

O botão deve ser derivado do preço do ciclo atualmente selecionado. Assim, o toggle mensal/anual
pode mostrar um CTA de trial em um ciclo e o CTA de checkout no outro, sem regra baseada no slug
ou no nome do plano:

```js
const price = priceFor(plan, cycle);
const action = price?.trial_days > 0 ? 'trial' : 'checkout';
const label = price?.trial_days > 0 ? 'Comece grátis' : price ? 'Assinar' : 'Falar com vendas';

return `<button
  data-plan-slug="${escapeHtml(plan.slug)}"
  data-cycle="${escapeHtml(cycle)}"
  data-action="${action}"
>${label}</button>`;
```

O botão precisa carregar `data-plan-slug`, `data-cycle` e `data-action`. O listener delegado em
`#plans-container` recupera o plano e o preço pelo dataset; para `data-action="checkout"`, chama
`POST /public/api/v1/bchat/checkout_sessions`. Para `data-action="trial"`, chama a função que
abre a dialog descrita abaixo.

O trecho essencial do listener é:

```js
const plan = state.plans.find(item => item.slug === button.dataset.planSlug);
const price = plan && priceFor(plan, button.dataset.cycle);

if (button.dataset.action === 'trial') {
  openTrialModal(plan, price);
  return;
}

await createCheckout(plan, price);
```

Não mostre o botão de trial apenas porque o plano existe: o critério é o `trial_days` do preço
ativo e selecionado. Preços inativos não chegam à API pública; um preço ativo sem trial segue para
o checkout e um plano sem preço disponível deve manter o botão desabilitado.

### Como chamar a dialog de criação de conta

Mantenha a dialog criada uma única vez e reutilize-a a cada clique. O fluxo atual é:

1. Localizar o plano por `button.dataset.planSlug` e o preço por `button.dataset.cycle`.
2. Executar `ensureTrialModal()` para criar o markup e registrar os listeners somente se a dialog
   ainda não existir.
3. Salvar o contexto em `modalState.plan` e `modalState.price`, limpar o formulário, preencher
   título e descrição com o nome do plano e `price.trial_days`, exibir a dialog e iniciar o passo 1
   com `updateTrialStep(1)`.
4. No envio do terceiro passo, postar para `/public/api/v1/bchat/trial_signups` o payload abaixo:

   ```json
   {
     "plan_slug": "essencial",
     "billing_cycle": "monthly",
     "turnstile_token": "token-do-turnstile",
     "customer": {
       "name": "Nome completo",
       "email": "pessoa@empresa.com",
       "company_name": "Empresa",
       "phone": "+55 11 99999-9999",
       "password": "senha-do-usuario"
     }
   }
   ```

5. Persistir os headers de autenticação retornados, fechar o fluxo somente após uma resposta
   `2xx` e redirecionar para `data.redirect_url`. Em erro, manter a dialog aberta e mostrar a
   mensagem retornada pela API.

O endpoint exige que o rollout de `trial_signup` esteja habilitado e valida o token Turnstile
com a ação `signup`. Em ambientes locais, o bypass de Turnstile pode ser habilitado pela
configuração de desenvolvimento existente; em produção, configure a chave e mantenha a validação
ativa.

## Contrato JSON de `Bchat::Plan`

Fonte: `app/models/bchat/plan.rb#to_public_h`. O controller embrulha em `{ "data": [...] }`.

```json
{
  "data": [
    {
      "id": 1,
      "uuid": "5d2e1f0a-7c8b-4a3e-9b6e-1f0a2b3c4d5e",
      "slug": "essencial",
      "name": "BChat Essencial",
      "short_description": "Para times que estão começando.",
      "long_description": "WhatsApp, multi-canal e relatórios essenciais.",
      "featured": false,
      "prices": [
        {
          "billing_cycle": "monthly",
          "currency": "BRL",
          "amount": 199.00,
          "promotional_amount": 149.00,
          "effective_amount": 149.00,
          "trial_days": 7,
          "setup_fee": 0.00
        },
        {
          "billing_cycle": "yearly",
          "currency": "BRL",
          "amount": 1908.00,
          "promotional_amount": null,
          "effective_amount": 1908.00,
          "trial_days": 0,
          "setup_fee": 0.00
        }
      ],
      "limits": {
        "users_limit": 5,
        "inboxes_limit": 2,
        "teams_limit": 1,
        "contacts_limit": 5000,
        "automations_limit": 10,
        "campaigns_limit": 5,
        "macros_limit": 20,
        "integrations_limit": 3,
        "extra": {}
      },
      "features": [
        { "code": "whatsapp_baileys", "name": "WhatsApp não-oficial", "category": "canais", "enabled": true },
        { "code": "copilot",         "name": "Copilot",            "category": "ia",      "enabled": true },
        { "code": "relatorios_basicos", "name": "Relatórios básicos", "category": "relatorios", "enabled": true }
      ]
    }
  ]
}
```

### Campos importantes

| Campo | Uso na LP | Observação |
| --- | --- | --- |
| `slug` | rota do detalhe e da chamada de checkout | `find_by!` no servidor |
| `uuid` | enviar em integrações que pedem `plan_id` | `CheckoutSessionsController` aceita `id`, `uuid` ou `slug` |
| `name` / `public_name` | título do card | backend devolve `public_name` quando presente, senão cai no `name` interno |
| `short_description` | subtítulo do card | pode ser `null` |
| `featured` | badge "Mais escolhido" / coluna em destaque | só um por vez na prática, mas o backend não força singularidade |
| `prices[]` | tabela de preços (mensal/anual) | sempre respeitar `effective_amount`; `promotional_amount` pode ser `null` |
| `limits.users_limit` etc. | contrato legado de limites | valores brutos; para os cards atuais, use `plan_limits` |
| `plan_limits` | painel de limites da LP | chaves de apresentação como `users`, `inboxes`, `captain_credits` e `captain_documents` |
| `feature_groups` | página de comparação | grupos e recursos apresentados na tabela comparativa |
| `features[].code` | ícone / agrupamento visual | usar como chave de i18n da LP |
| `features[].category` | agrupar em seções dentro do card | ex.: "Canais", "IA", "Relatórios" |

### `GET /public/api/v1/bchat/plans/:slug`

Retorna o mesmo `to_public_h` para um plano. Resposta `404` com `{ "error": "nao encontrado" }`
quando o slug não existe ou o plano não está publicado. Use esse endpoint para a página de
detalhe (`/planos/:slug`).

## Contrato JSON de `Bchat::PlanPrice`

| Campo | Tipo | Significado |
| --- | --- | --- |
| `billing_cycle` | `monthly` \| `yearly` | ciclo |
| `currency` | ISO 4217 (`"BRL"`) | moeda |
| `amount` | number | preço cheio |
| `promotional_amount` | number \| null | preço promocional (sobrepõe `amount` se presente) |
| `effective_amount` | number | valor a cobrar — use **este** no card |
| `trial_days` | integer | dias de trial grátis |
| `setup_fee` | number | taxa de implantação única |

`active: false` nunca aparece no payload público (escopo `bchat_plan_prices.active` filtra).

## Layout em colunas — receita

A LP tradicional mostra 3 colunas (básico, profissional, empresarial) com a do meio em destaque
quando o plano tem `featured: true`. Use o snippet abaixo como ponto de partida — adapta para
Vue/React/HTML estático sem mudar a semântica.

### HTML estático + Tailwind (referência)

```html
<section id="planos" class="bg-slate-50 py-20">
  <div class="mx-auto max-w-6xl px-4">
    <h2 class="text-center text-3xl font-bold text-slate-900">Escolha o plano ideal</h2>
    <p class="mt-3 text-center text-slate-600">Cobrança em reais, sem fidelidade.</p>

    <div id="plans-grid" class="mt-12 grid gap-6 md:grid-cols-3"></div>
  </div>
</section>

<template id="plan-card-template">
  <article
    data-featured="false"
    class="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
  >
    <span data-featured-badge
          class="absolute -top-3 left-1/2 hidden -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
      Mais escolhido
    </span>
    <h3 data-name class="text-xl font-semibold text-slate-900"></h3>
    <p data-short-description class="mt-1 text-sm text-slate-500"></p>

    <div data-price class="mt-6">
      <span data-currency class="text-sm text-slate-500"></span>
      <span data-effective-amount class="text-4xl font-bold text-slate-900"></span>
      <span data-cycle class="text-sm text-slate-500"></span>
    </div>
    <p data-trial class="mt-1 text-xs text-emerald-600"></p>

    <ul data-features class="mt-6 space-y-2 text-sm text-slate-700"></ul>

    <button data-cta
            data-plan-slug=""
            class="mt-8 inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
      Contratar
    </button>
  </article>
</template>

<script>
  const API_BASE = 'https://app.bchat.com.br';
  const grid = document.getElementById('plans-grid');
  const tpl  = document.getElementById('plan-card-template');

  fetch(`${API_BASE}/public/api/v1/bchat/plans`)
    .then(r => r.json())
    .then(({ data }) => data.forEach(plan => grid.appendChild(renderCard(plan))));

  function renderCard(plan) {
    const node = tpl.content.cloneNode(true);
    const root = node.querySelector('article');

    root.dataset.featured = String(plan.featured);
    if (plan.featured) {
      root.classList.add('ring-2', 'ring-amber-400', 'scale-[1.02]');
      node.querySelector('[data-featured-badge]').classList.remove('hidden');
    }

    node.querySelector('[data-name]').textContent = plan.name;
    node.querySelector('[data-short-description]').textContent = plan.short_description || '';

    const monthly = plan.prices.find(p => p.billing_cycle === 'monthly') || plan.prices[0];
    node.querySelector('[data-currency]').textContent = monthly.currency + ' ';
    node.querySelector('[data-effective-amount]').textContent =
      monthly.effective_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    node.querySelector('[data-cycle]').textContent = '/mês';
    node.querySelector('[data-trial]').textContent =
      monthly.trial_days > 0 ? `${monthly.trial_days} dias grátis` : '';

    const list = node.querySelector('[data-features]');
    plan.features.forEach(f => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2';
      li.innerHTML = `<span aria-hidden="true">✓</span><span>${f.name}</span>`;
      list.appendChild(li);
    });

    const cta = node.querySelector('[data-cta]');
    cta.dataset.planSlug = plan.slug;
    cta.addEventListener('click', () => startCheckout(plan.slug, monthly.billing_cycle));

    return node;
  }

  async function startCheckout(planSlug, billingCycle) {
    const res = await fetch(`${API_BASE}/public/api/v1/bchat/checkout_sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_slug: planSlug,
        billing_cycle: billingCycle,
        customer: collectCustomer()
      })
    });
    const { data } = await res.json();
    if (data?.checkout_url) window.location.assign(data.checkout_url);
  }
</script>
```

### Estrutura por card

1. **Badge** "Mais escolhido" se `featured === true` (use `ring-2 ring-amber-400` no card).
2. **Título** (`name`) e **subtítulo** (`short_description`).
3. **Preço principal**: `effective_amount` do ciclo `monthly` (ou `yearly` se a LP tiver toggle).
4. **Trial** se `trial_days > 0` — texto verde discreto.
5. **Lista de features** agrupada por `category` se houver mais de 4 itens; senão, lista única.
6. **CTA**: chama `POST /checkout_sessions` e redireciona para `checkout_url`.

### Toggle mensal/anual

Se a LP tiver toggle, troque a chamada de `effective_amount` para o ciclo selecionado e mostre
`amount - effective_amount` como economia anual. **Não** invente taxa de desconto — calcule a
partir dos dois preços retornados.

## Handoff para o checkout

```http
POST /public/api/v1/bchat/checkout_sessions
Content-Type: application/json

{
  "plan_slug": "essencial",
  "billing_cycle": "monthly",
  "customer": {
    "name": "Fulana de Tal",
    "email": "fulana@example.com",
    "phone": "+5511999999999",
    "document": "00000000000"
  }
}
```

Resposta `201`:

```json
{
  "data": {
    "id": "uuid-da-sessao",
    "status": "initiated",
    "checkout_url": "https://app.bchat.com.br/checkout/...",
    "plan":  { "id": "uuid-do-plano", "slug": "essencial", "name": "BChat Essencial" },
    "price": { "billing_cycle": "monthly", "effective_amount": 149.00, "currency": "BRL", "trial_days": 7, "setup_fee": 0.0, "amount": 199.0, "promotional_amount": 149.0 },
    "expires_at": "2026-08-01T22:30:00Z"
  }
}
```

A LP só precisa de `data.checkout_url` para `window.location.assign(...)`. Os demais campos são
úteis para telemetria e para reexibir a oferta na página de obrigado.

Códigos de erro:

| Status | Quando | Ação na LP |
| --- | --- | --- |
| `404` | plano inexistente ou arquivado | esconder card antes do clique; nesse ponto, bug |
| `422` | `ArgumentError` (plano sem preço, billing inválido) | mostrar banner genérico "Tente novamente" |
| `503` | flag `BCHAT_BILLING_PROVIDER_CHECKOUT_ENABLED = false` | esconder CTA, exibir "Em breve" |

## i18n da LP

Strings visíveis vêm da i18n da LP, não da API. A API não retorna rótulos traduzidos. Sugestão de
chaves (`pt-BR`):

```json
{
  "plans": {
    "section_title": "Escolha o plano ideal",
    "section_subtitle": "Cobrança em reais, sem fidelidade.",
    "featured_badge": "Mais escolhido",
    "per_month": "/mês",
    "per_year": "/ano",
    "trial_days": "{n} dias grátis",
    "cta": "Contratar",
    "category": { "canais": "Canais", "ia": "Inteligência artificial", "relatorios": "Relatórios" },
    "errors": {
      "checkout_unavailable": "Checkout temporariamente indisponível. Tente em instantes.",
      "generic": "Não foi possível iniciar o checkout. Tente novamente."
    }
  }
}
```

Use o `code` da feature como chave de i18n, não o `name` retornado pela API — o nome do
`Bchat::Feature` pode mudar sem aviso e quebrar a LP.

## Boas práticas

- **Cache curto do lado da LP**: 60–120s. Planos mudam raramente, mas preço promocional pode
  entrar e sair a qualquer momento.
- **SSR/SSG**: a API é pública e barata — gere o JSON no build (Next.js `getStaticProps`,
  Astro, Nuxt) e revalide a cada 5 min.
- **Não confiar em `id` numérico** para persistir seleção no carrinho. Use `uuid` ou `slug`.
- **Não duplicar lógica de preço** no front. Se precisar de mensalizado no anual, mostre
  `(yearly.effective_amount / 12)` com duas casas decimais.
- **Imagem do card**: use o `featured` como única heurística para "plano em destaque". Se a LP
  tiver regra própria (ex.: sempre o do meio), combine com `sort_order` retornado pelo backend.

## Armadilhas conhecidas

- **Plano em rascunho** não aparece em `index` nem em `show`. Não tente chamar
  `GET /plans/rascunho` — recebe 404, mas o motivo fica opaco para o cliente.
- **Preço promocional zerado** é diferente de `null`. Trate `null` como "sem promoção" e
  `0.00` como "grátis" (caso legítimo de plano free).
- **`currency` por linha de preço**: um plano pode ter mensal em BRL e anual em USD. Não
  presuma BRL.
- **Limite `0` no cadastro**: o Super Admin usa `0` para representar `Ilimitado`; a apresentação
  pública converte esse valor para o texto localizado de ilimitado. Não trate esse valor como
  ausência de limite no card.
- **Slug reservado**: o model valida `slug` com `/\A[a-z0-9-]+\z/`. Não use acentos.
- **CORS em pré-produção**: o initializer libera `origins '*'` para `/public/api/*`. Em produção
  vale apertar se a LP for first-party.
- **Rate limiting**: a `public/api/v1/bchat/checkout_sessions` herda o rate limit do Rails. A LP
  não precisa retry agressivo; em caso de `429`, espere 2s e reexiba o CTA.

## Checklist de implementação

- [ ] Endpoint `GET /plans` retorna ≥ 1 plano publicado no ambiente alvo.
- [ ] Cards renderizam mesmo com `short_description` ausente, `features` vazio ou
      `prices.length === 1`.
- [ ] Toggle mensal/anual troca o `effective_amount` exibido e o `billing_cycle` enviado no
      `POST /checkout_sessions`.
- [ ] CTA redireciona para `data.checkout_url` e funciona em webview mobile.
- [ ] Estados de erro do checkout têm tratamento específico (422, 503, rede).
- [ ] Sem string hardcoded em português — tudo via i18n da LP.
- [ ] Lighthouse ≥ 90 (LP, não a API): imagens do card não devem bloquear render.

## Referências internas

- Controller público: `app/controllers/public/api/v1/bchat/plans_controller.rb`
- Checkout: `app/controllers/public/api/v1/bchat/checkout_sessions_controller.rb`
- Modelo: `app/models/bchat/plan.rb` (escopo `active_for_public`, `to_public_h`)
- Preço: `app/models/bchat/plan_price.rb` (`effective_amount`, `as_legacy_json`)
- Limites: `app/models/bchat/plan_limit.rb` (`LIMIT_FIELDS`, `extra_json`)
- Features: `app/models/bchat/plan_feature.rb` (`enabled`, `to_public_h`)
- Super Admin: `app/controllers/super_admin/bchat/plans_controller.rb` e
  `app/views/super_admin/bchat/plans/edit.html.erb`
- Apresentação pública: `app/views/public/plans_page/index.html.erb` e
  `app/javascript/entrypoints/plans_lp.js`
- CORS: `config/initializers/cors.rb`
- Roteamento: `config/routes.rb` (namespace `public/api/v1/bchat`)
- Overview de faturamento: `docs/guides/faturamento/README.md`
