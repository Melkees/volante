// Servidor Express do Volante: /api/* + static dist + SPA fallback com 404 real.
// Uso:  node server/seed.mjs  (popula os dados)  →  node server/index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { initSchema, getDriver, getVeiculoById, getPost, getPosts, getVeiculos, getHistorico } from './db.mjs';
import apiRouter from './routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');

await initSchema();

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// Cabeçalhos de segurança. [V25] HSTS ligado — o site serve só por HTTPS (Render).
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  });
  next();
});

app.use('/api', apiRouter);

// [N14] API sem rota responde JSON, nunca o HTML "Cannot GET" do Express.
app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

// [N15] robots.txt e sitemap.xml antes do static. O sitemap é gerado do store
// em memória uma única vez por boot e reaproveitado (cache).
const SITE_URL = 'https://volante.onrender.com';

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

const escXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let sitemapCache = null;
function gerarSitemap() {
  if (sitemapCache) return sitemapCache;
  const urls = [];
  const add = (loc, lastmod) =>
    urls.push(`  <url><loc>${escXml(SITE_URL + loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
  // Rotas fixas da SPA — /favoritos fica de fora: exige login, não é página pública.
  for (const rota of SPA_ROUTES) {
    if (rota !== '/favoritos') add(rota);
  }
  for (const post of getPosts()) {
    add(`/blog/${encodeURIComponent(post.slug)}`, post.data ? String(post.data).slice(0, 10) : null);
  }
  for (const v of getVeiculos()) {
    if (v.preco == null) continue; // sem preço FIPE não vira página
    const hist = getHistorico(v);
    // mes vem como "2026-03" — lastmod precisa de data completa (AAAA-MM-DD).
    const lastmod = hist.length ? `${hist[hist.length - 1].mes}-01` : null;
    add(`/veiculo/${v.id}`, lastmod);
  }
  sitemapCache = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return sitemapCache;
}

app.get('/sitemap.xml', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(gerarSitemap());
});

// Assets com hash de build → cache imutável de 1 ano; sem hash (imagens públicas) → 1h.
// fallthrough: false → asset inexistente devolve 404, nunca o HTML da SPA.
app.use(
  '/assets',
  (req, res, next) => {
    const hasHash = /-[0-9A-Za-z_-]{8,}\.(js|css|woff2?|png|jpe?g|webp|svg)$/.test(req.path);
    res.set('Cache-Control', hasHash ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
    next();
  },
  express.static(path.join(DIST_DIR, 'assets'), { fallthrough: false }),
);

// Arquivos na raiz do dist (favicon etc.) sem cache
app.use(express.static(DIST_DIR, { index: false, setHeaders: (res) => res.set('Cache-Control', 'no-cache') }));

// Rotas válidas da SPA — qualquer outra coisa (sem extensão) é 404 de verdade com a página 404 do app
const SPA_ROUTES = new Set([
  '/', '/busca', '/comparar', '/decida', '/financiamento', '/calculadora', '/rankings',
  '/blog', '/sobre', '/privacidade', '/termos', '/favoritos',
  '/parceiros', '/parceiros/concessionarias', '/parceiros/seguros', '/parceiros/vistorias',
  '/users/sign_in', '/users/sign_up',
]);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexFile = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexFile)) {
    return res.status(503).send('Build não encontrado. Rode "npm run build" em app/.');
  }
  // [N13] URL canônica: 301 para minúsculas sem barra final, query preservada.
  // Só em caminhos sem extensão — asset nunca redireciona.
  if (
    !path.extname(req.path) &&
    req.path !== '/' &&
    (/[A-Z]/.test(req.path) || req.path.endsWith('/'))
  ) {
    const canonico = req.path.replace(/\/+$/, '').toLowerCase();
    return res.redirect(301, canonico + req.url.slice(req.path.length));
  }
  if (path.extname(req.path)) return res.status(404).type('text/plain').send('Não encontrado');

  // [N13] Parâmetro inexistente é 404 de verdade — a SPA mostra a tela 404.
  let status = SPA_ROUTES.has(req.path) ? 200 : 404;
  if (req.path.startsWith('/veiculo/')) {
    const id = req.path.slice('/veiculo/'.length);
    status = /^\d+$/.test(id) && getVeiculoById(Number(id)) ? 200 : 404;
  } else if (req.path.startsWith('/blog/')) {
    const slug = decodeURIComponent(req.path.slice('/blog/'.length));
    status = getPost(slug) ? 200 : 404;
  }
  res
    .status(status)
    .set('Cache-Control', 'no-cache')
    .sendFile(indexFile);
});

// Erro assíncrono (pg fora, p.ex.) responde JSON — nunca a página HTML do Express.
app.use((err, _req, res, _next) => {
  console.error('[volante] erro não tratado:', err.message);
  if (!res.headersSent) res.status(500).json({ erro: 'Erro interno' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[volante] servidor em http://localhost:${PORT} (driver: ${getDriver()})`);
});
