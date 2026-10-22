// Sanitização de HTML vindo da API (usada no conteúdo do blog) — allowlist de tags.
// Sem dependência nova: DOMParser + walk da árvore, reconstruindo o HTML limpo.

const TAGS_PERMITIDAS = new Set(['P', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'A', 'BR', 'BLOCKQUOTE']);

/** Aceita href http(s) ou relativo — recusa javascript:, data:, vbscript: etc. */
function hrefSeguro(href: string): string | null {
  const h = href.trim();
  if (/^(https?:)?\/\//i.test(h) || h.startsWith('/') || h.startsWith('#')) return h;
  return null;
}

function limparAtributos(el: Element): string {
  const attrs: string[] = [];
  for (const attr of Array.from(el.attributes)) {
    const nome = attr.name.toLowerCase();
    // nada de on* (onclick etc.), style ou href estranho
    if (nome.startsWith('on') || nome === 'style') continue;
    if (el.tagName === 'A' && nome === 'href') {
      const seguro = hrefSeguro(attr.value);
      if (seguro !== null) attrs.push(`href="${seguro.replace(/"/g, '&quot;')}"`);
    }
    // demais atributos descartados (class, id, target, src…)
  }
  return attrs.length ? ' ' + attrs.join(' ') : '';
}

function serializar(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent ?? '';
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  if (!TAGS_PERMITIDAS.has(el.tagName)) {
    // fora da allowlist: preserva só o conteúdo de texto/filhos válidos
    return Array.from(el.childNodes).map(serializar).join('');
  }
  const inner = Array.from(el.childNodes).map(serializar).join('');
  if (el.tagName === 'BR') return '<br>';
  const abertura = `<${el.tagName.toLowerCase()}${limparAtributos(el)}>`;
  return `${abertura}${inner}</${el.tagName.toLowerCase()}>`;
}

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.body.childNodes).map(serializar).join('');
}
