import { useRef, useState } from 'react'
import type { RunStatus } from '../lib/types'

interface QueryInputProps {
  onSubmit: (query: string) => void
  status: RunStatus
}

const EXAMPLE_QUERIES = [
  'What is the optimal thermal budget for FinFET gate-last integration with HfO2 high-k dielectrics?',
  'How does ALD cycle count affect HfO2 interfacial layer quality in gate stack formation?',
  'What plasma etch chemistry achieves >10:1 SiN:SiO2 selectivity for FinFET spacer processes?',
]

export function QueryInput({ onSubmit, status }: QueryInputProps) {
  const [query, setQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isRunning = status === 'running'

  const handleSubmit = () => {
    const trimmed = query.trim()
    if (!trimmed || isRunning) return
    onSubmit(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

  const loadExample = (q: string) => {
    setQuery(q)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Research Query</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-cyan-500/30 to-transparent" />
      </div>

      <div className="relative group">
        <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-cyan-500/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
        <textarea
          ref={textareaRef}
          id="research-query-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          rows={4}
          placeholder="Enter your semiconductor research question…&#10;e.g. What is the optimal thermal budget for FinFET gate-last integration with HfO2 high-k dielectrics?"
          className="relative w-full bg-navy-800 border border-navy-600 rounded-xl px-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-cyan-500/60 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => loadExample(q)}
              disabled={isRunning}
              className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 border border-navy-600 hover:border-cyan-500/40 rounded-md px-2 py-1 transition-all duration-150 disabled:opacity-30 truncate max-w-[220px]"
              title={q}
            >
              eg. {q.slice(0, 40)}…
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[10px] text-slate-600 font-mono">⌘+Enter to run</span>
          <button
            id="run-research-btn"
            onClick={handleSubmit}
            disabled={isRunning || !query.trim()}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-navy-700 disabled:text-slate-600 text-navy-950 font-semibold text-sm px-5 py-2 rounded-lg transition-all duration-200 font-mono shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none"
          >
            {isRunning ? (
              <>
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Running…
              </>
            ) : (
              <>
                <span className="text-base">⚡</span>
                Run Research
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
