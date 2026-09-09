import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { Alert, AlertFilters } from '../types';

interface UseAlertsState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

export function useAlerts(filters: AlertFilters, refreshInterval: number) {
  const [state, setState] = useState<UseAlertsState>({
    alerts: [],
    loading: true,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Pass filters to the API; backend handles severity/event_type filtering.
      // If the backend ignores unknown query params gracefully, they are a no-op.
      const alerts = await api.getAlerts({
        severity: filters.severity,
        event_type: filters.event_type,
      });
      setState({ alerts, loading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load alerts',
      }));
    }
  }, [filters.severity, filters.event_type]);

  useEffect(() => {
    fetchAlerts();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchAlerts, refreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAlerts, refreshInterval]);

  return { ...state, refresh: fetchAlerts };
}
