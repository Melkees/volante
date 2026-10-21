import { useEffect } from 'react';
import Financing from '@/sections/Financing';

export default function FinanciamentoPage() {
  useEffect(() => {
    document.title = 'Financiamento — Volante';
  }, []);
  return (
    <main className="pt-16">
      <Financing />
    </main>
  );
}
