#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  printf '%s\n' "Erro: pnpm não está instalado ou não está no PATH." >&2
  exit 1
fi

if [[ -n "${CLOUDFLARE_ENV_FILE:-}" ]]; then
  ENV_FILE="$CLOUDFLARE_ENV_FILE"
elif [[ -f "$ROOT_DIR/.env.local" ]]; then
  ENV_FILE="$ROOT_DIR/.env.local"
else
  ENV_FILE="$ROOT_DIR/.env"
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${CLOUDFLARE_API_TOKEN:?Erro: defina CLOUDFLARE_API_TOKEN no ambiente ou em .env/.env.local}"
: "${CLOUDFLARE_ACCOUNT_ID:?Erro: defina CLOUDFLARE_ACCOUNT_ID no ambiente ou em .env/.env.local}"

WRANGLER_CONFIG="${CLOUDFLARE_WRANGLER_CONFIG:-$ROOT_DIR/wrangler.jsonc}"
if [[ ! -f "$WRANGLER_CONFIG" ]]; then
  printf 'Erro: configuração do Wrangler não encontrada: %s\n' "$WRANGLER_CONFIG" >&2
  exit 1
fi

if ! pnpm exec wrangler --version >/dev/null 2>&1; then
  printf '%s\n' "Erro: Wrangler não está instalado. Execute pnpm install antes do deploy." >&2
  exit 1
fi

branch="main"
dry_run=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --branch=*)
      branch="${1#*=}"
      shift
      ;;
    --branch)
      if [[ $# -lt 2 ]]; then
        printf '%s\n' "Erro: --branch exige um valor." >&2
        exit 1
      fi
      branch="$2"
      shift 2
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    *)
      printf 'Erro: argumento desconhecido: %s\n' "$1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$branch" ]]; then
  printf '%s\n' "Erro: o nome da branch não pode ser vazio." >&2
  exit 1
fi

case "$branch" in
  main)
    worker_env="production"
    ;;
  develop)
    worker_env="develop"
    ;;
  *)
    printf 'Erro: branch de deploy não suportada: %s. Use main ou develop.\n' "$branch" >&2
    exit 1
    ;;
esac

printf 'Executando build para o ambiente %s...\n' "$worker_env"
pnpm run build

if [[ ! -f dist/index.html ]]; then
  printf '%s\n' "Erro: o build não gerou dist/index.html." >&2
  exit 1
fi

wrangler_args=(
  deploy
  --config "$WRANGLER_CONFIG"
  --env "$worker_env"
)

# NOTA: sem --env-file de propósito. O ENV_FILE acima é _sourcing_ local para o
# build (VITE_*) e para auth do wrangler (CLOUDFLARE_API_TOKEN/ACCOUNT_ID).
# Passar --env-file ao deploy publicaria esse arquivo inteiro como vars do
# Worker, vazando o token da API. Este projeto não tem vars de runtime
# (todo VITE_* já vai inlined no `vite build`); se um dia precisar, crie um
# arquivo só com vars públicas ou use `wrangler secret`.

printf 'Validando configuração do Worker (ambiente: %s)...\n' "$worker_env"
pnpm exec wrangler "${wrangler_args[@]}" --dry-run

if [[ "$dry_run" == true ]]; then
  printf '%s\n' "Dry-run concluído; o deploy remoto não foi executado."
  exit 0
fi

printf 'Publicando dist no Cloudflare Workers (ambiente: %s)...\n' "$worker_env"
pnpm exec wrangler "${wrangler_args[@]}"

printf 'Deploy do Worker concluído para a branch %s.\n' "$branch"
