// Servidor Express do Volante: /api/* + static dist + SPA fallback com 404 real.
// Uso:  node server/seed.mjs  (popula os dados)  →  node server/index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { initSchema, getDriver } from './db.mjs';
import apiRouter from './routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');

initSchema();

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// Cabeçalhos de segurança (HSTS fica pra quando houver domínio próprio)
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  });
  next();
});

app.use('/api', apiRouter);

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
  if (path.extname(req.path)) return res.status(404).type('text/plain').send('Não encontrado');
  // prefixos dinâmicos da SPA: /veiculo/:id e /blog/:slug
  const isSpa = SPA_ROUTES.has(req.path) || req.path.startsWith('/veiculo/') || req.path.startsWith('/blog/');
  res
    .status(isSpa ? 200 : 404)
    .set('Cache-Control', 'no-cache')
    .sendFile(indexFile);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[volante] servidor em http://localhost:${PORT} (driver: ${getDriver()})`);
});
