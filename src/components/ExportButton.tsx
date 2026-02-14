import { useState, useCallback } from 'react'
import type { AuditResult } from '../types/audit'
import type { PatientSnapshot } from '../types/patient'
import { exportSOAP } from '../engine/export-soap'
import { exportProblemList } from '../engine/export-problem-list'
import { exportJSON } from '../engine/export-json'

interface ExportButtonProps {
  readonly auditResult: AuditResult
  readonly patient: PatientSnapshot
}

type ExportFormat = 'soap' | 'problem-list' | 'json'

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ExportButton({ auditResult, patient }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = useCallback(
    (format: ExportFormat) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

      if (format === 'soap') {
        const content = exportSOAP(auditResult, patient)
        downloadFile(content, `inertia-linter-soap-${timestamp}.txt`, 'text/plain')
      } else if (format === 'problem-list') {
        const content = exportProblemList(auditResult)
        downloadFile(
          content,
          `inertia-linter-problems-${timestamp}.txt`,
          'text/plain',
        )
      } else {
        const content = exportJSON(auditResult)
        downloadFile(
          content,
          `inertia-linter-audit-${timestamp}.json`,
          'application/json',
        )
      }

      setIsOpen(false)
    },
    [auditResult, patient],
  )

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Export Report
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false)
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close export menu"
          />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="py-1">
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleExport('soap')}
              >
                SOAP Note (.txt)
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleExport('problem-list')}
              >
                Problem List (.txt)
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleExport('json')}
              >
                JSON Export (.json)
              </button>
            </div>
            <div className="border-t border-gray-100 px-4 py-2">
              <p className="text-xs text-gray-400">
                DRAFT — SYNTHETIC DATA ONLY
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
