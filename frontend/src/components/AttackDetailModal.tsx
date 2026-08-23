import { X, Clock, Globe, User, Lock } from 'lucide-react';
import type { Attack } from '../types';

interface AttackDetailModalProps {
  attack: Attack | null;
  index: number | null;
  onClose: () => void;
}

function DetailRow({ icon: Icon, label, value, mono = false }: {
  icon: typeof Clock;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-zinc-800 flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <p className={`text-sm text-zinc-200 break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function formatFullTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

export function AttackDetailModal({ attack, index, onClose }: AttackDetailModalProps) {
  if (!attack) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Attack Detail</h2>
            {index !== null && (
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">Record #{index + 1}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge */}
        <div className="px-5 py-3 border-b border-zinc-800">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            SSH Brute-Force Attempt — Blocked
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          <DetailRow
            icon={Clock}
            label="Timestamp"
            value={formatFullTimestamp(attack.timestamp)}
            mono
          />
          <DetailRow
            icon={Globe}
            label="Source IP"
            value={attack.ip}
            mono
          />
          <DetailRow
            icon={User}
            label="Username"
            value={attack.username}
            mono
          />
          <DetailRow
            icon={Lock}
            label="Password"
            value={attack.password}
            mono
          />
        </div>

        {/* Footer note */}
        <div className="px-5 py-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">
            Passwords are redacted by the server and never transmitted in plaintext.
          </p>
        </div>
      </div>
    </>
  );
}
