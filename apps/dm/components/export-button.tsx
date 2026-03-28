'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ExportButtonProps {
  href: string
  label?: string
  className?: string
}

export function ExportButton({ href, label = 'Export CSV', className }: ExportButtonProps) {
  async function handleExport() {
    try {
      const res = await fetch(href)
      if (!res.ok) {
        throw new Error(`Export failed: ${res.statusText}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Use filename from Content-Disposition if present, else derive from href
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      a.download = match?.[1]?.trim() || "export.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('CSV exported successfully')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export CSV')
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} className={className}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
