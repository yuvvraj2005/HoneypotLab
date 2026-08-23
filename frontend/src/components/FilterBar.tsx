import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import type { AttackFilters } from '../types';

interface FilterBarProps {
  filters: AttackFilters;
  onChange: (filters: AttackFilters) => void;
}

const LIMIT_OPTIONS = [25, 50, 100, 250, 500];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const hasActiveFilters = filters.ip !== '' || filters.username !== '' || filters.limit !== 100;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium uppercase tracking-wider">Filters</span>
        </div>

        {/* IP Filter */}
        <div className="flex-1 min-w-36 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by IP…"
            value={filters.ip}
            onChange={e => onChange({ ...filters, ip: e.target.value })}
            className="w-full pl-8 pr-8 py-1.5 text-xs font-mono rounded-md border border-zinc-700 bg-zinc-950 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors"
          />
          {filters.ip && (
            <button
              onClick={() => onChange({ ...filters, ip: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Username Filter */}
        <div className="flex-1 min-w-36 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by username…"
            value={filters.username}
            onChange={e => onChange({ ...filters, username: e.target.value })}
            className="w-full pl-8 pr-8 py-1.5 text-xs font-mono rounded-md border border-zinc-700 bg-zinc-950 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors"
          />
          {filters.username && (
            <button
              onClick={() => onChange({ ...filters, username: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Limit Selector */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600" />
          <div className="flex rounded-md overflow-hidden border border-zinc-700">
            {LIMIT_OPTIONS.map(limit => (
              <button
                key={limit}
                onClick={() => onChange({ ...filters, limit })}
                className={`px-2.5 py-1.5 text-xs font-mono transition-colors ${
                  filters.limit === limit
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ ip: '', username: '', limit: 100 })}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
