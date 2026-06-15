import type { SessionSummary, StreamEvent } from './types'

const BASE = '/api/v1'

/**
 * Open an SSE stream for a research query.
 * Returns the EventSource so the caller can close it early if needed.
 *
 * IMPORTANT: EventSource.onerror fires both on real network errors AND when
 * the server closes the connection normally at end-of-stream. We distinguish
 * the two cases by checking readyState: CLOSED (2) means the server finished
 * normally (we should have already received the 'complete' event); any other
 * state means a genuine connection failure.
 */
export function streamResearch(
  query: string,
  sessionId: string,
  onEvent: (event: StreamEvent) => void,
  onComplete: (report: string) => void,
  onError: (msg: string) => void
): EventSource {
  const url = `${BASE}/research/stream/${encodeURIComponent(sessionId)}?query=${encodeURIComponent(query)}`
  const source = new EventSource(url)

  source.onmessage = (e: MessageEvent<string>) => {
    try {
      const parsed = JSON.parse(e.data) as StreamEvent
      if (parsed.event === 'complete') {
        onComplete(parsed.final_report ?? '')
        source.close()
      } else if (parsed.event === 'error') {
        onError(parsed.message ?? 'Unknown error')
        source.close()
      } else {
        onEvent(parsed)
      }
    } catch {
      // Ignore malformed SSE frames
    }
  }

  source.onerror = () => {
    // readyState 2 = EventSource.CLOSED — the server closed the connection
    // normally after the final 'complete' event. This is NOT an error.
    if (source.readyState === EventSource.CLOSED) return
    onError('Stream connection lost')
    source.close()
  }

  return source
}

export async function getHistory(): Promise<SessionSummary[]> {
  const res = await fetch(`${BASE}/research/history`)
  if (!res.ok) return []
  return res.json() as Promise<SessionSummary[]>
}
