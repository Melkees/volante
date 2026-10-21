# Design tokens — medidos ao vivo (getComputedStyle)

- Body: font `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"...`; bg `rgb(249,250,251)` (gray-50); cor `rgb(0,0,0)`.
- H1 (hero): 60px / weight 900 / cor `rgb(255,255,255)` / line-height 60px.
- H2 (seções): 30px / weight 700 / cor `rgb(15,23,42)` (slate-900).
- CTA primário: bg `rgb(253,224,71)` (yellow-300); cor `rgb(113,63,18)` (amber-900); radius 12px; padding 14px 28px; 16px/700.
- CTA secundário (sobre fundo escuro): bg `rgba(255,255,255,0.15)`; cor branca; radius 12px; padding 14px 28px; 16px/600.
- Footer: bg `rgb(15,23,42)` (slate-900); texto branco.
- Card: radius 16px; fundo transparente no wrapper (card visual conforme descrição do visionario).
- Hero bg: `linear-gradient(135deg, rgba(15,23,42,.88), rgba(30,64,175,.75) 50%, rgba(15,23,42,.7))` sobre foto `hero-home.webp` (arquivo local: `site-assets/hero-home.webp`).
- Página: 4662px de altura total em 1264–1280px de largura; seções py-12 (~48px).

## Mapeamento de seção → y (scroll, viewport 1280×800)

| Seção | y inicial |
|---|---|
| Nav | 0 (fixa, ~64–72px) |
| Hero (foto) | 72 |
| Explorar por Categoria (bg branco) | 652 |
| Elétrico compensa? | 1096 |
| O que você pode fazer | 1797 |
| IA / Decida Meu Carro (bg branco) | 2240 |
| Financiamento | 2866 |
| Rankings | 3384 |
| Faixa Blog | ~4000 |
| Footer (slate-900) | 4047 |
