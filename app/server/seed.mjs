// Seed do CarroLens — números e textos reais exibidos no vídeo/DOM da home
// (ver out/plan.md, seções [S2]–[S8]).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initSchema,
  upsertStat, upsertCategory, upsertRankingEntry, clearRankingBoard,
  upsertHighlight, upsertTool, clearTools,
  upsertVeiculo, upsertVeiculosBulk, clearVeiculos, getDriver,
  upsertPost,
} from './db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initSchema();
console.log('[seed] driver:', getDriver());

// ── Catálogo FIPE (set/2026) — fonte dos números reais do hero ───────────────
const fipeRows = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'fipe-carros.json'), 'utf8'),
);
const fipeMarcas = new Set(fipeRows.map((r) => r.marca));
const fmt = (n) => `${n.toLocaleString('pt-BR')}+`;

// ── [S2] Hero ────────────────────────────────────────────────────────────────
// Números calculados do load FIPE — nada hardcode.
[
  { key: 'hero_modelos', label: 'modelos FIPE', value: fmt(fipeRows.length), hint: 'tabela FIPE set/2026' },
  { key: 'hero_marcas', label: 'marcas', value: String(fipeMarcas.size), hint: 'marcas cobertas' },
  { key: 'hero_fipe', label: 'tabela oficial · set/2026', value: '100%', hint: 'dados FIPE oficiais' },
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

// ── [B3] Catálogo de veículos — só dado real já presente no app:
// top 5 FENABRAVE (com marca no nome, item 7) + examples das categorias.
// Preço real existe só para o T-Cross 1.4 TSI 2024 (R$ 118.990 do
// /api/highlights → recomendacao). Demais: null (UI exibe "—").
clearVeiculos();
const curados = [
  { nome: 'Fiat Strada', marca: 'Fiat', categoria: 'Pickup', preco: null },
  { nome: 'Volkswagen Polo', marca: 'Volkswagen', categoria: 'Hatch', preco: null },
  { nome: 'BYD Dolphin Mini', marca: 'BYD', categoria: 'Hatch', preco: null },
  { nome: 'Volkswagen T-Cross', marca: 'Volkswagen', categoria: 'SUV', preco: 118990 },
  { nome: 'Volkswagen Tera', marca: 'Volkswagen', categoria: 'SUV', preco: null },
  { nome: 'Chevrolet Onix', marca: 'Chevrolet', categoria: 'Hatch', preco: null },
  { nome: 'Hyundai HB20', marca: 'Hyundai', categoria: 'Hatch', preco: null },
  { nome: 'Jeep Compass', marca: 'Jeep', categoria: 'SUV', preco: null },
  { nome: 'Hyundai Creta', marca: 'Hyundai', categoria: 'SUV', preco: null },
  { nome: 'Toyota Corolla', marca: 'Toyota', categoria: 'Sedan', preco: null },
  { nome: 'Fiat Cronos', marca: 'Fiat', categoria: 'Sedan', preco: null },
  { nome: 'Honda City', marca: 'Honda', categoria: 'Sedan', preco: null },
  { nome: 'Ford Ranger', marca: 'Ford', categoria: 'Pickup', preco: null },
  { nome: 'Toyota Hilux', marca: 'Toyota', categoria: 'Pickup', preco: null },
  // do exemplo do payback (dom-snapshot) — sem preço divulgado
  { nome: 'Toyota Corolla Cross HEV', marca: 'Toyota', categoria: 'SUV', preco: null },
  { nome: 'BYD Dolphin', marca: 'BYD', categoria: 'Hatch', preco: null },
];

// ── Merge de consumo (data/consumo.json, gerado por outra frente) ────────────
// Formato: [{chave:"MARCA MODELO normalizada", consumo_cidade, consumo_estrada, tanque, combustivel}]
// Normalização: upper + remover acentos (NFD) + colapsar espaços.
const normChave = (s) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
const normVeic = (marca, nome) => normChave(`${marca} ${nome}`);

let consumoMerge = [];
const consumoFile = path.join(__dirname, 'data', 'consumo.json');
if (fs.existsSync(consumoFile)) {
  try { consumoMerge = JSON.parse(fs.readFileSync(consumoFile, 'utf8')); }
  catch (err) { console.warn('[seed] consumo.json inválido, merge vazio:', err.message); }
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

curados.forEach((v) => upsertVeiculo(mergeConsumo(v)));

// Bulk load FIPE: categoria null, ano/combustivel/codigo_fipe/preco reais.
// Dedup: pula linha cuja chave (marca+nome) normalizada já existe entre curados.
const normKey = (marca, nome) => normVeic(marca, nome);
const curadosKeys = new Set(curados.map((v) => normKey(v.marca, v.nome)));
const fipe = fipeRows
  .map((r) => ({
    nome: r.nome, marca: r.marca, categoria: null, preco: r.preco,
    ano: r.ano, combustivel: r.combustivel, codigo_fipe: r.codigo_fipe,
  }))
  .filter((v) => !curadosKeys.has(normKey(v.marca, v.nome)))
  .map(mergeConsumo);
upsertVeiculosBulk(fipe);
console.log(`[seed] veiculos: ${curados.length} curados + ${fipe.length} FIPE (de ${fipeRows.length} linhas, ${fipeRows.length - fipe.length} dedup)`);

// ── [S8] Rankings ────────────────────────────────────────────────────────────
// Top 5 Marcas
clearRankingBoard('marcas');
[
  { position: 1, name: 'VW', value: 37098 },
  { position: 2, name: 'Fiat', value: 28873 },
  { position: 3, name: 'GM - Chevrolet', value: 23489 },
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
const top50 = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'fenabrave-top50.json'), 'utf8'),
);
top50.forEach((e) => upsertRankingEntry({ board: 'veiculos_top50', ...e }));
console.log(`[seed] veiculos_top50: ${top50.length} posições`);

// ── [S4] Highlight Payback (Elétrico compensa?) ──────────────────────────────
upsertHighlight('payback', {
  badge: 'Exemplo ilustrativo',
  economia_5_anos: 'R$ 20.640',
  comparacao: 'BYD Dolphin vs VW Polo · 1.500 km/mês',
  preco_combustiveis: { gasolina: 'R$ 6,20/L', energia: 'R$ 0,85/kWh' },
  custos_mensais: [
    { veiculo: 'VW Polo', detalhe: '12 km/L', valor: 'R$ 775/mês' },
    { veiculo: 'Corolla Cross HEV', detalhe: null, valor: 'R$ 517/mês' },
    { veiculo: 'BYD Dolphin', detalhe: null, valor: 'R$ 191/mês' },
  ],
  equilibrio: [
    { texto: 'Dolphin vence o Polo em', meses: 24 },
    { texto: 'Corolla HEV vence o Polo em', meses: 36 },
  ],
  chips: ['Gasolina', 'Etanol', 'Elétrico', 'Híbrido'],
  // parâmetros numéricos para a calculadora interativa (derivados dos valores exibidos)
  params: {
    km_mes: 1500,
    gasolina: 6.2, // R$/L
    energia: 0.85, // R$/kWh
    economia_5_anos_valor: 20640,
    carros: [
      { nome: 'VW Polo', tipo: 'gasolina', consumo: 12 }, // km/L
      { nome: 'Corolla Cross HEV', tipo: 'hibrido', consumo: 18 }, // km/L
      { nome: 'BYD Dolphin', tipo: 'eletrico', consumo: 6.7 }, // km/kWh
    ],
  },
});

// ── [S6] Highlight Recomendação IA ───────────────────────────────────────────
upsertHighlight('recomendacao', {
  card: 'Recomendação #1 · No catálogo',
  veiculo: 'VW T-Cross 1.4 TSI · 2024',
  preco: 'R$ 118.990 FIPE',
  pergunta: 'Por que este veículo?',
  resposta: 'Combina orçamento de até R$ 120k com uso misto cidade/estrada. Motor 1.4 turbo entrega 150 cv com bom consumo no dia a dia.',
  pontos_fortes: ['6 airbags de série', '0-100 em 8,2s', '13,4 km/L cidade'],
  atencao: ['Próximo ao teto do orçamento', 'Porta-malas menor'],
  rodape: '+ 4 outras opções rankeadas pela IA',
  preco_valor: 118990,
});

// ── [S7] Highlight Financiamento ─────────────────────────────────────────────
upsertHighlight('financiamento', {
  exemplo: 'R$ 80.000 · Entrada 20%',
  veiculo_financiado: 'R$ 64.000',
  opcoes: [
    { modalidade: 'CDC', parcela: '48x R$ 1.792', total: 'Total: R$ 86.016' },
    { modalidade: 'Leasing', parcela: '48x R$ 1.620', total: 'Total: R$ 77.760' },
    { modalidade: 'Consórcio', parcela: '60x R$ 1.067', total: '0% de juros!' },
    { modalidade: 'Assinatura', parcela: 'R$ 3.500/mês', total: 'Sem entrada' },
  ],
  selo: 'Consórcio: menor custo total',
  // parâmetros numéricos para o simulador interativo (taxas derivadas das parcelas exibidas)
  params: {
    valor_padrao: 80000,
    entrada_pct: 20,
    cdc: { meses: 48, taxa_mes: 0.0126 },
    leasing: { meses: 48, taxa_mes: 0.0049 },
    consorcio: { meses: 60, taxa_mes: 0 },
    assinatura: { mensalidade: 3500 },
  },
});

// ── [S5] Ferramentas ─────────────────────────────────────────────────────────
clearTools();
[
  { title: 'Buscar Veículos', description: 'Explore o catálogo completo com preços FIPE', action_label: 'Explorar', href: '/busca', icon: 'Search', badge: null },
  { title: 'Decida Meu Carro IA', description: 'Responda 10 perguntas e receba um ranking personalizado', action_label: 'Gerar recomendação', href: '/decida', icon: 'Sparkles', badge: 'IA' },
  { title: 'Comparar IA', description: 'Compare veículos lado a lado com análise honesta', action_label: 'Comparar', href: '/comparar', icon: 'Scale', badge: 'IA' },
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
