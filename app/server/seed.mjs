// Seed do Volante — números e textos reais exibidos no app.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initSchema,
  upsertStat, upsertCategory, upsertRankingEntry, clearRankingBoard, getRankingBoard,
  upsertHighlight, upsertTool, clearTools,
  upsertVeiculosBulk, clearVeiculos, getDriver,
  upsertPost,
} from './db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initSchema();
console.log('[seed] driver:', getDriver());

// ── Seed idempotente (v3) ─────────────────────────────────────────────────────
// O Render roda `npm run seed` a TODO boot; re-inserir 7,5k linhas no Postgres
// a cada cold start era desperdício puro. A versão do seed fica num board de
// metadados (invisível pra API — só os 5 boards conhecidos são expostos) e,
// se já bate com esta, o seed sai sem tocar o banco. FORCE_SEED=1 recarrega.
const SEED_VERSAO = '2026-10-22-v3';
if (getRankingBoard('seed_meta')?.[0]?.name === SEED_VERSAO && !process.env.FORCE_SEED) {
  console.log(`[seed] versão ${SEED_VERSAO} já aplicada — nada a fazer (FORCE_SEED=1 recarrega)`);
  process.exit(0);
}

// ── Normalização de marcas (N4/V7) ───────────────────────────────────────────
const MARCA_NORMALIZADA = {
  'VW - VolksWagen': 'Volkswagen',
  'GM - Chevrolet': 'Chevrolet',
  'Caoa Chery/Chery': 'Caoa Chery',
};
const marcaNorm = (marca) => MARCA_NORMALIZADA[marca] ?? marca;

// ── Categoria por prefixo de nome (N3) ──────────────────────────────────────
// Casa no INÍCIO do nome normalizado (upper, sem acento). Sedan antes de Hatch
// para 'ONIX PLUS'/'HB20S'/'CRUZE SEDAN' não caírem na regra do hatch.
// Furgões, esportivos e minivans ficam com categoria null (ok).
const CATEGORIA_PREFIXOS = [
  // Sedan primeiro: 'ONIX PLUS', 'HB20S', 'CRUZE SEDAN' não podem cair na regra do hatch.
  ['Sedan', ['ONIX PLUS', 'HB20S', 'CRUZE SEDAN', 'ETIOS SEDAN', 'YARIS SEDAN', 'COROLLA', 'CRONOS', 'CITY', 'VIRTUS', 'SENTRA', 'CIVIC', 'VERSA', 'SUNNY', 'LOGAN', 'ACCORD', 'AZERA', 'SONATA', 'ELANTRA', 'JETTA', 'PASSAT', 'PRIUS', 'VOYAGE']],
  ['Pickup', ['STRADA', 'TORO', 'RANGER', 'HILUX', 'S10', 'SAVEIRO', 'RAMPAGE', 'AMAROK', 'FRONTIER', 'MONTANA', 'L200', 'D-MAX', 'F-250', 'F-1000', 'F-4000']],
  ['SUV', ['T-CROSS', 'CRETA', 'COMPASS', 'PULSE', 'TRACKER', 'NIVUS', 'HR-V', 'KICKS', 'RENEGADE', 'HAVAL', 'COROLLA CROSS', 'TERA', 'TAOS', 'TIGGO', 'TUCSON', 'IX35', 'SPORTAGE', 'ECOSPORT', 'KUGA', 'CX-3', 'CX-30', 'AVENGER', 'SONG']],
  ['Hatch', ['ONIX', 'POLO', 'HB20', 'ARGO', 'MOBI', 'KWID', 'DOLPHIN', 'DOLPHIN MINI', 'SANDERO', 'GOLF', '208', '2008', 'CORSA', 'PALIO', 'UNO', 'FIESTA', 'KA', 'GO', 'GOL', 'I30', 'CRUZE HB', 'CRUZE SPORT', 'PICANTO', 'RIO', 'SWIFT', 'MIRAGE', 'I20', 'CLIO', 'PUNTO', 'SIENA', 'IDEA', 'CELTA', 'CLASSIC', 'PRISMA', 'FOX', 'ETIOS', 'YARIS', 'MARCH', '500', 'MINI COOPER']],
];
// Nota: 'DOLPHIN MINI', 'WR-V' e 'FASTBACK' listados como Hatch por serem
// compactos (a FIPE os trata fora do SUV); 'GO' também casa 'GOLF'/'GOL'.
// Furgões (Fiorino, Master), esportivos e minivans ficam com categoria null.

const normChave = (s) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
const normVeic = (marca, nome) => normChave(`${marca} ${nome}`);

// ── Capitalização de exibição (v3) ───────────────────────────────────────────
// A FIPE entrega boa parte dos nomes em CAIXA ALTA ("CRONOS DRIVE 1.3 8V").
// Capitaliza palavra a palavra PRESERVANDO o que não é palavra comum: tokens
// com dígito (1.3, 8V, 4x4), siglas de até 3 letras (TSI, HEV, CS, GT) e uma
// lista de siglas maiores que o tamanho não denuncia (TFSI, PHEV…). Casamento
// de busca/consumo/ranking usa normChave, então a caixa aqui é só visual.
const SIGLAS = new Set(['TFSI', 'PHEV', 'MHEV', 'BEV', 'DOHC', 'SOHC', 'MPI', 'GDI']);
const titleToken = (tok) => {
  if (!tok) return tok;
  if (/\d/.test(tok)) return tok;
  if (SIGLAS.has(tok)) return tok;
  if (tok === tok.toUpperCase() && tok.length <= 3) return tok;
  if (tok === tok.toUpperCase()) return tok[0] + tok.slice(1).toLowerCase();
  if (tok === tok.toLowerCase()) return tok[0].toUpperCase() + tok.slice(1);
  return tok;
};
const titleNome = (nome) =>
  String(nome)
    .split(' ')
    .map((tok) => (tok.includes('-') ? tok.split('-').map(titleToken).join('-') : titleToken(tok)))
    .join(' ');

function categoriaPorPrefixo(nome) {
  const nomeU = normChave(nome);
  for (const [cat, prefixes] of CATEGORIA_PREFIXOS) {
    if (prefixes.some((p) => nomeU.startsWith(p))) return cat;
  }
  return null;
}

// ── Catálogo FIPE — fonte dos números reais do hero ──────────────────────────
const fipeRows = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'fipe-carros.json'), 'utf8'),
);

// ── Histórico FIPE — preço do veículo = mês mais recente do histórico (N4) ──
const histFile = path.join(__dirname, 'data', 'fipe-historico.json');
let historico = {};
try {
  historico = JSON.parse(fs.readFileSync(histFile, 'utf8'));
  console.log(`[seed] fipe-historico: ${Object.keys(historico).length} chaves`);
} catch (err) {
  console.warn('[seed] fipe-historico.json indisponível, usando preco do catálogo:', err.message);
}
const mesMaisRecente = (serie) => {
  const meses = Object.keys(serie ?? {});
  if (!meses.length) return null;
  return serie[meses.sort().at(-1)];
};

// ── [S2] Hero ────────────────────────────────────────────────────────────────
const fmt = (n) => `${n.toLocaleString('pt-BR')}+`;
const marcasNorm = new Set(fipeRows.map((r) => marcaNorm(r.marca)));
[
  { key: 'hero_modelos', label: 'modelos FIPE', value: fmt(fipeRows.length), hint: 'tabela FIPE out/2026' },
  { key: 'hero_marcas', label: 'marcas', value: String(marcasNorm.size), hint: 'marcas cobertas' },
  { key: 'hero_fipe', label: 'tabela oficial · out/2026', value: '100%', hint: 'dados FIPE oficiais' },
  // [S8] Rankings — stats da seção
  { key: 'rank_emplacados', label: 'automóveis emplacados em Setembro/2026', value: '216.366', hint: 'FENABRAVE Setembro/2026' },
  { key: 'rank_crescimento', label: 'em relação a Setembro/2025', value: '+21,2%', hint: 'variação anual' },
  { key: 'rank_acumulado', label: 'acumulado em 2026', value: '1.728.390', hint: 'acumulado do ano' },
  { key: 'rank_eletrificados', label: 'eletrificados emplacados', value: '59.156', hint: 'eletrificados no mês' },
].forEach(upsertStat);

// ── [S3] Categorias ──────────────────────────────────────────────────────────
[
  { slug: 'hatch', name: 'Hatch', icon: 'Car', examples: 'Onix, Polo, HB20...', image: '/assets/categoria-hatch.webp' },
  { slug: 'suv', name: 'SUV', icon: 'CarFront', examples: 'Compass, T-Cross, Creta...', image: '/assets/categoria-suv.webp' },
  { slug: 'sedan', name: 'Sedan', icon: 'CarTaxiFront', examples: 'Corolla, Cronos, City...', image: '/assets/categoria-sedan.webp' },
  { slug: 'pickup', name: 'Pickup', icon: 'Truck', examples: 'Strada, Ranger, Hilux...', image: '/assets/categoria-pickup.webp' },
].forEach(upsertCategory);

// ── Merge de consumo (data/consumo.json, gerado por outra frente) ────────────
// Formato: [{chave:"MARCA MODELO normalizada", consumo_cidade, consumo_estrada, tanque, combustivel}]
let consumoMerge = [];
const consumoFile = path.join(__dirname, 'data', 'consumo.json');
if (fs.existsSync(consumoFile)) {
  try { consumoMerge = JSON.parse(fs.readFileSync(consumoFile, 'utf8')); }
  catch (err) { console.warn('[seed] consumo.json inválido, merge vazio:', err.message); }
}
// consumo-inmetro.json (v3): extraído do PBE Veicular/INMETRO pelo worker de
// dados. Entra DEPOIS do consumo.json — chave repetida, o curado vence.
const consumoInmetroFile = path.join(__dirname, 'data', 'consumo-inmetro.json');
if (fs.existsSync(consumoInmetroFile)) {
  try { consumoMerge = consumoMerge.concat(JSON.parse(fs.readFileSync(consumoInmetroFile, 'utf8'))); }
  catch (err) { console.warn('[seed] consumo-inmetro.json inválido, ignorado:', err.message); }
}
function mergeConsumo(v) {
  if (!consumoMerge.length) return v;
  const chave = normVeic(v.marca, v.nome);
  const row =
    consumoMerge.find((c) => normChave(c.chave) === chave) ??
    consumoMerge.find((c) => {
      const k = normChave(c.chave);
      return k && (k.includes(chave) || chave.includes(k));
    });
  if (!row) return v;
  return {
    ...v,
    consumo_cidade: row.consumo_cidade ?? v.consumo_cidade ?? null,
    consumo_estrada: row.consumo_estrada ?? v.consumo_estrada ?? null,
    tanque: row.tanque ?? v.tanque ?? null,
  };
}
if (consumoMerge.length) {
  console.log(`[seed] consumo.json: ${consumoMerge.length} chaves para merge`);
}

// ── [B3] Bulk load FIPE — 100% do catálogo, sem registros curados (N4) ──────
// Top 50 FENABRAVE (nomes já normalizados) para pos_fenabrave (N7).
const top50 = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'fenabrave-top50.json'), 'utf8'),
);
const top50Norm = top50.map((e) => ({ pos: e.position, nome: normChave(e.name) }));

const fipe = fipeRows.map((r) => {
  const marca = marcaNorm(r.marca);
  const nome = titleNome(String(r.nome).replace(/\s+/g, ' ').trim()); // v3: caixa de exibição
  const chaveHist = `${r.codigo_fipe}|${r.ano}`;
  const precoHist = mesMaisRecente(historico[chaveHist]);
  const chaveFull = normChave(`${marca} ${nome}`);
  const fenabrave = top50Norm.find((t) => chaveFull.includes(t.nome));
  return {
    nome,
    marca,
    categoria: categoriaPorPrefixo(nome),
    preco: precoHist ?? r.preco,
    ano: r.ano,
    combustivel: r.combustivel,
    codigo_fipe: r.codigo_fipe,
    pos_fenabrave: fenabrave ? fenabrave.pos : null,
  };
});
clearVeiculos();
upsertVeiculosBulk(fipe.map(mergeConsumo));
console.log(`[seed] veiculos: ${fipe.length} FIPE (preço do histórico aplicado quando mais recente)`);
console.log('[seed] categorias:', fipe.reduce((acc, v) => { acc[v.categoria ?? 'null'] = (acc[v.categoria ?? 'null'] ?? 0) + 1; return acc; }, {}));

// ── [S8] Rankings ────────────────────────────────────────────────────────────
// Top 5 Marcas — nomes na mesma normalização do catálogo (N4/V7)
clearRankingBoard('marcas');
[
  { position: 1, name: 'Volkswagen', value: 37098 },
  { position: 2, name: 'Fiat', value: 28873 },
  { position: 3, name: 'Chevrolet', value: 23489 },
  { position: 4, name: 'BYD', value: 22171 },
  { position: 5, name: 'Hyundai', value: 14907 },
].forEach((e) => upsertRankingEntry({ board: 'marcas', ...e, href: null }));

// Eletrificados — Híbridos
clearRankingBoard('ev_hibridos');
[
  { position: 1, name: 'BYD', value: 7854 },
  { position: 2, name: 'GWM', value: 7017 },
  { position: 3, name: 'Omoda', value: 6495 },
  { position: 4, name: 'Jeep', value: 4129 },
  { position: 5, name: 'Toyota', value: 3470 },
].forEach((e) => upsertRankingEntry({ board: 'ev_hibridos', ...e, href: null }));

// Eletrificados — Elétricos
clearRankingBoard('ev_eletricos');
[
  { position: 1, name: 'BYD', value: 14317 },
  { position: 2, name: 'GEELY', value: 3119 },
  { position: 3, name: 'GAC', value: 1755 },
  { position: 4, name: 'GM', value: 986 },
  { position: 5, name: 'MG', value: 556 },
].forEach((e) => upsertRankingEntry({ board: 'ev_eletricos', ...e, href: null }));

// Top 5 Veículos
clearRankingBoard('veiculos');
[
  { position: 1, name: 'Fiat Strada', value: 16002 },
  { position: 2, name: 'Volkswagen Polo', value: 11095 },
  { position: 3, name: 'BYD Dolphin Mini', value: 9385 },
  { position: 4, name: 'Volkswagen T-Cross', value: 9339 },
  { position: 5, name: 'Volkswagen Tera', value: 8725 },
].forEach((e) => upsertRankingEntry({ board: 'veiculos', ...e, href: '/busca' }));

// Top 50 FENABRAVE (set/2026) — extraído de carrolens.com.br/rankings (do próprio
// dono; coleta autorizada 21/10/2026). Arquivo: data/fenabrave-top50.json.
clearRankingBoard('veiculos_top50');
top50.forEach((e) => upsertRankingEntry({ board: 'veiculos_top50', ...e }));
console.log(`[seed] veiculos_top50: ${top50.length} posições`);

// ── [S4] Highlight Payback (Elétrico compensa?) — B5/N5: payload honesto ────
// Preços FIPE reais do catálogo (versões 2026/2027). Custos: 1.500 km/mês.
// Polo gasolina 12 km/L × R$ 6,20 = R$ 775 · Polo etanol 8,5 × R$ 4,20 = R$ 741
// Corolla Cross HEV 18 km/L = R$ 517 · Dolphin 6,7 km/kWh × R$ 0,85 = R$ 190
upsertHighlight('payback', {
  badge: 'Exemplo ilustrativo',
  comparacao: 'BYD Dolphin vs VW Polo · 1.500 km/mês',
  preco_combustiveis: { gasolina: 'R$ 6,20/L', etanol: 'R$ 4,20/L', energia: 'R$ 0,85/kWh' },
  custos_mensais: [
    { veiculo: 'VW Polo 1.0 TSI', detalhe: '12 km/L (gasolina)', valor: 'R$ 775/mês' },
    { veiculo: 'VW Polo 1.0 TSI', detalhe: '8,5 km/L (etanol)', valor: 'R$ 741/mês' },
    { veiculo: 'Corolla Cross XRE 1.8 HEV', detalhe: '18 km/L', valor: 'R$ 517/mês' },
    { veiculo: 'BYD Dolphin EV', detalhe: '6,7 km/kWh', valor: 'R$ 190/mês' },
  ],
  chips: ['Gasolina', 'Etanol', 'Híbrido', 'Elétrico'],
  // parâmetros numéricos para a calculadora interativa (valores dos custos acima)
  params: {
    km_mes: 1500,
    gasolina: 6.2, // R$/L
    etanol: 4.2, // R$/L
    energia: 0.85, // R$/kWh
    carros: [
      { nome: 'VW Polo 1.0 TSI', tipo: 'gasolina', consumo: 12, preco: 91272 }, // Polo 1.0 TSI Flex 12V 5p 2026
      { nome: 'VW Polo 1.0 TSI', tipo: 'etanol', consumo: 8.5, preco: 91272 },
      { nome: 'Corolla Cross XRE 1.8 HEV', tipo: 'hibrido', consumo: 18, preco: 192963 }, // Corolla Cross XRV 1.8 16V Aut. (Híbrido) 2026
      { nome: 'BYD Dolphin EV', tipo: 'eletrico', consumo: 6.7, preco: 132420 }, // Dolphin EV GS (Elétrico) 2027
    ],
  },
});

// ── [S6] Highlight Recomendação IA — N18/N5: sem "No catálogo"/"IA" ─────────
upsertHighlight('recomendacao', {
  card: 'Recomendação #1',
  veiculo: 'VW T-Cross 1.4 TSI · 2024',
  preco: 'R$ 118.990 FIPE',
  pergunta: 'Por que este veículo?',
  resposta: 'Combina orçamento de até R$ 120k com uso misto cidade/estrada. Motor 1.4 turbo entrega 150 cv com bom consumo no dia a dia.',
  pontos_fortes: ['6 airbags de série', '0-100 em 8,2s', '13,4 km/L cidade'],
  atencao: ['Próximo ao teto do orçamento', 'Porta-malas menor'],
  rodape: '+ 4 outras opções no seu ranking',
  preco_valor: 118990,
});

// ── [S7] Highlight Financiamento — N9: consórcio com taxa adm. explícita ────
// Consórcio: 60× R$ 64.000 × 1,18 (taxa adm. ~18%) = R$ 1.258,67/mês.
upsertHighlight('financiamento', {
  exemplo: 'R$ 80.000 · Entrada 20%',
  veiculo_financiado: 'R$ 64.000',
  opcoes: [
    { modalidade: 'CDC', parcela: '48x R$ 1.792', total: 'Total: R$ 86.016' },
    { modalidade: 'Leasing', parcela: '48x R$ 1.620', total: 'Total: R$ 77.760' },
    { modalidade: 'Consórcio', parcela: '60x R$ 1.259', total: 'Total: R$ 75.520 · taxa adm. ~18%' },
    { modalidade: 'Assinatura', parcela: 'R$ 3.500/mês', total: 'Sem entrada' },
  ],
  // parâmetros numéricos para o simulador interativo (taxas derivadas das parcelas exibidas)
  params: {
    valor_padrao: 80000,
    entrada_pct: 20,
    cdc: { meses: 48, taxa_mes: 0.0126 },
    leasing: { meses: 48, taxa_mes: 0.0049 },
    consorcio: { meses: 60, taxa_mes: 0, taxa_adm: 0.18 },
    assinatura: { mensalidade: 3500, meses: 48, obs: 'sem posse do veículo' },
  },
});

// ── [S5] Ferramentas — N5: discurso único sobre "IA" ─────────────────────────
clearTools();
[
  { title: 'Buscar Veículos', description: 'Explore o catálogo completo com preços FIPE', action_label: 'Explorar', href: '/busca', icon: 'Search', badge: null },
  { title: 'Decida Meu Carro', description: 'Responda 4 perguntas e receba um ranking personalizado', action_label: 'Gerar recomendação', href: '/decida', icon: 'Sparkles', badge: null },
  { title: 'Comparar', description: 'Compare veículos lado a lado com dados FIPE', action_label: 'Comparar', href: '/comparar', icon: 'Scale', badge: null },
  { title: 'Calculadora de payback', description: 'Descubra em quantos meses o elétrico compensa', action_label: 'Calcular', href: '/calculadora', icon: 'Calculator', badge: 'Inédito' },
  { title: 'Financiamento', description: 'CDC, Leasing, Consórcio e Assinatura comparados', action_label: 'Simular', href: '/financiamento', icon: 'Banknote', badge: null },
  { title: 'Rankings', description: 'Vendas FENABRAVE oficiais mês a mês', action_label: 'Ver ranking', href: '/rankings', icon: 'Trophy', badge: null },
].forEach(upsertTool);

// ── [B5] Blog — 4 posts do dono (carrolens.com.br/blog, autorizado) ─────────
const posts = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'blog-posts.json'), 'utf8'),
);
posts.forEach(upsertPost);
console.log(`[seed] posts: ${posts.length}`);

console.log('[seed] ok — stats, 4 categorias, 5 boards de ranking, 3 highlights, 6 ferramentas, posts');

// Marcador de versão (por último: só vira "já semeado" quando TUDO rodou).
clearRankingBoard('seed_meta');
upsertRankingEntry({ board: 'seed_meta', position: 1, name: SEED_VERSAO, value: 0, href: null });;
