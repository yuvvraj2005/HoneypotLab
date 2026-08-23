import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { Attack, AttackFilters, ConnectionStatus, Stats, TimelineEntry } from '../types';

interface DashboardData {
  stats: Stats | null;
  attacks: Attack[];
  timeline: TimelineEntry[];
  connectionStatus: ConnectionStatus;
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
}

export function useDashboard(filters: AttackFilters, refreshInterval: number) {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    attacks: [],
    timeline: [],
    connectionStatus: 'checking',
    loading: true,
    error: null,
    lastRefreshed: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      await api.health();
      const [stats, attacks, timeline] = await Promise.all([
        api.getStats(),
        api.getAttacks({ limit: filters.limit, ip: filters.ip, username: filters.username }),
        api.getTimeline(),
      ]);
      setData({
        stats,
        attacks,
        timeline,
        connectionStatus: 'connected',
        loading: false,
        error: null,
        lastRefreshed: new Date(),
      });
    } catch (err) {
      setData(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to connect to API',
        lastRefreshed: prev.lastRefreshed,
      }));
    }
  }, [filters.limit, filters.ip, filters.username]);

  useEffect(() => {
    fetchAll();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchAll, refreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll, refreshInterval]);

  return { ...data, refresh: fetchAll };
}
