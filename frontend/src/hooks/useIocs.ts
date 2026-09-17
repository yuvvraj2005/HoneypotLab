import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { Ioc, IocFilters } from '../types';

interface UseIocsState {
  iocs: Ioc[];
  loading: boolean;
  error: string | null;
}

export function useIocs(filters: Partial<IocFilters>, refreshInterval: number) {
  const [state, setState] = useState<UseIocsState>({
    iocs: [],
    loading: true,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchIocs = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const iocs = await api.getIocs(filters);
      setState({ iocs, loading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load IOCs',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.ioc_type, filters.session_id, filters.ip, filters.limit]);

  useEffect(() => {
    fetchIocs();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchIocs, refreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchIocs, refreshInterval]);

  return { ...state, refresh: fetchIocs };
}
