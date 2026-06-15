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

export function ReportViewer({ report }: ReportViewerProps) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-green-500/50" />
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Research Report</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="copy-markdown-btn"
            onClick={() => copyMarkdown(report, setCopied)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 border border-navy-600 hover:border-cyan-500/40 rounded-md px-3 py-1.5 transition-all duration-150"
          >
            {copied ? '✓ Copied' : '⎘ Copy Markdown'}
          </button>
          <button
            id="download-report-btn"
            onClick={() => downloadMarkdown(report)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 border border-navy-600 hover:border-cyan-500/40 rounded-md px-3 py-1.5 transition-all duration-150"
          >
            ↓ Download .md
          </button>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-600 rounded-xl p-6 overflow-auto max-h-[70vh]">
        <div className="prose prose-invert prose-sm max-w-none font-mono">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
