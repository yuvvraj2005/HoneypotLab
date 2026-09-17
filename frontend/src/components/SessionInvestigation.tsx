import { X, Terminal, Shield, Clock, AlertTriangle, Info } from 'lucide-react';
import type { SessionAlert, SessionCommand } from '../types';
import { useSession } from '../hooks/useSession';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatFullTs(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return ts;
  }
}

// ─── Severity badge (mirrors AlertsPanel) ─────────────────────────────────────

const SEVERITY_CONFIG = {
  LOW: {
    badge: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
    dot: 'bg-sky-400',
    glow: 'border-sky-500/20',
  },
  MEDIUM: {
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    dot: 'bg-amber-400',
    glow: 'border-amber-500/20',
  },
  HIGH: {
    badge: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
    dot: 'bg-orange-400',
    glow: 'border-orange-500/20',
  },
  CRITICAL: {
    badge: 'text-red-400 bg-red-500/10 border-red-500/25',
    dot: 'bg-red-400 animate-pulse',
    glow: 'border-red-500/20',
  },
} as const;

function getSeverityCfg(severity: string) {
  const key = severity.toUpperCase() as keyof typeof SEVERITY_CONFIG;
  return (
    SEVERITY_CONFIG[key] ?? {
      badge: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/25',
      dot: 'bg-zinc-400',
      glow: 'border-zinc-700',
    }
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = getSeverityCfg(severity);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border font-mono tracking-wider ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {severity.toUpperCase()}
    </span>
  );
}

// ─── Command timeline entry ────────────────────────────────────────────────────

function CommandEntry({ cmd }: { cmd: SessionCommand }) {
  const ts = formatTimestamp(cmd.timestamp);
  return (
    <div className="relative pl-6 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-zinc-800">
      {/* Timeline dot */}
      <span className="absolute left-[5px] top-3.5 w-2 h-2 rounded-full bg-emerald-500/60 border border-emerald-500 block" />

      <div className="mb-5">
        {/* Timestamp */}
        <p className="text-[11px] font-mono text-zinc-600 mb-1.5">
          {ts.date} <span className="text-zinc-500">{ts.time}</span>
        </p>

        {/* Command */}
        <div className="rounded-t-md bg-zinc-900 border border-zinc-800 px-3 py-2">
          <span className="text-emerald-400 font-mono text-xs mr-1.5">$</span>
          <span className="font-mono text-sm text-zinc-100">{cmd.command}</span>
        </div>

        {/* Output */}
        {cmd.output ? (
          <div className="rounded-b-md bg-zinc-950 border border-t-0 border-zinc-800 px-3 py-2">
            <pre className="font-mono text-xs text-zinc-400 whitespace-pre-wrap break-all leading-relaxed">
              {cmd.output}
            </pre>
          </div>
        ) : (
          <div className="rounded-b-md bg-zinc-950 border border-t-0 border-zinc-800 px-3 py-1.5">
            <span className="text-xs text-zinc-700 italic">No output</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session alert entry ───────────────────────────────────────────────────────

function SessionAlertEntry({ alert }: { alert: SessionAlert }) {
  const ts = formatTimestamp(alert.timestamp);
  const cfg = getSeverityCfg(alert.severity);

  return (
    <div className={`rounded-lg border ${cfg.glow} bg-zinc-950 p-4 space-y-3`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge severity={alert.severity} />
          <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded">
            {alert.event_type}
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-600 shrink-0">
          {ts.date} {ts.time}
        </span>
      </div>

      {/* Command */}
      {alert.command && (
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Command</p>
          <code className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded block break-all">
            {alert.command}
          </code>
        </div>
      )}

      {/* Description */}
      {alert.description && (
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Description</p>
          <p className="text-xs text-zinc-400 leading-relaxed">{alert.description}</p>
        </div>
      )}

      {/* MITRE ATT&CK */}
      <div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">MITRE ATT&amp;CK</p>
        {alert.mitre_technique ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
              {alert.mitre_technique}
            </span>
            {alert.mitre_name && (
              <span className="text-xs text-zinc-400">{alert.mitre_name}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-zinc-600 italic">Not mapped</span>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-5">
      {/* Session info skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Commands skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-3 w-36 mb-3" />
        {[1, 2, 3].map(i => (
          <div key={i} className="pl-6 mb-5">
            <Skeleton className="h-2 w-24 mb-2" />
            <Skeleton className="h-9 w-full mb-0.5" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count }: {
  icon: typeof Terminal;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700">
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      {count !== undefined && (
        <span className="ml-1 text-xs font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SessionInvestigationProps {
  sessionId: string | null;
  onClose: () => void;
}

export function SessionInvestigation({ sessionId, onClose }: SessionInvestigationProps) {
  const { session, loading, error, retry } = useSession(sessionId);

  if (!sessionId) return null;

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Session investigation: ${sessionId}`}
        onKeyDown={handleKeyDown}
        className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 flex flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-100">Session Investigation</h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">{sessionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="session-investigation-close"
            aria-label="Close session investigation"
            className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex-shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
          {loading && <LoadingSkeleton />}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-1">
                  Unable to load session investigation
                </p>
                <p className="text-xs text-zinc-600 font-mono">{error}</p>
              </div>
              <button
                onClick={retry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Session data */}
          {!loading && !error && session && (
            <div className="p-5 space-y-7">
              {/* ── Session Information ── */}
              <section>
                <SectionHeader icon={Info} title="Session Information" />
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <InfoField label="Session ID" value={session.session_id} mono />
                  <InfoField label="Attacker IP" value={session.ip} mono accent="cyan" />
                  <InfoField label="Username" value={session.username} mono />
                  <InfoField
                    label="Start Time"
                    value={formatFullTs(session.start_time)}
                    mono
                  />
                  <InfoField
                    label="End Time"
                    value={session.end_time ? formatFullTs(session.end_time) : '—'}
                    mono
                  />
                </div>
              </section>

              {/* ── Command Timeline ── */}
              <section>
                <SectionHeader
                  icon={Terminal}
                  title="Command Timeline"
                  count={session.commands.length}
                />
                {session.commands.length === 0 ? (
                  <EmptyState message="No commands recorded for this session." />
                ) : (
                  <div>
                    {session.commands.map(cmd => (
                      <CommandEntry key={cmd.id} cmd={cmd} />
                    ))}
                  </div>
                )}
              </section>

              {/* ── Security Alerts ── */}
              <section>
                <SectionHeader
                  icon={Shield}
                  title="Security Alerts"
                  count={session.alerts.length}
                />
                {session.alerts.length === 0 ? (
                  <EmptyState message="No security alerts recorded for this session." />
                ) : (
                  <div className="space-y-3">
                    {session.alerts.map(a => (
                      <SessionAlertEntry key={a.id} alert={a} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function InfoField({
  label,
  value,
  mono = false,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: 'cyan';
}) {
  const valueClass = accent === 'cyan'
    ? 'text-cyan-400 font-mono'
    : mono
    ? 'text-zinc-200 font-mono'
    : 'text-zinc-200';

  return (
    <div>
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xs break-all leading-relaxed ${valueClass}`}>{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-5 rounded-lg border border-dashed border-zinc-800 text-zinc-600">
      <Clock className="w-4 h-4 flex-shrink-0" />
      <p className="text-xs">{message}</p>
    </div>
  );
}
