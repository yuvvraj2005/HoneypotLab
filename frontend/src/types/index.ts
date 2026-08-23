export interface Attack {
  id?: number;
  timestamp: string;
  ip: string;
  username: string;
  password: string;
}

export interface Stats {
  total_attacks: number;
  unique_ips: number;
  unique_usernames: number;
  top_username: string | null;
  top_ip: string | null;
  latest_attack: Attack | null;
}

export interface TimelineEntry {
  date: string;
  attacks: number;
}

export interface HealthStatus {
  status: string;
  service: string;
}

export interface AttackFilters {
  limit: number;
  ip: string;
  username: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking';
