import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

const KEY = 'volante:cookies';

// N21: enquanto o banner está visível, adiciona padding-bottom no <body> para o
// rodapé não ficar escondido atrás dele. Removido ao aceitar/desmontar.
export default function CookieBar() {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) {
      document.body.style.paddingBottom = '';
      return;
    }
    const aplicar = () => {
      const h = ref.current?.offsetHeight ?? 0;
      document.body.style.paddingBottom = h > 0 ? `${h + 16}px` : '';
    };
    aplicar();
    // banner muda de altura com resize/quebra de linha
    const ro = new ResizeObserver(aplicar);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener('resize', aplicar);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', aplicar);
      document.body.style.paddingBottom = '';
    };
  }, [show]);

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* noop */
    }
    setShow(false);
  };

  return (
    <>
      {show && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-sm border border-ink/10 bg-card px-5 py-4 shadow-[0_16px_48px_-16px_rgba(30,28,26,0.3)] sm:flex-row"
          role="dialog"
          aria-label="Aviso de cookies"
        >
          <Cookie className="h-5 w-5 shrink-0 text-primary" />
          <p className="flex-1 text-center text-sm text-muted-foreground sm:text-left">
            Guardamos apenas uma preferência local (sem cookies de rastreamento) para não repetir
            este aviso.{' '}
            <Link to="/privacidade" className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-foreground">
              Saiba mais
            </Link>
          </p>
          <button
            type="button"
            onClick={accept}
            className="shrink-0 rounded-sm bg-ink px-5 py-2 text-sm font-semibold text-ink-foreground transition-colors hover:bg-ink/85"
          >
            Entendi
          </button>
        </motion.div>
      )}
    </>
  );
}
