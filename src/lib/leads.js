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
