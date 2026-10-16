import { demoDashboard } from './demoData'
import type { DashboardData, DashboardResult } from './types'

const isDashboardData = (value: unknown): value is DashboardData => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DashboardData>
  return (
    typeof candidate.generatedAt === 'string' &&
    typeof candidate.environment === 'string' &&
    !!candidate.summary &&
    typeof candidate.summary.totalEvents === 'number' &&
    typeof candidate.summary.healthyPlatforms === 'number' &&
    typeof candidate.summary.attentionRequired === 'number' &&
    typeof candidate.summary.schemaVersion === 'string' &&
    Array.isArray(candidate.platforms) &&
    Array.isArray(candidate.recentEvents)
  )
}

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardResult> {
  try {
    const response = await fetch('/api/dashboard', {
      headers: { Accept: 'application/json' },
      signal,
    })

    if (!response.ok) {
      throw new Error(`Dashboard request returned ${response.status}`)
    }

    const payload: unknown = await response.json()
    if (!isDashboardData(payload)) {
      throw new Error('Dashboard response did not match the expected contract')
    }

    return { data: payload, source: 'live' }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error

    return {
      data: demoDashboard,
      source: 'demo',
      message: 'API unavailable — showing clearly labeled local demo data.',
    }
  }
}
