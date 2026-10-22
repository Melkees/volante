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

  // Relevância: com busca, match no início do nome primeiro. Depois posição no
  // top 50 FENABRAVE (null por último — [N7]: a busca sem filtro não abre mais
  // em carro obscuro), ano DESC e nome A-Z.
  items.sort((a, b) => {
    if (q) {
      const rank = (v) => {
        const n = normalize(v.nome);
        if (n.startsWith(q)) return 0;
        if (n.includes(q)) return 1;
        return 2;
      };
      const ra = rank(a) - rank(b);
      if (ra !== 0) return ra;
    }
    const pa = a.pos_fenabrave ?? null;
    const pb = b.pos_fenabrave ?? null;
    if (pa != null || pb != null) {
      if (pa == null) return 1; // sem posição FENABRAVE vai pro fim
      if (pb == null) return -1;
      if (pa !== pb) return pa - pb;
    }
    const ya = a.ano ?? -1;
    const yb = b.ano ?? -1;
    if (ya !== yb) return yb - ya;
    return String(a.nome).localeCompare(String(b.nome), 'pt-BR', { sensitivity: 'base' });
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

// [N11] Rate limit em memória (sem dependência): 20 req/IP por janela de 15 min
// nos POSTs sensíveis. Map ip → timestamps, com limpeza preguiçosa das entradas
// velhas p/ não vazar memória.
const RL_JANELA_MS = 15 * 60_000;
const RL_LIMITE = 20;
const rlAcessos = new Map();

const ipDo = (req) =>
  String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.ip;

const rateLimit = (req, res, next) => {
  const ip = ipDo(req);
  const agora = Date.now();
  const janela = (rlAcessos.get(ip) ?? []).filter((t) => agora - t < RL_JANELA_MS);
  rlAcessos.set(ip, janela);
  if (rlAcessos.size > 5_000) {
    for (const [k, ts] of rlAcessos) {
      if (ts.length === 0) rlAcessos.delete(k);
    }
  }
  if (janela.length >= RL_LIMITE) {
    return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos' });
  }
  janela.push(agora);
  next();
};

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

// [N11] Secure só atrás de HTTPS (Render manda x-forwarded-proto) — em http
// local o cookie Secure seria descartado pelo navegador e o login quebraria.
const cookieSecure = (req) => req.headers['x-forwarded-proto'] === 'https';

const setCookieHeader = (res, name, value, { httpOnly = true, maxAgeSeg, secure = false } = {}) => {
  const attrs = [`${name}=${value}`, 'Path=/', 'SameSite=Lax'];
  if (httpOnly) attrs.push('HttpOnly');
  if (maxAgeSeg != null) attrs.push(`Max-Age=${maxAgeSeg}`);
  if (secure) attrs.push('Secure');
  const anterior = res.getHeader('Set-Cookie');
  const lista = anterior ? (Array.isArray(anterior) ? anterior : [anterior]) : [];
  lista.push(attrs.join('; '));
  res.setHeader('Set-Cookie', lista);
};

const publicUser = (u) => ({ id: u.id, nome: u.nome, email: u.email });

async function getUserDaSessao(req) {
  const token = parseCookies(req)[SESSAO_COOKIE];
  const sess = await getSession(token);
  return sess ? getUserById(sess.user_id) : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const agoraIso = () => new Date().toISOString();

// POST /api/users — cadastro (+ login automático via cookie de sessão).
router.post('/users', rateLimit, async (req, res) => {
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
  if (await getUserByEmail(email)) {
    return res.status(409).json({ erro: 'E-mail já cadastrado' });
  }
  const user = await createUser({ nome, email, senha });
  const token = novoTokenSessao();
  await createSession(user.id, token, new Date(Date.now() + SESSAO_DIAS * 864e5).toISOString());
  setCookieHeader(res, SESSAO_COOKIE, token, { maxAgeSeg: SESSAO_DIAS * 86400, secure: cookieSecure(req) });
  res.status(201).json({ user: publicUser(user) });
});

// POST /api/session — login.
router.post('/session', rateLimit, async (req, res) => {
  const { email, senha } = req.body ?? {};
  const user = typeof email === 'string' ? await getUserByEmail(email) : null;
  const ok = user && typeof senha === 'string' && verificarSenha(senha, user.salt, user.senha_hash);
  if (!ok) return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
  const token = novoTokenSessao();
  await createSession(user.id, token, new Date(Date.now() + SESSAO_DIAS * 864e5).toISOString());
  setCookieHeader(res, SESSAO_COOKIE, token, { maxAgeSeg: SESSAO_DIAS * 86400, secure: cookieSecure(req) });
  res.json({ user: publicUser(user) });
});

// DELETE /api/session — logout (limpa cookie, idempotente).
router.delete('/session', async (req, res) => {
  const token = parseCookies(req)[SESSAO_COOKIE];
  if (token) await deleteSession(token);
  setCookieHeader(res, SESSAO_COOKIE, '', { maxAgeSeg: 0, secure: cookieSecure(req) });
  res.json({ ok: true });
});

// GET /api/me — sessão atual; sem sessão válida devolve {user:null} com 200.
router.get('/me', async (req, res) => {
  const user = await getUserDaSessao(req);
  res.json({ user: user ? publicUser(user) : null });
});

// GET /api/favoritos — catálogo completo dos veículos favoritados.
router.get('/favoritos', async (req, res) => {
  const user = await getUserDaSessao(req);
  if (!user) return res.status(401).json({ erro: 'Entre para ver favoritos' });
  res.json({ favoritos: await listFavoritos(user.id) });
});

// POST /api/favoritos — favoritar (idempotente, sem toggle).
router.post('/favoritos', async (req, res) => {
  const user = await getUserDaSessao(req);
  if (!user) return res.status(401).json({ erro: 'Entre para favoritar' });
  const veiculoId = Number(req.body?.veiculoId);
  if (!getVeiculoById(veiculoId)) return res.status(404).json({ erro: 'Veículo não encontrado' });
  await addFavorito(user.id, veiculoId);
  res.json({ ok: true });
});

// DELETE /api/favoritos/:veiculoId — desfavoritar (idempotente).
router.delete('/favoritos/:veiculoId(\\d+)', async (req, res) => {
  const user = await getUserDaSessao(req);
  if (!user) return res.status(401).json({ erro: 'Entre para gerenciar favoritos' });
  await removeFavorito(user.id, Number(req.params.veiculoId));
  res.json({ ok: true });
});

// POST /api/ia/gerar — consome 1 crédito (20 logado, 1 grátis por anônimo).
router.post('/ia/gerar', rateLimit, async (req, res) => {
  const user = await getUserDaSessao(req);
  if (user) {
    const restantes = await decrementarCreditosIA(user.id);
    if (restantes == null) return res.status(403).json({ erro: 'Suas 20 recomendações do mês acabaram' });
    return res.json({ ok: true, creditos: restantes });
  }
  const cookies = parseCookies(req);
  let anon = cookies[ANON_COOKIE];
  if (!anon) {
    anon = crypto.randomBytes(16).toString('hex');
    setCookieHeader(res, ANON_COOKIE, anon, { httpOnly: false, maxAgeSeg: 365 * 86400, secure: cookieSecure(req) });
  }
  const registro = await getAnonIa(anon);
  if (registro?.usado) {
    return res.status(403).json({ erro: 'Sua recomendação grátis acabou — crie conta para 20 por mês' });
  }
  await marcarAnonIaUsado(anon);
  res.json({ ok: true, anon: true });
});

// POST /api/leads — captura de lead.
router.post('/leads', rateLimit, async (req, res) => {
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
  await createLead({ nome, email, tipo, mensagem });
  res.status(201).json({ ok: true });
});

export default router;
