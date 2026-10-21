import { useEffect } from 'react';
import Payback from '@/sections/Payback';

export default function CalculadoraPage() {
  useEffect(() => {
    document.title = 'Calculadora — Volante';
  }, []);
  return (
    <main className="pt-16">
      <Payback />
    </main>
  );
}
