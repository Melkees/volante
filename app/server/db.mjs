// Camada de persistência do CarroLens.
// Motor primário: better-sqlite3 (app/server/data/app.db).
// Fallback: store JSON em app/server/data/ (mesma interface) caso o módulo
// nativo não esteja disponível/compilado no ambiente.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'app.db');
const JSON_FILE = path.join(DATA_DIR, 'app.json');

let driver = 'sqlite';
let db = null;
let jsonState = null;

function loadJsonState() {
  if (jsonState) return jsonState;
  if (fs.existsSync(JSON_FILE)) {
    jsonState = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  } else {
    jsonState = { stats: [], categories: [], ranking_entries: [], highlights: [], tools: [], veiculos: [], posts: [] };
  }
  // Tabelas de conta (podem faltar em stores antigos).
  for (const k of ['users', 'sessions', 'favoritos', 'leads', 'anon_ia']) {
    if (!Array.isArray(jsonState[k])) jsonState[k] = [];
  }
  return jsonState;
}

function saveJsonState() {
  fs.writeFileSync(JSON_FILE, JSON.stringify(jsonState, null, 2));
}

let Database = null;
try {
  const mod = await import('better-sqlite3');
  Database = mod.default;
  db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
} catch (err) {
  driver = 'json';
  console.warn('[db] better-sqlite3 indisponível, usando store JSON:', err.message);
}

export function getDriver() {
  return driver;
}

export function initSchema() {
  if (driver === 'json') return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      hint TEXT
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      icon TEXT,
      examples TEXT,
      image TEXT
    );
    CREATE TABLE IF NOT EXISTS ranking_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board TEXT NOT NULL,
      position INTEGER NOT NULL,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      href TEXT
    );
    CREATE TABLE IF NOT EXISTS highlights (
      section TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      action_label TEXT,
      href TEXT,
      icon TEXT,
      badge TEXT
    );
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      resumo TEXT,
      conteudo TEXT NOT NULL,
      data TEXT,
      categoria TEXT
    );
    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      marca TEXT NOT NULL,
      categoria TEXT NOT NULL,
      preco REAL
    );
  `);
  // Colunas FIPE (opcional em bancos criados antes do catálogo completo).
  for (const ddl of [
    'ALTER TABLE veiculos ADD COLUMN ano INTEGER',
    'ALTER TABLE veiculos ADD COLUMN combustivel TEXT',
    'ALTER TABLE veiculos ADD COLUMN codigo_fipe TEXT',
    'ALTER TABLE veiculos ADD COLUMN consumo_cidade REAL',
    'ALTER TABLE veiculos ADD COLUMN consumo_estrada REAL',
    'ALTER TABLE veiculos ADD COLUMN tanque REAL',
  ]) {
    try { db.exec(ddl); } catch { /* coluna já existe */ }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      creditos_ia INTEGER NOT NULL DEFAULT 20,
      criado_em TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expira_em TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS favoritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      veiculo_id INTEGER NOT NULL,
      criado_em TEXT NOT NULL,
      UNIQUE(user_id, veiculo_id)
    );
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      tipo TEXT NOT NULL,
      mensagem TEXT,
      criado_em TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS anon_ia (
      cookie TEXT PRIMARY KEY,
      usado INTEGER NOT NULL DEFAULT 0
    );
  `);
}

// ── stats ────────────────────────────────────────────────────────────────────
export function upsertStat(stat) {
  if (driver === 'json') {
    const s = loadJsonState();
    const i = s.stats.findIndex((x) => x.key === stat.key);
    if (i >= 0) s.stats[i] = stat; else s.stats.push(stat);
    saveJsonState();
    return;
  }
  db.prepare(
    `INSERT INTO stats (key, label, value, hint) VALUES (@key, @label, @value, @hint)
     ON CONFLICT(key) DO UPDATE SET label=@label, value=@value, hint=@hint`
  ).run(stat);
}

export function getStats() {
  if (driver === 'json') return loadJsonState().stats;
  return db.prepare('SELECT key, label, value, hint FROM stats ORDER BY key').all();
}

// ── categories ───────────────────────────────────────────────────────────────
export function upsertCategory(cat) {
  if (driver === 'json') {
    const s = loadJsonState();
    const i = s.categories.findIndex((x) => x.slug === cat.slug);
    if (i >= 0) s.categories[i] = { id: i + 1, ...cat }; else s.categories.push({ id: s.categories.length + 1, ...cat });
    saveJsonState();
    return;
  }
  db.prepare(
    `INSERT INTO categories (slug, name, icon, examples, image) VALUES (@slug, @name, @icon, @examples, @image)
     ON CONFLICT(slug) DO UPDATE SET name=@name, icon=@icon, examples=@examples, image=@image`
  ).run(cat);
}

export function getCategories() {
  if (driver === 'json') return loadJsonState().categories;
  return db.prepare('SELECT * FROM categories ORDER BY id').all();
}

// ── ranking_entries ──────────────────────────────────────────────────────────
export function upsertRankingEntry(entry) {
  if (driver === 'json') {
    const s = loadJsonState();
    const i = s.ranking_entries.findIndex((x) => x.board === entry.board && x.position === entry.position);
    if (i >= 0) s.ranking_entries[i] = entry; else s.ranking_entries.push(entry);
    saveJsonState();
    return;
  }
  db.prepare(
    `INSERT INTO ranking_entries (board, position, name, value, href) VALUES (@board, @position, @name, @value, @href)
     ON CONFLICT DO NOTHING`
  ).run(entry);
}

export function clearRankingBoard(board) {
  if (driver === 'json') {
    const s = loadJsonState();
    s.ranking_entries = s.ranking_entries.filter((x) => x.board !== board);
    saveJsonState();
    return;
  }
  db.prepare('DELETE FROM ranking_entries WHERE board = ?').run(board);
}

export function getRankingBoard(board) {
  if (driver === 'json') {
    return loadJsonState().ranking_entries.filter((x) => x.board === board).sort((a, b) => a.position - b.position);
  }
  return db.prepare('SELECT * FROM ranking_entries WHERE board = ? ORDER BY position').all(board);
}

// ── highlights ───────────────────────────────────────────────────────────────
export function upsertHighlight(section, payload) {
  const payloadJson = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (driver === 'json') {
    const s = loadJsonState();
    const i = s.highlights.findIndex((x) => x.section === section);
    if (i >= 0) s.highlights[i] = { section, payload: payloadJson }; else s.highlights.push({ section, payload: payloadJson });
    saveJsonState();
    return;
  }
  db.prepare(
    `INSERT INTO highlights (section, payload) VALUES (?, ?)
     ON CONFLICT(section) DO UPDATE SET payload=excluded.payload`
  ).run(section, payloadJson);
}

export function getHighlights() {
  if (driver === 'json') {
    return loadJsonState().highlights.map((h) => ({ section: h.section, payload: JSON.parse(h.payload) }));
  }
  return db.prepare('SELECT section, payload FROM highlights ORDER BY section').all()
    .map((h) => ({ section: h.section, payload: JSON.parse(h.payload) }));
}

// ── tools ────────────────────────────────────────────────────────────────────
export function upsertTool(tool) {
  if (driver === 'json') {
    const s = loadJsonState();
    const i = s.tools.findIndex((x) => x.title === tool.title);
    if (i >= 0) s.tools[i] = { id: i + 1, ...tool }; else s.tools.push({ id: s.tools.length + 1, ...tool });
    saveJsonState();
    return;
  }
  db.prepare(
    `INSERT INTO tools (title, description, action_label, href, icon, badge)
     VALUES (@title, @description, @action_label, @href, @icon, @badge)
     ON CONFLICT DO NOTHING`
  ).run(tool);
}

export function clearTools() {
  if (driver === 'json') {
    loadJsonState().tools = [];
    saveJsonState();
    return;
  }
  db.prepare('DELETE FROM tools').run();
}

export function getTools() {
  if (driver === 'json') return loadJsonState().tools;
  return db.prepare('SELECT * FROM tools ORDER BY id').all();
}

// ── histórico FIPE (FipeX) ───────────────────────────────────────────────────
// Série mensal por (codigo_fipe|ano_modelo) em app/server/data/fipe-historico.json.
// Carregada uma única vez (arquivo grande, ~230k pontos) e servida via join.
let historicoCache = null;
function getHistoricoMap() {
  if (historicoCache) return historicoCache;
  const FILE = path.join(DATA_DIR, 'fipe-historico.json');
  historicoCache = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
  return historicoCache;
}

export function getHistorico(veiculo) {
  if (!veiculo?.codigo_fipe || veiculo.ano == null) return [];
  const serie = getHistoricoMap()[`${veiculo.codigo_fipe}|${veiculo.ano}`];
  if (!serie) return [];
  return Object.entries(serie)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([mes, preco]) => ({ mes, preco }));
}

// ── posts (blog) ─────────────────────────────────────────────────────────────
export function upsertPost(post) {
  if (driver === 'json') {
    const s = loadJsonState();
    if (!Array.isArray(s.posts)) s.posts = [];
    const i = s.posts.findIndex((x) => x.slug === post.slug);
    if (i >= 0) s.posts[i] = post; else s.posts.push(post);
    saveJsonState();
    return;
  }
  db.prepare(
    `INSERT INTO posts (slug, titulo, resumo, conteudo, data, categoria)
     VALUES (@slug, @titulo, @resumo, @conteudo, @data, @categoria)
     ON CONFLICT(slug) DO UPDATE SET titulo=@titulo, resumo=@resumo,
       conteudo=@conteudo, data=@data, categoria=@categoria`
  ).run(post);
}

export function getPosts() {
  if (driver === 'json') return loadJsonState().posts ?? [];
  return db.prepare(
    'SELECT slug, titulo, resumo, conteudo, data, categoria FROM posts ORDER BY data DESC'
  ).all();
}

export function getPost(slug) {
  if (driver === 'json') return (loadJsonState().posts ?? []).find((p) => p.slug === slug) ?? null;
  return db.prepare(
    'SELECT slug, titulo, resumo, conteudo, data, categoria FROM posts WHERE slug = ?'
  ).get(slug) ?? null;
}

export function getVeiculoById(id) {
  return getVeiculos().find((v) => v.id === Number(id)) ?? null;
}

// ── veiculos (catálogo) ──────────────────────────────────────────────────────
// Cache em memória: o catálogo FIPE tem ~7.5k linhas — ler tudo a cada request
// (JSON re-parse ou query SQLite) é desperdício. Invalida em upsert/clear.
let veiculosCache = null;
const invalidateVeiculos = () => { veiculosCache = null; };

const FIPE_COLS = ['nome', 'marca', 'categoria', 'preco', 'ano', 'combustivel', 'codigo_fipe', 'consumo_cidade', 'consumo_estrada', 'tanque'];
const fipeParams = (v) => Object.fromEntries(FIPE_COLS.map((c) => [c, v[c] ?? null]));

const insertVeiculoSql = `INSERT INTO veiculos (nome, marca, categoria, preco, ano, combustivel, codigo_fipe, consumo_cidade, consumo_estrada, tanque)
  VALUES (@nome, @marca, @categoria, @preco, @ano, @combustivel, @codigo_fipe, @consumo_cidade, @consumo_estrada, @tanque)`;

export function upsertVeiculo(v) {
  if (driver === 'json') {
    const s = loadJsonState();
    const i = s.veiculos.findIndex((x) => x.nome === v.nome && x.marca === v.marca);
    if (i >= 0) s.veiculos[i] = { id: i + 1, ...v }; else s.veiculos.push({ id: s.veiculos.length + 1, ...v });
    saveJsonState();
    invalidateVeiculos();
    return;
  }
  db.prepare(insertVeiculoSql).run(fipeParams(v));
  invalidateVeiculos();
}

// Bulk load do catálogo FIPE — grava uma única vez (JSON) ou numa transação (SQLite).
export function upsertVeiculosBulk(list) {
  if (list.length === 0) return;
  if (driver === 'json') {
    const s = loadJsonState();
    let id = s.veiculos.length;
    for (const v of list) s.veiculos.push({ id: ++id, ...v });
    saveJsonState();
  } else {
    const insert = db.prepare(insertVeiculoSql);
    db.transaction((rows) => { for (const v of rows) insert.run(fipeParams(v)); })(list);
  }
  invalidateVeiculos();
}

export function clearVeiculos() {
  if (driver === 'json') {
    loadJsonState().veiculos = [];
    saveJsonState();
  } else {
    db.prepare('DELETE FROM veiculos').run();
  }
  invalidateVeiculos();
}

export function getVeiculos() {
  if (veiculosCache) return veiculosCache;
  let rows;
  if (driver === 'json') rows = loadJsonState().veiculos;
  else {
    rows = db.prepare(
      'SELECT id, nome, marca, categoria, preco, ano, combustivel, codigo_fipe, consumo_cidade, consumo_estrada, tanque FROM veiculos ORDER BY id'
    ).all();
  }
  veiculosCache = rows;
  return rows;
}

// ── contas: users / sessions / favoritos / leads / anon_ia ───────────────────
// Segurança: scrypt p/ hash de senha (salt 16B aleatório), timingSafeEqual na
// comparação. Nunca logar senha nem hash.

export function hashSenha(senha, salt) {
  return crypto.scryptSync(String(senha), salt, 64).toString('hex');
}

export function verificarSenha(senha, salt, hashEsperado) {
  const hash = Buffer.from(hashSenha(senha, salt), 'hex');
  const esperado = Buffer.from(hashEsperado, 'hex');
  return hash.length === esperado.length && crypto.timingSafeEqual(hash, esperado);
}

export function novoSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function novoTokenSessao() {
  return crypto.randomBytes(32).toString('hex');
}

function nextId(list) {
  return list.reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1;
}

export function getUserByEmail(email) {
  const e = String(email ?? '').trim().toLowerCase();
  if (driver === 'json') return loadJsonState().users.find((u) => u.email === e) ?? null;
  return db.prepare('SELECT * FROM users WHERE email = ?').get(e) ?? null;
}

export function getUserById(id) {
  if (driver === 'json') return loadJsonState().users.find((u) => u.id === Number(id)) ?? null;
  return db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id)) ?? null;
}

export function createUser({ nome, email, senha }) {
  const salt = novoSalt();
  const user = {
    nome: String(nome).trim(),
    email: String(email).trim().toLowerCase(),
    senha_hash: hashSenha(senha, salt),
    salt,
    creditos_ia: 20,
    criado_em: new Date().toISOString(),
  };
  if (driver === 'json') {
    const s = loadJsonState();
    user.id = nextId(s.users);
    s.users.push(user);
    saveJsonState();
  } else {
    const info = db.prepare(
      'INSERT INTO users (nome, email, senha_hash, salt, creditos_ia, criado_em) VALUES (@nome, @email, @senha_hash, @salt, @creditos_ia, @criado_em)'
    ).run(user);
    user.id = Number(info.lastInsertRowid);
  }
  return user;
}

export function decrementarCreditosIA(userId) {
  if (driver === 'json') {
    const s = loadJsonState();
    const u = s.users.find((x) => x.id === Number(userId));
    if (!u || u.creditos_ia <= 0) return null;
    u.creditos_ia -= 1;
    saveJsonState();
    return u.creditos_ia;
  }
  const row = db.prepare(
    'UPDATE users SET creditos_ia = creditos_ia - 1 WHERE id = ? AND creditos_ia > 0 RETURNING creditos_ia'
  ).get(Number(userId));
  return row ? row.creditos_ia : null;
}

export function createSession(userId, token, expiraEm) {
  if (driver === 'json') {
    const s = loadJsonState();
    s.sessions.push({ token, user_id: Number(userId), expira_em: expiraEm });
    saveJsonState();
    return;
  }
  db.prepare('INSERT INTO sessions (token, user_id, expira_em) VALUES (?, ?, ?)').run(token, Number(userId), expiraEm);
}

export function getSession(token) {
  if (!token) return null;
  let sess;
  if (driver === 'json') sess = loadJsonState().sessions.find((x) => x.token === token) ?? null;
  else sess = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) ?? null;
  if (!sess) return null;
  if (new Date(sess.expira_em).getTime() < Date.now()) {
    deleteSession(token);
    return null;
  }
  return sess;
}

export function deleteSession(token) {
  if (driver === 'json') {
    const s = loadJsonState();
    s.sessions = s.sessions.filter((x) => x.token !== token);
    saveJsonState();
    return;
  }
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Favoritos — join com o catálogo (objeto veículo completo), mais recente 1º.
export function listFavoritos(userId) {
  let favs;
  if (driver === 'json') {
    favs = loadJsonState().favoritos.filter((f) => f.user_id === Number(userId));
  } else {
    favs = db.prepare('SELECT * FROM favoritos WHERE user_id = ?').all(Number(userId));
  }
  favs.sort((a, b) => (a.criado_em < b.criado_em ? 1 : a.criado_em > b.criado_em ? -1 : b.id - a.id));
  const veiculos = getVeiculos();
  return favs
    .map((f) => veiculos.find((v) => v.id === f.veiculo_id))
    .filter(Boolean);
}

export function getFavorito(userId, veiculoId) {
  if (driver === 'json') {
    return loadJsonState().favoritos.find((f) => f.user_id === Number(userId) && f.veiculo_id === Number(veiculoId)) ?? null;
  }
  return db.prepare('SELECT * FROM favoritos WHERE user_id = ? AND veiculo_id = ?').get(Number(userId), Number(veiculoId)) ?? null;
}

export function addFavorito(userId, veiculoId) {
  if (getFavorito(userId, veiculoId)) return false; // idempotente
  const fav = { user_id: Number(userId), veiculo_id: Number(veiculoId), criado_em: new Date().toISOString() };
  if (driver === 'json') {
    const s = loadJsonState();
    s.favoritos.push({ id: nextId(s.favoritos), ...fav });
    saveJsonState();
  } else {
    db.prepare('INSERT INTO favoritos (user_id, veiculo_id, criado_em) VALUES (?, ?, ?)').run(fav.user_id, fav.veiculo_id, fav.criado_em);
  }
  return true;
}

export function removeFavorito(userId, veiculoId) {
  if (driver === 'json') {
    const s = loadJsonState();
    const antes = s.favoritos.length;
    s.favoritos = s.favoritos.filter((f) => !(f.user_id === Number(userId) && f.veiculo_id === Number(veiculoId)));
    saveJsonState();
    return s.favoritos.length < antes;
  }
  return db.prepare('DELETE FROM favoritos WHERE user_id = ? AND veiculo_id = ?').run(Number(userId), Number(veiculoId)).changes > 0;
}

export function createLead({ nome, email, tipo, mensagem }) {
  const lead = {
    nome: String(nome).trim(),
    email: String(email).trim().toLowerCase(),
    tipo: String(tipo),
    mensagem: mensagem ? String(mensagem) : null,
    criado_em: new Date().toISOString(),
  };
  if (driver === 'json') {
    const s = loadJsonState();
    s.leads.push({ id: nextId(s.leads), ...lead });
    saveJsonState();
  } else {
    db.prepare('INSERT INTO leads (nome, email, tipo, mensagem, criado_em) VALUES (@nome, @email, @tipo, @mensagem, @criado_em)').run(lead);
  }
  return lead;
}

// IA anônima — 1 uso grátis por cookie.
export function getAnonIa(cookie) {
  if (!cookie) return null;
  if (driver === 'json') return loadJsonState().anon_ia.find((a) => a.cookie === cookie) ?? null;
  return db.prepare('SELECT * FROM anon_ia WHERE cookie = ?').get(cookie) ?? null;
}

export function marcarAnonIaUsado(cookie) {
  if (driver === 'json') {
    const s = loadJsonState();
    const existente = s.anon_ia.find((a) => a.cookie === cookie);
    if (existente) existente.usado = 1;
    else s.anon_ia.push({ cookie, usado: 1 });
    saveJsonState();
    return;
  }
  db.prepare('INSERT INTO anon_ia (cookie, usado) VALUES (?, 1) ON CONFLICT(cookie) DO UPDATE SET usado=1').run(cookie);
}
