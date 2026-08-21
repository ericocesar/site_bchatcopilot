import { CATEGORY_ORDER, copilotAllowance, cycleLabel, planHighlights, resolveCardPrice, sharedCycles } from "./lib/pricing.js";
import { buildLeadPayload, submitLead, validateLead } from "./lib/leads.js";
import { clientLogos, contact, fitStatements, testimonials } from "./content/landing-content.js";

(() => {
  "use strict";

  const state = {
    plans: [],
    billingCycle: "monthly",
    selectedFeature: "contexto",
    apiState: "loading",
    cacheKey: "bchat-copilot-public-plans-v1",
  };

  const configuredApiUrl = (import.meta.env.VITE_BCHAT_API_URL || "").trim().replace(/\/+$/, "");
  const endpoint = configuredApiUrl
    ? `${configuredApiUrl}/public/api/v1/bchat/plans`
    : document.body.dataset.plansEndpoint || "/public/api/v1/bchat/plans";
  const demoEndpoint = configuredApiUrl
    ? `${configuredApiUrl}/public/api/v1/bchat/demo_requests`
    : "/public/api/v1/bchat/demo_requests";
  const allowedExtra = new Set(["captain_credits", "captain_documents", "emails_monthly"]);
  const categoryLabels = { core: "Core", channels: "Canais", productivity: "Produtividade", reporting: "Relatórios", enterprise: "Enterprise", other: "Outros" };
  const demoPlans = [
    { id: 2, uuid: "demo-profissional", slug: "profissional", name: "Profissional", short_description: "Para equipes que querem mais contexto no atendimento.", long_description: null, featured: true, prices: [{ billing_cycle: "monthly", currency: "BRL", amount: 249, promotional_amount: null, effective_amount: 249, trial_days: 0, setup_fee: 0 }], limits: { users_limit: 15, inboxes_limit: 5, teams_limit: 4, contacts_limit: 5000, automations_limit: 20, campaigns_limit: 10, macros_limit: 50, integrations_limit: 8, extra: { captain_credits: 500, captain_documents: 50 } }, features: [{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }, { code: "summaries", name: "Resumos de conversas", category: "productivity", enabled: true }, { code: "knowledge_base", name: "Base de conhecimento conectada", category: "productivity", enabled: true }, { code: "reports", name: "Relatórios", category: "reporting", enabled: true }] },
    { id: 1, uuid: "demo-essencial", slug: "essencial", name: "Essencial", short_description: "O ponto de partida para organizar seu atendimento.", long_description: null, featured: false, prices: [{ billing_cycle: "monthly", currency: "BRL", amount: 99, promotional_amount: null, effective_amount: 99, trial_days: 0, setup_fee: 0 }, { billing_cycle: "yearly", currency: "BRL", amount: 990, promotional_amount: null, effective_amount: 990, trial_days: 0, setup_fee: 0 }], limits: { users_limit: 5, inboxes_limit: 2, teams_limit: 2, contacts_limit: 1000, automations_limit: 5, campaigns_limit: 3, macros_limit: 15, integrations_limit: 3, extra: { captain_credits: 100, captain_documents: 10 } }, features: [{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }, { code: "inboxes", name: "Canais de atendimento", category: "channels", enabled: true }, { code: "reports", name: "Relatórios", category: "reporting", enabled: true }] },
    { id: 3, uuid: "demo-enterprise", slug: "enterprise", name: "Enterprise", short_description: "Para operações com necessidades específicas.", long_description: null, featured: false, prices: [], limits: { users_limit: 0, inboxes_limit: 0, teams_limit: 0, contacts_limit: 0, automations_limit: 0, campaigns_limit: 0, macros_limit: 0, integrations_limit: 0, extra: { captain_credits: 5000, captain_documents: 500 } }, features: [{ code: "captain", name: "BChat Copilot", category: "productivity", enabled: true }, { code: "knowledge_base", name: "Base de conhecimento conectada", category: "productivity", enabled: true }, { code: "enterprise_support", name: "Atendimento personalizado", category: "enterprise", enabled: true }] },
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
    const features = plan.features.filter((feature) => isRecord(feature) && typeof feature.code === "string" && typeof feature.name === "string").map((feature) => ({ ...feature, category: CATEGORY_ORDER.includes(feature.category) ? feature.category : "other" }));
    return { ...plan, prices, features, limits: isRecord(plan.limits) ? { ...plan.limits, extra: normalizeExtra(plan.limits.extra) } : { extra: {} } };
  }
  function normalizePlans(plans) { return plans.map(normalizePlan); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
  function formatCurrency(amount, currency) { try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL", maximumFractionDigits: 0 }).format(amount); } catch { return `${currency || "R$"} ${amount}`; } }
  function buildComparison(plans) {
    const features = new Map();
    plans.forEach((plan) => plan.features.forEach((feature) => { if (!features.has(feature.code)) features.set(feature.code, feature); }));
    return [...features.values()].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.name.localeCompare(b.name, "pt-BR"));
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
    if (!state.plans.length) { grid.innerHTML = `<div class="pricing-empty"><strong>Nenhum plano publicado no momento.</strong><p>O catálogo está sendo atualizado. Fale com o time para encontrar o melhor próximo passo.</p><a class="button button-primary" href="#contato">Solicitar demonstração <span aria-hidden="true">↗</span></a></div>`; return; }
    const cards = state.plans.map((plan) => {
      const price = resolveCardPrice(plan, state.billingCycle);
      const featured = plan.featured ? `<span class="featured-label">Em destaque</span>` : "";
      const priceMarkup = price ? `<div class="price-line"><span class="price-value">${price.effective_amount === 0 ? "Grátis" : formatCurrency(price.effective_amount, price.currency)}</span>${price.effective_amount !== 0 ? `<span class="price-cycle">/ ${cycleLabel(price.billing_cycle, "period")}</span>` : ""}${price.promotional_amount !== null && price.promotional_amount < price.amount ? `<span class="price-old">${formatCurrency(price.amount, price.currency)}</span>` : ""}</div>` : `<div class="price-line"><span class="price-value price-consult">Sob consulta</span></div>`;
      const allowance = copilotAllowance(plan);
      const allowanceMarkup = allowance.length
        ? `<ul class="pricing-card-allowance">${allowance.map((item) => `<li><strong>${new Intl.NumberFormat("pt-BR").format(item.value)}</strong> ${escapeHtml(item.label)}</li>`).join("")}</ul>`
        : "";
      const highlights = planHighlights(plan, state.plans, 3);
      const featureNames = highlights.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("");
      const remaining = plan.features.length - highlights.length;
      const cta = `<a class="button ${plan.featured ? "button-primary" : "button-ghost"} pricing-card-cta" href="#contato" data-analytics="landing_primary_cta_click" data-placement="pricing_card" data-plan-slug="${escapeHtml(plan.slug)}">Solicitar demonstração <span aria-hidden="true">↗</span></a>`;
      return `<article class="pricing-card ${plan.featured ? "is-featured" : ""}">${featured}<div class="pricing-card-top"><h3>${escapeHtml(plan.name)}</h3><span class="card-index">${String(state.plans.indexOf(plan) + 1).padStart(2, "0")}</span></div><p class="pricing-card-description">${escapeHtml(plan.short_description || "Plano BChat para sua operação de atendimento.")}</p>${priceMarkup}${allowanceMarkup}${cta}<ul class="pricing-card-features">${featureNames || "<li>Recursos conforme configuração publicada</li>"}</ul>${remaining > 0 ? `<button class="pricing-card-more" type="button" data-comparison-toggle-from-card>Ver os outros ${remaining} recursos <span aria-hidden="true">↓</span></button>` : ""}</article>`;
    }).join("");
    grid.innerHTML = cards;
  }
  function renderComparison() {
    const container = $("[data-pricing-comparison]"); if (!container || !state.plans.length) return;
    const features = buildComparison(state.plans);
    const groups = features.reduce((result, feature) => { (result[feature.category] ||= []).push(feature); return result; }, {});
    const head = state.plans.map((plan) => `<th scope="col">${escapeHtml(plan.name)}</th>`).join("");
    const rows = Object.entries(groups).sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)).map(([category, items]) => `<tr class="comparison-group"><td colspan="${state.plans.length + 1}">${escapeHtml(categoryLabels[category] || categoryLabels.other)}</td></tr>${items.map((feature) => `<tr><th scope="row">${escapeHtml(feature.name)}</th>${state.plans.map((plan) => { const included = plan.features.some((item) => item.code === feature.code); return `<td aria-label="${included ? "Incluído" : "Não incluído"}"><span class="${included ? "included" : "not-included"}" aria-hidden="true">${included ? "✓" : "–"}</span><span class="sr-only">${included ? "Incluído" : "Não incluído"}</span></td>`; }).join("")}</tr>`).join("")}`).join("");
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
      const link = event.target.closest('a[href="#contato"]');
      if (!link) return;
      const form = $("[data-demo-form]");
      if (!form || form.hidden) return;
      // O scroll da âncora é do navegador; só assumimos o foco depois dele.
      window.setTimeout(() => field.focus({ preventScroll: true }), 400);
    });
  }

  function renderProof() {
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

  function setupFaqAnalytics() {
    $$('.faq-item').forEach((item) => item.addEventListener("toggle", () => emit("faq_item_toggle", { faq_id: item.id || "unknown", expanded: item.open })));
  }

  function setupInfographicEditor() {
    if (new URLSearchParams(window.location.search).get("infographic-edit") !== "1") return;
    const figure = $(".scenarios-infographic-figure");
    if (!figure) return;
    const positions = $$(".scenario-info-text-position", figure);
    if (!positions.length) return;

    const baseShifts = {
      "01": { x: "calc(4.4cqw + 23.5px)", y: "calc(-6.2cqw + 21.5px)" },
      "02": { x: "calc(-5.9cqw - 23.6px)", y: "calc(-2.4cqw - 26px)" },
      "03": { x: "calc(-11.75cqw + 19.6px)", y: "calc(1.1cqw - 42.6px)" },
      "04": { x: "calc(-8.8cqw + 62.5px)", y: "calc(-3.55cqw - 40.1px)" },
    };
    const adjustments = new Map();
    const readTranslation = (element) => {
      const transform = getComputedStyle(element).transform;
      if (!transform || transform === "none") return { x: 0, y: 0 };
      const matrix = new DOMMatrixReadOnly(transform);
      return { x: matrix.e, y: matrix.f };
    };
    positions.forEach((position) => {
      const scenario = [...(position.closest(".scenario-info")?.classList || [])].find((name) => /^scenario-info-\d+$/.test(name));
      const key = scenario?.replace("scenario-info-", "");
      if (!key || !baseShifts[key]) return;
      const base = readTranslation(position);
      adjustments.set(key, { position, base, total: { ...base }, drag: null });
    });

    const panel = document.createElement("aside");
    panel.className = "scenario-editor-panel";
    panel.setAttribute("aria-label", "Ajuste temporário do infográfico");
    panel.innerHTML = `<strong>Modo de ajuste</strong><span>Arraste os blocos de texto. Os ícones permanecem fixos.</span><pre data-infographic-editor-output></pre><div class="scenario-editor-actions"><button type="button" data-infographic-copy>Copiar CSS</button><button type="button" data-infographic-reset>Resetar</button></div>`;
    document.body.append(panel);
    document.body.classList.add("infographic-edit-mode");

    const formatShift = (value) => {
      if (Math.abs(value) < 0.05) return "0px";
      return `${value > 0 ? "+" : "-"} ${Math.abs(value).toFixed(1)}px`;
    };
    const renderOutput = (message = "") => {
      const output = $("[data-infographic-editor-output]", panel);
      output.textContent = message || [...adjustments.entries()].map(([key, item]) => {
        const base = baseShifts[key];
        const deltaX = item.total.x - item.base.x;
        const deltaY = item.total.y - item.base.y;
        const x = Math.abs(deltaX) < 0.05 ? base.x : `calc(${base.x} ${formatShift(deltaX)})`;
        const y = Math.abs(deltaY) < 0.05 ? base.y : `calc(${base.y} ${formatShift(deltaY)})`;
        return `.scenario-info-${key} .scenario-info-text-position {\n  --shift-x: ${x};\n  --shift-y: ${y};\n}`;
      }).join("\n\n");
    };
    renderOutput();

    adjustments.forEach((item) => {
      const { position } = item;
      const finish = (event) => {
        if (!item.drag || item.drag.pointerId !== event.pointerId) return;
        position.releasePointerCapture?.(event.pointerId);
        item.drag = null;
        position.classList.remove("is-dragging");
      };
      position.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        const point = item.total;
        item.drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startTotal: { ...point } };
        position.setPointerCapture?.(event.pointerId);
        position.classList.add("is-dragging");
      });
      position.addEventListener("pointermove", (event) => {
        if (!item.drag || item.drag.pointerId !== event.pointerId) return;
        item.total = { x: item.drag.startTotal.x + event.clientX - item.drag.startX, y: item.drag.startTotal.y + event.clientY - item.drag.startY };
        item.position.style.setProperty("--drag-x", `${item.total.x - item.base.x}px`);
        item.position.style.setProperty("--drag-y", `${item.total.y - item.base.y}px`);
        renderOutput();
      });
      position.addEventListener("pointerup", finish);
      position.addEventListener("pointercancel", finish);
    });

    $("[data-infographic-reset]", panel).addEventListener("click", () => {
      adjustments.forEach((item) => {
        item.total = { ...item.base };
        item.position.style.removeProperty("--drag-x");
        item.position.style.removeProperty("--drag-y");
      });
      renderOutput("Posições restauradas.");
      window.setTimeout(renderOutput, 900);
    });
    $("[data-infographic-copy]", panel).addEventListener("click", async () => {
      const output = $("[data-infographic-editor-output]", panel).textContent;
      try {
        await navigator.clipboard.writeText(output);
        renderOutput("CSS copiado para a área de transferência.");
        window.setTimeout(renderOutput, 1200);
      } catch {
        renderOutput("Não foi possível copiar automaticamente; selecione o CSS acima.");
      }
    });
  }

  function init() {
    if (window.location.pathname.replace(/\/$/, "") === "/blog") return;
    setupHeader(); setupFeatureTabs(); setupComparison(); setupAnalytics(); setupDemoForm(); setupCtaFocus(); setupFaqAnalytics(); setupInfographicEditor(); renderProof(); loadPlans();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
