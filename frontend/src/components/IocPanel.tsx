import { useState } from 'react';
import {
  ChevronDown,
  Filter,
  Globe,
  Link2,
  RefreshCw,
  Search,
  Server,
  X,
  Zap,
} from 'lucide-react';
import type { Ioc, IocFilters } from '../types';
import { useIocs } from '../hooks/useIocs';

// ─── IOC type config ──────────────────────────────────────────────────────────

const IOC_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Globe; badge: string; dot: string }
> = {
  IP: {
    label: 'IP',
    icon: Server,
    badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    dot: 'bg-cyan-400',
  },
  URL: {
    label: 'URL',
    icon: Link2,
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    dot: 'bg-amber-400',
  },
  DOMAIN: {
    label: 'DOMAIN',
    icon: Globe,
    badge: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
    dot: 'bg-violet-400',
  },
};

function getIocTypeCfg(type: string) {
  const key = type.toUpperCase();
  return (
    IOC_TYPE_CONFIG[key] ?? {
      label: type,
      icon: Zap,
      badge: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/25',
      dot: 'bg-zinc-400',
    }
  );
}

// ─── IOC type badge ───────────────────────────────────────────────────────────

function IocTypeBadge({ type }: { type: string }) {
  const cfg = getIocTypeCfg(type);
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border font-mono tracking-wider ${cfg.badge}`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      {cfg.label}
    </span>
  );
}

// ─── IOC value display ────────────────────────────────────────────────────────

function IocValue({ type, value }: { type: string; value: string }) {
  const key = type.toUpperCase();
  const colorClass =
    key === 'IP'
      ? 'text-cyan-300'
      : key === 'URL'
      ? 'text-amber-300'
      : key === 'DOMAIN'
      ? 'text-violet-300'
      : 'text-zinc-300';

  return (
    <span className={`font-mono text-xs break-all ${colorClass}`} title={value}>
      {value}
    </span>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-800/50">
      {[10, 28, 14, 16, 22, 14].map((w, i) => (
        <td key={i} className="px-3 py-3">
          <div
            className="h-3.5 bg-zinc-800 rounded animate-pulse"
            style={{ width: `${w * 4}px` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const IOC_TYPE_OPTIONS = ['', 'IP', 'URL', 'DOMAIN'];

interface IocFilterBarProps {
  iocType: string;
  onChange: (type: string) => void;
}

function IocFilterBar({ iocType, onChange }: IocFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Filter className="w-3.5 h-3.5" />
        <span className="uppercase tracking-wider font-medium">Filter</span>
      </div>

      {/* IOC type filter */}
      <div className="relative">
        <select
          value={iocType}
          onChange={e => onChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-md border border-zinc-700 bg-zinc-950 text-zinc-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors cursor-pointer"
          id="ioc-type-filter"
        >
          <option value="">All types</option>
          {IOC_TYPE_OPTIONS.filter(Boolean).map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
      </div>

      {iocType && (
        <button
          onClick={() => onChange('')}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-auto"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}

// ─── IOC row ──────────────────────────────────────────────────────────────────

interface IocRowProps {
  ioc: Ioc;
  onInvestigateSession: (sessionId: string) => void;
}

function IocRow({ ioc, onInvestigateSession }: IocRowProps) {
  const formattedTs = (() => {
    try {
      const d = new Date(ioc.timestamp);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour12: false }),
      };
    } catch {
      return { date: ioc.timestamp, time: '' };
    }
  })();

  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/25 transition-colors group">
      {/* IOC Type */}
      <td className="px-3 py-3 whitespace-nowrap">
        <IocTypeBadge type={ioc.ioc_type} />
      </td>

      {/* Value */}
      <td className="px-3 py-3 max-w-xs">
        <IocValue type={ioc.ioc_type} value={ioc.value} />
      </td>

      {/* Source IP */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
          {ioc.ip}
        </span>
      </td>

      {/* Session ID — clickable */}
      <td className="px-3 py-3 whitespace-nowrap">
        <button
          id={`ioc-investigate-${ioc.id}`}
          onClick={() => onInvestigateSession(ioc.session_id)}
          className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded transition-colors"
          title={`Investigate session ${ioc.session_id}`}
        >
          <Search className="w-3 h-3 flex-shrink-0" />
          {ioc.session_id}
        </button>
      </td>

      {/* Source command */}
      <td className="px-3 py-3 max-w-[16rem]">
        <span
          className="font-mono text-xs text-zinc-400 truncate block max-w-[14rem]"
          title={ioc.source_command}
        >
          {ioc.source_command || <span className="text-zinc-600 italic">—</span>}
        </span>
      </td>

      {/* Timestamp */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-zinc-300 font-mono text-xs">{formattedTs.date}</span>
        <span className="text-zinc-600 font-mono text-xs ml-2">{formattedTs.time}</span>
      </td>
    </tr>
  );
}

// ─── Type summary pills ───────────────────────────────────────────────────────

function TypeSummary({ iocs }: { iocs: Ioc[] }) {
  const counts = iocs.reduce<Record<string, number>>((acc, ioc) => {
    const key = ioc.ioc_type.toUpperCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const order = ['IP', 'URL', 'DOMAIN'];
  const shown = order.filter(t => counts[t]);
  const otherKeys = Object.keys(counts).filter(k => !order.includes(k));

  if (shown.length === 0 && otherKeys.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/20">
      {[...shown, ...otherKeys].map(t => {
        const cfg = getIocTypeCfg(t);
        return (
          <span
            key={t}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {counts[t]} {t}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main IocPanel ────────────────────────────────────────────────────────────

interface IocPanelProps {
  refreshInterval: number;
  onInvestigateSession: (sessionId: string) => void;
}

export function IocPanel({ refreshInterval, onInvestigateSession }: IocPanelProps) {
  const [iocTypeFilter, setIocTypeFilter] = useState('');

  const filters: Partial<IocFilters> = { ioc_type: iocTypeFilter, limit: 200 };
  const { iocs, loading, error, refresh } = useIocs(filters, refreshInterval);

  // Client-side type filter as fallback
  const displayed = iocTypeFilter
    ? iocs.filter(i => i.ioc_type.toUpperCase() === iocTypeFilter)
    : iocs;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">IOC Intelligence</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Extracted indicators of compromise</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && iocs.length > 0 && (
            <span className="text-xs font-mono text-zinc-500">
              {displayed.length} / {iocs.length}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-950 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-3 bg-red-500/5 border-b border-red-800/30">
          <span className="text-xs text-red-400">{error}</span>
          <button
            onClick={refresh}
            className="text-xs text-red-400 underline hover:text-red-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Type summary pills */}
      {!loading && iocs.length > 0 && <TypeSummary iocs={iocs} />}

      {/* Filter bar */}
      <IocFilterBar iocType={iocTypeFilter} onChange={setIocTypeFilter} />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/50">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                Type
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                Source IP
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                Session
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                Source Command
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && iocs.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-600">
                  {error
                    ? 'Could not load IOCs.'
                    : iocs.length === 0
                    ? 'No indicators of compromise recorded yet.'
                    : 'No IOCs match the current filter.'}
                </td>
              </tr>
            ) : (
              displayed.map(ioc => (
                <IocRow
                  key={ioc.id}
                  ioc={ioc}
                  onInvestigateSession={onInvestigateSession}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer hint */}
      {displayed.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-800 flex items-center gap-1.5">
          <Search className="w-3 h-3 text-zinc-600" />
          <p className="text-xs text-zinc-600">
            Click a Session ID to open the full session investigation.
          </p>
        </div>
      )}
    </div>
  );
}
