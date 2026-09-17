import { useState } from 'react';
import { Bell, ChevronDown, ChevronRight, ExternalLink, Filter, Search, Shield, X } from 'lucide-react';
import type { Alert, AlertFilters } from '../types';
import { useAlerts } from '../hooks/useAlerts';

// ─── Severity badge ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  LOW: {
    label: 'LOW',
    dot: 'bg-sky-400',
    badge: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
    row: '',
  },
  MEDIUM: {
    label: 'MEDIUM',
    dot: 'bg-amber-400',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    row: '',
  },
  HIGH: {
    label: 'HIGH',
    dot: 'bg-orange-400',
    badge: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
    row: 'bg-orange-500/5',
  },
  CRITICAL: {
    label: 'CRITICAL',
    dot: 'bg-red-400 animate-pulse',
    badge: 'text-red-400 bg-red-500/10 border-red-500/25',
    row: 'bg-red-500/5',
  },
} as const;

function getSeverityConfig(severity: string) {
  const key = severity.toUpperCase() as keyof typeof SEVERITY_CONFIG;
  return SEVERITY_CONFIG[key] ?? {
    label: severity,
    dot: 'bg-zinc-400',
    badge: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/25',
    row: '',
  };
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = getSeverityConfig(severity);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border font-mono tracking-wider ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Expandable row ───────────────────────────────────────────────────────────

function AlertRow({ alert, onInvestigateSession }: { alert: Alert; onInvestigateSession: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getSeverityConfig(alert.severity);

  const formattedTs = (() => {
    try {
      const d = new Date(alert.timestamp);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour12: false }),
      };
    } catch {
      return { date: alert.timestamp, time: '' };
    }
  })();

  return (
    <>
      <tr
        className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer group ${cfg.row}`}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Expand toggle */}
        <td className="pl-4 pr-2 py-3 w-8">
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        </td>

        {/* Timestamp */}
        <td className="px-3 py-3 whitespace-nowrap">
          <span className="text-zinc-300 font-mono text-xs">{formattedTs.date}</span>
          <span className="text-zinc-600 font-mono text-xs ml-2">{formattedTs.time}</span>
        </td>

        {/* Severity */}
        <td className="px-3 py-3 whitespace-nowrap">
          <SeverityBadge severity={alert.severity} />
        </td>

        {/* Event type */}
        <td className="px-3 py-3 whitespace-nowrap">
          <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded">
            {alert.event_type}
          </span>
        </td>

        {/* Source IP */}
        <td className="px-3 py-3 whitespace-nowrap">
          <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
            {alert.ip}
          </span>
        </td>

        {/* Username */}
        <td className="px-3 py-3 whitespace-nowrap">
          <span className="text-zinc-300 font-mono text-xs">{alert.username}</span>
        </td>

        {/* Command */}
        <td className="px-3 py-3 max-w-xs">
          <span className="text-xs font-mono text-zinc-400 truncate block max-w-[18rem]" title={alert.command}>
            {alert.command || <span className="text-zinc-600 italic">—</span>}
          </span>
        </td>

        {/* MITRE */}
        <td className="px-3 py-3 whitespace-nowrap">
          {alert.mitre_technique ? (
            <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
              {alert.mitre_technique}
            </span>
          ) : (
            <span className="text-xs text-zinc-600 italic">Not mapped</span>
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className={`border-b border-zinc-800 ${cfg.row}`}>
          <td colSpan={8} className="px-6 pb-4 pt-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <DetailField label="Alert ID" value={String(alert.id)} mono />
              <div>
                <p className="text-zinc-600 uppercase tracking-wider text-[10px] mb-0.5">Session ID</p>
                <button
                  id={`investigate-session-${alert.session_id}`}
                  onClick={e => { e.stopPropagation(); onInvestigateSession(alert.session_id); }}
                  className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded transition-colors"
                  title={`Investigate session ${alert.session_id}`}
                >
                  <Search className="w-3 h-3 flex-shrink-0" />
                  {alert.session_id}
                </button>
              </div>
              <DetailField label="Description" value={alert.description} />
              <DetailField label="Full Command" value={alert.command || '—'} mono />
              <DetailField
                label="MITRE Technique"
                value={alert.mitre_technique ?? 'Not mapped'}
                mono={!!alert.mitre_technique}
              />
              <DetailField
                label="MITRE Name"
                value={alert.mitre_name ?? 'Not mapped'}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-zinc-600 uppercase tracking-wider text-[10px] mb-0.5">{label}</p>
      <p className={`text-zinc-300 break-all leading-relaxed ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-800/50">
      {[8, 20, 10, 12, 12, 10, 20, 10].map((w, i) => (
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

// ─── Filter controls ──────────────────────────────────────────────────────────

const SEVERITY_OPTIONS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

interface AlertFilterBarProps {
  filters: AlertFilters;
  onChange: (f: AlertFilters) => void;
  eventTypes: string[];
}

function AlertFilterBar({ filters, onChange, eventTypes }: AlertFilterBarProps) {
  const hasActive = filters.severity !== '' || filters.event_type !== '';

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Filter className="w-3.5 h-3.5" />
        <span className="uppercase tracking-wider font-medium">Filter</span>
      </div>

      {/* Severity filter */}
      <div className="relative">
        <select
          value={filters.severity}
          onChange={e => onChange({ ...filters, severity: e.target.value })}
          className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-md border border-zinc-700 bg-zinc-950 text-zinc-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors cursor-pointer"
        >
          <option value="">All severities</option>
          {SEVERITY_OPTIONS.filter(Boolean).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
      </div>

      {/* Event type filter */}
      {eventTypes.length > 0 && (
        <div className="relative">
          <select
            value={filters.event_type}
            onChange={e => onChange({ ...filters, event_type: e.target.value })}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-md border border-zinc-700 bg-zinc-950 text-zinc-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors cursor-pointer"
          >
            <option value="">All event types</option>
            {eventTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
        </div>
      )}

      {hasActive && (
        <button
          onClick={() => onChange({ severity: '', event_type: '' })}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-auto"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Severity summary pills ───────────────────────────────────────────────────

function SeveritySummary({ alerts }: { alerts: Alert[] }) {
  const counts = alerts.reduce<Record<string, number>>((acc, a) => {
    const key = a.severity.toUpperCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const shown = order.filter(s => counts[s]);

  if (shown.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/20">
      {shown.map(s => {
        const cfg = getSeverityConfig(s);
        return (
          <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {counts[s]} {s}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main AlertsPanel ─────────────────────────────────────────────────────────

interface AlertsPanelProps {
  refreshInterval: number;
  onInvestigateSession: (sessionId: string) => void;
}

export function AlertsPanel({ refreshInterval, onInvestigateSession }: AlertsPanelProps) {
  const [filters, setFilters] = useState<AlertFilters>({ severity: '', event_type: '' });

  const { alerts, loading, error, refresh } = useAlerts(filters, refreshInterval);

  // Derive unique event types from current full list for the filter dropdown.
  // We fetch unfiltered once to populate the dropdown — we use filters passed
  // to the backend, so the event_type list comes from whatever the backend returns.
  const eventTypes = [...new Set(alerts.map(a => a.event_type))].sort();

  // Client-side filter as fallback when backend ignores query params
  const displayed = alerts.filter(a => {
    if (filters.severity && a.severity.toUpperCase() !== filters.severity) return false;
    if (filters.event_type && a.event_type !== filters.event_type) return false;
    return true;
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Security Alerts</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Session activity &amp; threat intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && alerts.length > 0 && (
            <span className="text-xs font-mono text-zinc-500">{displayed.length} / {alerts.length}</span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-950 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <Shield className="w-3.5 h-3.5" />
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

      {/* Severity summary */}
      {!loading && alerts.length > 0 && <SeveritySummary alerts={alerts} />}

      {/* Filters */}
      <AlertFilterBar filters={filters} onChange={setFilters} eventTypes={eventTypes} />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/50">
              <th className="pl-4 pr-2 py-2.5 w-8" />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                Timestamp
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                Event Type
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                Source IP
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Command
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                MITRE ID
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && alerts.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-600">
                  {error
                    ? 'Could not load alerts.'
                    : alerts.length === 0
                    ? 'No alerts recorded yet.'
                    : 'No alerts match the current filters.'}
                </td>
              </tr>
            ) : (
              displayed.map(alert => <AlertRow key={alert.id} alert={alert} onInvestigateSession={onInvestigateSession} />)
            )}
          </tbody>
        </table>
      </div>

      {/* External link hint */}
      {displayed.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-800 flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3 text-zinc-600" />
          <p className="text-xs text-zinc-600">
            Click any row to expand the full alert detail including MITRE ATT&amp;CK mapping.
          </p>
        </div>
      )}
    </div>
  );
}
