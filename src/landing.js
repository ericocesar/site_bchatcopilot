import {
  CATEGORY_ORDER,
  copilotAllowance,
  cycleLabel,
  planCardAction,
  planCardCtaLabel,
  planDisplayName,
  planHighlights,
  planLimits,
  resolveCardPrice,
  sharedCycles,
  sharedFeatureGroups,
} from "./lib/pricing.js";
import { buildLeadPayload, submitLead, validateLead } from "./lib/leads.js";
import { contact, fitStatements } from "./content/landing-content.js";

(() => {
  "use strict";

  const state = {
    plans: [],
    rawPlans: [],
    billingCycle: "monthly",
    selectedFeature: "contexto",
    apiState: "loading",
    cacheKey: "bchat-copilot-public-plans-v1",
    cacheStamp: null,
    apiBase: "",
  };

  const configuredApiUrl = (import.meta.env.VITE_BCHAT_API_URL || "").trim().replace(/\/+$/, "");
  const configuredTrialTurnstileSiteKey = (import.meta.env.VITE_BCHAT_TURNSTILE_SITE_KEY || "").trim();
  state.apiBase = configuredApiUrl || "";
  const apiBase = state.apiBase;
  const plansEndpoint = apiBase
    ? `${apiBase}/public/api/v1/bchat/plans`
    : document.body.dataset.plansEndpoint || "/public/api/v1/bchat/plans";
  const checkoutEndpoint = apiBase
    ? `${apiBase}/public/api/v1/bchat/checkout_sessions`
    : "/public/api/v1/bchat/checkout_sessions";
  const trialEndpoint = apiBase
    ? `${apiBase}/public/api/v1/bchat/trial_signups`
    : "/public/api/v1/bchat/trial_signups";
  const demoEndpoint = apiBase
    ? `${apiBase}/public/api/v1/bchat/demo_requests`
    : "/public/api/v1/bchat/demo_requests";

  const allowedExtra = new Set(["captain_credits", "captain_documents", "emails_monthly"]);
  const demoPlans = [
    { id: 2, uuid: "demo-profissional", slug: "profissional", public_name: "Profissional", name: "Profissional", short_description: "Para equipes que querem mais contexto no atendimento.", long_description: null, featured: true, prices: [{ billing_cycle: "monthly", currency: "BRL", amount: 249, promotional_amount: null, effective_amount: 249, trial_days: 7, setup_fee: 0 }], limits: { users_limit: 15, inboxes_limit: 5, teams_limit: 4, contacts_limit: 5000, automations_limit: 20, campaigns_limit: 10, macros_limit: 50, integrations_limit: 8, extra: { captain_credits: 500, captain_documents: 50 } }, plan_limits: { users: 15, inboxes: 5, teams: 4, contacts: 5000, captain_credits: 500, captain_documents: 50 }, features: [{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }, { code: "summaries", name: "Resumos de conversas", category: "productivity", enabled: true }, { code: "knowledge_base", name: "Base de conhecimento conectada", category: "productivity", enabled: true }, { code: "reports", name: "Relatórios", category: "reporting", enabled: true }] },
    { id: 1, uuid: "demo-essencial", slug: "essencial", public_name: "Essencial", name: "Essencial", short_description: "O ponto de partida para organizar seu atendimento.", long_description: null, featured: false, prices: [{ billing_cycle: "monthly", currency: "BRL", amount: 99, promotional_amount: null, effective_amount: 99, trial_days: 0, setup_fee: 0 }, { billing_cycle: "yearly", currency: "BRL", amount: 990, promotional_amount: null, effective_amount: 990, trial_days: 0, setup_fee: 0 }], limits: { users_limit: 5, inboxes_limit: 2, teams_limit: 2, contacts_limit: 1000, automations_limit: 5, campaigns_limit: 3, macros_limit: 15, integrations_limit: 3, extra: { captain_credits: 100, captain_documents: 10 } }, plan_limits: { users: 5, inboxes: 2, teams: 2, contacts: 1000, captain_credits: 100, captain_documents: 10 }, features: [{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }, { code: "inboxes", name: "Canais de atendimento", category: "channels", enabled: true }, { code: "reports", name: "Relatórios", category: "reporting", enabled: true }] },
    { id: 3, uuid: "demo-enterprise", slug: "enterprise", public_name: "Enterprise", name: "Enterprise", short_description: "Para operações complexas, múltiplos departamentos, franquias e redes com governança avançada.", long_description: null, featured: false, prices: [], limits: { users_limit: 0, inboxes_limit: 0, teams_limit: 0, contacts_limit: 0, automations_limit: 0, campaigns_limit: 0, macros_limit: 0, integrations_limit: 0, extra: { captain_credits: 5000, captain_documents: 500 } }, plan_limits: { captain_credits: 5000, captain_documents: 500 }, features: [{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }, { code: "knowledge_base", name: "Base de conhecimento conectada", category: "productivity", enabled: true }, { code: "enterprise_support", name: "Atendimento personalizado", category: "enterprise", enabled: true }] },
  ];

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
  function asNonNegativeInteger(value) { const number = typeof value === "number" ? value : Number(value); return Number.isInteger(number) && number >= 0 ? number : null; }
  function isValidPlan(plan) {
    return isRecord(plan) && typeof plan.slug === "string" && typeof plan.name === "string" && Array.isArray(plan.prices) && Array.isArray(plan.features);
  }
  function validatePlansPayload(payload) {
    if (!isRecord(payload) || !Array.isArray(payload.data)) throw new Error("Formato de planos inválido");
    const data = payload.data.filter(isValidPlan);
    if (data.length !== payload.data.length) throw new Error("Um ou mais planos estão incompletos");
    return { data };
  }
  function readCachedPlans() {
    try { const cached = JSON.parse(localStorage.getItem(state.cacheKey)); return cached && Array.isArray(cached.data) ? cached : null; } catch { return null; }
  }
  function writeCachedPlans(data) {
    try { localStorage.setItem(state.cacheKey, JSON.stringify({ data, savedAt: Date.now() })); state.cacheStamp = Date.now(); } catch { /* cache é opcional */ }
  }
  async function fetchPlans() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch(plansEndpoint, { method: "GET", headers: { Accept: "application/json" }, signal: controller.signal, credentials: "omit" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return validatePlansPayload(await response.json()).data;
    } finally { window.clearTimeout(timeout); }
  }
  function normalizeExtra(extra) {
    if (!isRecord(extra)) return {};
    return Object.fromEntries([...Object.entries(extra)].filter(([key, value]) => allowedExtra.has(key) && (asNonNegativeInteger(value) !== null)).map(([key, value]) => [key, asNonNegativeInteger(value)]));
  }
  function normalizePlan(plan) {
    const prices = plan.prices.filter((price) => isRecord(price) && ["monthly", "yearly"].includes(price.billing_cycle) && typeof price.currency === "string" && typeof price.effective_amount === "number").map((price) => ({ ...price, effective_amount: Math.max(0, price.effective_amount) }));
    const features = plan.features.filter((feature) => isRecord(feature) && typeof feature.code === "string" && typeof feature.name === "string").map((feature) => ({ ...feature, category: CATEGORY_ORDER.includes(feature.category) ? feature.category : "other" }));
    const planLimitsInput = isRecord(plan.plan_limits) ? plan.plan_limits : null;
    return {
      ...plan,
      prices,
      features,
      limits: isRecord(plan.limits) ? { ...plan.limits, extra: normalizeExtra(plan.limits.extra) } : { extra: {} },
      plan_limits: planLimitsInput,
    };
  }
  function normalizePlans(plans) { return plans.map(normalizePlan); }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
  function formatCurrency(amount, currency) { try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL", maximumFractionDigits: 0 }).format(amount); } catch { return `${currency || "R$"} ${amount}`; } }
  function formatCycle(cycle) { return cycle === "yearly" ? "ano" : "mês"; }

  function emit(name, properties = {}) { window.dispatchEvent(new CustomEvent(name, { detail: properties })); }

  function stampLabel() {
    if (!state.cacheStamp) return "agora";
    const seconds = Math.max(1, Math.round((Date.now() - state.cacheStamp) / 1000));
    if (seconds < 60) return `há ${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    return new Date(state.cacheStamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function updatePricingStatus(kind, message, options = {}) {
    const element = $("[data-pricing-status]"); if (!element) return;
    element.className = `pricing-status ${kind ? `is-${kind}` : ""}`;
    const text = element.querySelector(".pricing-status-text");
    if (text) text.textContent = message;
    const meta = element.querySelector("[data-pricing-status-meta]");
    if (meta) meta.textContent = options.meta || stampLabel();
  }

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
    $$('[data-cycle]', control).forEach((button) => button.addEventListener("click", () => { if (state.billingCycle === button.dataset.cycle) return; const previous = state.billingCycle; state.billingCycle = button.dataset.cycle; emit("pricing_cycle_change", { from_cycle: previous, to_cycle: state.billingCycle }); renderBillingControl(); renderPricing(); renderRail(); }));
  }

  function priceBlock(plan) {
    const price = resolveCardPrice(plan, state.billingCycle);
    if (!price) {
      return `<div class="price-sheet"><span class="price-tag">Sob consulta</span><span class="price-cycle">plano enterprise</span></div>`;
    }
    const hasPromo = price.promotional_amount !== null && price.promotional_amount !== undefined && price.promotional_amount < price.amount;
    const isFree = price.effective_amount === 0;
    const value = isFree ? "Grátis" : formatCurrency(price.effective_amount, price.currency);
    const cycle = cycleLabel(price.billing_cycle, "period");
    return `
      <div class="price-sheet">
        ${hasPromo ? `<span class="price-old">${formatCurrency(price.amount, price.currency)}</span>` : ""}
        <span class="price-value">${value}</span>
        <span class="price-cycle">/ ${cycle}</span>
        ${price.trial_days > 0 ? `<span class="price-trial">${price.trial_days} dias grátis</span>` : ""}
      </div>`;
  }

  function renderPricing() {
    const grid = $("[data-pricing-grid]"); if (!grid) return;
    if (!state.plans.length) {
      grid.innerHTML = `<div class="pricing-empty"><strong>Nenhum plano publicado no momento.</strong><p>O catálogo está sendo atualizado. Fale com o time para encontrar o melhor próximo passo.</p><a class="button button-primary" href="#contato">Solicitar demonstração <span aria-hidden="true">↗</span></a></div>`;
      return;
    }
    const cards = state.plans.map((plan, index) => {
      const highlights = planHighlights(plan, state.plans, 4);
      const limits = planLimits(plan);
      const allowance = copilotAllowance(plan);
      const ctaInfo = planCardCtaLabel(plan, state.billingCycle);
      const featured = plan.featured ? `<span class="featured-label">Em destaque</span>` : "";
      const indexLabel = String(index + 1).padStart(2, "0");
      const slugVariant = plan.slug?.replace(/^bchat-/, "");
      const cardVariant = ["essencial", "profissional", "enterprise"].includes(slugVariant) ? slugVariant : "default";
      const limitsMarkup = limits.length
        ? `<dl class="pricing-card-limits">${limits.map((limit) => `<div><dt>${escapeHtml(limit.label)}</dt><dd>${new Intl.NumberFormat("pt-BR").format(limit.value)}</dd></div>`).join("")}</dl>`
        : "";
      const allowanceMarkup = allowance.length
        ? `<ul class="pricing-card-allowance">${allowance.map((item) => `<li><strong>${new Intl.NumberFormat("pt-BR").format(item.value)}</strong> ${escapeHtml(item.label)}</li>`).join("")}</ul>`
        : "";
      const featureNames = highlights.length
        ? `<ul class="pricing-card-features">${highlights.map((item) => `<li><span class="feature-dot" aria-hidden="true"></span>${escapeHtml(item.name)}</li>`).join("")}</ul>`
        : `<p class="pricing-card-empty-features">Recursos conforme configuração publicada</p>`;
      const remaining = plan.features.length - highlights.length;
      const ctaClass = ctaInfo.kind === "trial" ? "button-trial" : ctaInfo.kind === "checkout" ? "button-primary" : "button-ghost";
      const ctaIcon = ctaInfo.kind === "trial" ? "✦" : ctaInfo.kind === "checkout" ? "↗" : "→";
      const cta = `<button class="button ${ctaClass} pricing-card-cta" type="button" data-cta-kind="${ctaInfo.kind}" data-plan-slug="${escapeHtml(plan.slug)}" data-cycle="${escapeHtml(state.billingCycle || "")}" data-analytics="pricing_card_cta_click" data-placement="pricing_card">${escapeHtml(ctaInfo.label)} <span aria-hidden="true">${ctaIcon}</span></button>`;

      return `<article class="pricing-card pricing-card-${cardVariant} ${plan.featured ? "is-featured" : ""}" data-plan-slug="${escapeHtml(plan.slug)}">
        ${featured}
        <div class="pricing-card-atmosphere" aria-hidden="true"><span></span><span></span><span></span><i></i></div>
        <div class="pricing-card-rail" aria-hidden="true"></div>
        <header class="pricing-card-head">
          <span class="card-index">${indexLabel}</span>
          <h3>${escapeHtml(planDisplayName(plan))}</h3>
        </header>
        <p class="pricing-card-description">${escapeHtml(plan.short_description || "Plano BChat para sua operação de atendimento.")}</p>
        ${priceBlock(plan)}
        ${allowanceMarkup}
        ${limitsMarkup}
        ${cta}
        ${featureNames}
        ${remaining > 0 ? `<button class="pricing-card-more" type="button" data-comparison-toggle-from-card>Ver mais ${remaining} recursos <span aria-hidden="true">↓</span></button>` : ""}
      </article>`;
    }).join("");
    grid.innerHTML = cards;

    $$("[data-cta-kind]", grid).forEach((button) => button.addEventListener("click", () => {
      const slug = button.dataset.planSlug;
      const plan = state.plans.find((item) => item.slug === slug);
      if (!plan) return;
      const kind = button.dataset.ctaKind;
      if (kind === "trial") { openTrialDialog(plan, planCardAction(plan, state.billingCycle).price); return; }
      if (kind === "checkout") { startCheckout(plan, planCardAction(plan, state.billingCycle).price); return; }
      window.location.assign("#contato");
    }));
  }

  function renderRail() {
    const rail = $("[data-pricing-rail]"); if (!rail) return;
    const groups = sharedFeatureGroups(state.plans);
    if (!groups.length) { rail.hidden = true; rail.innerHTML = ""; return; }
    rail.hidden = false;
    rail.innerHTML = `
      <div class="pricing-rail-inner">
        <div class="pricing-rail-kicker"><span>✦</span> Incluso em todos os planos</div>
        <p class="pricing-rail-lede">Recursos que você encontra em qualquer plano publicado do BChat Copilot. A franquia de créditos e os limites específicos variam por plano.</p>
        ${groups.map((group) => `
          <section class="pricing-rail-group">
            <h4>${escapeHtml(group.label)}</h4>
            <ul>${group.items.map((feature) => `<li><span class="feature-dot" aria-hidden="true"></span>${escapeHtml(feature.name)}</li>`).join("")}</ul>
          </section>
        `).join("")}
      </div>`;
  }

  function renderComparison() {
    const container = $("[data-pricing-comparison]"); if (!container || !state.plans.length) return;
    const groups = sharedFeatureGroups(state.plans);
    const head = state.plans.map((plan) => `<th scope="col"><span class="card-index">${String(state.plans.indexOf(plan) + 1).padStart(2, "0")}</span>${escapeHtml(planDisplayName(plan))}</th>`).join("");
    const rows = groups.map((group) => `<tr class="comparison-group"><td colspan="${state.plans.length + 1}">${escapeHtml(group.label)}</td></tr>${group.items.map((feature) => `<tr><th scope="row">${escapeHtml(feature.name)}</th>${state.plans.map((plan) => { const included = plan.features.some((item) => item.code === feature.code); return `<td aria-label="${included ? "Incluído" : "Não incluído"}"><span class="${included ? "included" : "not-included"}" aria-hidden="true">${included ? "✓" : "–"}</span><span class="sr-only">${included ? "Incluído" : "Não incluído"}</span></td>`; }).join("")}</tr>`).join("")}`).join("");
    container.innerHTML = `<table class="comparison-table"><caption>Comparação completa de recursos publicados</caption><thead><tr><th scope="col">Recursos</th>${head}</tr></thead><tbody>${rows || `<tr><td colspan="${state.plans.length + 1}">Nenhum recurso comparável publicado.</td></tr>`}</tbody></table>`;
  }

  function setPlans(plans, kind, message) { state.rawPlans = plans; state.plans = normalizePlans(plans); state.apiState = kind; renderBillingControl(); renderPricing(); renderRail(); renderComparison(); updatePricingStatus(kind === "stale" ? "stale" : kind === "error" ? "error" : "", message); }

  async function loadPlans(isRetry = false) {
    const cached = readCachedPlans();
    if (!isRetry && cached?.data?.length) {
      state.cacheStamp = cached.savedAt || null;
      setPlans(cached.data, "stale", "Catálogo em cache · atualizando");
    }
    try {
      const plans = await fetchPlans();
      state.cacheStamp = Date.now();
      writeCachedPlans(plans);
      setPlans(plans, "success", "Catálogo atualizado");
      emit("pricing_section_view", { plans_count: plans.length, cache_state: cached ? "cache-revalidated" : "network" });
    } catch (error) {
      if (cached?.data?.length && !isRetry) {
        state.cacheStamp = cached.savedAt || null;
        setPlans(cached.data, "stale", "Último catálogo válido · atualização pendente");
        emit("plans_load_error", { stage: "revalidate", http_status: error.message, has_stale_cache: true });
      }
      else if (location.protocol === "file:") {
        state.cacheStamp = Date.now();
        setPlans(demoPlans, "stale", "Prévia de demonstração · conecte a API pública");
      }
      else {
        state.apiState = "error";
        const grid = $("[data-pricing-grid]");
        grid.innerHTML = `<div class="pricing-error"><strong>Não foi possível carregar os planos.</strong><p>Verifique a conexão e tente novamente. O restante da página continua disponível.</p><button class="retry-button" type="button" data-retry>Tentar novamente</button></div>`;
        updatePricingStatus("error", "Catálogo indisponível");
        emit("plans_load_error", { stage: "initial", http_status: error.message, has_stale_cache: false });
        $("[data-retry]")?.addEventListener("click", () => loadPlans(true));
      }
    }
  }

  function trialOfferFor(plans) {
    return (Array.isArray(plans) ? plans : []).map((plan) => {
      const activePrice = resolveCardPrice(plan, state.billingCycle);
      const trialPrice = activePrice?.trial_days > 0 ? activePrice : plan.prices?.find((price) => price.trial_days > 0);
      return trialPrice ? { plan, price: trialPrice } : null;
    }).find(Boolean) || null;
  }

  function openHeaderTrial() {
    const offer = trialOfferFor(state.plans) || trialOfferFor(demoPlans);
    if (!offer) {
      window.location.hash = "#decisao";
      updatePricingStatus("error", "Nenhum teste gratuito disponível");
      return;
    }
    openTrialDialog(offer.plan, offer.price);
  }

  function setupHeader() {
    const header = $("[data-header]"); const toggle = $("[data-menu-toggle]"); const menu = $("[data-mobile-menu]"); if (!header || !toggle || !menu) return;
    const setMenu = (open) => { toggle.classList.toggle("is-open", open); toggle.setAttribute("aria-expanded", String(open)); menu.hidden = !open; };
    toggle.addEventListener("click", () => setMenu(menu.hidden));
    $$('[data-menu-close], .mobile-menu a', menu).forEach((link) => link.addEventListener("click", () => setMenu(false)));
    $$('[data-header-trial-trigger]', header).forEach((trigger) => trigger.addEventListener("click", () => { setMenu(false); openHeaderTrial(); }));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });
    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 20); onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setupFeatureTabs() {
    const tabs = $$('[data-feature]'); const panels = $$('[data-panel]');
    const select = (tab, focus = false) => { state.selectedFeature = tab.dataset.feature; tabs.forEach((item) => { const active = item === tab; item.classList.toggle("is-active", active); item.setAttribute("aria-selected", String(active)); if (active) item.setAttribute("tabindex", "0"); else item.setAttribute("tabindex", "-1"); }); panels.forEach((panel) => { const active = panel.dataset.panel === state.selectedFeature; panel.classList.toggle("is-active", active); panel.hidden = !active; }); if (focus) tab.focus(); };
    tabs.forEach((tab) => { tab.addEventListener("click", () => select(tab)); tab.addEventListener("keydown", (event) => { const index = tabs.indexOf(tab); let next = null; if (event.key === "ArrowRight" || event.key === "ArrowDown") next = tabs[(index + 1) % tabs.length]; else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = tabs[(index - 1 + tabs.length) % tabs.length]; else if (event.key === "Home") next = tabs[0]; else if (event.key === "End") next = tabs[tabs.length - 1]; if (next) { event.preventDefault(); select(next, true); } }); });
    tabs[0]?.setAttribute("tabindex", "0"); tabs.slice(1).forEach((tab) => tab.setAttribute("tabindex", "-1"));
  }

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

  function setupAnalytics() {
    document.addEventListener("click", (event) => {
      const element = event.target.closest("[data-analytics]");
      if (!element) return;
      emit(element.dataset.analytics, { placement: element.dataset.placement || "unknown", target_section: element.getAttribute("href")?.replace("#", "") || null });
    });
  }

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

  function setupCtaFocus() {
    const field = $("#demo-name");
    if (!field) return;
    document.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      const link = event.target.closest('a[href="#contato"]');
      if (!link) return;
      const form = $("[data-demo-form]");
      if (!form || form.hidden) return;
      window.setTimeout(() => field.focus({ preventScroll: true }), 400);
    });
  }

  function setupFaqAnalytics() {
    $$('.faq-item').forEach((item) => item.addEventListener("toggle", () => emit("faq_item_toggle", { faq_id: item.id || "unknown", expanded: item.open })));
  }

  // ─── Checkout & Trial dialog ──────────────────────────────────────────

  async function startCheckout(plan, price) {
    if (!plan || !price) return;
    const payload = {
      plan_slug: plan.slug,
      plan_id: plan.uuid || plan.slug,
      billing_cycle: price.billing_cycle,
      currency: price.currency,
      customer: { source: "landing_copilot" },
      source: "landing_copilot",
    };
    emit("conversion_started", { flow_kind: "checkout", plan_slug: plan.slug });
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 8000);
      const response = await fetch(checkoutEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, credentials: "omit", body: JSON.stringify(payload), signal: controller.signal });
      window.clearTimeout(timer);
      const body = await response.json().catch(() => ({}));
      if (response.ok && body?.data?.checkout_url) {
        emit("conversion_completed", { flow_kind: "checkout", plan_slug: plan.slug });
        window.location.assign(body.data.checkout_url);
        return;
      }
      if (response.status === 503) {
        updatePricingStatus("error", "Checkout temporariamente indisponível");
        return;
      }
      if (response.status === 422) {
        updatePricingStatus("error", body?.error || "Plano indisponível no momento");
        return;
      }
      updatePricingStatus("error", "Não foi possível iniciar o checkout");
    } catch (error) {
      updatePricingStatus("error", "Falha de rede no checkout · tente novamente");
    }
  }

  const trialState = { plan: null, price: null, step: 1, previousBodyOverflow: "" };
  const trialCaptcha = { api: null, widgetId: null, token: "", resolve: null, reject: null, loadPromise: null };

  function trialTurnstileSiteKey() {
    return String(window.bchatTrialConfig?.turnstileSiteKey || configuredTrialTurnstileSiteKey).trim();
  }

  function loadTrialTurnstile() {
    if (window.turnstile?.render) return Promise.resolve(window.turnstile);
    if (trialCaptcha.loadPromise) return trialCaptcha.loadPromise;

    trialCaptcha.loadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-trial-turnstile]');
      const script = existingScript || document.createElement("script");
      const resolveTurnstile = () => {
        if (window.turnstile?.render) resolve(window.turnstile);
        else reject(new Error("Turnstile não foi inicializado."));
      };
      script.addEventListener("load", resolveTurnstile, { once: true });
      script.addEventListener("error", () => reject(new Error("Não foi possível carregar a verificação de segurança.")), { once: true });
      if (!existingScript) {
        script.async = true;
        script.defer = true;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.dataset.trialTurnstile = "true";
        document.head.appendChild(script);
      }
    }).catch((error) => {
      trialCaptcha.loadPromise = null;
      throw error;
    });

    return trialCaptcha.loadPromise;
  }

  async function renderTrialCaptcha(form) {
    const siteKey = trialTurnstileSiteKey();
    if (!siteKey) throw new Error("A verificação de segurança está indisponível no momento.");
    if (trialCaptcha.widgetId !== null) return trialCaptcha.api;

    const container = $("[data-trial-turnstile]", form);
    if (!container) throw new Error("A verificação de segurança não foi configurada.");
    const api = await loadTrialTurnstile();
    trialCaptcha.api = api;
    trialCaptcha.widgetId = api.render(container, {
      sitekey: siteKey,
      action: "signup",
      execution: "execute",
      appearance: "interaction-only",
      callback: (token) => {
        trialCaptcha.token = token;
        trialCaptcha.resolve?.(token);
        trialCaptcha.resolve = null;
        trialCaptcha.reject = null;
      },
      "error-callback": () => {
        trialCaptcha.token = "";
        trialCaptcha.reject?.(new Error("Não foi possível concluir a verificação de segurança."));
        trialCaptcha.resolve = null;
        trialCaptcha.reject = null;
      },
      "expired-callback": () => {
        trialCaptcha.token = "";
        trialCaptcha.reject?.(new Error("A verificação de segurança expirou. Tente novamente."));
        trialCaptcha.resolve = null;
        trialCaptcha.reject = null;
      },
      "timeout-callback": () => {
        trialCaptcha.token = "";
        trialCaptcha.reject?.(new Error("A verificação de segurança demorou demais. Tente novamente."));
        trialCaptcha.resolve = null;
        trialCaptcha.reject = null;
      },
    });
    return api;
  }

  async function executeTrialCaptcha(form) {
    const api = await renderTrialCaptcha(form);
    return new Promise((resolve, reject) => {
      trialCaptcha.resolve = resolve;
      trialCaptcha.reject = reject;
      trialCaptcha.token = "";
      try {
        api.execute(trialCaptcha.widgetId);
      } catch (error) {
        trialCaptcha.resolve = null;
        trialCaptcha.reject = null;
        reject(error);
      }
    });
  }

  function resetTrialCaptcha() {
    if (trialCaptcha.widgetId !== null) trialCaptcha.api?.reset(trialCaptcha.widgetId);
    trialCaptcha.token = "";
    trialCaptcha.resolve = null;
    trialCaptcha.reject = null;
  }

  function openTrialDialog(plan, price) {
    const dialog = $("[data-trial-dialog]"); if (!dialog) return;
    trialState.plan = plan; trialState.price = price; trialState.step = 1;
    trialState.previousBodyOverflow = document.body.style.overflow;
    const description = $("[data-trial-dialog-description]", dialog);
    if (description) description.textContent = `Você está iniciando ${price?.trial_days || 0} dias gratuitos no plano ${planDisplayName(plan)}. Sem cartão de crédito.`;
    const slugInput = $("[data-trial-plan-slug]", dialog);
    if (slugInput) slugInput.value = plan.slug;
    const cycleInput = $("[data-trial-cycle]", dialog);
    if (cycleInput) cycleInput.value = price?.billing_cycle || "monthly";
    const form = $("[data-trial-form]", dialog);
    if (form) form.reset();
    $$('[data-error-for]', dialog).forEach((element) => { element.textContent = ""; element.hidden = true; });
    const status = $("[data-trial-status]", dialog);
    if (status) { status.textContent = ""; status.hidden = true; status.classList.remove("is-error"); }
    $$('input', dialog).forEach((field) => field.removeAttribute("aria-invalid"));
    $$('[data-password-rules] li', dialog).forEach((rule) => rule.classList.remove("is-warn"));
    clearPasswordWarn();
    updatePasswordFeedback(form);
    dialog.hidden = false; dialog.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTrialStep(1);
  }

  function closeTrialDialog() {
    const dialog = $("[data-trial-dialog]"); if (!dialog) return;
    dialog.hidden = true; dialog.setAttribute("aria-hidden", "true");
    clearPasswordWarn();
    resetTrialCaptcha();
    document.body.style.overflow = trialState.previousBodyOverflow;
  }

  function setTrialStep(step) {
    const dialog = $("[data-trial-dialog]"); if (!dialog) return;
    trialState.step = step;
    dialog.dataset.trialActiveStep = String(step);
    $$('[data-step-panel]', dialog).forEach((panel) => { const active = Number(panel.dataset.stepPanel) === step; panel.hidden = !active; panel.classList.toggle("is-active", active); });
    $$('[data-trial-step]', dialog).forEach((item) => {
      const itemStep = Number(item.dataset.trialStep);
      const active = itemStep === step;
      const complete = itemStep < step;
      item.classList.toggle("is-active", active);
      item.classList.toggle("is-complete", complete);
      if (active) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    const back = $("[data-trial-back]", dialog);
    const next = $("[data-trial-next]", dialog);
    const submit = $("[data-trial-submit]", dialog);
    const cancel = $("[data-trial-cancel]", dialog);
    if (back) back.hidden = step === 1;
    if (cancel) cancel.hidden = step !== 1;
    if (next) next.hidden = step === 3;
    if (submit) submit.hidden = step !== 3;
    const phone = $('[name="phone"]', dialog);
    if (step === 2 && phone && !trialPhoneDigits(phone.value)) phone.value = "+55 ";
    const field = $(`[data-step-panel="${step}"] input`, dialog);
    if (step === 3) updatePasswordFeedback($("[data-trial-form]", dialog));
    field?.focus();
    schedulePasswordWarn();
  }

  let passwordWarnTimer = null;
  function clearPasswordWarn() {
    if (passwordWarnTimer) { window.clearTimeout(passwordWarnTimer); passwordWarnTimer = null; }
    $$('[data-password-rules] li').forEach((rule) => rule.classList.remove("is-warn"));
  }

  function passwordRuleStates(form) {
    const password = form.querySelector('[name="password"]')?.value || "";
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      character: /[^A-Za-z0-9]/.test(password),
    };
  }

  function updatePasswordFeedback(form) {
    if (!form) return;
    const states = passwordRuleStates(form);
    const values = Object.values(states);
    const validCount = values.filter(Boolean).length;
    const complete = validCount === values.length;
    const feedback = $("#trial-password-feedback", form);
    const status = $("[data-password-status]", form);
    const count = $("[data-password-count]", form);
    const strength = $("[data-password-strength]", form);
    const password = form.querySelector('[name="password"]')?.value || "";
    const confirmation = form.querySelector('[name="password_confirmation"]')?.value || "";

    feedback?.classList.toggle("is-complete", complete);
    if (status) status.textContent = complete ? "Senha forte" : password ? `Faltam ${values.length - validCount} requisitos` : "Senha incompleta";
    if (count) count.textContent = `${validCount} / ${values.length}`;
    if (strength) {
      strength.setAttribute("aria-valuenow", String(validCount));
      strength.setAttribute("aria-valuetext", status?.textContent || "Senha incompleta");
      $$('[data-password-strength-segment]', strength).forEach((segment, index) => segment.classList.toggle("is-filled", index < validCount));
    }
    $$('[data-password-rules] li', form).forEach((rule) => {
      const key = rule.dataset.passwordRule || rule.dataset.rule;
      rule.classList.toggle("is-valid", Boolean(states[key]));
      if (states[key]) rule.classList.remove("is-warn");
    });
    const match = $("[data-password-match]", form);
    if (match) {
      match.textContent = confirmation ? (password === confirmation ? "As senhas coincidem." : "As senhas precisam ser iguais.") : "";
      match.classList.toggle("is-mismatch", Boolean(confirmation) && password !== confirmation);
    }
  }

  function trialPhoneDigits(value) {
    const text = String(value || "").trim();
    const digits = text.replace(/\D/g, "");
    const hasCountryCode = text.startsWith("+55") || /^55(?:\s|\(|$)/.test(text) || (digits.length > 10 && digits.startsWith("55"));
    return hasCountryCode && digits.startsWith("55") ? digits.slice(2) : digits;
  }

  function formatTrialPhone(value) {
    const digits = trialPhoneDigits(value).slice(0, 10);
    if (!digits) return "+55 ";
    const area = digits.slice(0, 2);
    const first = digits.slice(2, 6);
    const second = digits.slice(6, 10);
    let formatted = `+55 (${area}`;
    if (digits.length >= 2) formatted += ")";
    if (first) formatted += first;
    if (second) formatted += `-${second}`;
    return formatted;
  }

  function schedulePasswordWarn() {
    clearPasswordWarn();
    if (trialState.step !== 3) return;
    passwordWarnTimer = window.setTimeout(checkPasswordRules, 5000);
  }
  function checkPasswordRules() {
    const form = $("[data-trial-form]"); if (!form || trialState.step !== 3) return;
    const states = passwordRuleStates(form);
    updatePasswordFeedback(form);
    $$('[data-password-rules] li', form).forEach((rule) => {
      const key = rule.dataset.passwordRule || rule.dataset.rule;
      rule.classList.toggle("is-warn", !states[key]);
    });
    passwordWarnTimer = null;
  }

  function validateTrialStep(step, form) {
    const errors = {};
    const fields = $$(`[data-step-panel="${step}"] input`, form);
    fields.forEach((field) => {
      field.removeAttribute("aria-invalid");
      const value = String(field.value || "").trim();
      if (!value && field.required) errors[field.name] = "Preencha este campo.";
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) errors[field.name] = "Informe um e-mail válido.";
      if (field.name === "phone") {
        const phoneDigits = trialPhoneDigits(field.value);
        if (!phoneDigits && field.required) errors[field.name] = "Preencha este campo.";
        else if (phoneDigits.length < 10) errors[field.name] = "Informe um telefone válido.";
      }
    });
    if (step === 3) {
      const password = form.querySelector('[name="password"]').value;
      const confirm = form.querySelector('[name="password_confirmation"]').value;
      const rules = passwordRuleStates(form);
      if (password) {
        if (!rules.length) errors.password = "A senha precisa ter pelo menos 8 caracteres.";
        else if (!rules.uppercase) errors.password = "A senha precisa ter pelo menos uma letra maiúscula.";
        else if (!rules.lowercase) errors.password = "A senha precisa ter pelo menos uma letra minúscula.";
        else if (!rules.number) errors.password = "A senha precisa ter pelo menos um número.";
        else if (!rules.character) errors.password = "A senha precisa ter pelo menos um caractere especial.";
      }
      if (password !== confirm) errors.password_confirmation = "As senhas não conferem.";
    }
    return errors;
  }

  function showTrialErrors(form, errors) {
    $$('[data-error-for]', form).forEach((element) => { element.textContent = ""; element.hidden = true; });
    Object.entries(errors).forEach(([field, message]) => {
      const element = $(`[data-error-for="${field}"]`, form);
      const input = $(`[name="${field}"]`, form);
      if (element) { element.textContent = message; element.hidden = false; }
      if (input) input.setAttribute("aria-invalid", "true");
    });
  }

  function showTrialStatus(form, message) {
    const status = $("[data-trial-status]", form);
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
    status.classList.add("is-error");
  }

  function setupTrialDialog() {
    const dialog = $("[data-trial-dialog]"); const form = $("[data-trial-form]"); if (!dialog || !form) return;
    $$('[data-trial-dialog-dismiss]', dialog).forEach((element) => element.addEventListener("click", closeTrialDialog));
    $("[data-trial-cancel]", dialog)?.addEventListener("click", closeTrialDialog);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !dialog.hidden) closeTrialDialog(); });
    const next = $("[data-trial-next]", dialog);
    const back = $("[data-trial-back]", dialog);
    next?.addEventListener("click", () => {
      const errors = validateTrialStep(trialState.step, form);
      if (Object.keys(errors).length) { showTrialErrors(form, errors); return; }
      $$('[data-error-for]', form).forEach((element) => { element.textContent = ""; element.hidden = true; });
      setTrialStep(Math.min(3, trialState.step + 1));
    });
    back?.addEventListener("click", () => setTrialStep(Math.max(1, trialState.step - 1)));

    $$('[name="password"], [name="password_confirmation"]', form).forEach((field) => field.addEventListener("input", () => {
      clearPasswordWarn();
      field.removeAttribute("aria-invalid");
      const error = $(`[data-error-for="${field.name}"]`, form);
      if (error) { error.textContent = ""; error.hidden = true; }
      updatePasswordFeedback(form);
    }));

    form.addEventListener("focusin", (event) => {
      const phone = event.target;
      if (phone?.name === "phone" && !phone.value) phone.value = "+55 ";
    });
    form.addEventListener("input", (event) => {
      const phone = event.target;
      if (phone?.name !== "phone") return;
      const formatted = formatTrialPhone(phone.value);
      if (phone.value !== formatted) phone.value = formatted;
      phone.removeAttribute("aria-invalid");
      const error = $(`[data-error-for="${phone.name}"]`, form);
      if (error) { error.textContent = ""; error.hidden = true; }
    });
    form.addEventListener("focusout", (event) => {
      const phone = event.target;
      if (phone?.name === "phone" && !trialPhoneDigits(phone.value)) phone.value = "";
    });

    form.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || trialState.step === 3 || event.target.closest?.("button")) return;
      event.preventDefault();
      next?.click();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const errors = validateTrialStep(3, form);
      if (Object.keys(errors).length) { showTrialErrors(form, errors); return; }
      const submit = $("[data-trial-submit]", form);
      submit.disabled = true; submit.innerHTML = 'Criando seu acesso <span aria-hidden="true">…</span>';
      emit("conversion_started", { flow_kind: "trial_signup", plan_slug: trialState.plan?.slug });
      let payload = null;
      payload = {
        plan_slug: trialState.plan?.slug,
        billing_cycle: trialState.price?.billing_cycle,
        customer: {
          name: form.querySelector('[name="name"]').value.trim(),
          email: form.querySelector('[name="email"]').value.trim(),
          company_name: form.querySelector('[name="company_name"]').value.trim(),
          phone: form.querySelector('[name="phone"]').value.trim(),
          password: form.querySelector('[name="password"]').value,
        },
      };
      try {
        const turnstileToken = await executeTrialCaptcha(form);
        payload.turnstile_token = turnstileToken;
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 8000);
        const response = await fetch(trialEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, credentials: "omit", body: JSON.stringify(payload), signal: controller.signal });
        window.clearTimeout(timer);
        const body = await response.json().catch(() => ({}));
        if (response.ok) {
          emit("conversion_completed", { flow_kind: "trial_signup", plan_slug: trialState.plan?.slug });
          if (body?.data?.redirect_url) { window.location.assign(body.data.redirect_url); return; }
          closeTrialDialog();
          return;
        }
        submit.disabled = false; submit.innerHTML = 'Criar meu acesso <span aria-hidden="true">↗</span>';
        if (response.status === 422) {
          if (body?.errors) showTrialErrors(form, body.errors);
          showTrialStatus(form, body?.error || "Não foi possível validar os dados do cadastro.");
          return;
        }
        if (response.status === 503) {
          showTrialStatus(form, "Cadastro de trial temporariamente indisponível.");
          return;
        }
        showTrialStatus(form, body?.error || "Não foi possível concluir o cadastro.");
      } catch (error) {
        submit.disabled = false; submit.innerHTML = 'Criar meu acesso <span aria-hidden="true">↗</span>';
        showTrialStatus(form, error?.message || "Não foi possível concluir o cadastro. Tente novamente.");
      } finally {
        resetTrialCaptcha();
      }
    });
  }

  function init() {
    if (window.location.pathname.replace(/\/$/, "") === "/blog") return;
    setupHeader(); setupFeatureTabs(); setupComparison(); setupAnalytics(); setupDemoForm(); setupCtaFocus(); setupFaqAnalytics(); setupTrialDialog(); loadPlans();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
