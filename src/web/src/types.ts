export type Platform = 'memorial' | 'donation' | 'commerce'
export type HealthState = 'healthy' | 'attention' | 'critical' | 'unknown'
export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type Severity = 'info' | 'warning' | 'critical'

export interface PlatformHealth {
  id: Platform
  name: string
  status: HealthState
  lastEventAt: string
  eventCount: number
  latestMessage: string
}

export interface LifecycleEvent {
  schemaVersion: string
  eventId: string
  eventType: string
  sourcePlatform: Platform
  occurredAt: string
  correlationId: string
  subject: {
    type: string
    id: string
    displayName?: string
  }
  status: EventStatus
  severity: Severity
  data: Record<string, unknown>
}

export interface DashboardSummary {
  totalEvents: number
  healthyPlatforms: number
  attentionRequired: number
  schemaVersion: string
}

export interface DashboardData {
  generatedAt: string
  environment: string
  summary: DashboardSummary
  platforms: PlatformHealth[]
  recentEvents: LifecycleEvent[]
}

export interface DashboardResult {
  data: DashboardData
  source: 'live' | 'demo'
  message?: string
}
