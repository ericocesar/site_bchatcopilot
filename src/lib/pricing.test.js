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
