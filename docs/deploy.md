# Deploy do Volante

## Publique agora (10 min, grátis — Render)

1. **GitHub** (pule se já tem conta): crie a conta e um repo vazio `volante` (sem README).
2. No terminal, na raiz do repo local:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/volante.git
   git push -u origin main
   ```
   (O Windows vai abrir o navegador pra você logar no GitHub na 1ª vez — Git Credential Manager.)
3. **Render**: crie a conta em render.com (botão "Get Started", login com GitHub) →
   New → Web Service → conecte o repo `volante` e preencha:
   - **Root Directory**: `app`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run seed && npm start`
   - **Instance Type**: Free
4. Publique. Em ~3 min o app fica em `https://volante-xxxx.onrender.com`.
5. Depois: troque `og:url`/`og:image` em `app/index.html` pela URL do Render, commit e push.

Aviso honesto do plano Free: o app adormece após 15 min sem visitas e a primeira
carga seguinte demora ~40s. Pra link permanente sem sono: VPS (abaixo) ou Render Starter.

---

## Caminhos completos

O app é um processo único: Express servindo `/api/*` + `dist/` na porta 3000
(`PORT` sobrepõe). Requer Node 20+. Dados de seed (FIPE, histórico, top 50, posts,
consumo) são arquivos JSON versionados em `app/server/data/` — o seed é idempotente.

## 1. Docker (qualquer host)

```bash
cd app
docker build -t volante .
docker run -d -p 3000:3000 --name volante volante
```

O `CMD` roda `seed` + `server` automaticamente. Persistência: montar volume em
`/app/server/data` para o store sobreviver a redeploys (`app.json` é gerado).

## Seed idempotente por versão (22/10/26)

O seed carrega uma marcação de versão no próprio store (board `seed_meta`).
Se a versão já bate com a do código, `node server/seed.mjs` sai na hora sem
tocar o banco — antes ele re-inseria as ~7,5k linhas do catálogo a cada boot,
engordando o cold start do Render. Para forçar recarga (dados novos em
`server/data/*.json`): `FORCE_SEED=1 node server/seed.mjs`. Bump de
`SEED_VERSAO` no `seed.mjs` também dispara recarga automática no próximo boot.

## 2. Railway / Render / Fly (sem Docker)

- Root do serviço: `app/`
- Build: `npm ci && npm run build`
- Start: `npm run seed && npm start`
- Porta: o Express respeita `PORT`.

## 3. VPS (Ubuntu + Node 20)

```bash
git clone <repo> && cd Volante/app
npm ci && npm run build
node server/seed.mjs
# systemd ou pm2:
pm2 start server/index.mjs --name volante
# proxy HTTPS com nginx/caddy apontando pra 127.0.0.1:3000
```

## Checklist pós-domínio

1. `app/index.html`: trocar `og:url` e `og:image` pelas URLs definitivas (hoje apontam
   pro túnel efêmero trycloudflare) e adicionar `<link rel="canonical">`.
2. `app/server/index.mjs`: ativar HSTS (comentário no arquivo indica onde) e, se
   servidor de e-mail existir, ligar o envio dos leads.
3. Regenerar `og.jpg` se trocar o hero.
4. `docs/asset-provenance.md`: atualizar se novas fontes de dados entrarem.

## Banco transacional (DATABASE_URL) — obrigatório no Render free

O disco do plano free do Render é efêmero: contas, sessões, favoritos, leads e o
uso anônimo da recomendação gravados localmente **somem a cada restart ou volta
do sono**. Por isso o servidor aceita a env var `DATABASE_URL`: quando ela
existe, as 5 tabelas transacionais (`users`, `sessions`, `favoritos`, `leads`,
`anon_ia`) vão para Postgres e `/api/health` passa a reportar `"driver":"postgres"`.
O catálogo (FIPE, rankings, posts) segue no armazenamento local — o seed roda a
cada boot e o repovoa, é read-only no runtime.

- **Render Postgres free**: crie em Render → Postgres → copie a "External
  Database URL" para a env var `DATABASE_URL` do web service. Atenção: o plano
  free de Postgres **expira** (instância por 30 dias) — para o site no ar de
  verdade, use um provedor que não expire.
- **Neon ou Supabase** funcionam igual: copie a connection string do painel
  deles para a mesma `DATABASE_URL` (o driver é `pg` padrão, com SSL). As
  tabelas são criadas sozinhas no boot (`CREATE TABLE IF NOT EXISTS`).
- Em dev local, sem `DATABASE_URL`, tudo continua funcionando em sqlite/JSON
  como antes.

## Keep-alive opcional (cold start)

O web service free adormece após 15 min sem acesso (primeira visita seguinte:
~40s em branco). Um ping externo a cada 10 min em `/api/health` (cron-job.org ou
UptimeRobot, grátis) mantém o serviço acordado — mas consome as ~750 h/mês do
plano free, ou seja, o app fica sem folga de horário no mês. Quando for
divulgar, considere Render Starter.

## O que mudou no servidor (out/2026)

- **Rate limit**: POSTs de cadastro, login, leads e recomendação limitados a
  20 req/IP por 15 min (429 com `{"erro"}` acima disso).
- **Cookie de sessão `Secure`** quando a requisição chega por HTTPS
  (`x-forwarded-proto: https`); em http local segue sem o flag.
- **HSTS** ligado (`max-age=31536000; includeSubDomains`).
- **Redirects canônicos**: caminhos com maiúsculas ou barra final caem em 301
  para a forma canônica (minúsculas, sem barra); `/veiculo/<id>` e
  `/blog/<slug>` inexistentes agora respondem **404 de verdade**.
- **404 da API em JSON** (`/api/qualquer-coisa` → `{"erro":"Rota não encontrada"}`).
- **`/robots.txt` e `/sitemap.xml`**: o sitemap lista rotas fixas, posts e todos
  os veículos com preço FIPE (~7.5k URLs), gerado uma vez por boot.

## Fontes dos dados (pra reprocessar)

- Catálogo + histórico: dataset `alanwgt/fipex-veiculos-brasil` (HuggingFace), pastas
  `2026/MM`; transformações em `.zcode/tmp/fipe/` da sessão de 21/10/26 (recriar se
  preciso: ler CSVs, filtrar tipo carro, 1 entrada por marca+modelo+combustível).
- Top 50 FENABRAVE e consumo (132 modelos): coletados do CarroLens (projeto do dono,
  autorizado 21/10/26).
- Consumo INMETRO (84 modelos, 22/10/26): Tabela PBE Veicular 2026 (18º ciclo,
  atualização 14/ago/26) — PDF oficial do INMETRO em
  `gov.br/inmetro/.../veiculos-automotivos-pbe-veicular`; extração e mediana por
  modelo em `app/server/data/consumo-inmetro.json` (temporários/auditoria em
  `~/.zcode/tmp/inmetro/`). Curado do CarroLens vence em conflito.
- Blog: 4 posts do CarroLens (conteúdo do dono).
