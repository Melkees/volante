// Rotas da API do CarroLens — todo dado dinâmico da home é servido daqui.
import { Router } from 'express';
import {
  getDriver, getStats, getCategories, getRankingBoard, getHighlights, getTools,
  getVeiculos, getVeiculoById, getHistorico, getPosts, getPost,
  getUserByEmail, getUserById, createUser, createSession, getSession, deleteSession,
  decrementarCreditosIA, listFavoritos, addFavorito, removeFavorito,
  createLead, getAnonIa, marcarAnonIaUsado, verificarSenha, novoTokenSessao,
} from './db.mjs';
import crypto from 'node:crypto';

const router = Router();

// Normaliza texto para busca case/acento-insensível (NFD remove diacríticos).
const normalize = (s) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

router.get('/health', (_req, res) => {
  res.json({ ok: true, driver: getDriver() });
});

// [B1] Hero + stats de rankings
router.get('/stats', (_req, res) => {
  const rows = getStats();
  const hero = [];
  const rankings = [];
  for (const row of rows) {
    if (row.key.startsWith('rank_')) rankings.push(row);
    else hero.push(row);
  }
  res.json({ hero, rankings });
});

// [B4] Categorias
router.get('/categories', (_req, res) => {
  res.json(getCategories());
});

// [B2] Rankings: marcas, eletrificados (híbridos + elétricos), veículos
router.get('/rankings', (_req, res) => {
  const hibridos = getRankingBoard('ev_hibridos');
  const eletricos = getRankingBoard('ev_eletricos');
  const total = [...hibridos, ...eletricos].reduce((acc, e) => acc + e.value, 0);
  // [D3] total único de eletrificados: mesma fonte do /api/stats (rank_eletrificados).
  const stat = getStats().find((r) => r.key === 'rank_eletrificados');
  const totalOficial = stat ? parseInt(String(stat.value).replace(/\./g, ''), 10) : NaN;
  res.json({
    marcas: getRankingBoard('marcas'),
    eletrificados: {
      hibridos,
      eletricos,
      total: Number.isFinite(totalOficial) ? totalOficial : total,
    },
    veiculos: getRankingBoard('veiculos'),
    // Top 50 FENABRAVE completo (set/2026) — fonte: carrolens.com.br/rankings
    veiculos_top50: getRankingBoard('veiculos_top50'),
  });
});

// [B3] Highlights (payback / financiamento / recomendacao)
router.get('/highlights', (_req, res) => {
  const bySection = {};
  for (const h of getHighlights()) bySection[h.section] = h.payload;
  res.json(bySection);
});

// [B4] Ferramentas
router.get('/tools', (_req, res) => {
  res.json(getTools());
});

// [B3] Catálogo de veículos — contrato do front (api.ts):
// {total, veiculos} com filtros q/marca/categoria/combustivel/ano_min/preco_max
// e paginação limit (default 20, máx 100) / offset.
router.get('/veiculos', (req, res) => {
  const q = normalize(req.query.q);
  const marca = String(req.query.marca ?? '').trim();
  const categoria = String(req.query.categoria ?? '').trim();
  const combustivel = normalize(req.query.combustivel);
  const anoMin = req.query.ano_min != null && req.query.ano_min !== '' ? Number(req.query.ano_min) : null;
  const precoMax = req.query.preco_max != null && req.query.preco_max !== '' ? Number(req.query.preco_max) : null;
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);
  const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);

  let items = getVeiculos().filter((v) => {
    if (q && !normalize(`${v.nome} ${v.marca} ${v.categoria ?? ''}`).includes(q)) return false;
    if (marca && v.marca.toLowerCase() !== marca.toLowerCase()) return false;
    // filtro de categoria só vale pra veículo curado (FIPE tem categoria null)
    if (categoria) {
      if (v.categoria == null || v.categoria.toLowerCase() !== categoria.toLowerCase()) return false;
    }
    if (combustivel && !normalize(v.combustivel ?? '').includes(combustivel)) return false;
    if (anoMin != null && Number.isFinite(anoMin) && !(v.ano != null && v.ano >= anoMin)) return false;
    if (precoMax != null && Number.isFinite(precoMax) && !(v.preco != null && v.preco <= precoMax)) return false;
    return true;
  });

  // Relevância simples: match no início do nome primeiro, depois alfabético marca+nome.
  items.sort((a, b) => {
    const rank = (v) => {
      const n = normalize(v.nome);
      if (q && n.startsWith(q)) return 0;
      if (q && n.includes(q)) return 1;
      return 2;
    };
    const ra = rank(a) - rank(b);
    if (ra !== 0) return ra;
    const ka = `${a.marca} ${a.nome}`.toLowerCase();
    const kb = `${b.marca} ${b.nome}`.toLowerCase();
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  res.json({ total: items.length, veiculos: items.slice(offset, offset + limit) });
});

// Distinct marcas do catálogo com contagem, ordenado por total desc.
router.get('/veiculos/marcas', (_req, res) => {
  const counts = new Map();
  for (const v of getVeiculos()) {
    counts.set(v.marca, (counts.get(v.marca) ?? 0) + 1);
  }
  const marcas = [...counts.entries()]
    .map(([marca, total]) => ({ marca, total }))
    .sort((a, b) => b.total - a.total || a.marca.localeCompare(b.marca, 'pt-BR'));
  res.json({ marcas });
});

// Detalhe do veículo: ficha + histórico de preço FIPE (FipeX, mar..out/2026).
// 404 com {erro} se id inexistente; sem histórico → historico: [].
router.get('/veiculos/:id(\\d+)', (req, res) => {
  const veiculo = getVeiculoById(req.params.id);
  if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado' });
  res.json({ veiculo, historico: getHistorico(veiculo) });
});

// ── [B5] Blog — posts do dono (fonte: carrolens.com.br/blog, autorizado) ────
router.get('/posts', (_req, res) => {
  res.json({ posts: getPosts() });
});

router.get('/posts/:slug', (req, res) => {
  const post = getPost(req.params.slug);
  if (!post) return res.status(404).json({ erro: 'Post não encontrado' });
  res.json(post);
});

// ── Contas, sessões, favoritos, IA e leads ───────────────────────────────────
// Sem cookie-parser: parse manual de req.headers.cookie. Erros sempre {"erro"}.

const SESSAO_COOKIE = 'volante_sessao';
const ANON_COOKIE = 'volante_anon';
const SESSAO_DIAS = 30;

const parseCookies = (req) => {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const parte of header.split(';')) {
    const i = parte.indexOf('=');
    if (i > 0) out[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim());
  }
  return out;
};

const setCookieHeader = (res, name, value, { httpOnly = true, maxAgeSeg } = {}) => {
  const attrs = [`${name}=${value}`, 'Path=/', 'SameSite=Lax'];
  if (httpOnly) attrs.push('HttpOnly');
  if (maxAgeSeg != null) attrs.push(`Max-Age=${maxAgeSeg}`);
  const anterior = res.getHeader('Set-Cookie');
  const lista = anterior ? (Array.isArray(anterior) ? anterior : [anterior]) : [];
  lista.push(attrs.join('; '));
  res.setHeader('Set-Cookie', lista);
};

const publicUser = (u) => ({ id: u.id, nome: u.nome, email: u.email });

function getUserDaSessao(req) {
  const token = parseCookies(req)[SESSAO_COOKIE];
  const sess = getSession(token);
  return sess ? getUserById(sess.user_id) : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const agoraIso = () => new Date().toISOString();

// POST /api/users — cadastro (+ login automático via cookie de sessão).
router.post('/users', (req, res) => {
  const { nome, email, senha } = req.body ?? {};
  if (typeof nome !== 'string' || nome.trim().length < 2) {
    return res.status(400).json({ erro: 'Informe seu nome (mínimo 2 letras)' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ erro: 'E-mail inválido' });
  }
  if (typeof senha !== 'string' || senha.length < 8) {
    return res.status(400).json({ erro: 'A senha precisa de pelo menos 8 caracteres' });
  }
  if (getUserByEmail(email)) {
    return res.status(409).json({ erro: 'E-mail já cadastrado' });
  }
  const user = createUser({ nome, email, senha });
  const token = novoTokenSessao();
  createSession(user.id, token, new Date(Date.now() + SESSAO_DIAS * 864e5).toISOString());
  setCookieHeader(res, SESSAO_COOKIE, token, { maxAgeSeg: SESSAO_DIAS * 86400 });
  res.status(201).json({ user: publicUser(user) });
});

// POST /api/session — login.
router.post('/session', (req, res) => {
  const { email, senha } = req.body ?? {};
  const user = typeof email === 'string' ? getUserByEmail(email) : null;
  const ok = user && typeof senha === 'string' && verificarSenha(senha, user.salt, user.senha_hash);
  if (!ok) return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
  const token = novoTokenSessao();
  createSession(user.id, token, new Date(Date.now() + SESSAO_DIAS * 864e5).toISOString());
  setCookieHeader(res, SESSAO_COOKIE, token, { maxAgeSeg: SESSAO_DIAS * 86400 });
  res.json({ user: publicUser(user) });
});

// DELETE /api/session — logout (limpa cookie, idempotente).
router.delete('/session', (req, res) => {
  const token = parseCookies(req)[SESSAO_COOKIE];
  if (token) deleteSession(token);
  setCookieHeader(res, SESSAO_COOKIE, '', { maxAgeSeg: 0 });
  res.json({ ok: true });
});

// GET /api/me — sessão atual; sem sessão válida devolve {user:null} com 200.
router.get('/me', (req, res) => {
  const user = getUserDaSessao(req);
  res.json({ user: user ? publicUser(user) : null });
});

// GET /api/favoritos — catálogo completo dos veículos favoritados.
router.get('/favoritos', (req, res) => {
  const user = getUserDaSessao(req);
  if (!user) return res.status(401).json({ erro: 'Entre para ver favoritos' });
  res.json({ favoritos: listFavoritos(user.id) });
});

// POST /api/favoritos — favoritar (idempotente, sem toggle).
router.post('/favoritos', (req, res) => {
  const user = getUserDaSessao(req);
  if (!user) return res.status(401).json({ erro: 'Entre para favoritar' });
  const veiculoId = Number(req.body?.veiculoId);
  if (!getVeiculoById(veiculoId)) return res.status(404).json({ erro: 'Veículo não encontrado' });
  addFavorito(user.id, veiculoId);
  res.json({ ok: true });
});

// DELETE /api/favoritos/:veiculoId — desfavoritar (idempotente).
router.delete('/favoritos/:veiculoId(\\d+)', (req, res) => {
  const user = getUserDaSessao(req);
  if (!user) return res.status(401).json({ erro: 'Entre para gerenciar favoritos' });
  removeFavorito(user.id, Number(req.params.veiculoId));
  res.json({ ok: true });
});

// POST /api/ia/gerar — consome 1 crédito (20 logado, 1 grátis por anônimo).
router.post('/ia/gerar', (req, res) => {
  const user = getUserDaSessao(req);
  if (user) {
    const restantes = decrementarCreditosIA(user.id);
    if (restantes == null) return res.status(403).json({ erro: 'Seus créditos de IA acabaram' });
    return res.json({ ok: true, creditos: restantes });
  }
  const cookies = parseCookies(req);
  let anon = cookies[ANON_COOKIE];
  if (!anon) {
    anon = crypto.randomBytes(16).toString('hex');
    setCookieHeader(res, ANON_COOKIE, anon, { httpOnly: false, maxAgeSeg: 365 * 86400 });
  }
  const registro = getAnonIa(anon);
  if (registro?.usado) {
    return res.status(403).json({ erro: 'Sua recomendação grátis acabou — crie conta para 20 por mês' });
  }
  marcarAnonIaUsado(anon);
  res.json({ ok: true, anon: true });
});

// POST /api/leads — captura de lead.
router.post('/leads', (req, res) => {
  const { nome, email, tipo, mensagem } = req.body ?? {};
  if (typeof nome !== 'string' || nome.trim().length < 2) {
    return res.status(400).json({ erro: 'Informe seu nome (mínimo 2 letras)' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ erro: 'E-mail inválido' });
  }
  if (typeof tipo !== 'string' || !tipo.trim()) {
    return res.status(400).json({ erro: 'Informe o tipo de contato' });
  }
  createLead({ nome, email, tipo, mensagem });
  res.status(201).json({ ok: true });
});

export default router;
