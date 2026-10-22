// Cliente tipado da API Volante — TODO dado dinâmico vem daqui (nunca hardcode).

export interface StatRow {
  key: string;
  label: string;
  value: string;
  hint?: string | null;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
  examples: string;
  image: string;
}

export interface RankingEntry {
  id?: number;
  board: string;
  position: number;
  name: string;
  value: number;
  href?: string | null;
}

export interface Rankings {
  marcas: RankingEntry[];
  eletrificados: { hibridos: RankingEntry[]; eletricos: RankingEntry[]; total: number };
  veiculos: RankingEntry[];
  /** top 50 FENABRAVE completo (quando disponível) */
  veiculos_top50?: RankingEntry[];
}

export interface PaybackParams {
  km_mes: number;
  gasolina: number;
  /** preço do etanol R$/L (payload novo; o velho não traz — fallback: preco_combustiveis.etanol) */
  etanol?: number;
  energia: number;
  carros: {
    nome: string;
    tipo: 'gasolina' | 'etanol' | 'hibrido' | 'eletrico';
    consumo: number;
    /** preço FIPE (payload novo); sem preço o payback em meses não é exibido */
    preco?: number;
  }[];
}

// B4/B5: sem economia_5_anos / equilibrio / economia_5_anos_valor — economia e
// payback passam a ser calculados ao vivo no cliente a partir de params.
export interface PaybackHighlight {
  badge: string;
  comparacao: string;
  preco_combustiveis: { gasolina: string; etanol?: string; energia: string };
  custos_mensais: { veiculo: string; detalhe: string | null; valor: string }[];
  chips: string[];
  params: PaybackParams;
}

export interface RecomendacaoHighlight {
  card: string;
  veiculo: string;
  preco: string;
  pergunta: string;
  resposta?: string;
  pontos_fortes: string[];
  atencao: string[];
  rodape: string;
  preco_valor: number;
}

export interface FinanciamentoParams {
  valor_padrao: number;
  entrada_pct: number;
  cdc: { meses: number; taxa_mes: number };
  leasing: { meses: number; taxa_mes: number };
  consorcio: {
    meses: number;
    /** taxa de administração sobre o valor financiado (payload novo; ausente ⇒ 18%, N9) */
    taxa_adm?: number;
    taxa_mes?: number;
  };
  /** assinatura não dá posse do veículo — fora da disputa de menor custo (N9) */
  assinatura: { mensalidade: number; /** payload novo; ausente ⇒ 48 */ meses?: number };
}

export interface FinanciamentoHighlight {
  exemplo: string;
  veiculo_financiado: string;
  opcoes: { modalidade: string; parcela: string; total: string }[];
  selo: string;
  params: FinanciamentoParams;
}

export interface Highlights {
  payback: PaybackHighlight;
  recomendacao: RecomendacaoHighlight;
  financiamento: FinanciamentoHighlight;
}

export interface Tool {
  id: number;
  title: string;
  description: string;
  action_label: string;
  href: string;
  icon: string;
  badge: string | null;
}

export interface Veiculo {
  id: number;
  nome: string;
  marca: string;
  categoria: string | null;
  preco: number | null;
  ano?: number | null;
  combustivel?: string | null;
  codigo_fipe?: string | null;
  consumo_cidade?: number | null;
  consumo_estrada?: number | null;
  tanque?: number | null;
}

export interface VeiculosQuery {
  q?: string;
  marca?: string;
  categoria?: string;
  combustivel?: string;
  ano_min?: number;
  preco_max?: number;
  limit?: number;
  offset?: number;
}

export interface VeiculosResponse {
  total: number;
  veiculos: Veiculo[];
}

export interface MarcasResponse {
  marcas: { marca: string; total: number }[];
}

export interface HistoricoPonto {
  /** "2026-03" */
  mes: string;
  preco: number;
}

export interface VeiculoDetalhe {
  veiculo: Veiculo;
  historico: HistoricoPonto[];
}

export interface Post {
  slug: string;
  titulo: string;
  resumo: string;
  /** HTML simples (p/h2/h3/ul) */
  conteudo: string;
  data: string;
  categoria?: string | null;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await erroDe(res, `GET ${path}`));
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await erroDe(res, `POST ${path}`));
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: 'DELETE' });
  if (!res.ok) throw new Error(await erroDe(res, `DELETE ${path}`));
  return res.json() as Promise<T>;
}

async function erroDe(res: Response, fallback: string): Promise<string> {
  try {
    const j = await res.json();
    if (j && typeof j.erro === 'string') return j.erro;
  } catch { /* corpo não-JSON */ }
  // Detalhe técnico só no console — o usuário recebe mensagem amigável (N12).
  console.error(`${fallback} → ${res.status}`);
  return 'Algo deu errado. Tente de novo.';
}

export interface User {
  id: number;
  nome: string;
  email: string;
}

export const api = {
  stats: () => get<{ hero: StatRow[]; rankings: StatRow[] }>('/api/stats'),
  categories: () => get<Category[]>('/api/categories'),
  rankings: () => get<Rankings>('/api/rankings'),
  // N8: /api/highlights é consumido por 3 seções da home — uma única Promise
  // compartilhada; em falha, o cache é limpo para permitir retry.
  highlights: (() => {
    let _hl: Promise<Highlights> | null = null;
    return () => {
      _hl ??= get<Highlights>('/api/highlights').catch((e) => {
        _hl = null;
        throw e;
      });
      return _hl;
    };
  })(),
  tools: () => get<Tool[]>('/api/tools'),
  veiculos: (query: VeiculosQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return get<VeiculosResponse>(`/api/veiculos${qs ? `?${qs}` : ''}`);
  },
  veiculoDetalhe: (id: number | string) => get<VeiculoDetalhe>(`/api/veiculos/${id}`),
  marcas: () => get<MarcasResponse>('/api/veiculos/marcas'),
  posts: () => get<{ posts: Post[] }>('/api/posts'),
  post: (slug: string) => get<Post>(`/api/posts/${encodeURIComponent(slug)}`),
  me: () => get<{ user: User | null }>('/api/me'),
  signUp: (dados: { nome: string; email: string; senha: string }) =>
    post<{ user: User }>('/api/users', dados),
  signIn: (dados: { email: string; senha: string }) =>
    post<{ user: User }>('/api/session', dados),
  signOut: () => del<{ ok: boolean }>('/api/session'),
  favoritos: () => get<{ favoritos: Veiculo[] }>('/api/favoritos'),
  favoritar: (veiculoId: number) => post<{ ok: boolean }>('/api/favoritos', { veiculoId }),
  desfavoritar: (veiculoId: number) => del<{ ok: boolean }>(`/api/favoritos/${veiculoId}`),
  /** valida/consome 1 crédito de IA (20 logado · 1 grátis anônimo) */
  gerarIA: () => post<{ ok: boolean; creditos?: number; anon?: boolean }>('/api/ia/gerar'),
  lead: (dados: { nome: string; email: string; tipo: string; mensagem?: string }) =>
    post<{ ok: boolean }>('/api/leads', dados),
};

export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const brl2 = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
