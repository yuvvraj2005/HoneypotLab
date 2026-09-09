import type {
  Alert,
  AlertFilters,
  Attack,
  AttackFilters,
  HealthStatus,
  Stats,
  TimelineEntry,
} from '../types';

const BASE_URL = 'http://127.0.0.1:8000';

async function apiFetch<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health(): Promise<HealthStatus> {
    return apiFetch<HealthStatus>('/health');
  },

  getAttacks(filters?: Partial<AttackFilters>): Promise<Attack[]> {
    const params: Record<string, string> = {};

    if (filters?.limit) params.limit = String(filters.limit);
    if (filters?.ip) params.ip = filters.ip;
    if (filters?.username) params.username = filters.username;

    return apiFetch<Attack[]>('/attacks', params);
  },

  getAttackById(id: number): Promise<Attack> {
    return apiFetch<Attack>(`/attacks/${id}`);
  },

  getStats(): Promise<Stats> {
    return apiFetch<Stats>('/stats');
  },

  getTimeline(): Promise<TimelineEntry[]> {
    return apiFetch<TimelineEntry[]>('/stats/timeline');
  },

  getAlerts(filters?: Partial<AlertFilters>): Promise<Alert[]> {
    const params: Record<string, string> = {};
    if (filters?.severity) params.severity = filters.severity;
    if (filters?.event_type) params.event_type = filters.event_type;
    return apiFetch<Alert[]>('/alerts', params);
  },

  getAlertById(id: number): Promise<Alert> {
    return apiFetch<Alert>(`/alerts/${id}`);
  },

  getSessionAlerts(sessionId: string): Promise<Alert[]> {
    return apiFetch<Alert[]>(`/sessions/${sessionId}`);
  },
};