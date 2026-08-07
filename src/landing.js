import { cycleLabel, resolveCardPrice, sharedCycles } from "./lib/pricing.js";
import { buildLeadPayload, submitLead, validateLead } from "./lib/leads.js";
import { contact } from "./content/landing-content.js";

(() => {
  "use strict";

  const state = {
    plans: [],
    billingCycle: "monthly",
    selectedFeature: "contexto",
    apiState: "loading",
    cacheKey: "bchat-copilot-public-plans-v1",
    checkout: { planSlug: null, billingCycle: null, previousFocus: null },
  };

  const configuredApiUrl = (import.meta.env.VITE_BCHAT_API_URL || "").trim().replace(/\/+$/, "");
  const endpoint = configuredApiUrl
    ? `${configuredApiUrl}/public/api/v1/bchat/plans`
    : document.body.dataset.plansEndpoint || "/public/api/v1/bchat/plans";
  const checkoutEndpoint = configuredApiUrl
    ? `${configuredApiUrl}/public/api/v1/bchat/checkout_sessions`
    : "/public/api/v1/bchat/checkout_sessions";
  const demoEndpoint = configuredApiUrl
    ? `${configuredApiUrl}/public/api/v1/bchat/demo_requests`
    : "/public/api/v1/bchat/demo_requests";
  const allowedExtra = new Set(["captain_credits", "captain_documents", "emails_monthly"]);
  const categoryOrder = ["core", "channels", "productivity", "reporting", "enterprise", "other"];
  const categoryLabels = { core: "Core", channels: "Canais", productivity: "Produtividade", reporting: "Relatórios", enterprise: "Enterprise", other: "Outros" };
  const demoPlans = [
    { id: 2, uuid: "demo-profissional", slug: "profissional", name: "Profissional", short_description: "Para equipes que querem mais contexto no atendimento.", long_description: null, featured: true, prices: [{ billing_cycle: "monthly", currency: "BRL", amount: 249, promotional_amount: null, effective_amount: 249, trial_days: 0, setup_fee: 0 }], limits: { users_limit: 15, inboxes_limit: 5, teams_limit: 4, contacts_limit: 5000, automations_limit: 20, campaigns_limit: 10, macros_limit: 50, integrations_limit: 8, extra: { captain_credits: 500, captain_documents: 50 } }, features: [{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }, { code: "summaries", name: "Resumos de conversas", category: "productivity", enabled: true }, { code: "knowledge_base", name: "Base de conhecimento conectada", category: "productivity", enabled: true }, { code: "reports", name: "Relatórios", category: "reporting", enabled: true }] },
    { id: 1, uuid: "demo-essencial", slug: "essencial", name: "Essencial", short_description: "O ponto de partida para organizar seu atendimento.", long_description: null, featured: false, prices: [{ billing_cycle: "monthly", currency: "BRL", amount: 99, promotional_amount: null, effective_amount: 99, trial_days: 0, setup_fee: 0 }, { billing_cycle: "yearly", currency: "BRL", amount: 990, promotional_amount: null, effective_amount: 990, trial_days: 0, setup_fee: 0 }], limits: { users_limit: 5, inboxes_limit: 2, teams_limit: 2, contacts_limit: 1000, automations_limit: 5, campaigns_limit: 3, macros_limit: 15, integrations_limit: 3, extra: {} }, features: [{ code: "inboxes", name: "Canais de atendimento", category: "channels", enabled: true }, { code: "reports", name: "Relatórios", category: "reporting", enabled: true }] },
    { id: 3, uuid: "demo-enterprise", slug: "enterprise", name: "Enterprise", short_description: "Para operações com necessidades específicas.", long_description: null, featured: false, prices: [], limits: { users_limit: 0, inboxes_limit: 0, teams_limit: 0, contacts_limit: 0, automations_limit: 0, campaigns_limit: 0, macros_limit: 0, integrations_limit: 0, extra: {} }, features: [{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }, { code: "knowledge_base", name: "Base de conhecimento conectada", category: "productivity", enabled: true }, { code: "enterprise_support", name: "Atendimento personalizado", category: "enterprise", enabled: true }] },
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
    try { localStorage.setItem(state.cacheKey, JSON.stringify({ data, savedAt: Date.now() })); } catch { /* cache é opcional */ }
  }
  async function fetchPlans() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch(endpoint, { method: "GET", headers: { Accept: "application/json" }, signal: controller.signal, credentials: "omit" });
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
    const features = plan.features.filter((feature) => isRecord(feature) && typeof feature.code === "string" && typeof feature.name === "string").map((feature) => ({ ...feature, category: categoryOrder.includes(feature.category) ? feature.category : "other" }));
    return { ...plan, prices, features, limits: isRecord(plan.limits) ? { ...plan.limits, extra: normalizeExtra(plan.limits.extra) } : { extra: {} } };
  }
  function normalizePlans(plans) { return plans.map(normalizePlan); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
  function formatCurrency(amount, currency) { try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL", maximumFractionDigits: 0 }).format(amount); } catch { return `${currency || "R$"} ${amount}`; } }
  function buildComparison(plans) {
    const features = new Map();
    plans.forEach((plan) => plan.features.forEach((feature) => { if (!features.has(feature.code)) features.set(feature.code, feature); }));
    return [...features.values()].sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.name.localeCompare(b.name, "pt-BR"));
  }

  function emit(name, properties = {}) { window.dispatchEvent(new CustomEvent(name, { detail: properties })); }
  function updatePricingStatus(kind, message) { const element = $("[data-pricing-status]"); if (!element) return; element.className = `pricing-status ${kind ? `is-${kind}` : ""}`; element.innerHTML = `<span class="status-dot"></span> ${message}`; }

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
  function renderPricing() {
    const grid = $("[data-pricing-grid]"); if (!grid) return;
    if (!state.plans.length) { grid.innerHTML = `<div class="pricing-empty"><strong>Nenhum plano publicado no momento.</strong><p>O catálogo está sendo atualizado. Fale com o time para encontrar o melhor próximo passo.</p><a class="button button-primary" href="#contato">Falar com o time <span aria-hidden="true">↗</span></a></div>`; return; }
    const cards = state.plans.map((plan) => {
      const price = resolveCardPrice(plan, state.billingCycle);
      const featured = plan.featured ? `<span class="featured-label">Em destaque</span>` : "";
      const priceMarkup = price ? `<div class="price-line"><span class="price-value">${price.effective_amount === 0 ? "Grátis" : formatCurrency(price.effective_amount, price.currency)}</span>${price.effective_amount !== 0 ? `<span class="price-cycle">/ ${cycleLabel(price.billing_cycle, "period")}</span>` : ""}${price.promotional_amount !== null && price.promotional_amount < price.amount ? `<span class="price-old">${formatCurrency(price.amount, price.currency)}</span>` : ""}</div>` : `<div class="price-line"><span class="price-value price-consult">Sob consulta</span></div>`;
      const featureNames = plan.features.slice(0, 3).map((feature) => `<li>${escapeHtml(feature.name)}</li>`).join("");
      const cta = price
        ? `<button class="button ${plan.featured ? "button-primary" : "button-ghost"} pricing-card-cta" type="button" data-checkout-plan="${escapeHtml(plan.slug)}" data-plan-name="${escapeHtml(plan.name)}" data-billing-cycle="${escapeHtml(state.billingCycle)}">Ir para checkout <span aria-hidden="true">↗</span></button>`
        : `<a class="button button-ghost pricing-card-cta" href="#contato">Falar com o time <span aria-hidden="true">↗</span></a>`;
      return `<article class="pricing-card ${plan.featured ? "is-featured" : ""}">${featured}<div class="pricing-card-top"><h3>${escapeHtml(plan.name)}</h3><span class="card-index">${String(state.plans.indexOf(plan) + 1).padStart(2, "0")}</span></div><p class="pricing-card-description">${escapeHtml(plan.short_description || "Plano BChat para sua operação de atendimento.")}</p>${priceMarkup}${cta}<ul class="pricing-card-features">${featureNames || "<li>Recursos conforme configuração publicada</li>"}${plan.features.length > 3 ? `<li class="pricing-card-more">+ ${plan.features.length - 3} outros recursos</li>` : ""}</ul></article>`;
    }).join("");
    grid.innerHTML = cards;
  }
  function renderComparison() {
    const container = $("[data-pricing-comparison]"); if (!container || !state.plans.length) return;
    const features = buildComparison(state.plans);
    const groups = features.reduce((result, feature) => { (result[feature.category] ||= []).push(feature); return result; }, {});
    const head = state.plans.map((plan) => `<th scope="col">${escapeHtml(plan.name)}</th>`).join("");
    const rows = Object.entries(groups).sort(([a], [b]) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)).map(([category, items]) => `<tr class="comparison-group"><td colspan="${state.plans.length + 1}">${escapeHtml(categoryLabels[category] || categoryLabels.other)}</td></tr>${items.map((feature) => `<tr><th scope="row">${escapeHtml(feature.name)}</th>${state.plans.map((plan) => { const included = plan.features.some((item) => item.code === feature.code); return `<td aria-label="${included ? "Incluído" : "Não incluído"}"><span class="${included ? "included" : "not-included"}" aria-hidden="true">${included ? "✓" : "—"}</span><span class="sr-only">${included ? "Incluído" : "Não incluído"}</span></td>`; }).join("")}</tr>`).join("")}`).join("");
    container.innerHTML = `<table class="comparison-table"><caption>Comparação de recursos publicados por plano</caption><thead><tr><th scope="col">Recursos</th>${head}</tr></thead><tbody>${rows || `<tr><td colspan="${state.plans.length + 1}">Nenhum recurso comparável publicado.</td></tr>`}</tbody></table>`;
  }
  function setPlans(plans, kind, message) { state.plans = normalizePlans(plans); state.apiState = kind; renderBillingControl(); renderPricing(); renderComparison(); updatePricingStatus(kind === "stale" ? "stale" : kind === "error" ? "error" : "", message); }
  async function loadPlans(isRetry = false) {
    const cached = readCachedPlans();
    if (!isRetry && cached?.data?.length) setPlans(cached.data, "stale", "Catálogo em cache · atualizando");
    try { const plans = await fetchPlans(); writeCachedPlans(plans); setPlans(plans, "success", "Catálogo atualizado"); emit("pricing_section_view", { plans_count: plans.length, cache_state: cached ? "cache-revalidated" : "network" }); } catch (error) {
      if (cached?.data?.length && !isRetry) { setPlans(cached.data, "stale", "Último catálogo válido · atualização pendente"); emit("plans_load_error", { stage: "revalidate", http_status: error.message, has_stale_cache: true }); }
      else if (location.protocol === "file:") { setPlans(demoPlans, "stale", "Prévia de demonstração · conecte a API pública"); }
      else { state.apiState = "error"; const grid = $("[data-pricing-grid]"); grid.innerHTML = `<div class="pricing-error"><strong>Não foi possível carregar os planos.</strong><p>Verifique a conexão e tente novamente. O restante da página continua disponível.</p><button class="retry-button" type="button" data-retry>Tentar novamente</button></div>`; updatePricingStatus("error", "Catálogo indisponível"); emit("plans_load_error", { stage: "initial", http_status: error.message, has_stale_cache: false }); $("[data-retry]")?.addEventListener("click", () => loadPlans(true)); }
    }
  }

  function setupHeader() { const header = $("[data-header]"); const toggle = $("[data-menu-toggle]"); const menu = $("[data-mobile-menu]"); if (!header || !toggle || !menu) return; const setMenu = (open) => { toggle.classList.toggle("is-open", open); toggle.setAttribute("aria-expanded", String(open)); menu.hidden = !open; }; toggle.addEventListener("click", () => setMenu(menu.hidden)); $$('[data-menu-close], .mobile-menu a', menu).forEach((link) => link.addEventListener("click", () => setMenu(false))); document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); }); const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 20); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); }
  function setupFeatureTabs() {
    const tabs = $$('[data-feature]'); const panels = $$('[data-panel]');
    const select = (tab, focus = false) => { state.selectedFeature = tab.dataset.feature; tabs.forEach((item) => { const active = item === tab; item.classList.toggle("is-active", active); item.setAttribute("aria-selected", String(active)); if (active) item.setAttribute("tabindex", "0"); else item.setAttribute("tabindex", "-1"); }); panels.forEach((panel) => { const active = panel.dataset.panel === state.selectedFeature; panel.classList.toggle("is-active", active); panel.hidden = !active; }); if (focus) tab.focus(); };
    tabs.forEach((tab) => { tab.addEventListener("click", () => select(tab)); tab.addEventListener("keydown", (event) => { const index = tabs.indexOf(tab); let next = null; if (event.key === "ArrowRight" || event.key === "ArrowDown") next = tabs[(index + 1) % tabs.length]; else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = tabs[(index - 1 + tabs.length) % tabs.length]; else if (event.key === "Home") next = tabs[0]; else if (event.key === "End") next = tabs[tabs.length - 1]; if (next) { event.preventDefault(); select(next, true); } }); });
    tabs[0]?.setAttribute("tabindex", "0"); tabs.slice(1).forEach((tab) => tab.setAttribute("tabindex", "-1"));
  }
  function setupComparison() { const button = $("[data-comparison-toggle]"); const comparison = $("[data-pricing-comparison]"); if (!button || !comparison) return; button.addEventListener("click", () => { const isOpen = button.getAttribute("aria-expanded") === "true"; button.setAttribute("aria-expanded", String(!isOpen)); comparison.hidden = isOpen; button.innerHTML = isOpen ? 'Ver comparação completa <span>↓</span>' : 'Ocultar comparação <span>↑</span>'; if (!isOpen) emit("pricing_section_view", { plans_count: state.plans.length, cache_state: state.apiState }); }); }
  function setupAnalytics() { $$('[data-analytics]').forEach((element) => element.addEventListener("click", () => emit(element.dataset.analytics, { placement: element.dataset.placement || "unknown", target_section: element.getAttribute("href")?.replace("#", "") || null }))); }
  function setCheckoutError(message = "Não foi possível iniciar o checkout. Tente novamente.") { const error = $("[data-checkout-error]"); if (!error) return; error.textContent = message; error.hidden = false; }
  function getFocusable(dialog) {
    return [...dialog.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.disabled && element.offsetParent !== null);
  }
  function trapFocus(event, dialog) {
    if (event.key !== "Tab") return;
    const focusable = getFocusable(dialog);
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function closeCheckout() { const dialog = $("[data-checkout-dialog]"); if (!dialog) return; dialog.hidden = true; document.body.classList.remove("checkout-open"); const shell = $(".page-shell"); shell?.removeAttribute("inert"); state.checkout.previousFocus?.focus(); state.checkout.previousFocus = null; }
  function openCheckout(button) {
    const dialog = $("[data-checkout-dialog]"); const form = $("[data-checkout-form]"); const email = $("#checkout-email"); const name = $("[data-checkout-plan-name]"); const error = $("[data-checkout-error]");
    if (!dialog || !form || !email || !name) return;
    state.checkout = { planSlug: button.dataset.checkoutPlan, billingCycle: button.dataset.billingCycle, previousFocus: button };
    name.textContent = button.dataset.planName || "selecionado"; error.hidden = true; form.reset(); dialog.hidden = false; document.body.classList.add("checkout-open"); $(".page-shell")?.setAttribute("inert", ""); window.requestAnimationFrame(() => email.focus());
  }
  async function submitCheckout(event) {
    event.preventDefault();
    const form = event.currentTarget; const email = $("#checkout-email"); const submit = $("[data-checkout-submit]");
    if (!email.reportValidity()) return;
    submit.disabled = true; submit.classList.add("is-loading"); submit.innerHTML = "Criando checkout <span aria-hidden=\"true\">…</span>";
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4500);
      let response;
      try {
        response = await fetch(checkoutEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, credentials: "omit", signal: controller.signal, body: JSON.stringify({ plan_slug: state.checkout.planSlug, billing_cycle: state.checkout.billingCycle, customer: { email: email.value.trim() } }) });
      } finally { window.clearTimeout(timeout); }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status >= 500) throw new Error("O checkout está temporariamente indisponível. Tente novamente em instantes ou fale com o time comercial.");
        throw new Error(payload.message || payload.error || "Confira o e-mail informado e tente novamente.");
      }
      const checkoutUrl = payload.checkout_url || payload.url || payload.data?.checkout_url || payload.data?.url;
      if (!checkoutUrl) throw new Error("O checkout foi criado, mas não retornou uma URL válida.");
      emit("conversion_started", { plan_slug: state.checkout.planSlug, flow_kind: "checkout" });
      window.location.assign(checkoutUrl);
    } catch (error) { setCheckoutError(error.name === "AbortError" ? "A conexão demorou demais. Tente novamente." : error.message); submit.disabled = false; submit.classList.remove("is-loading"); submit.innerHTML = 'Continuar para o checkout <span aria-hidden="true">↗</span>'; }
  }
  function setupCheckout() {
    const dialog = $("[data-checkout-dialog]"); const form = $("[data-checkout-form]"); if (!dialog || !form) return;
    document.addEventListener("click", (event) => { const button = event.target.closest("[data-checkout-plan]"); if (button) { emit("pricing_plan_cta_click", { plan_slug: button.dataset.checkoutPlan, billing_cycle: button.dataset.billingCycle, cta_kind: "checkout", featured: state.plans.find((plan) => plan.slug === button.dataset.checkoutPlan)?.featured || false }); openCheckout(button); } if (event.target.closest("[data-checkout-close]")) closeCheckout(); });
    form.addEventListener("submit", submitCheckout); document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !dialog.hidden) closeCheckout(); if (!dialog.hidden) trapFocus(event, dialog); });
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

  function init() {
    if (window.location.pathname.replace(/\/$/, "") === "/blog") return;
    setupHeader(); setupFeatureTabs(); setupComparison(); setupAnalytics(); setupCheckout(); setupDemoForm(); loadPlans();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
