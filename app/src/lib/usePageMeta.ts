// Meta por página (title, description, OG, canonical) — sem dependência nova.
// Cria os elementos no <head> se faltarem e atualiza a cada troca de rota.

const ORIGEM = 'https://volante.onrender.com';

function garantirMeta(seletor: string, criar: () => HTMLMetaElement): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(seletor);
  if (!el) {
    el = criar();
    document.head.appendChild(el);
  }
  return el;
}

function garantirLink(rel: string): HTMLLinkElement {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  return el;
}

export function usePageMeta({ title, description, canonical }: { title: string; description?: string; canonical?: string }) {
  // Roda no commit do render — idempotente: sempre reflete os valores atuais.
  if (typeof document === 'undefined') return;

  document.title = title;

  const metaDescription = garantirMeta('meta[name="description"]', () => {
    const m = document.createElement('meta');
    m.setAttribute('name', 'description');
    return m;
  });
  if (description) metaDescription.setAttribute('content', description);

  const ogTitle = garantirMeta('meta[property="og:title"]', () => {
    const m = document.createElement('meta');
    m.setAttribute('property', 'og:title');
    return m;
  });
  ogTitle.setAttribute('content', title);

  if (description) {
    const ogDescription = garantirMeta('meta[property="og:description"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('property', 'og:description');
      return m;
    });
    ogDescription.setAttribute('content', description);
  }

  const ogUrl = garantirMeta('meta[property="og:url"]', () => {
    const m = document.createElement('meta');
    m.setAttribute('property', 'og:url');
    return m;
  });
  ogUrl.setAttribute('content', ORIGEM + (canonical ?? ''));

  garantirLink('canonical').href = ORIGEM + (canonical ?? '');
}
