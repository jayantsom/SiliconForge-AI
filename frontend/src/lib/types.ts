export interface TraceEvent {
  node: string
  timestamp: string
  summary: string
}

export interface SessionSummary {
  session_id: string
  user_query: string
  created_at: string
  status: string
}

export interface StreamEvent {
  event: 'node_complete' | 'complete' | 'error'
  node?: string
  summary?: string
  timestamp?: string
  session_id?: string
  final_report?: string
  message?: string
}

export type RunStatus = 'idle' | 'running' | 'complete' | 'error'
