import { describe, expect, it, vi } from "vitest";

import { buildLeadPayload, submitLead, validateLead } from "./leads.js";

const valid = { name: "Larissa Mendes", email: "larissa@empresa.com.br", company: "Empresa", team_size: "11-50" };

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe("validateLead", () => {
  it("accepts a complete submission", () => {
    expect(validateLead(valid)).toEqual({ valid: true, errors: {} });
  });

  it("requires a name with at least two characters", () => {
    const result = validateLead({ ...valid, name: " L " });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("Informe seu nome.");
  });

  it("rejects a malformed email", () => {
    const result = validateLead({ ...valid, email: "larissa@empresa" });

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Informe um e-mail válido.");
  });

  it("requires a company", () => {
    const result = validateLead({ ...valid, company: "" });

    expect(result.valid).toBe(false);
    expect(result.errors.company).toBe("Informe o nome da empresa.");
  });

  it("treats team_size as optional", () => {
    expect(validateLead({ ...valid, team_size: "" }).valid).toBe(true);
  });

  it("reports every invalid field at once", () => {
    const result = validateLead({ name: "", email: "", company: "" });

    expect(Object.keys(result.errors).sort()).toEqual(["company", "email", "name"]);
  });

  it("survives missing keys", () => {
    expect(validateLead({}).valid).toBe(false);
  });
});

describe("buildLeadPayload", () => {
  it("trims and normalises the contact", () => {
    expect(buildLeadPayload({ name: "  Larissa  ", email: "  Larissa@Empresa.com.BR ", company: " Empresa ", team_size: " 11-50 " })).toEqual({
      source: "landing_copilot",
      contact: { name: "Larissa", email: "larissa@empresa.com.br", company: "Empresa", team_size: "11-50" },
    });
  });

  it("sends null when team_size is absent", () => {
    expect(buildLeadPayload({ name: "L", email: "l@e.com", company: "E" }).contact.team_size).toBeNull();
  });
});

describe("submitLead", () => {
  it("reports success and returns the created id", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(201, { data: { id: "lead_1" } }));

    await expect(submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).resolves.toEqual({ ok: true, id: "lead_1" });
  });

  it("succeeds even when the body carries no id", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(201, {}));

    await expect(submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).resolves.toEqual({ ok: true, id: null });
  });

  it("flags the endpoint as unavailable on 404", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(404, {}));
    const result = await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl });

    expect(result).toMatchObject({ ok: false, reason: "unavailable" });
  });

  it("flags the endpoint as unavailable on 501", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(501, {}));

    expect((await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).reason).toBe("unavailable");
  });

  it("surfaces field errors from a 422", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(422, { errors: { email: "E-mail já cadastrado." } }));
    const result = await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl });

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(result.errors).toEqual({ email: "E-mail já cadastrado." });
  });

  it("treats a 5xx as a retryable network failure", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(503, {}));

    expect((await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).reason).toBe("network");
  });

  it("treats a thrown fetch as a network failure", async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError("Failed to fetch"); });

    expect((await submitLead("/api/demo", buildLeadPayload(valid), { fetchImpl })).reason).toBe("network");
  });

  it("posts JSON to the given endpoint without credentials", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(201, {}));
    const payload = buildLeadPayload(valid);

    await submitLead("/api/demo", payload, { fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/demo");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("omit");
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});
