import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

const KEY = 'volante:cookies';

export default function CookieBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {
      setShow(true);
    }
  }, []);

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
