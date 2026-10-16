import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { demoDashboard } from './demoData'

describe('Platform Bridge dashboard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a loading state while the dashboard request is pending', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => undefined))

    render(<App />)

    expect(screen.getByRole('main', { name: /loading dashboard/i })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByText(/loading operations overview/i)).toBeInTheDocument()
  })

  it('renders live dashboard data returned by the API', async () => {
    const liveDashboard = { ...demoDashboard, environment: 'production' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(liveDashboard), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Platform overview' })).toBeInTheDocument()
    expect(screen.getByText('production')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Platform health' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recent lifecycle events' })).toBeInTheDocument()
    expect(screen.getByText('commerce-ORD-3098')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/dashboard',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })

  it('falls back to clearly labeled demo data when the API is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network error'))

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Platform overview' })).toBeInTheDocument()
    expect(screen.getByText('Local demo')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Demo data notice' })).toHaveTextContent(
      /illustrative and are not production metrics/i,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))
  })
})
