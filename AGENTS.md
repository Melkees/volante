# AGENTS.md — Volante

- Leia nesta ordem: README.md → docs/plan.md (design system e tags S/D/B) → app/src/.
- Stack: React+TS+Vite 7+Tailwind v4+shadcn/ui no front; Express em `app/server/*.mjs` servindo API e `dist/` num único processo na porta 3000.
- Rode com `cd app && node server/seed.mjs && node server/index.mjs`; build com `npm run build` (Node 20+).
- Dado dinâmico vem só de `/api/*` — nunca hardcode em componente.
- Tokens de design vivem em `app/src/index.css` — acento âmbar único, não invente cor fora dos tokens.
- Persistência: store JSON em `app/server/data/app.json`; com toolchain de compilação, `better-sqlite3` ativa sozinho.
- Não mude versões de Vite/Tailwind/`@vitejs/plugin-react` — a cadeia de peer-deps quebra.
- Componente novo nasce mobile-first: alvo de toque ≥44px, input ≥16px, sem overflow em 375px.
- Verificação é append-only em `docs/verify.jsonl`; correção acrescenta linha nova, nunca edita.
- Assets fotográficos são pixels reais em `app/public/assets/` — nunca redesenhe foto, nunca hotlinke.
- Origem dos dados e das imagens: docs/asset-provenance.md e docs/report.md.
- Texto de agent deste repo (AGENTS.md, prompt de worker) nasce e se revisa pela skill /escrever.
- Responda em pt-BR; código, caminhos e termos técnicos no original.
