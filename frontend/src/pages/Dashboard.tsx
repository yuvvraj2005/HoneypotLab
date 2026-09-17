import { useState } from 'react';
import { Activity, Globe, Hash, Shield, User } from 'lucide-react';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { AttackChart } from '../components/AttackChart';
import { AttacksTable } from '../components/AttacksTable';
import { AttackDetailModal } from '../components/AttackDetailModal';
import { FilterBar } from '../components/FilterBar';
import { ErrorBanner } from '../components/ErrorBanner';
import { AlertsPanel } from '../components/AlertsPanel';
import { IocPanel } from '../components/IocPanel';
import { SessionInvestigation } from '../components/SessionInvestigation';
import { useDashboard } from '../hooks/useDashboard';
import { useAttackDetail } from '../hooks/useAttackDetail';
import type { AttackFilters } from '../types';

const DEFAULT_FILTERS: AttackFilters = { limit: 100, ip: '', username: '' };
const DEFAULT_INTERVAL = 10;

export function Dashboard() {
  const [filters, setFilters] = useState<AttackFilters>(DEFAULT_FILTERS);
  const [refreshInterval, setRefreshInterval] = useState(DEFAULT_INTERVAL);

  const { stats, attacks, timeline, connectionStatus, loading, error, lastRefreshed, refresh } =
    useDashboard(filters, refreshInterval);

  const { selectedAttack, selectedIndex, openAttack, closeAttack } = useAttackDetail();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        connectionStatus={connectionStatus}
        lastRefreshed={lastRefreshed}
        onRefresh={refresh}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={setRefreshInterval}
        isLoading={loading}
      />

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 space-y-5">
        {/* Error banner */}
        {error && <ErrorBanner message={error} onRetry={refresh} />}

        {/* Stats grid */}
        <section aria-label="Summary statistics" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <StatCard
            label="Total Attacks"
            value={stats?.total_attacks ?? null}
            icon={Activity}
            accent="rose"
          />
          <StatCard
            label="Unique IPs"
            value={stats?.unique_ips ?? null}
            icon={Globe}
            accent="cyan"
          />
          <StatCard
            label="Unique Usernames"
            value={stats?.unique_usernames ?? null}
            icon={Hash}
            accent="violet"
          />
          <StatCard
            label="Top Username"
            value={stats?.top_username ?? null}
            icon={User}
            accent="amber"
            mono
          />
          <StatCard
            label="Top IP"
            value={stats?.top_ip ?? null}
            icon={Shield}
            accent="emerald"
            mono
          />
        </section>

        {/* Chart */}
        <section aria-label="Attack activity timeline">
          <AttackChart data={timeline} loading={loading && timeline.length === 0} />
        </section>

        {/* Filters */}
        <section aria-label="Attack filters">
          <FilterBar filters={filters} onChange={setFilters} />
        </section>

        {/* Table */}
        <section aria-label="Recent attacks">
          <AttacksTable attacks={attacks} loading={loading} onSelectAttack={openAttack} />
        </section>

        {/* Alerts */}
        <section aria-label="Security alerts">
          <AlertsPanel
            refreshInterval={refreshInterval}
            onInvestigateSession={setSelectedSessionId}
          />
        </section>

        {/* IOC Intelligence */}
        <section aria-label="IOC Intelligence">
          <IocPanel
            refreshInterval={refreshInterval}
            onInvestigateSession={setSelectedSessionId}
          />
        </section>
      </main>

      {/* Attack detail modal */}
      <AttackDetailModal attack={selectedAttack} index={selectedIndex} onClose={closeAttack} />

      {/* Session investigation drawer */}
      <SessionInvestigation
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}
