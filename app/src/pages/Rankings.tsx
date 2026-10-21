import { useEffect } from 'react';
import Rankings from '@/sections/Rankings';

export default function RankingsPage() {
  useEffect(() => {
    document.title = 'Rankings — Volante';
  }, []);
  return (
    <main className="pt-16">
      <Rankings />
    </main>
  );
}
