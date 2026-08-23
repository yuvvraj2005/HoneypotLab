import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimelineEntry } from '../types';

interface AttackChartProps {
  data: TimelineEntry[];
  loading: boolean;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
        <p className="text-xs text-zinc-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-emerald-400">
          {payload[0].value} {payload[0].value === 1 ? 'attack' : 'attacks'}
        </p>
      </div>
    );
  }
  return null;
}

export function AttackChart({ data, loading }: AttackChartProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Attack Activity</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Daily SSH brute-force attempts</p>
        </div>
        {data.length > 0 && (
          <span className="text-xs text-zinc-500 font-mono">
            {data.length} {data.length === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-sm text-zinc-600">No timeline data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={208}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)} // Show MM-DD
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="attacks"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#attackGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
