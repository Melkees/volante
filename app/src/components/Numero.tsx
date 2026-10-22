// Contador animado seguro (V6): o valor FINAL está sempre no DOM para leitores de
// tela (sr-only); a animação é só visual (aria-hidden), parte de ~90% do alvo,
// dura ≤600ms e nunca exibe menos que 90% do alvo. Com reduced-motion, sem animação.
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function formatarNumero(n: number, decimals = 0): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function Numero({
  valor,
  formatar,
  decimals = 0,
  prefixo = '',
  sufixo = '',
  sufixoClassName,
  className,
}: {
  valor: number;
  /** formatação customizada do número animado/final (recebe inteiro arredondado) */
  formatar?: (n: number) => string;
  decimals?: number;
  prefixo?: string;
  sufixo?: string;
  sufixoClassName?: string;
  className?: string;
}) {
  const reduzMotion = useReducedMotion();
  const [exibido, setExibido] = useState(() =>
    reduzMotion ? valor : Math.max(Math.round(valor * 0.9), 0),
  );
  const raf = useRef(0);

  useEffect(() => {
    if (reduzMotion) {
      setExibido(valor);
      return;
    }
    const inicio = Math.max(Math.round(valor * 0.9), 0);
    setExibido(inicio);
    const t0 = performance.now();
    const duracao = 500;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duracao);
      const eased = 1 - Math.pow(1 - p, 3);
      // clamp: nunca abaixo de 90% do alvo durante a animação
      const v = Math.max(inicio + (valor - inicio) * eased, Math.min(inicio, valor));
      setExibido(Math.round(v));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [valor, reduzMotion]);

  const textoFinal = formatar ? formatar(valor) : formatarNumero(valor, decimals);
  const textoAnimado = formatar ? formatar(exibido) : formatarNumero(exibido, decimals);

  return (
    <span className={className}>
      <span className="sr-only">
        {prefixo}
        {textoFinal}
        {sufixo}
      </span>
      <span aria-hidden="true">
        {prefixo}
        {textoAnimado}
        {sufixo && <span className={sufixoClassName}>{sufixo}</span>}
      </span>
    </span>
  );
}
