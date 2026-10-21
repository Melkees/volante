# Plan — VOLANTE (app premium, dark) — a partir do CarroLens

Direção do dono (20/10/26): transformar o CarroLens em **app próprio, premium**, com
design melhor e DIFERENTE, features mais intuitivas, nome **Volante**, visual **dark
premium**. Não é mais réplica fiel: o conteúdo/dados backbone vem do CarroLens
(gravação `recordings/carrolens-home.mp4` + `out/dom-snapshot-home.txt`), o design é novo.

Baseline do original (relatório do visionario): paleta verde/emerald + azul royal +
amarelo, seções claras e escuras alternadas, nav escura fixa, count-up nos stats,
reveal on scroll, dropdown Parceiros. O Volante **difere** deliberately: tudo dark
grafite, um único acento âmbar, tipografia display, interativos live, pódio nos rankings.

## Layout strategy & design system

- [S0] Viewport base 1280×800; responsivo fluido fora dela (container max-w-7xl
  centralizado; grids mudam colunas). Extrapolações marcadas.
- [S1] Tokens (foundation em `app/src/index.css`, dono = sessão principal):
  - bg base `#0A0E14`; seções alternando `#0C1119`; superfície card `#131A28`
    com border `rgba(255,255,255,.07)`; hairline `rgba(255,255,255,.08)`.
  - Texto: primário `#F4F7FB`, secundário `#9AA6B8`.
  - Acento único: âmbar `#F0B429` (hover `#F6C453`; tintas 10–15% para chips/badges).
    Positivo `#34D399` só em dados (variações/%). 
  - Fontes: **Space Grotesk** (display 600/700, títulos/números) + **Inter** (corpo)
    via @fontsource (já pré-instaladas no scaffold).
  - Radius: cards 16px, botões 12px, pills 999px. Sombras profundas suaves; glow
    âmbar sutil só em hover/foco.
- [S2] Nav flutuante sticky (glass): pill central com blur, border hairline, wordmark
  **VOLANTE** + ícone de volante (SVG próprio), links (Buscar, Comparar, Decida com IA,
  Financiamento, Calculadora, Rankings, Parceiros▾), botão de busca global (lupa,
  hint "/"), Entrar (ghost) + CTA âmbar "Criar conta".
- [S3] Hero full-bleed: foto real `hero-home.webp` (site-assets) com overlay escuro
  premium (linear + radial p/ legibilidade); badge status "FIPE · FENABRAVE · IA ·
  atualizado mensalmente" com dot verde pulsante; H1 display 2 linhas (segunda linha
  em âmbar) — copy nova premium; parágrafo de apoio; CTAs: sólido âmbar + ghost;
  faixa de 3 stats com **count-up** (4.860+ modelos · 84+ marcas · 97% dados FIPE)
  separados por hairlines verticais.
- [S4] "Explorar por Categoria": 4 cards fotográficos (assets reais webp) com overlay
  gradiente escuro na base, título + exemplos, chip "Ver todos →" no canto; hover:
  lift + borda âmbar sutil. Grid 4→2→1.
- [S5] "Elétrico compensa pra você?" — **interativo**: sliders (km/mês, preço
  gasolina R$/L, energia R$/kWh) + toggle carro base; cálculo AO VIVO a partir das
  tarifas/consumos do payload `/api/highlights` (payback); barras comparativas
  animadas (Polo/Corolla Cross HEV/Dolphin), payback em meses, badge "Exemplo
  ilustrativo" mantido nos valores default.
- [S6] "O que você pode fazer" — grid 3×2 glass cards: ícone em tile, título,
  descrição, ação com seta; badges "IA" e "Novo"; reveal on scroll.
- [S7] Seção IA: 4 passos numerados (timeline vertical premium) + card
  "Recomendação #1" (dados `/api/highlights` recomendacao): métricas em grid,
  pontos fortes/atenção, selo FIPE.
- [S8] Financiamento — **interativo**: sliders valor do carro + entrada %; 4
  modalidades calculadas AO VIVO (CDC, Leasing, Consórcio, Assinatura — fórmulas e
  taxas do payload `/api/highlights` financiamento); destaque automático do menor
  custo total; valores default = exemplo do original (R$ 80.000, entrada 20%).
- [S9] Rankings: 4 stats com count-up (216.366 · +21,2% · 1.728.390 · 59.156) +
  **pódio** no Top Veículos (1º maior, 2º/3º menores, medalhas âmbar/prata/bronze)
  + painéis Top 5 Marcas e Eletrificados (subgrupos Híbridos/Elétricos); links
  "Ver ranking completo →".
- [S10] Faixa CTA Blog (card glass horizontal, ícone newspaper, seta).
- [S11] Footer dark: wordmark + tagline, descrição, sociais (Instagram/TikTok/X/
  e-mail), colunas Ferramentas/Parceiros/Sua Conta, barra de feedback com botão,
  © 2026 Volante + "Dados oficiais: Tabela FIPE · Rankings: FENABRAVE", sub-nav
  Sobre · Privacidade · Termos.
- [S12] Busca global (feature nova intuitiva): overlay estilo command-palette abre
  com "/" ou clique na lupa; filtra client-side categorias + ferramentas + veículos
  do ranking; Enter/navegação básica; fecha com Esc.
- [S13] Cookie bar minimal dark (texto + "Saiba mais" + botão "Entendi"); dispensa
  persiste em localStorage.
- [S14] Assets: somente os reais já baixados (site-assets → app/public/assets);
  wordmark/ícone volante = SVG próprio novo (marca original).

## Interactions & animations

- [D1] Count-up nos stats ao entrar no viewport (hero + rankings).
- [D2] Reveal on scroll (fade + translateY, stagger) nas seções/cards.
- [D3] Hover states: lift + glow âmbar sutil em cards; transições 150–250ms.
- [D4] Sliders dos calculadores (S5/S8) atualizam números/barras em tempo real.
- [D5] Dropdown Parceiros na nav (com chevron, fecha em Esc/fora).
- [D6] Busca global abre com "/" e filtra enquanto digita (S12).
- [D7] Scroll suave entre âncoras das seções.

## Backend design (inalterado — executor já despachado)

Entidades better-sqlite3 (ou fallback JSON): `stats(key,label,value,hint)`,
`categories(id,slug,name,icon,examples,image)`, `ranking_entries(id,board,position,
name,value,href)` boards `marcas|ev_hibridos|ev_eletricos|veiculos`,
`highlights(section,payload JSON: payback|financiamento|recomendacao — payloads
estendidos com tarifas/consumos/taxas p/ os calculadores live)`,
`tools(id,title,description,action_label,href,icon,badge)`.

API: `GET /api/health` · `/api/stats` · `/api/categories` · `/api/rankings` ·
`/api/highlights` · `/api/tools`. Seed com dados reais do original (tags antigas
S2–S8 do DOM snapshot).

## Backend behaviors

- [B1] Hero + stats de rankings de `/api/stats` (curl + render + reload).
- [B2] Rankings (marcas/eletrificados/veículos) de `/api/rankings` (curl + render + reload).
- [B3] Payloads de exemplo + parâmetros dos calculadores de `/api/highlights`
  (curl + render + reload; sliders recalculam sobre dados da API).
- [B4] Categorias e ferramentas de `/api/categories` e `/api/tools` (curl + render + reload).

Escopo: só a home/journey do vídeo; sem auth/cart reais (não demonstrados). Links
internos apontam para rotas com SPA fallback servindo a home; listado em report.md.

## Redesign 2.0 — editorial claro (21/10/26)

Direção do dono: mudar o visual TOTALMENTE pra algo premium. Escolha entre três
direções apresentadas (editorial claro / dark cromado / glass futurista): **editorial
claro**. Backup do design dark anterior: `backup-design-dark-20261021.tar.gz` (não há
git no workspace).

- [E1] Tokens (substituem S1): porcelana `#FAF8F5` (bg) · tinta quente `#1E1C1A`
  (texto e tarjas pretas) · bronze `#8D6F3A` acento único (+ champanhe `#DABC80`
  sobre tarja) · hairlines `rgba(30,28,26,.14)` · papel `#EDEAE2` (surface-2 alterna
  seções) · radius 6px/sharp. Fontes: **Fraunces** (display serif 500/600 + itálico
  500) + Inter (corpo). Positivo verde `#047857`-family só em dados.
- [E2] Ritmo editorial: porcelana e papel alternando; tarjas pretas no card
  Recomendação IA, 1º lugar do pódio, faixa do blog e footer (bloco final preto).
- [E3] Hero de capa: grid 6/6 — tipografia à esquerda (badge dot verde, H1 Fraunces
  com 2ª linha itálica bronze, CTAs tinta-sólido + ghost hairline, stats serif com
  hairlines) e prato fotográfico à direita com moldura deslocada e legenda caps.
- [E4] Categorias como pratos de revista: foto com moldura hairline + legenda ABAIXO
  (sem overlay), underline que escurece no hover, selo "Ver todos" no canto.
- [E5] Calculadoras (S5/S8 mantêm interações): pratos brancos, thumb do slider em
  tinta, barras tinta/tinta-20%, chips hairline em caps, valores serif bronze.
- [E6] Nav porcelana com hairline inferior (sem pill glass): links caps espaçados
  `whitespace-nowrap` 0.7rem/0.1em, CTA "Criar conta" tinta sólida, kbd hairline.
- [E7] Busca global (dialog) e cookie bar no claro; footer tarja preta com colunas
  caps e bronze-champanhe nos links destaque.
- Inalterados: backend/API/seed, interações D1–D7, dados só de /api/*, mobile-first
  (≥44px toque, input ≥16px, sem overflow 375px).
