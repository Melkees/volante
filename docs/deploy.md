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

## Fontes dos dados (pra reprocessar)

- Catálogo + histórico: dataset `alanwgt/fipex-veiculos-brasil` (HuggingFace), pastas
  `2026/MM`; transformações em `.zcode/tmp/fipe/` da sessão de 21/10/26 (recriar se
  preciso: ler CSVs, filtrar tipo carro, 1 entrada por marca+modelo+combustível).
- Top 50 FENABRAVE e consumo (132 modelos): coletados do CarroLens (projeto do dono,
  autorizado 21/10/26).
- Blog: 4 posts do CarroLens (conteúdo do dono).
