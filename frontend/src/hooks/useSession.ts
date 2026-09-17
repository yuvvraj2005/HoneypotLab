import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Session } from '../types';

interface UseSessionState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useSession(sessionId: string | null) {
  const [state, setState] = useState<UseSessionState>({
    session: null,
    loading: false,
    error: null,
  });

  const fetchSession = useCallback(async (id: string) => {
    setState({ session: null, loading: true, error: null });
    try {
      const session = await api.getSession(id);
      setState({ session, loading: false, error: null });
    } catch (err) {
      setState({
        session: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load session',
      });
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    } else {
      setState({ session: null, loading: false, error: null });
    }
  }, [sessionId, fetchSession]);

  const retry = useCallback(() => {
    if (sessionId) fetchSession(sessionId);
  }, [sessionId, fetchSession]);

  return { ...state, retry };
}
