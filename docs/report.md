# Report — VOLANTE

**App premium dark gerado a partir do CarroLens** (carrolens.com.br, home) por decisão do
dono: nome diferente (**Volante**), design melhor e diferente (**dark premium** grafite +
acento âmbar único, Space Grotesk + Inter), features mais intuitivas (calculadoras live,
busca global "/", pódio nos rankings, count-up, reveal on scroll).

## Como rodar

```bash
cd app
node server/seed.mjs      # popula o store (idempotente)
node server/index.mjs     # http://localhost:3000 (API + frontend no mesmo processo)
```

Build do front: `npm run build` (produz `app/dist/`, já buildado). O servidor está rodando
agora em http://localhost:3000 (processo em background).

## O que foi entregue

- **Frontend** (`app/src/`): nav pill glass fixa com dropdown Parceiros e botão de busca
  ("/"), hero full-bleed com foto real + count-up, 4 cards de categoria fotográficos,
  **calculadora elétrica interativa** (3 sliders → custos/barras/projeção ao vivo),
  grid de 6 ferramentas, seção IA com timeline + card de recomendação, **simulador de
  financiamento interativo** (PMT CDC/Leasing/Consórcio/Assinatura, destaque do menor
  custo total), rankings com pódio top-3 + painéis marcas/eletrificados, CTA blog,
  footer completo, cookie bar persistente e **command palette** de busca global
  (categorias + ferramentas + veículos mais vendidos).
- **Backend** (`app/server/`): Express servindo `/api/*` + `dist/` + SPA fallback na
  porta 3000. Persistência: better-sqlite3 com fallback automático para store JSON
  (`server/data/app.json`) — neste Windows sem toolchain de compilação o driver ativo é
  o JSON (persistência server-side preservada; instalar better-sqlite3 com toolchain
  ativa o SQLite sem mudar código).
- **Assets**: 7 arquivos reais baixados do site original (fotos de categoria, hero,
  logos) em `app/public/assets/` — provenança em `out/asset-provenance.md`.

## API

| Endpoint | Conteúdo | Rows |
|---|---|---|
| GET /api/health | `{ok, driver}` | — (API-only, uso operacional) |
| GET /api/stats | hero (3) + rankings (4) | 7 |
| GET /api/categories | Hatch/SUV/Sedan/Pickup | 4 |
| GET /api/rankings | marcas + eletrificados{hibridos, eletricos} + veículos | 20 |
| GET /api/highlights | payback + financiamento + recomendacao (com params numéricos p/ calculadoras) | 3 |
| GET /api/tools | 6 ferramentas | 6 |

Todo dado dinâmico do front vem de `/api/*` (zero hardcode em componentes).

## Verificação

`out/verify.jsonl`: 40 checks — S0–S14, D1–D7, B1–B4, COV1, C1 (desktop) + **M1–M9 e
NOTA-COUNTUP (mobile/perf)** — todos `pass`, cada um com evidência (curl, evaluate no
DOM, capturas). Destaques: slider com mouse real (1500→4100 km → valores recalculados
corretamente), busca abre/filtra/fecha, dropdown com 4 itens, cookie bar persiste após
reload, contrato API 5/5 caminhos do frontend servidos.

## Mobile & performance (2ª fase, 20/10/26)

Auditado em 375×812 (IAB) com QA visual do worker visionario; correções aplicadas por
3 executores + sessão principal:

- **Menu mobile**: painel do hamburger agora opaco (bg #0C1119/97 + blur + scrim),
  com botão "Buscar no Volante" no topo e links com alvo ≥44px — o hero não sangra mais.
- **Toque**: thumbs dos sliders 28px âmbar no mobile (20px em md+), links do footer e
  "Ver ranking completo" com alvo ≥40/44px, chips com respiro.
- **iOS**: input da busca com 16px (sem zoom automático ao focar); theme-color #0A0E14.
- **Bug de formato corrigido**: "+21,2%" (antes "+212,0%" — parse de milhar/decimal).
- **Pódio mobile**: 1º lugar no topo (desktop mantém 2-1-3).
- **Zero overflow horizontal** em 375px; cookie bar funcional no mobile.
- **Build**: code-splitting em 4 chunks (react/radix/motion/app) — melhor cache e
  download paralelo; imagens lazy com dimensões explícitas (menos CLS).
- Nota: contadores "zerados" vistos em medições eram rAF throttled do WebView para
  elementos fora da tela; visíveis, completam (ver NOTA-COUNTUP).

## Limitações e notas

- **Viewport verificada**: 1280×800 (a do vídeo). Responsivo além disso é extrapolado
  (grids 4→2→1, nav com hamburger) e não foi testado no IAB.
- **Capturas do WebView2** podem compostar camadas stale de conteúdo animado; medições
  de layout computado foram usadas como fonte de verdade (ver NOTA-CAPTURA no
  verify.jsonl). Captura com repaint forçado confirma 4/4 cards nítidos.
- **Teclado sintético do IAB**: tecla "/" física e Escape sintéticos não são entregues
  como eventos trusted; abertura da busca via botão/evento custom e fechamento foram
  verificados por outros caminhos. Em navegador real, atalhos são radix/cmdk padrão.
- **Fora do escopo** (não demonstrados no vídeo/fonte): auth real, páginas internas
  (/busca, /comparar…) — links apontam para rotas com SPA fallback servindo a home.
  Botão "Enviar feedback" é estático (sem comportamento demonstrado no original).

## Estrutura

```
app/                  # projeto (React+TS+Vite+Tailwind v4+shadcn/ui + Express)
  src/components/     # Navbar, CommandSearch, CookieBar, Footer, Brand
  src/sections/       # Hero, Categories, Payback, Tools, AiReco, Financing, Rankings, BlogCta
  src/lib/            # api.ts (tipos+fetchers), ui.tsx (Reveal/count-up/Section)
  server/             # index/routes/db/seed (.mjs)
recordings/           # carrolens-home.mp4 (fonte) + .webm original
out/                  # plan.md, verify.jsonl, report.md, dom-snapshot-home.txt
screenshots/          # evidências (strips do original, volante-secoes, volante-final)
HANDOFF.md            # continuidade
```
