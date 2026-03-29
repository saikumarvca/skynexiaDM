import { BookOpen, ExternalLink } from "lucide-react";

const sections = [
  {
    id: "overview",
    title: "Platform Overview",
    content: [
      {
        heading: "What is Skynexia DM?",
        body: `Skynexia DM is a full-featured digital marketing agency management platform. It centralises client management, content scheduling, campaign tracking, lead management, SEO monitoring, team coordination, invoicing, time tracking, and automated reporting into a single workspace.`,
      },
      {
        heading: "Navigation",
        body: `The sidebar on the left provides access to every module. Sections with sub-pages show a chevron — click to expand. The sidebar can be collapsed to icon-only mode using the toggle at the bottom. On mobile a slide-over drawer is used instead.`,
      },
    ],
  },
  {
    id: "clients",
    title: "Clients",
    content: [
      {
        heading: "Client List",
        body: `All active clients are listed at /clients. Use the search bar to filter by name, industry, or status. Archived clients are hidden by default — use the Archived tab to view them.`,
      },
      {
        heading: "Creating a Client",
        body: `Go to Clients → Add Client. Fill in the name, contact email, industry, monthly budget, and contract dates. Once saved the client appears in every module's client selector.`,
      },
      {
        heading: "Google Reviews Sync",
        body: `Under Clients → Google Reviews you can connect a Google Business Profile and pull recent reviews. Reviews are synced via the /api/cron/google-reviews cron job which runs daily. Synced reviews appear in the Reviews module for allocation.`,
      },
    ],
  },
  {
    id: "campaigns",
    title: "Campaigns",
    content: [
      {
        heading: "Campaign Management",
        body: `Campaigns track paid and organic marketing efforts per client. Each campaign has a name, platform (Google Ads, Meta, LinkedIn, etc.), status, start/end dates, and a total budget.`,
      },
      {
        heading: "Budget Pacing",
        body: `Navigate to Campaigns → Budget Pacing to see real-time spend health across all active campaigns. Daily spend entries are logged manually or can be synced from ad platforms. Alerts fire at 75%, 90%, and 100% of budget. The cron job /api/cron/check-budget-pacing runs daily at 09:00 UTC to recalculate pacing and trigger notifications.`,
      },
      {
        heading: "Spend Entries API",
        body: `POST /api/campaigns/[id]/spend to log a spend entry. GET /api/campaigns/[id]/pacing returns the current pacing status: ON_TRACK, OVER_PACING, or UNDER_PACING with percentage consumed.`,
      },
    ],
  },
  {
    id: "content",
    title: "Content & Scheduled Posts",
    content: [
      {
        heading: "Content Bank",
        body: `The content bank stores reusable copy, images, and assets for each client. Content items can be tagged and filtered by type. Use /dashboard/content to browse and /dashboard/content/new to create.`,
      },
      {
        heading: "Scheduled Posts",
        body: `Social posts can be scheduled for automatic publishing to Facebook, Instagram, LinkedIn, and Twitter/X. Create a post at /dashboard/scheduled-posts/new, pick the platform, write the copy, attach media, and set the publish time. The cron job /api/cron/scheduled-posts runs every 5 minutes and publishes any post whose scheduledAt time has passed.`,
      },
      {
        heading: "Client Approval Gate",
        body: `Toggle the "Requires Approval" flag on a scheduled post to hold it until the client approves it via the Client Portal. Posts requiring approval will not publish even when their scheduled time passes until the portal approval is granted.`,
      },
    ],
  },
  {
    id: "seo",
    title: "SEO",
    content: [
      {
        heading: "Keyword Tracking",
        body: `Add keywords per client at /dashboard/seo/new. Each keyword tracks the target URL, current rank, previous rank, and search volume. Rank history is plotted as a line chart on the keyword detail page.`,
      },
      {
        heading: "Competitor Tracking",
        body: `Add competitor domains per client at /dashboard/seo/competitors. The system tracks each competitor's rank for every keyword the client monitors and shows a side-by-side comparison table. An alert fires when a competitor overtakes the client on a monitored keyword.`,
      },
      {
        heading: "Rank Gap Analysis",
        body: `GET /api/seo/rank-gap?clientId=X returns keywords where one or more competitors rank higher than the client, sorted by rank gap size. Use this to prioritise SEO effort.`,
      },
    ],
  },
  {
    id: "leads",
    title: "Leads & CRM",
    content: [
      {
        heading: "Lead Pipeline",
        body: `Leads move through stages: NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED_WON / CLOSED_LOST. View them as a list at /dashboard/leads or switch to the Kanban Board view.`,
      },
      {
        heading: "Lead Detail & Activity Timeline",
        body: `Each lead has an activity timeline showing every interaction — calls, emails, notes, and status changes — in chronological order. Add an activity via POST /api/leads/[id]/activities with type (CALL, EMAIL, NOTE, STATUS_CHANGE) and a note.`,
      },
      {
        heading: "Pipeline Summary",
        body: `GET /api/leads/pipeline-summary returns total estimated deal value by stage, conversion rates by source, and average days in each stage. This is shown as a dashboard widget on the Leads overview.`,
      },
      {
        heading: "Lead Scoring",
        body: `Each lead has a score (0–100) calculated from source quality, days in current stage, and recency of last activity. Scores update automatically when activities are logged.`,
      },
    ],
  },
  {
    id: "tasks",
    title: "Tasks",
    content: [
      {
        heading: "Task Management",
        body: `Tasks are the internal to-do system. Each task belongs to a client and optionally links to a campaign or lead. Statuses are TODO, IN_PROGRESS, BLOCKED, and DONE. Priority levels: LOW, MEDIUM, HIGH, URGENT.`,
      },
      {
        heading: "Assignments",
        body: `Tasks can be assigned to one or more team members. Assigned team members see their tasks in the My Tasks view under Team → Assignments.`,
      },
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    content: [
      {
        heading: "Review Lifecycle",
        body: `Reviews follow a structured lifecycle: DRAFT → ALLOCATED → POSTED (or REJECTED). Writers draft responses, managers allocate them to specific platforms, and once posted the review is archived.`,
      },
      {
        heading: "Review Templates",
        body: `Create reusable response templates at /dashboard/review-templates. Templates support variable placeholders like {{clientName}} that are substituted when a draft is created.`,
      },
      {
        heading: "Review Requests",
        body: `Send automated review request emails to clients' customers from /dashboard/review-requests. Emails are sent via the configured SMTP/Resend provider.`,
      },
      {
        heading: "Review Analytics",
        body: `View aggregate stats (response rate, average sentiment, review velocity) at /dashboard/review-analytics.`,
      },
    ],
  },
  {
    id: "team",
    title: "Team",
    content: [
      {
        heading: "Members & Roles",
        body: `Add team members at /team/members. Assign roles at /team/roles — roles control which modules a member can access and whether they have admin privileges.`,
      },
      {
        heading: "Workload & Performance",
        body: `The Workload view shows open tasks and estimated hours per member. The Performance view shows completed tasks, review allocations handled, and time logged over a selected period.`,
      },
      {
        heading: "Activity Feed",
        body: `/team/activity shows a real-time audit feed of who did what across the platform, sourced from the audit log.`,
      },
    ],
  },
  {
    id: "social-analytics",
    title: "Social Analytics",
    content: [
      {
        heading: "Post Performance",
        body: `After a post is published, the platform fetches performance metrics (reach, impressions, likes, comments, shares, saves, engagement rate) 24 hours later. The cron job /api/cron/sync-post-metrics runs every 6 hours.`,
      },
      {
        heading: "Analytics Dashboard",
        body: `/dashboard/social-analytics shows engagement trends per client and per platform over a selectable date range. The best-performing posts are surfaced in a gallery sorted by engagement rate.`,
      },
      {
        heading: "Per-Post Metrics",
        body: `GET /api/scheduled-posts/[id]/metrics returns the full metrics snapshot for a single post. If no metrics exist yet the post may not have been synced — check that it has been published and the cron has run.`,
      },
    ],
  },
  {
    id: "reports",
    title: "Automated Reports",
    content: [
      {
        heading: "Report Schedules",
        body: `Create a report schedule at /dashboard/reports/new. Choose which sections to include (campaigns, leads, SEO, social, reviews), set frequency (WEEKLY, MONTHLY, or QUARTERLY), and add recipient email addresses.`,
      },
      {
        heading: "Automatic Delivery",
        body: `The cron job /api/cron/send-reports runs daily at 08:00 UTC and sends any reports whose nextSendAt time has passed. Reports are generated as branded PDFs and emailed to all recipients.`,
      },
      {
        heading: "Send Now",
        body: `To send a report immediately without waiting for the schedule, use the "Send Now" button on the report schedule detail page. This calls POST /api/report-schedules/[id]/send-now.`,
      },
    ],
  },
  {
    id: "invoices",
    title: "Invoices",
    content: [
      {
        heading: "Creating Invoices",
        body: `Create an invoice at /dashboard/invoices/new. Add line items (retainer fee, ad spend, one-off services) with quantities and unit prices. The total is calculated automatically.`,
      },
      {
        heading: "Invoice Lifecycle",
        body: `Invoices progress through: DRAFT → SENT → PAID (or OVERDUE / CANCELLED). A DRAFT invoice can be edited freely. Once sent, it is locked.`,
      },
      {
        heading: "Sending & Marking Paid",
        body: `Click "Send Invoice" to email the PDF to the client contact (POST /api/invoices/[id]/send). When payment is received, click "Mark as Paid" (POST /api/invoices/[id]/mark-paid) which records the paidAt timestamp.`,
      },
      {
        heading: "Recurring Invoices",
        body: `Set a recurrence interval on an invoice to have the system auto-generate a new DRAFT each cycle. The cron job /api/cron/invoices/generate-recurring handles this.`,
      },
    ],
  },
  {
    id: "time-tracking",
    title: "Time Tracking",
    content: [
      {
        heading: "Logging Time",
        body: `Log time at /dashboard/time-tracking/new. Select the client, optionally link to a task, enter the date, duration in minutes, and mark whether the time is billable.`,
      },
      {
        heading: "Weekly Timesheet",
        body: `The time tracking dashboard shows a weekly grid of hours per team member. Filter by client or team member using the dropdowns.`,
      },
      {
        heading: "Profitability Summary",
        body: `GET /api/time-entries/summary?clientId=X returns total hours, billable hours, non-billable hours, and estimated billable value for the selected client and date range. Use this when creating invoices to cross-reference billed vs. worked hours.`,
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    content: [
      {
        heading: "Setting Up an Integration",
        body: `Go to /dashboard/integrations/new to create an integration. Choose a type (FACEBOOK_LEAD_ADS, GOOGLE_ADS, TYPEFORM, or WEBHOOK), give it a name, and configure the field mapping that maps incoming JSON fields to Lead or Campaign model fields.`,
      },
      {
        heading: "Inbound Webhook URL",
        body: `Each integration gets a unique inbound endpoint: POST /api/integrations/[id]/ingest. Authenticate requests by passing your integration API key in the X-API-Key header. This endpoint is publicly accessible and does not require a session cookie.`,
      },
      {
        heading: "Integration Event Log",
        body: `Every inbound payload is recorded in the event log. View recent events and their processing status (RECEIVED, PROCESSED, FAILED) at GET /api/integrations/[id]/events. Use this to debug mapping errors.`,
      },
    ],
  },
  {
    id: "portal",
    title: "Client Portal",
    content: [
      {
        heading: "Portal Access",
        body: `Each client has a unique portal URL containing a signed token. Share this URL directly with the client — no login is required. The token expires after 30 days and can be regenerated from the client settings page.`,
      },
      {
        heading: "Content Approvals",
        body: `Clients can APPROVE or REQUEST_CHANGES on any scheduled post flagged as requiring approval. Approved posts proceed to publish on schedule. Posts with requested changes are held and the agency receives a notification.`,
      },
      {
        heading: "Portal Comments",
        body: `Clients and agency team members can exchange comments on content items and scheduled posts directly inside the portal, eliminating email threads.`,
      },
      {
        heading: "Monthly Summary PDF",
        body: `Clients can download a summary PDF of the current month's activity from the portal at any time via GET /api/portal/report?token=XXX.`,
      },
    ],
  },
  {
    id: "admin",
    title: "Admin (Admins Only)",
    content: [
      {
        heading: "User Management",
        body: `Admins can create, deactivate, and manage all team members at /dashboard/admin/users. Admins can also reset passwords and change roles.`,
      },
      {
        heading: "Audit Log",
        body: `/dashboard/admin/audit-log shows a full audit trail of all user actions: record created/updated/deleted events with the actor's ID, IP address, and timestamp.`,
      },
      {
        heading: "Outbound Webhooks",
        body: `/dashboard/admin/webhooks lets you configure outbound webhook URLs that receive event payloads when records change (lead created, invoice paid, post published, etc.). Each webhook has a secret for HMAC signature verification.`,
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    content: [
      {
        heading: "Account Settings",
        body: `Update your display name, email address, and password at /dashboard/settings.`,
      },
      {
        heading: "Environment Variables",
        body: `The following environment variables must be configured for full functionality:`,
      },
      {
        heading: "Required Variables",
        body: `AUTH_SECRET — random 32-byte secret for session token signing.\nMONGODB_URI — MongoDB connection string.\nCRON_SECRET — Bearer token that Vercel Cron sends in the Authorization header.\nEMAIL_PROVIDER — "resend" or "smtp" (set to "console" in development to log emails instead of sending).\nRESEND_API_KEY — required when EMAIL_PROVIDER=resend.\nSMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — required when EMAIL_PROVIDER=smtp.\nNEXT_PUBLIC_APP_URL — public base URL (e.g. https://yourdomain.com).`,
      },
    ],
  },
  {
    id: "cron",
    title: "Cron Jobs Reference",
    content: [
      {
        heading: "Scheduled Jobs",
        body: `All cron jobs require a valid Authorization: Bearer {CRON_SECRET} header. They can also be triggered manually for testing.`,
      },
      {
        heading: "Job Schedule",
        body: `/api/cron/scheduled-posts — every 5 minutes — publishes scheduled social posts.\n/api/cron/send-reports — 08:00 UTC daily — emails report schedules due today.\n/api/cron/check-budget-pacing — 09:00 UTC daily — recalculates campaign pacing and fires budget alerts.\n/api/cron/sync-post-metrics — every 6 hours — fetches post engagement metrics from social platforms.\n/api/cron/invoices/generate-recurring — daily — auto-generates recurring invoice drafts.\n/api/cron/google-reviews — daily — syncs Google Business Profile reviews.`,
      },
    ],
  },
];

export default function DocumentationPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <div className="flex items-center gap-3 border-b pb-6">
        <BookOpen className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Complete reference for the Skynexia DM platform
          </p>
        </div>
      </div>

      {/* Table of contents */}
      <div className="rounded-lg border bg-muted/40 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Contents
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-sm text-primary hover:underline"
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.id} id={section.id} className="scroll-mt-20 space-y-5">
          <h2 className="text-xl font-semibold tracking-tight border-b pb-2">
            {section.title}
          </h2>
          <div className="space-y-5">
            {section.content.map((block) => (
              <div key={block.heading}>
                <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                  {block.heading}
                </h3>
                <div className="space-y-1">
                  {block.body.split("\n").map((line, i) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-lg border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Need further help? </span>
        Contact your account administrator or open an issue in the project
        repository.
      </div>
    </div>
  );
}
