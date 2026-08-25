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
 * não participam da interseção (senão um único card sem preço
 * derrubaria o seletor para a página inteira).
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

export const CATEGORY_ORDER = ["core", "channels", "productivity", "reporting", "enterprise", "other"];

const CATEGORY_LABELS = {
  core: "Núcleo",
  channels: "Canais",
  productivity: "Produtividade",
  reporting: "Relatórios",
  enterprise: "Enterprise",
  other: "Outros",
};

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || CATEGORY_LABELS.other;
}

/**
 * `Bchat::Plan` no payload público aceita duas apresentações de limites:
 *
 *  1. `plan_limits` — chaves de apresentação (users, inboxes,
 *     captain_credits, captain_documents, emails_monthly, …) já filtradas
 *     pelo servidor conforme publicação comercial vigente.
 *  2. `limits.extra` — fallback legado, com as chaves internas do modelo
 *     (`captain_credits`, `captain_documents`). Usado apenas quando
 *     `plan_limits` está ausente.
 *
 * Quando o plano tem `users_limit: 0` ou outro limite zero, o backend
 * sinaliza "Ilimitado" — o frontend apenas exibe o número; a regra de
 * apresentação de "Ilimitado" é da própria LP.
 */
const PRESENTATION_LIMITS = [
  { key: "users", label: "usuários", fallback: "users_limit" },
  { key: "inboxes", label: "caixas de entrada", fallback: "inboxes_limit" },
  { key: "teams", label: "times", fallback: "teams_limit" },
  { key: "contacts", label: "contatos", fallback: "contacts_limit" },
  { key: "automations", label: "automações", fallback: "automations_limit" },
  { key: "campaigns", label: "campanhas", fallback: "campaigns_limit" },
  { key: "macros", label: "macros", fallback: "macros_limit" },
  { key: "integrations", label: "integrações", fallback: "integrations_limit" },
];

const COPILOT_ALLOWANCE = [
  { key: "captain_credits", label: "créditos de Copilot / mês" },
  { key: "captain_documents", label: "documentos na base" },
];

export function planLimits(plan) {
  const presentation = plan?.plan_limits;
  const legacy = plan?.limits?.extra;
  const fallback = plan?.limits;

  if (presentation && typeof presentation === "object") {
    return PRESENTATION_LIMITS
      .map(({ key, label }) => ({ key, label, value: presentation[key] }))
      .filter(({ value }) => Number.isFinite(value) && value > 0);
  }

  if (fallback && typeof fallback === "object") {
    return PRESENTATION_LIMITS
      .map(({ key, label, fallback: legacyKey }) => ({ key, label, value: fallback[legacyKey] }))
      .filter(({ value }) => Number.isFinite(value) && value > 0);
  }

  if (legacy && typeof legacy === "object") {
    return [];
  }
  return [];
}

/**
 * Franquia do Copilot — créditos mensais e documentos na base.
 * Lê de `plan_limits.captain_credits` / `captain_documents` quando há
 * apresentação, caindo para `limits.extra` no legado. Coerce strings
 * numéricas para número, conforme snapshot da API.
 */
export function copilotAllowance(plan) {
  const presentation = plan?.plan_limits;
  const extra = plan?.limits?.extra;

  const coerce = (raw) => {
    if (typeof raw === "number") return raw;
    if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) return Number(raw);
    return NaN;
  };
  const read = (key) => {
    if (presentation) { const coerced = coerce(presentation[key]); if (Number.isFinite(coerced)) return coerced; }
    if (extra) { const coerced = coerce(extra[key]); if (Number.isFinite(coerced)) return coerced; }
    return NaN;
  };

  return COPILOT_ALLOWANCE
    .map(({ key, label }) => ({ key, label, value: read(key) }))
    .filter(({ value }) => Number.isFinite(value) && value > 0);
}

/**
 * Recursos comuns a todos os planos publicados.
 * O endpoint público inclui esses itens em `features[]` por meio de
 * `Bchat::Plan#public_plan_features`; este helper apenas os particiona
 * para a sidebar lateral.
 */
export function sharedFeatureGroups(plans) {
  if (!Array.isArray(plans) || !plans.length) return [];

  const features = new Map();
  plans.forEach((plan) => (plan.features || []).forEach((feature) => {
    if (!feature?.code) return;
    features.set(feature.code, feature);
  }));

  const grouped = {};
  features.forEach((feature) => {
    const category = CATEGORY_ORDER.includes(feature.category) ? feature.category : "other";
    (grouped[category] ||= []).push(feature);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
    .map(([category, items]) => ({ category, label: categoryLabel(category), items }));
}

/**
 * Nome de apresentação do plano — backend pode devolver `public_name`
 * além do `name` interno.
 */
export function planDisplayName(plan) {
  return plan?.public_name?.trim() || plan?.name?.trim() || "";
}

/**
 * Decide a ação do CTA primário do card.
 *  - `trial`     → preço ativo tem `trial_days > 0` (abre dialog)
 *  - `checkout`  → plano publicável com preço ativo (POST checkout_sessions)
 *  - `consult`   → plano sem preço ativo (Enterprise, sob consulta)
 */
export function planCardAction(plan, cycle) {
  const price = resolveCardPrice(plan, cycle);
  if (price && Number(price.trial_days) > 0) return { kind: "trial", price };
  if (price) return { kind: "checkout", price };
  return { kind: "consult", price: null };
}

/**
 * Rótulos do CTA primário derivados da ação e do ciclo.
 */
export function planCardCtaLabel(plan, cycle) {
  const action = planCardAction(plan, cycle);
  if (action.kind === "trial") return { label: "Comece grátis", kind: action.kind, price: action.price };
  if (action.kind === "checkout") {
    const suffix = cycle === "yearly" ? " anual" : "";
    return { label: `Assinar plano${suffix}`, kind: action.kind, price: action.price };
  }
  return { label: "Falar com vendas", kind: action.kind, price: action.price };
}

/**
 * Destaques do card: primeiro o que nem todo plano tem (diferencial real),
 * depois a ordem de categoria; dentro do mesmo grupo, a ordem original de
 * declaração é preservada (sort estável). Determinístico.
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
    .sort((a, b) => isShared(a) - isShared(b) || categoryRank(a) - categoryRank(b))
    .slice(0, limit);
}
