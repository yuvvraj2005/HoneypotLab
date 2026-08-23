import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number | null;
  icon: LucideIcon;
  accent?: 'emerald' | 'cyan' | 'amber' | 'violet' | 'rose';
  mono?: boolean;
}

const accentClasses = {
  emerald: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    value: 'text-emerald-300',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    value: 'text-cyan-300',
  },
  amber: {
    icon: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    value: 'text-amber-300',
  },
  violet: {
    icon: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    value: 'text-violet-300',
  },
  rose: {
    icon: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    value: 'text-rose-300',
  },
};

export function StatCard({ label, value, icon: Icon, accent = 'emerald', mono = false }: StatCardProps) {
  const classes = accentClasses[accent];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex items-start gap-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${classes.bg} flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${classes.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p
          className={`text-xl font-semibold truncate ${classes.value} ${mono ? 'font-mono' : ''}`}
          title={value?.toString() ?? '—'}
        >
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}
