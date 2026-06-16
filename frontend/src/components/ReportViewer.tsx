import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReportViewerProps {
  report: string
}

function downloadMarkdown(content: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `siliconforge-report-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

async function copyMarkdown(content: string, setCopied: (v: boolean) => void) {
  await navigator.clipboard.writeText(content)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}

/**
 * Splits a markdown report into:
 *   - body: everything before the ## References section
 *   - references: array of parsed reference strings
 */
function parseReport(report: string): { body: string; references: string[] } {
  // Find the references section (case-insensitive, with any number of # signs)
  const refHeaderPattern = /^#{1,3}\s*references\s*$/im
  const match = report.match(refHeaderPattern)

  if (!match || match.index === undefined) {
    return { body: report, references: [] }
  }

  const body = report.slice(0, match.index).trim()
  const refBlock = report.slice(match.index + match[0].length).trim()

  // Parse individual reference lines (e.g. "[1] Author...", "1. Author...", "- Author...")
  const references = refBlock
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    // Remove leading list markers like "- ", "* ", "1. ", "[1] " etc
    .map(line => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/^\[\d+\]\s+/, ''))
    .filter(line => line.length > 0)

  return { body, references }
}

/**
 * Detect reference source using the [ArXiv] / [Local] tags injected by synthesis_node.
 * Falls back to keyword matching for legacy reports that don't have tags.
 */
function getReferenceSource(ref: string): 'arxiv' | 'local' | 'unknown' {
  // Primary: explicit tags injected by the backend synthesis node
  if (ref.includes('[ArXiv]')) return 'arxiv'
  if (ref.includes('[Local]')) return 'local'

  // Fallback: heuristic keyword matching for tag-less reports
  const lower = ref.toLowerCase()
  if (lower.includes('arxiv') || lower.includes('abs/')) return 'arxiv'
  const localKeywords = ['finfet', 'thermal budget', 'hfo2', 'ald window', 'sio2', 'sin', 'harc', 'arde', 'cmp', 'overlay', 'cd-sem', 'nanosheet', 'gaa']
  if (localKeywords.some(kw => lower.includes(kw))) return 'local'
  return 'unknown'
}

export function ReportViewer({ report }: ReportViewerProps) {
  const [copied, setCopied] = useState(false)
  const { body, references } = parseReport(report)

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-green-500/50" />
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Research Report</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="copy-markdown-btn"
            onClick={() => copyMarkdown(report, setCopied)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 rounded-md px-3 py-1.5 transition-all duration-150"
          >
            {copied ? '✓ Copied' : '⎘ Copy Markdown'}
          </button>
          <button
            id="download-report-btn"
            onClick={() => downloadMarkdown(report)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 rounded-md px-3 py-1.5 transition-all duration-150"
          >
            ↓ Download .md
          </button>
        </div>
      </div>

      {/* Main report body */}
      <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-6 overflow-auto max-h-[60vh] report-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-white font-mono mb-4 mt-2 pb-2 border-b border-slate-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-cyan-400 font-mono mt-6 mb-3 flex items-center gap-2">
                <span className="inline-block w-1 h-4 bg-cyan-500/60 rounded-full" />
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-blue-300 font-mono mt-4 mb-2">
                ▸ {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-sm text-slate-300 leading-relaxed mb-3 font-sans">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-none space-y-1 mb-3 pl-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 space-y-1 mb-3 text-sm text-slate-300">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-sm text-slate-300 flex items-start gap-2">
                <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                <span>{children}</span>
              </li>
            ),
            strong: ({ children }) => (
              <strong className="text-white font-semibold">{children}</strong>
            ),
            code: ({ children, ...props }) => {
              // react-markdown passes className="language-*" for fenced blocks
              const isBlock = !!(props as { className?: string }).className
              if (isBlock) {
                return (
                  <pre className="bg-slate-800/80 rounded-lg p-4 overflow-x-auto my-3 border border-slate-700/40">
                    <code className="text-xs text-green-400 font-mono leading-relaxed" {...props}>
                      {children}
                    </code>
                  </pre>
                )
              }
              return (
                <code className="text-xs bg-slate-800 text-green-400 px-1.5 py-0.5 rounded font-mono" {...props}>
                  {children}
                </code>
              )
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-cyan-500/40 pl-4 italic text-slate-400 my-3">
                {children}
              </blockquote>
            ),
          }}
        >
          {body}
        </ReactMarkdown>
      </div>

      {/* References panel — only shown when references exist */}
      {references.length > 0 && (
        <div className="border border-slate-700/60 rounded-xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">References</span>
            <span className="ml-auto text-[10px] font-mono text-slate-600">{references.length} sources</span>
          </div>

          {/* Source legend */}
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/40 border-b border-slate-700/30">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400/80" />
              <span className="text-[10px] font-mono text-slate-500">ChromaDB / Local</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400/80" />
              <span className="text-[10px] font-mono text-slate-500">ArXiv</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-slate-500/80" />
              <span className="text-[10px] font-mono text-slate-500">LLM-generated / Unknown</span>
            </div>
          </div>

          {/* Reference items */}
          <div className="divide-y divide-slate-700/30 bg-slate-900/30 max-h-56 overflow-y-auto">
            {references.map((ref, idx) => {
              const source = getReferenceSource(ref)
              const dotColor =
                source === 'local' ? 'bg-blue-400/80' :
                source === 'arxiv' ? 'bg-orange-400/80' :
                'bg-slate-500/60'
              const badge =
                source === 'local' ? { label: 'Local', cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20' } :
                source === 'arxiv' ? { label: 'ArXiv', cls: 'text-orange-400 bg-orange-400/10 border-orange-400/20' } :
                { label: 'LLM', cls: 'text-slate-500 bg-slate-700/30 border-slate-600/30' }

              return (
                <div key={idx} className="flex items-start gap-3 px-4 py-2.5">
                  <span className={`mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className="text-[11px] font-mono text-slate-400 leading-relaxed flex-1">
                    <span className="text-slate-600 mr-1.5">[{idx + 1}]</span>
                    {ref}
                  </span>
                  <span className={`flex-shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded border ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-700/30">
            <p className="text-[10px] font-mono text-slate-600 leading-relaxed">
              ⓘ Sources retrieved from <span className="text-blue-400/70">ChromaDB</span> (local semiconductor literature) and live{' '}
              <span className="text-orange-400/70">ArXiv</span> search. <span className="text-amber-500/70">LLM-tagged</span> citations may be
              hallucinated — verify independently.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
