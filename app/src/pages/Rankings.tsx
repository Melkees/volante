import Rankings from '@/sections/Rankings';
import { usePageMeta } from '@/lib/usePageMeta';

export default function RankingsPage() {
  usePageMeta({ title: 'Rankings FENABRAVE — Volante' });
  return (
    <main className="pt-16">
      <Rankings completo />
    </main>
  );
}
