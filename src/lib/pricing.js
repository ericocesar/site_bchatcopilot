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
