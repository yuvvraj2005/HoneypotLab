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

export interface Alert {
  id: number;
  timestamp: string;
  session_id: string;
  ip: string;
  username: string;
  command: string;
  event_type: string;
  severity: string;
  description: string;
  mitre_technique: string | null;
  mitre_name: string | null;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertFilters {
  severity: string;
  event_type: string;
}

// ─── Session Investigation ────────────────────────────────────────────────────

export interface SessionCommand {
  id: number;
  timestamp: string;
  command: string;
  output: string;
}

export interface SessionAlert {
  id: number;
  timestamp: string;
  event_type: string;
  severity: string;
  command: string;
  description: string;
  mitre_technique: string | null;
  mitre_name: string | null;
}

export interface Session {
  session_id: string;
  ip: string;
  username: string;
  start_time: string;
  end_time: string | null;
  commands: SessionCommand[];
  alerts: SessionAlert[];
}

// ─── IOC Intelligence ────────────────────────────────────────────────────

export interface Ioc {
  id: number;
  timestamp: string;
  session_id: string;
  ip: string;
  ioc_type: string;
  value: string;
  source_command: string;
}

export interface IocFilters {
  ioc_type: string;
  session_id: string;
  ip: string;
  limit: number;
}