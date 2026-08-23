import { Activity, Shield, Wifi, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '../types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  lastRefreshed: Date | null;
  onRefresh: () => void;
  refreshInterval: number;
  onRefreshIntervalChange: (v: number) => void;
  isLoading: boolean;
}

const INTERVAL_OPTIONS = [
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: 'Off', value: 0 },
];

export function Header({
  connectionStatus,
  lastRefreshed,
  onRefresh,
  refreshInterval,
  onRefreshIntervalChange,
  isLoading,
}: HeaderProps) {
  const isConnected = connectionStatus === 'connected';
  const isChecking = connectionStatus === 'checking';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
      <div className="mx-auto max-w-screen-2xl flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight tracking-tight">
              HoneypotLab
            </h1>
            <p className="text-xs text-zinc-500 leading-tight">SSH Honeypot Monitor</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Last refreshed */}
          {lastRefreshed && (
            <span className="hidden sm:block text-xs text-zinc-500 font-mono">
              {formatTime(lastRefreshed)}
            </span>
          )}

          {/* Auto-refresh interval */}
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500 hidden md:block">Refresh:</span>
            <div className="flex rounded-md overflow-hidden border border-zinc-700">
              {INTERVAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onRefreshIntervalChange(opt.value)}
                  className={`px-2 py-1 text-xs font-mono transition-colors ${
                    refreshInterval === opt.value
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={isLoading ? 'animate-spin' : ''}>↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Connection status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              isChecking
                ? 'border-zinc-700 bg-zinc-900 text-zinc-400'
                : isConnected
                ? 'border-emerald-800/60 bg-emerald-500/10 text-emerald-400'
                : 'border-red-800/60 bg-red-500/10 text-red-400'
            }`}
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isChecking ? 'Checking…' : isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isChecking
                  ? 'bg-zinc-500 animate-pulse'
                  : isConnected
                  ? 'bg-emerald-400'
                  : 'bg-red-400 animate-pulse'
              }`}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
