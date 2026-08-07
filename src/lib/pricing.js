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
