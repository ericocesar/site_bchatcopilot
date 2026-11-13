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
