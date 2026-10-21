# Volante

App premium editorial de decisão automotiva: preços FIPE, rankings de vendas FENABRAVE,
comparador, calculadoras de payback e financiamento em tempo real, busca global e
recomendação por IA. Nasceu de um estudo de replicação do CarroLens e virou produto
próprio com identidade nova (porcelana + tinta + bronze, Fraunces + Inter — editorial claro,
redesign 21/10/26; design anterior dark grafite+âmbar em `backup-design-dark-20261021.tar.gz`).

## Rodar

Pré-requisito: Node 20+.

```bash
cd app
node server/seed.mjs      # popula o store (idempotente)
node server/index.mjs     # http://localhost:3000 — API + frontend no mesmo processo
```

Build do front: `npm run build` (gera `app/dist/`, já incluído).

## Estrutura

```
app/                  projeto
  src/components/     Navbar, CommandSearch, CookieBar, Footer, Brand
  src/sections/       Hero, Categories, Payback, Tools, AiReco, Financing, Rankings, BlogCta
  src/lib/            api.ts (tipos+fetchers), ui.tsx (Reveal, count-up, Section)
  server/             index/routes/db/seed (.mjs) — Express, porta 3000
  public/assets/      fotos reais (categorias, hero, logos)
docs/                 plan.md (especificação), verify.jsonl (40 checks), report.md,
                      design-tokens, provenança dos assets, evidências e vídeo-fonte
```

## API

| Endpoint | Conteúdo |
|---|---|
| GET /api/stats | stats do hero e dos rankings |
| GET /api/categories | Hatch, SUV, Sedan, Pickup |
| GET /api/rankings | marcas, eletrificados (híbridos/elétricos), veículos |
| GET /api/highlights | payback, financiamento, recomendação (com parâmetros das calculadoras) |
| GET /api/tools | 6 ferramentas |
| GET /api/health | estado do servidor e do driver de persistência |

Todo dado exibido vem daqui — nada hardcoded em componente.

## Notas

- Persistência server-side em JSON (`app/server/data/app.json`); com toolchain C,
  `better-sqlite3` é usado automaticamente.
- Verificado em desktop (1280×800) e mobile (375×812): 40 checks em `docs/verify.jsonl`.
- Origem dos dados e imagens: `docs/asset-provenance.md`; histórico completo do build
  em `docs/report.md`.
