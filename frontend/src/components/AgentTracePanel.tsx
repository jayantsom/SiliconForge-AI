import type { TraceEvent } from '../lib/types'

const NODE_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  planner:   { border: 'border-cyan-500',  bg: 'bg-cyan-500/10',  text: 'text-cyan-400',  dot: 'bg-cyan-500' },
  retrieval: { border: 'border-blue-500',  bg: 'bg-blue-500/10',  text: 'text-blue-400',  dot: 'bg-blue-500' },
  critique:  { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
  synthesis: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
}

const NODE_ICONS: Record<string, string> = {
  planner:   '🧠',
  retrieval: '🔍',
  critique:  '⚗️',
  synthesis: '📄',
}

interface AgentTracePanelProps {
  events: TraceEvent[]
  isRunning: boolean
}

export function AgentTracePanel({ events, isRunning }: AgentTracePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest font-mono">
          Agent Trace
        </h2>
        {isRunning && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-xs text-cyan-400 font-mono animate-pulse">Agent running…</span>
          </div>
        )}
      </div>

      {events.length === 0 && !isRunning && (
        <div className="text-xs text-slate-600 font-mono py-4 text-center border border-dashed border-navy-600 rounded-lg">
          Agent trace will appear here during execution
        </div>
      )}

      <div className="relative flex flex-col gap-2">
        {events.length > 0 && (
          <div className="absolute left-[11px] top-0 bottom-0 w-px bg-navy-600" />
        )}
        {events.map((event, i) => {
          const colors = NODE_COLORS[event.node] ?? {
            border: 'border-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500',
          }
          const isCritiqueFail = event.node === 'critique' && event.summary.toLowerCase().includes('fail')

          return (
            <div
              key={i}
              className="flex gap-3 items-start trace-step"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative flex-shrink-0 mt-1">
                <div className={`w-5 h-5 rounded-full ${colors.dot} flex items-center justify-center text-[10px] z-10 relative`}>
                  {NODE_ICONS[event.node] ?? '•'}
                </div>
              </div>
              <div className={`flex-1 rounded-lg border ${colors.border} ${colors.bg} px-3 py-2`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${colors.text}`}>
                    {event.node}
                  </span>
                  <div className="flex items-center gap-2">
                    {isCritiqueFail && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-mono">
                        ↺ Replanning…
                      </span>
                    )}
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed">
                  {event.summary}
                </p>
              </div>
            </div>
          )
        })}
        {isRunning && (
          <div className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin flex-shrink-0 mt-1" />
            <div className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2">
              <span className="text-xs text-cyan-400/60 font-mono animate-pulse">Processing…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
