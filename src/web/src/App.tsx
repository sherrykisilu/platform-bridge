import { useEffect, useMemo, useState } from 'react'
import { fetchDashboard } from './api'
import type {
  DashboardResult,
  EventStatus,
  HealthState,
  LifecycleEvent,
  Platform,
  PlatformHealth,
  Severity,
} from './types'

const platformMeta: Record<Platform, { label: string; eyebrow: string; icon: JSX.Element }> = {
  memorial: {
    label: 'Memorial',
    eyebrow: 'Publishing',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.25s-7.5-4.35-7.5-10.13A4.37 4.37 0 0 1 12 7.08a4.37 4.37 0 0 1 7.5 3.04c0 5.78-7.5 10.13-7.5 10.13Z" />
      </svg>
    ),
  },
  donation: {
    label: 'Donation',
    eyebrow: 'Giving',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v18M16.5 7.25c0-1.52-1.72-2.75-4.5-2.75S7.5 5.73 7.5 7.25 9.1 9.6 12 10.2s4.5 1.42 4.5 3.55-1.72 3.25-4.5 3.25-4.5-1.23-4.5-2.75" />
      </svg>
    ),
  },
  commerce: {
    label: 'Commerce',
    eyebrow: 'Store',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 4.5h2l1.8 10.25h10.9l1.8-7.5H6.1M9.25 19.5h.01M17 19.5h.01" />
      </svg>
    ),
  },
}

const healthLabels: Record<HealthState, string> = {
  healthy: 'Healthy',
  attention: 'Attention',
  critical: 'Critical',
  unknown: 'Unknown',
}

const statusLabels: Record<EventStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

const severityLabels: Record<Severity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
}

const icon = {
  bridge: (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M6 28h28M9 28c0-10 4.8-15 11-15s11 5 11 15M5 11h8v7H5zM27 11h8v7h-8zM13 14h14" />
      <circle cx="20" cy="13" r="2.5" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h4l2.25-6 4.5 12L16 12h5" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 12 3 3 7-7" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8v5M12 17h.01M10.2 3.9 2.6 17a2 2 0 0 0 1.73 3h15.34a2 2 0 0 0 1.73-3L13.8 3.9a2.08 2.08 0 0 0-3.6 0Z" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 13.5a4.5 4.5 0 0 0 6.7.3l2.1-2.1a4.5 4.5 0 0 0-6.36-6.36L11.2 6.58M14 10.5a4.5 4.5 0 0 0-6.7-.3l-2.1 2.1a4.5 4.5 0 0 0 6.36 6.36l1.24-1.24" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6v5h-5M4 18v-5h5M6.1 9a7 7 0 0 1 11.8-2.6L20 11M4 13l2.1 4.6A7 7 0 0 0 17.9 15" />
    </svg>
  ),
  contract: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" />
    </svg>
  ),
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function LoadingView() {
  return (
    <main className="dashboard-shell" aria-busy="true" aria-label="Loading dashboard">
      <div className="loading-panel">
        <div className="loading-mark">{icon.bridge}</div>
        <div>
          <p className="eyebrow">Platform Bridge</p>
          <h1>Loading operations overview…</h1>
          <p>Connecting to the unified dashboard API.</p>
        </div>
        <span className="spinner" aria-hidden="true" />
      </div>
    </main>
  )
}

function HealthCard({ health }: { health: PlatformHealth }) {
  const meta = platformMeta[health.id]
  return (
    <article className={`health-card health-card--${health.id}`}>
      <div className="health-card__top">
        <span className="platform-icon">{meta.icon}</span>
        <div className="health-card__identity">
          <p>{meta.eyebrow}</p>
          <h3>{health.name}</h3>
        </div>
        <span className={`health-pill health-pill--${health.status}`}>
          <span aria-hidden="true" />
          {healthLabels[health.status]}
        </span>
      </div>
      <dl className="health-metrics">
        <div>
          <dt>Events</dt>
          <dd>{health.eventCount.toLocaleString()}</dd>
        </div>
        <div className="health-metrics__message">
          <dt>Latest activity</dt>
          <dd>{health.latestMessage}</dd>
        </div>
      </dl>
      <div className="health-card__footer">
        <span>Last event</span>
        <time dateTime={health.lastEventAt}>{formatTime(health.lastEventAt)}</time>
      </div>
    </article>
  )
}

function EventRow({ event }: { event: LifecycleEvent }) {
  const meta = platformMeta[event.sourcePlatform]
  const eventLabel = event.eventType
    .split('.')
    .at(-1)!
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <tr>
      <td>
        <div className="event-name">
          <span className={`event-platform event-platform--${event.sourcePlatform}`}>
            {meta.icon}
          </span>
          <div>
            <strong>{eventLabel}</strong>
            <span>{meta.label}</span>
          </div>
        </div>
      </td>
      <td>
        <div className="subject-cell">
          <strong>{event.subject.displayName ?? event.subject.type}</strong>
          <code>{event.subject.id}</code>
        </div>
      </td>
      <td>
        <code className="correlation">{event.correlationId}</code>
      </td>
      <td>
        <span className={`status-tag status-tag--${event.status}`}>
          <span aria-hidden="true" />
          {statusLabels[event.status]}
        </span>
      </td>
      <td>
        <span className={`severity severity--${event.severity}`}>
          {severityLabels[event.severity]}
        </span>
      </td>
      <td>
        <time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time>
      </td>
    </tr>
  )
}

function Dashboard({ result, refresh, refreshing }: {
  result: DashboardResult
  refresh: () => void
  refreshing: boolean
}) {
  const { data, source, message } = result
  const isDemo = source === 'demo' || data.environment === 'local-demo'
  const kpis = [
    {
      label: 'Lifecycle events',
      value: data.summary.totalEvents.toLocaleString(),
      detail: 'in this snapshot',
      icon: icon.activity,
      tone: 'blue',
    },
    {
      label: 'Healthy platforms',
      value: `${data.summary.healthyPlatforms}/${data.platforms.length}`,
      detail: 'reporting healthy',
      icon: icon.success,
      tone: 'green',
    },
    {
      label: 'Needs attention',
      value: data.summary.attentionRequired.toLocaleString(),
      detail: 'across all platforms',
      icon: icon.alert,
      tone: 'amber',
    },
    {
      label: 'Schema version',
      value: `v${data.summary.schemaVersion}`,
      detail: 'shared event contract',
      icon: icon.link,
      tone: 'violet',
    },
  ]

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="Platform Bridge operations home">
          <span className="brand__mark">{icon.bridge}</span>
          <span>
            <strong>Platform Bridge</strong>
            <small>Unified operations</small>
          </span>
        </a>
        <div className="topbar__right">
          <span className={`environment-badge ${isDemo ? 'environment-badge--demo' : ''}`}>
            <span aria-hidden="true" />
            {isDemo ? 'Local demo' : data.environment}
          </span>
          <button className="refresh-button" type="button" onClick={refresh} disabled={refreshing}>
            <span className={refreshing ? 'is-spinning' : ''}>{icon.refresh}</span>
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      <main className="dashboard-shell" id="overview">
        {isDemo && (
          <aside className="demo-banner" aria-label="Demo data notice">
            <span className="demo-banner__icon">D</span>
            <div>
              <strong>Demo / local data</strong>
              <p>
                {message ?? 'The API identified this environment as local-demo.'}
                {' '}Values below are illustrative and are not production metrics.
              </p>
            </div>
          </aside>
        )}

        <section className="page-heading" aria-labelledby="dashboard-title">
          <div>
            <p className="eyebrow">Operations center</p>
            <h1 id="dashboard-title">Platform overview</h1>
            <p>Health and lifecycle activity across the connected product ecosystem.</p>
          </div>
          <div className="updated-at">
            <span>Snapshot updated</span>
            <time dateTime={data.generatedAt}>{formatDateTime(data.generatedAt)}</time>
          </div>
        </section>

        <section className="kpi-grid" aria-label="Dashboard summary">
          {kpis.map((kpi) => (
            <article className="kpi-card" key={kpi.label}>
              <span className={`kpi-card__icon kpi-card__icon--${kpi.tone}`}>{kpi.icon}</span>
              <div>
                <p>{kpi.label}</p>
                <strong>{kpi.value}</strong>
                <span>{kpi.detail}</span>
              </div>
            </article>
          ))}
        </section>

        <section aria-labelledby="health-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Connected services</p>
              <h2 id="health-heading">Platform health</h2>
            </div>
            <div className="legend" aria-label="Health status legend">
              <span><i className="dot dot--good" /> Healthy</span>
              <span><i className="dot dot--warning" /> Attention</span>
              <span><i className="dot dot--danger" /> Critical</span>
            </div>
          </div>
          <div className="health-grid">
            {data.platforms.map((platform) => (
              <HealthCard health={platform} key={platform.id} />
            ))}
          </div>
        </section>

        <section className="lower-grid">
          <article className="events-panel" aria-labelledby="events-heading">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Shared event stream</p>
                <h2 id="events-heading">Recent lifecycle events</h2>
              </div>
              <span className="event-count">{data.recentEvents.length} latest</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">Subject</th>
                    <th scope="col">Correlation</th>
                    <th scope="col">Status</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Occurred</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvents.map((event) => (
                    <EventRow event={event} key={event.eventId} />
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="contract-panel" aria-labelledby="contract-heading">
            <span className="contract-panel__icon">{icon.contract}</span>
            <p className="eyebrow">Integration contract</p>
            <h2 id="contract-heading">One envelope.<br />Three platforms.</h2>
            <p>
              Versioned lifecycle events create a stable boundary between platform adapters and
              operations consumers.
            </p>
            <div className="architecture-flow" aria-label="Platform adapters flow through contract version 1 to the dashboard">
              <div className="architecture-flow__sources" aria-hidden="true">
                {data.platforms.map(({ id }) => (
                  <span key={id}>{platformMeta[id].icon}</span>
                ))}
              </div>
              <span className="architecture-flow__line" aria-hidden="true" />
              <div className="contract-version">
                <small>JSON contract</small>
                <strong>v{data.summary.schemaVersion}</strong>
              </div>
              <span className="architecture-flow__line" aria-hidden="true" />
              <span className="dashboard-node" aria-hidden="true">{icon.activity}</span>
            </div>
            <dl className="contract-details">
              <div>
                <dt>Dashboard</dt>
                <dd><code>GET /api/dashboard</code></dd>
              </div>
              <div>
                <dt>Event ingest</dt>
                <dd><code>POST /api/events</code></dd>
              </div>
              <div>
                <dt>Health</dt>
                <dd><code>GET /health</code></dd>
              </div>
            </dl>
          </aside>
        </section>
      </main>

      <footer>
        <span>Platform Bridge</span>
        <span>Operational clarity across connected experiences.</span>
      </footer>
    </div>
  )
}

export default function App() {
  const [result, setResult] = useState<DashboardResult | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    if (refreshCount > 0) setRefreshing(true)

    fetchDashboard(controller.signal)
      .then(setResult)
      .finally(() => setRefreshing(false))

    return () => controller.abort()
  }, [refreshCount])

  const refresh = useMemo(() => () => setRefreshCount((count) => count + 1), [])

  if (!result) return <LoadingView />
  return <Dashboard result={result} refresh={refresh} refreshing={refreshing} />
}
