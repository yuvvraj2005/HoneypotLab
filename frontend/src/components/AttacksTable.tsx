import { ChevronRight } from 'lucide-react';
import type { Attack } from '../types';

interface AttacksTableProps {
  attacks: Attack[];
  loading: boolean;
  onSelectAttack: (attack: Attack, index: number) => void;
}

function formatTimestamp(ts: string): { date: string; time: string } {
  try {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour12: false }),
    };
  } catch {
    return { date: ts, time: '' };
  }
}

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-800/50">
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 bg-zinc-800 rounded animate-pulse" style={{ width: `${50 + (i * 10) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function AttacksTable({ attacks, loading, onSelectAttack }: AttacksTableProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Recent Attacks</h2>
          <p className="text-xs text-zinc-500 mt-0.5">SSH brute-force login attempts</p>
        </div>
        {attacks.length > 0 && (
          <span className="text-xs font-mono text-zinc-500">
            {attacks.length} records
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Source IP
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && attacks.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : attacks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-600">
                  No attacks recorded yet.
                </td>
              </tr>
            ) : (
              attacks.map((attack, index) => {
                const { date, time } = formatTimestamp(attack.timestamp);
                return (
                  <tr
                    key={index}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                    onClick={() => onSelectAttack(attack, index)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-zinc-300 font-mono text-xs">{date}</span>
                      <span className="text-zinc-600 font-mono text-xs ml-2">{time}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                        {attack.ip}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-300 font-mono text-xs">{attack.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Blocked
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="inline-flex items-center gap-1 text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
