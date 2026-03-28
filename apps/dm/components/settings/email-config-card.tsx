"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Mail, Send, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EmailConfigData {
  provider: string
  configured: boolean
}

interface EmailConfigCardProps {
  isAdmin: boolean
}

function ProviderBadge({ provider, configured }: { provider: string; configured: boolean }) {
  if (provider === "none" || provider === "") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" />
        Not configured (console only)
      </span>
    )
  }

  const label =
    provider === "smtp"
      ? "Configured (SMTP)"
      : provider === "resend"
        ? "Configured (Resend)"
        : `Configured (${provider})`

  if (configured) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
        <CheckCircle className="h-3.5 w-3.5" />
        {label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
      <XCircle className="h-3.5 w-3.5" />
      {label} (missing credentials)
    </span>
  )
}

export function EmailConfigCard({ isAdmin }: EmailConfigCardProps) {
  const [config, setConfig] = useState<EmailConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    fetch("/api/settings/email-config")
      .then((r) => r.json())
      .then((data: EmailConfigData) => setConfig(data))
      .catch(() => setConfig({ provider: "none", configured: false }))
      .finally(() => setLoading(false))
  }, [isAdmin])

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault()
    const addr = testEmail.trim()
    if (!addr) {
      toast.error("Enter a recipient email address")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: addr,
          subject: "Test email from DM Dashboard",
          html: "<p>This is a test email sent from DM Dashboard. If you received this, your email integration is working correctly.</p>",
          text: "This is a test email sent from DM Dashboard.",
        }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Failed to send test email")
      } else {
        toast.success("Test email sent successfully")
        setTestEmail("")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setSending(false)
    }
  }

  if (!isAdmin) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : config ? (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <ProviderBadge provider={config.provider} configured={config.configured} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Provider</p>
              <p className="text-sm capitalize">{config.provider === "none" ? "None (console logging)" : config.provider.toUpperCase()}</p>
            </div>
            <form onSubmit={handleSendTest} className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">Send test email</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure <code className="font-mono bg-muted px-1 rounded">EMAIL_PROVIDER</code> in your environment variables to enable email delivery.
              </p>
            </form>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Could not load email configuration.</p>
        )}
      </CardContent>
    </Card>
  )
}
