// Conteúdo que depende de autorização comercial.
// Regra: bloco sem conteúdo se oculta. Nunca preencher com exemplo fictício.

/** Canais de contato usados quando o envio automático falha. `null` oculta a opção. */
export const contact = {
  salesEmail: null,
  salesWhatsappUrl: null,
};

/**
 * Logos de clientes autorizados. `src` precisa ser um caminho da própria
 * aplicação (ex.: "/brand/clients/acme.svg"), nunca uma URL de terceiro.
 * Lista vazia oculta o bloco inteiro.
 */
export const clientLogos = [];

/**
 * Depoimentos autorizados, com nome e cargo reais.
 * Lista vazia oculta o bloco inteiro.
 * Formato: { quote, author, role, company }
 */
export const testimonials = [];

/**
 * Adequação: descrição de produto, não claim de desempenho.
 * Sempre visível — não depende de autorização externa.
 */
export const fitStatements = [
  "Feito para operações com múltiplos canais",
  "Construído para o fluxo real do atendimento",
  "Humano no controle de cada decisão",
];
