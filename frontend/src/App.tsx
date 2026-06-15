import { useState } from 'react'
import { AgentTracePanel } from './components/AgentTracePanel'
import { HistorySidebar } from './components/HistorySidebar'
import { QueryInput } from './components/QueryInput'
import { ReportViewer } from './components/ReportViewer'
import { streamResearch } from './lib/api'
import type { RunStatus, SessionSummary, StreamEvent, TraceEvent } from './lib/types'

export default function App() {
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([])
  const [finalReport, setFinalReport] = useState<string | null>(null)
  const [status, setStatus] = useState<RunStatus>('idle')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = (query: string) => {
    const sessionId = crypto.randomUUID()
    setActiveSessionId(sessionId)
    setTraceEvents([])
    setFinalReport(null)
    setErrorMsg(null)
    setStatus('running')

    streamResearch(
      query,
      sessionId,
      (event: StreamEvent) => {
        if (event.event === 'node_complete' && event.node && event.summary && event.timestamp) {
          setTraceEvents(prev => [...prev, { node: event.node!, summary: event.summary!, timestamp: event.timestamp! }])
        }
      },
      (report: string) => {
        setFinalReport(report)
        setStatus('complete')
      },
      (msg: string) => {
        setErrorMsg(msg)
        setStatus('error')
      }
    )
  }

  const handleSelectSession = (session: SessionSummary) => {
    setActiveSessionId(session.session_id)
    setTraceEvents([])
    setErrorMsg(null)
    setStatus('idle')
    // Show a summary card for the historical session.
    // Full reports are not persisted client-side; the user can re-run the query.
    setFinalReport(
      `## 📁 Historical Session\n\n` +
      `**Query:** ${session.user_query}\n\n` +
      `**Status:** ${session.status}  ·  **Date:** ${new Date(session.created_at).toLocaleString()}\n\n` +
      `---\n\n` +
      `> The full report is not cached in the browser. ` +
      `Enter the query above and click **Run Research** to regenerate it.`
    )
  }

  return (
    <div className="flex h-screen bg-navy-950 text-slate-200 font-sans overflow-hidden">
      <HistorySidebar onSelectSession={handleSelectSession} activeSessionId={activeSessionId} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-navy-600 bg-navy-900/50 backdrop-blur-sm">
          <div>
            <h1 className="text-base font-bold text-white font-mono tracking-tight">
              Autonomous Research Agent
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Planner → Retrieval → Critique → Synthesis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'bg-cyan-400 animate-pulse' : status === 'complete' ? 'bg-green-400' : status === 'error' ? 'bg-red-400' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-mono text-slate-500 capitalize">{status}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-6">
            {/* Query input */}
            <section className="bg-navy-800/60 border border-navy-600 rounded-2xl p-5 shadow-xl shadow-black/30">
              <QueryInput onSubmit={handleSubmit} status={status} />
            </section>

            {/* Error */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 font-mono">
                ⚠ {errorMsg}
              </div>
            )}

            {/* Agent trace */}
            {(traceEvents.length > 0 || status === 'running') && (
              <section className="bg-navy-800/60 border border-navy-600 rounded-2xl p-5 shadow-xl shadow-black/30">
                <AgentTracePanel events={traceEvents} isRunning={status === 'running'} />
              </section>
            )}

            {/* Report */}
            {finalReport && (
              <section className="bg-navy-800/60 border border-navy-600 rounded-2xl p-5 shadow-xl shadow-black/30">
                <ReportViewer report={finalReport} />
              </section>
            )}

            {/* Landing state */}
            {status === 'idle' && traceEvents.length === 0 && !finalReport && (
              <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center text-4xl shadow-2xl shadow-cyan-500/10">
                    ⚗️
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 animate-ping opacity-40" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-mono mb-2">Ready for Research</h2>
                  <p className="text-sm text-slate-500 max-w-md font-mono leading-relaxed">
                    Enter a semiconductor manufacturing research question above. The AI agent will plan, retrieve literature, critique the findings, and synthesize a structured report.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                  {['🧠 Planner', '🔍 Retrieval', '⚗️ Critique', '📄 Synthesis', '🗄️ ChromaDB', '🌐 ArXiv'].map(label => (
                    <div key={label} className="bg-navy-800/80 border border-navy-600 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-500 text-center">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
