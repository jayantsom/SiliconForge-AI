import { useEffect, useState } from 'react'
import { getHistory } from '../lib/api'
import type { SessionSummary } from '../lib/types'

interface HistorySidebarProps {
  onSelectSession: (session: SessionSummary) => void
  activeSessionId: string | null
}

function statusBadge(status: string) {
  if (status === 'complete') {
    return <span className="text-[9px] font-mono bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">done</span>
  }
  if (status === 'running') {
    return <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full animate-pulse">running</span>
  }
  return <span className="text-[9px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">failed</span>
}

export function HistorySidebar({ onSelectSession, activeSessionId }: HistorySidebarProps) {
  const [history, setHistory] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    const data = await getHistory()
    setHistory(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
    // Refresh history every 30 seconds
    const interval = setInterval(fetchHistory, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="w-[280px] flex-shrink-0 bg-navy-900 border-r border-navy-600 flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-navy-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
            Si
          </div>
          <div>
            <div className="text-sm font-bold text-white font-mono tracking-tight">SiliconForge AI</div>
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Semiconductor Research</div>
          </div>
        </div>
      </div>

      {/* History Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-600">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Session History</span>
        <button
          onClick={fetchHistory}
          className="text-[10px] text-slate-500 hover:text-cyan-400 font-mono transition-colors"
          title="Refresh history"
        >
          ↻
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="px-4 py-8 text-center text-xs text-slate-600 font-mono">Loading…</div>
        )}
        {!loading && history.length === 0 && (
          <div className="px-4 py-8 text-center">
            <div className="text-2xl mb-2">🔬</div>
            <p className="text-xs text-slate-600 font-mono">No sessions yet</p>
          </div>
        )}
        {history.map(session => (
          <button
            key={session.session_id}
            id={`history-${session.session_id}`}
            onClick={() => onSelectSession(session)}
            className={`w-full text-left px-4 py-3 transition-all duration-150 border-b border-navy-700/50 group hover:bg-navy-800/60 ${
              activeSessionId === session.session_id ? 'bg-navy-800 border-l-2 border-l-cyan-500' : 'border-l-2 border-l-transparent'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              {statusBadge(session.status)}
              <span className="text-[9px] text-slate-600 font-mono flex-shrink-0">
                {new Date(session.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-2 group-hover:text-slate-100 transition-colors">
              {session.user_query}
            </p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-navy-600">
        <div className="text-[9px] text-slate-600 font-mono text-center">
          Powered by LangGraph · Ollama · ChromaDB
        </div>
      </div>
    </aside>
  )
}
