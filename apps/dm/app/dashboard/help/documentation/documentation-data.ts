import type { LucideIcon } from "lucide-react";
import {
  Users,
  Target,
  Layers,
  Search,
  TrendingUp,
  ClipboardList,
  FileText,
  Users2,
  BarChart2,
  BarChart3,
  Mail,
  DollarSign,
  Clock,
  Zap,
  Globe,
  Shield,
  Settings,
  Timer,
  GitBranch,
  LayoutDashboard,
} from "lucide-react";

/* ─────────────────────────── types ─────────────────────────── */

export type BlockType = "default" | "warning" | "info" | "code";

export interface ContentBlock {
  heading: string;
  body: string;
  type?: BlockType;
}

export type StepVariant = "neutral" | "active" | "success" | "danger" | "warn";

export interface WorkflowStep {
  label: string;
  sublabel?: string;
  variant?: StepVariant;
  terminal?: boolean;
}

export interface WorkflowPhase {
  steps: WorkflowStep[];
}

export interface Workflow {
  name: string;
  description?: string;
  phases: WorkflowPhase[];
}

export interface ScreenGuide {
  id: string;
  title: string;
  /** Omit when there is no safe static URL (e.g. dynamic client id). */
  href?: string;
  summary: string;
  keywords?: string[];
}

export interface DocSection {
  id: string;
  title: string;
  icon: LucideIcon;
  content?: ContentBlock[];
  workflows?: Workflow[];
  screenGuides?: ScreenGuide[];
}

/* ─────────────────────────── search ─────────────────────────── */

function workflowSearchText(w: Workflow): string {
  const parts = [w.name, w.description ?? ""];
  for (const ph of w.phases) {
    for (const st of ph.steps) {
      parts.push(st.label, st.sublabel ?? "");
    }
  }
  return parts.join("\n");
}

/** Lowercased blob for substring search. */
export function sectionSearchBlob(section: DocSection): string {
  const parts: string[] = [section.id, section.title];
  section.content?.forEach((b) => {
    parts.push(b.heading, b.body);
  });
  section.workflows?.forEach((w) => parts.push(workflowSearchText(w)));
  section.screenGuides?.forEach((g) => {
    parts.push(g.title, g.summary, ...(g.keywords ?? []));
  });
  return parts.join("\n").toLowerCase();
}

export function sectionMatchesQuery(section: DocSection, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return sectionSearchBlob(section).includes(q);
}

export function filterDocumentationSections(
  sections: DocSection[],
  rawQuery: string,
): DocSection[] {
  const q = rawQuery.trim();
  if (!q) return sections;
  return sections.filter((s) => sectionMatchesQuery(s, q));
}

/** Base path for documentation (index redirects to …/overview). */
export const DOCUMENTATION_BASE_PATH = "/dashboard/help/documentation" as const;

export function documentationTopicHref(topicId: string): string {
  return `${DOCUMENTATION_BASE_PATH}/${encodeURIComponent(topicId)}`;
}

/* ─────────────────────────── data ─────────────────────────── */

export const DOCUMENTATION_SECTIONS: DocSection[] = [
  /* ── 1. OVERVIEW ── */
  {
    id: "overview",
    title: "Platform Overview",
    icon: LayoutDashboard,
    screenGuides: [
      {
        id: "screen-dashboard",
        title: "Dashboard home",
        href: "/dashboard",
        summary:
          "Landing overview after sign-in. Shows today's task count, upcoming scheduled posts, outstanding invoices, recent lead activity, and quick-entry buttons for every major module.",
        keywords: ["home", "overview", "landing"],
      },
      {
        id: "screen-connect",
        title: "Connect wall",
        href: "/connect-wall",
        summary:
          "Team communication wall: post updates, reply to threads, and stay aligned without leaving the app. Threads are global across the workspace.",
        keywords: ["chat", "messages", "wall", "team", "communication"],
      },
      {
        id: "screen-notifications",
        title: "Notifications",
        href: "/dashboard/notifications",
        summary:
          "Central list of alerts and system notices. Badge count shows unread items. Open an item to jump to the related record when applicable. Notification types include: budget alerts, lead follow-up reminders, portal approval actions, cron errors, and review assignments.",
        keywords: ["alerts", "bell", "badge"],
      },
      {
        id: "screen-help-docs",
        title: "Help — Documentation",
        href: "/dashboard/help/documentation/overview",
        summary:
          "This page. Browse topics using the sidebar, use the search box to filter by keyword, and click Screen guide links to open the matching app screen. On mobile, tap the menu icon to open the topic drawer.",
        keywords: ["help", "docs", "guide"],
      },
    ],
    content: [
      {
        heading: "What is Skynexia DM?",
        body: "Skynexia DM is a full-featured digital marketing agency management platform. It centralises client management, content scheduling, campaign tracking, lead management, SEO monitoring, team coordination, invoicing, time tracking, and automated reporting into a single workspace designed for marketing agencies.",
      },
      {
        heading: "Navigation structure",
        body: "The sidebar on the left provides access to every module. Sections with sub-pages show a chevron — click to expand or hover to see a flyout in collapsed mode. The sidebar can be collapsed to icon-only mode using the toggle at the bottom. On mobile, a slide-over drawer is used instead.",
        type: "info",
      },
      {
        heading: "Access roles",
        body: "Every user is either a standard team member or an admin. Admins see the Admin section in the sidebar and can manage users, view the full audit log, and configure outbound webhooks. All other modules are available to both roles, but some destructive actions (deleting clients, voiding invoices) may be restricted to admins depending on your workspace configuration.",
      },
      {
        heading: "Session & authentication",
        body: "Sessions are issued as signed HTTP-only cookies on login. Each session is valid for 7 days and is automatically renewed on activity. If you are logged out unexpectedly, your session has expired or the AUTH_SECRET environment variable changed — sign in again.",
        type: "info",
      },
      {
        heading: "Notification types",
        body: "The platform emits in-app notifications for: budget alert thresholds reached, invoice overdue, lead follow-up due, portal approval request received, scheduled post publish failure, review allocated, and cron job errors. Notifications are accessible from the bell icon at the top of the sidebar.",
      },
      {
        heading: "Keyboard shortcuts",
        body: "The documentation search box responds to the Enter key — press Enter to jump to the first matching topic. All sidebar links are keyboard-navigable using Tab and Enter. Screen guide 'Open in app' links open in the same tab.",
      },
      {
        heading: "Dark mode",
        body: "All components use Tailwind's dark: variant. Toggle dark mode from the Settings page or your system preference — the app respects the prefers-color-scheme media query automatically.",
      },
    ],
  },

  /* ── 2. CLIENTS ── */
  {
    id: "clients",
    title: "Clients",
    icon: Users,
    screenGuides: [
      {
        id: "clients-all",
        title: "All Clients",
        href: "/clients",
        summary:
          "Directory of clients. Search by name, industry, or status. Click a row to open that client's workspace. Use the top-right archive toggle to include inactive accounts.",
      },
      {
        id: "clients-new",
        title: "Add Client",
        href: "/clients/new",
        summary:
          "Create a client record: company name, primary contact email and phone, industry, monthly retainer budget, contract start/end dates, and optional notes. Once saved the client appears in every module's client selector.",
      },
      {
        id: "clients-archived",
        title: "Archived clients",
        href: "/clients?archived=1",
        summary:
          "View clients marked as archived. Archived clients are hidden from all active selectors but their historical data (campaigns, leads, invoices) remains intact for reporting.",
        keywords: ["archive", "inactive"],
      },
      {
        id: "clients-google-reviews",
        title: "Google Reviews (sync)",
        href: "/dashboard/google-reviews",
        summary:
          "Connect Google Business profiles to a client and pull recent reviews on demand or via the daily cron. Synced reviews appear in the Reviews module queue ready for draft allocation.",
        keywords: ["GBP", "sync", "google", "business"],
      },
      {
        id: "clients-hub-overview",
        title: "Client workspace — profile",
        summary:
          "From All Clients, open any client row. Path pattern: /clients/[clientId]. Manage core profile fields, regenerate portal token, view contract summary, and navigate to each module tab filtered to this client.",
        keywords: ["detail", "account", "profile"],
      },
      {
        id: "clients-hub-campaigns",
        title: "Client workspace — Campaigns tab",
        summary:
          "Campaign list filtered to the client. Add, edit, or open campaigns from here. Path: /clients/[clientId]/campaigns",
      },
      {
        id: "clients-hub-content",
        title: "Client workspace — Content tab",
        summary:
          "Content bank items and scheduled posts for this client. Create new items from here without navigating away. Path: /clients/[clientId]/content",
      },
      {
        id: "clients-hub-seo",
        title: "Client workspace — SEO tab",
        summary:
          "Keyword list and competitors for this client. Adds new keywords pre-filled with the client. Path: /clients/[clientId]/seo",
      },
      {
        id: "clients-hub-leads",
        title: "Client workspace — Leads tab",
        summary:
          "CRM slice filtered to this client. View pipeline stage distribution and add leads with the client pre-selected. Path: /clients/[clientId]/leads",
      },
      {
        id: "clients-hub-reviews",
        title: "Client workspace — Reviews tab",
        summary:
          "Review response activity for the client: drafts, allocations, and posted count. Path: /clients/[clientId]/reviews",
      },
      {
        id: "clients-hub-files",
        title: "Client workspace — Files",
        summary:
          "Upload and organise attachments for the client (briefs, brand assets, approvals). Files are stored per-client and are not exposed in the portal by default. Path: /clients/[clientId]/files",
      },
      {
        id: "clients-hub-tasks",
        title: "Client workspace — Tasks",
        summary:
          "Task list scoped to the client. Quickly add tasks without leaving the client context. Path: /clients/[clientId]/tasks",
      },
      {
        id: "clients-hub-edit",
        title: "Edit client",
        summary:
          "Update any client field. Changes take effect immediately across all modules. Path: /clients/[clientId]/edit",
      },
    ],
    content: [
      {
        heading: "Client list",
        body: "All active clients are listed at /clients. Use the search bar to filter by name, industry, or status. Archived clients are hidden by default — toggle the filter to view them. Clicking a client row opens their workspace.",
      },
      {
        heading: "Creating a client",
        body: "Go to Clients → Add Client. Required fields: company name and primary contact email. Optional but recommended: industry, monthly retainer budget (used in profitability calculations), and contract start/end dates (used by automated report date ranges). Once saved, the client appears in every module's client selector.",
      },
      {
        heading: "Client workspace tabs",
        body: "Each client has a dedicated workspace with tabs for Campaigns, Content, SEO, Leads, Reviews, Tasks, and Files. All data in these tabs is scoped to the selected client — changes here affect the same records visible in the global module views.",
      },
      {
        heading: "Portal token",
        body: "Every client has a unique signed portal URL. The token is generated on client creation and can be regenerated from the client profile page. Share the URL directly with your client contact. The token expires after 30 days of inactivity — regenerate if the client loses access.",
        type: "warning",
      },
      {
        heading: "Archiving a client",
        body: "Archiving hides the client from all active views, selectors, and cron jobs (e.g., scheduled posts for an archived client will not publish). All historical data is preserved. Unarchive at any time from the Archived Clients view.",
      },
      {
        heading: "Google Reviews sync",
        body: "Navigate to Clients → Google Reviews to connect a Google Business Profile. The /api/cron/google-reviews cron runs daily and fetches new reviews. Synced reviews feed directly into the Reviews module for drafting and allocation.",
        type: "info",
      },
      {
        heading: "Client API",
        body: "GET /api/clients — list all clients (paginated).\nGET /api/clients/[id] — single client detail.\nPATCH /api/clients/[id] — update fields.\nDELETE /api/clients/[id] — archive (soft delete).",
        type: "code",
      },
    ],
  },

  /* ── 3. CAMPAIGNS ── */
  {
    id: "campaigns",
    title: "Campaigns",
    icon: Target,
    screenGuides: [
      {
        id: "camp-all",
        title: "All Campaigns",
        href: "/dashboard/campaigns",
        summary:
          "List and filter campaigns by client, platform, status, and date range. Open a campaign to edit spend entries, dates, and platform details. Active campaigns show a live pacing badge.",
      },
      {
        id: "camp-new",
        title: "New Campaign",
        href: "/dashboard/campaigns/new",
        summary:
          "Create a campaign: pick client, platform (Google Ads, Meta, LinkedIn, Twitter, TikTok, or Other), budget window, total and daily budget targets. It appears in Budget Pacing immediately when status is set to ACTIVE.",
      },
      {
        id: "camp-pacing",
        title: "Budget Pacing",
        href: "/dashboard/budget-pacing",
        summary:
          "Health view showing spend vs budget across all active campaigns. Campaigns display a coloured pacing badge: green (on track), amber (over/under-pacing), red (critical). Filter by client to focus on one account.",
      },
      {
        id: "camp-archived",
        title: "Archived campaigns",
        href: "/dashboard/campaigns?archived=1",
        summary:
          "Historical campaigns removed from the default list but kept for reporting. Archived campaigns do not appear in Budget Pacing or analytics selectors.",
      },
    ],
    content: [
      {
        heading: "Campaign model",
        body: "Each campaign belongs to a client and tracks: name, platform, status (DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED), start and end dates, total budget, optional daily budget, and a platform campaign ID for external reference.",
      },
      {
        heading: "Platform types",
        body: "Supported platforms: GOOGLE_ADS, META (Facebook/Instagram), LINKEDIN, TWITTER, TIKTOK, EMAIL, SEO, and OTHER. The platform field is used for grouping in the Analytics hub and Budget Pacing view.",
      },
      {
        heading: "Budget Pacing",
        body: "Navigate to Campaigns → Budget Pacing to see real-time spend health. Daily spend entries are logged manually (see API below) or pulled from connected ad platforms via integrations. Pacing alerts fire at 75%, 90%, and 100% of budget thresholds. The cron /api/cron/check-budget-pacing runs daily at 09:00 UTC to recalculate all active campaigns and fire notification records.",
      },
      {
        heading: "Pacing states",
        body: "ON_TRACK — spend is within ±10% of the expected daily run rate.\nOVER_PACING — spend is more than 10% above the expected run rate (risk of exhausting budget early).\nUNDER_PACING — spend is more than 10% below expected run rate (risk of under-delivering).\nCRITICAL — over 90% of total budget consumed.",
        type: "info",
      },
      {
        heading: "Budget alert thresholds",
        body: "Three alert levels are tracked per campaign: WARN_75 (75% consumed), WARN_90 (90% consumed), and EXHAUSTED (100% consumed). Each threshold fires once per campaign per budget cycle. Alerts appear in the Notifications panel and are stored in BudgetAlert records that can be acknowledged.",
      },
      {
        heading: "Spend entry API",
        body: "POST /api/campaigns/[id]/spend\nBody: { date, amount, notes? }\n\nGET /api/campaigns/[id]/pacing\nReturns: { status, percentConsumed, projectedEndDate, totalBudget, totalSpent, dailyBudget, avgDailySpend }",
        type: "code",
      },
      {
        heading: "Budget alerts API",
        body: "GET /api/budget-alerts — list unacknowledged alerts.\nPOST /api/budget-alerts/[id]/acknowledge — mark an alert as seen.",
        type: "code",
      },
      {
        heading: "Archiving a campaign",
        body: "Archived campaigns are excluded from Budget Pacing, cron calculations, and new spend entry forms. Campaign history and spend data remain available in reports.",
      },
    ],
    workflows: [
      {
        name: "Campaign Budget Lifecycle",
        description: "How a campaign's budget state progresses as spend is logged.",
        phases: [
          { steps: [{ label: "ACTIVE", variant: "active", sublabel: "Budget tracking begins" }] },
          {
            steps: [
              { label: "ON TRACK", variant: "success", sublabel: "Within run rate ±10%" },
              { label: "OVER PACING", variant: "warn", sublabel: ">10% above run rate" },
              { label: "UNDER PACING", variant: "neutral", sublabel: ">10% below run rate" },
            ],
          },
          {
            steps: [
              { label: "WARN 75%", variant: "warn", sublabel: "Alert fired" },
            ],
          },
          {
            steps: [
              { label: "WARN 90%", variant: "warn", sublabel: "Alert fired" },
            ],
          },
          {
            steps: [
              { label: "EXHAUSTED", variant: "danger", terminal: true, sublabel: "100% consumed" },
              { label: "COMPLETED", variant: "success", terminal: true, sublabel: "End date reached" },
            ],
          },
        ],
      },
    ],
  },

  /* ── 4. CONTENT & SCHEDULED POSTS ── */
  {
    id: "content",
    title: "Content & Scheduled Posts",
    icon: Layers,
    screenGuides: [
      {
        id: "content-bank",
        title: "Content Bank",
        href: "/dashboard/content",
        summary:
          "Browse reusable assets and copy per client. Filter by type (copy, image, video, carousel) or tags. Open items to edit or attach to a new scheduled post.",
      },
      {
        id: "content-new",
        title: "New Content",
        href: "/dashboard/content/new",
        summary:
          "Create a library item: attach client, content type, body text, media URL, and searchable tags for later scheduling.",
      },
      {
        id: "content-scheduled",
        title: "Scheduled Posts",
        href: "/dashboard/scheduled-posts",
        summary:
          "List of upcoming and past posts sorted by scheduledAt. Shows status badge, approval flag, platform, and client. Use filters to narrow by status or client.",
      },
      {
        id: "content-scheduled-new",
        title: "New Scheduled Post",
        href: "/dashboard/scheduled-posts/new",
        summary:
          "Compose a post: select platform and client, write copy, attach media URL, set schedule time, and optionally enable client approval gate.",
      },
      {
        id: "content-scheduled-edit",
        title: "Edit scheduled post",
        summary:
          "From Scheduled Posts, open any pending post to change copy, media, or publish time. Posts with status PUBLISHED or FAILED cannot be edited. Path: /dashboard/scheduled-posts/[postId]/edit",
      },
    ],
    content: [
      {
        heading: "Content Bank",
        body: "The content bank stores reusable copy, images, and asset references for each client. Content items are not scheduled directly — they serve as a library you pull from when composing scheduled posts. Filter by client, type, or tags from the main content list.",
      },
      {
        heading: "Scheduled Posts",
        body: "Social posts are composed, assigned to a platform, and scheduled for automatic publishing. Supported platforms: Facebook, Instagram, LinkedIn, Twitter/X. Set the scheduledAt timestamp and the cron job handles the rest — no manual publishing required.",
      },
      {
        heading: "Auto-publish cron",
        body: "The cron job POST /api/cron/scheduled-posts runs every 5 minutes. It queries for posts where scheduledAt ≤ now and status = PENDING and requiresApproval is false (or approval status is APPROVED). It calls the platform API for each post and sets status to PUBLISHED or FAILED accordingly.",
        type: "info",
      },
      {
        heading: "Post statuses",
        body: "DRAFT — saved but not yet scheduled.\nPENDING — scheduled and awaiting publish time.\nAWAITING_APPROVAL — scheduled time has passed but client approval is still pending.\nPUBLISHED — successfully published to the platform.\nFAILED — platform API returned an error (see error field in post record).\nCANCELLED — manually cancelled before publish.",
      },
      {
        heading: "Client Approval Gate",
        body: "Toggle 'Requires Approval' on a scheduled post to hold it in AWAITING_APPROVAL status until the client acts on it via the Client Portal. Even if the scheduled time has passed, the cron will not publish until the portal approval record shows APPROVED.",
        type: "warning",
      },
      {
        heading: "Platform character limits",
        body: "Twitter/X: 280 characters.\nLinkedIn: 3,000 characters (personal), 700 characters (company page).\nFacebook: 63,206 characters (practical limit ≈ 500 for engagement).\nInstagram: 2,200 characters (caption); hashtags count toward the limit.",
        type: "info",
      },
      {
        heading: "Media attachments",
        body: "Media is referenced by URL (not uploaded to the app). Store media in your CDN or cloud storage and paste the URL into the media field. The platform API uses the URL directly. Instagram and Facebook require images to be publicly accessible — password-protected or intranet URLs will fail.",
        type: "warning",
      },
      {
        heading: "Scheduled Posts API",
        body: "GET /api/scheduled-posts — list all posts (filters: clientId, platform, status).\nPOST /api/scheduled-posts — create a post.\nPATCH /api/scheduled-posts/[id] — update copy, time, or approval flag.\nDELETE /api/scheduled-posts/[id] — cancel/delete a post.",
        type: "code",
      },
    ],
  },

  /* ── 5. SEO ── */
  {
    id: "seo",
    title: "SEO",
    icon: Search,
    screenGuides: [
      {
        id: "seo-keywords",
        title: "Keywords",
        href: "/dashboard/seo",
        summary:
          "Table of tracked keywords per client showing current rank, previous rank, rank change delta, and search volume. Rank direction arrows indicate improvement or decline. Click a keyword for full history chart.",
      },
      {
        id: "seo-new",
        title: "Add Keyword",
        href: "/dashboard/seo/new",
        summary:
          "Register a keyword to track: term, target URL, client, search volume estimate, and keyword difficulty. Once added, rank history begins accumulating on the next cron run.",
      },
      {
        id: "seo-competitors",
        title: "Competitors",
        href: "/dashboard/seo/competitors",
        summary:
          "Add and manage competitor domains per client. The competitor tracking view shows a side-by-side rank table: your client vs each competitor for every monitored keyword. Alerts fire when a competitor overtakes the client.",
      },
    ],
    content: [
      {
        heading: "Keyword tracking",
        body: "Add keywords per client at /dashboard/seo/new. Each keyword tracks: the search term, target URL (the page you want to rank), current rank, previous rank, and search volume estimate. Rank history is stored per-check and plotted as a line chart on the keyword detail page.",
      },
      {
        heading: "Rank history",
        body: "Ranks are recorded each time the cron runs a check. The history chart shows up to 90 days of data points. Rank improvements (lower number) are shown as green, declines as red. If rank data is missing for a period, the cron may not have run or the keyword was added after that date.",
        type: "info",
      },
      {
        heading: "Competitor tracking",
        body: "Add competitor domains at /dashboard/seo/competitors. For each client you can track up to 10 competitor domains. The platform records competitor ranks for every keyword the client monitors. The comparison table shows client rank vs each competitor rank per keyword with a delta column.",
      },
      {
        heading: "Competitor overtake alerts",
        body: "When a competitor's rank improves past the client's rank for a monitored keyword, an alert notification is generated. The alert includes the keyword, the previous gap, and the new positions. Alerts appear in the main Notifications panel.",
        type: "warning",
      },
      {
        heading: "Rank Gap Analysis",
        body: "The rank gap endpoint returns keywords where one or more competitors currently outrank the client, sorted by gap size (largest gap first). Use this to prioritise content and link-building effort.",
      },
      {
        heading: "SEO API",
        body: "GET /api/seo/rank-gap?clientId=X — keywords where competitors outrank client.\nGET /api/competitors?clientId=X — list competitors for a client.\nPOST /api/competitors — add a competitor domain.\nGET /api/competitors/[id]/keyword-ranks — historical rank data for the competitor.",
        type: "code",
      },
      {
        heading: "Keyword difficulty",
        body: "Keyword difficulty (0–100) is an optional field you populate manually based on your SEO tool of choice (Ahrefs, Semrush, Moz, etc.). The platform stores and displays it but does not calculate it automatically.",
      },
    ],
  },

  /* ── 6. LEADS & CRM ── */
  {
    id: "leads",
    title: "Leads & CRM",
    icon: TrendingUp,
    screenGuides: [
      {
        id: "leads-all",
        title: "All Leads",
        href: "/dashboard/leads",
        summary:
          "Sortable list view with stage, owner, score, estimated value, and next follow-up date. Click a lead to open the detail page with activity timeline and CRM fields.",
      },
      {
        id: "leads-kanban",
        title: "Kanban Board",
        href: "/dashboard/leads?view=kanban",
        summary:
          "Drag-and-drop pipeline: cards arranged in columns by stage. Dragging a card updates its stage instantly. Card shows lead name, client, score badge, and estimated value.",
        keywords: ["board", "pipeline", "drag"],
      },
      {
        id: "leads-new",
        title: "Add Lead",
        href: "/dashboard/leads/new",
        summary:
          "Manually create a lead: name, company, contact email, phone, source, assigned owner, estimated value, and initial stage. Leads arriving via integrations are created automatically.",
      },
    ],
    content: [
      {
        heading: "Lead stages",
        body: "NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED_WON / CLOSED_LOST. Stage changes are logged automatically as STATUS_CHANGE entries in the activity timeline. You can also set lostReason when moving a lead to CLOSED_LOST.",
      },
      {
        heading: "Activity timeline",
        body: "Every lead maintains a chronological timeline of interactions. Activity types: CALL, EMAIL, NOTE, MEETING, STATUS_CHANGE, TASK_LINKED. Add a manual entry from the lead detail page. Each entry stores the type, a free-text note, the actor's user ID, and a timestamp.",
      },
      {
        heading: "Adding activities",
        body: "POST /api/leads/[id]/activities\nBody: { type: 'CALL' | 'EMAIL' | 'NOTE' | 'MEETING' | 'STATUS_CHANGE', note, metadata? }\nReturns the created activity and the updated lead record.",
        type: "code",
      },
      {
        heading: "Lead scoring",
        body: "Each lead has a score (0–100) recalculated whenever an activity is logged. The score is based on three signals: source quality (REFERRAL = high, COLD_OUTREACH = low), days in current stage (penalty for stale leads), and activity recency (bonus for recent contact). Scores display as a coloured badge: green (70+), amber (40–69), red (<40).",
      },
      {
        heading: "Assigned owner",
        body: "Each lead can be assigned to a team member (assignedTo). The owner is responsible for follow-ups and moving the lead forward. Filter the leads list by assignee to see a personal pipeline view.",
      },
      {
        heading: "Next follow-up",
        body: "Set nextFollowUpAt on a lead to schedule a reminder. A notification is generated on the follow-up date and assigned to the lead owner. Leads with overdue follow-ups are highlighted in the list view.",
        type: "info",
      },
      {
        heading: "Estimated deal value",
        body: "Populate estimatedValue (currency number) on each lead to enable weighted pipeline metrics. The pipeline summary weights each lead's value by a stage probability factor (NEW=5%, CONTACTED=15%, QUALIFIED=30%, PROPOSAL=60%, NEGOTIATION=80%, CLOSED_WON=100%).",
      },
      {
        heading: "Pipeline Summary API",
        body: "GET /api/leads/pipeline-summary\nQuery params: clientId (optional), ownerId (optional), dateFrom, dateTo.\nReturns: totalByStage, weightedValue, conversionRateBySource, avgDaysInStage.",
        type: "code",
      },
      {
        heading: "Auto-import via integrations",
        body: "Leads can be automatically created from inbound integrations (Facebook Lead Ads, Typeform, generic webhooks). Configure field mapping in the Integrations module — the integration event processor creates a Lead record using the mapped fields.",
        type: "info",
      },
    ],
    workflows: [
      {
        name: "Lead Pipeline",
        description: "Stages a prospect moves through in the CRM from first contact to close.",
        phases: [
          { steps: [{ label: "NEW", variant: "neutral", sublabel: "Uncontacted" }] },
          { steps: [{ label: "CONTACTED", variant: "active", sublabel: "First touch made" }] },
          { steps: [{ label: "QUALIFIED", variant: "active", sublabel: "Fit confirmed" }] },
          { steps: [{ label: "PROPOSAL", variant: "active", sublabel: "Proposal sent" }] },
          { steps: [{ label: "NEGOTIATION", variant: "warn", sublabel: "Terms in discussion" }] },
          {
            steps: [
              { label: "CLOSED WON", variant: "success", terminal: true, sublabel: "Deal signed" },
              { label: "CLOSED LOST", variant: "danger", terminal: true, sublabel: "Lost / no decision" },
            ],
          },
        ],
      },
    ],
  },

  /* ── 7. TASKS ── */
  {
    id: "tasks",
    title: "Tasks",
    icon: ClipboardList,
    screenGuides: [
      {
        id: "tasks-all",
        title: "All Tasks",
        href: "/dashboard/tasks",
        summary:
          "Filter by status, assignee, client, priority, and due date. Overdue tasks are highlighted. Click a task to open its detail — update status, add notes, or reassign.",
      },
      {
        id: "tasks-new",
        title: "New Task",
        href: "/dashboard/tasks/new",
        summary:
          "Create a task: title, description, client, priority, due date, linked campaign or lead (optional), and one or more assignees.",
      },
    ],
    content: [
      {
        heading: "Task model",
        body: "Each task has: title, description, client (required), priority (LOW, MEDIUM, HIGH, URGENT), status (TODO, IN_PROGRESS, BLOCKED, DONE), due date, optional campaign link, optional lead link, and one or more assignees (team member IDs).",
      },
      {
        heading: "Status flow",
        body: "Tasks start at TODO. Move to IN_PROGRESS when work begins. Mark BLOCKED if you are waiting on an external dependency (add a note explaining what's blocked). Set DONE when complete. There is no hard enforcement — statuses are informational, but overdue TODO/IN_PROGRESS tasks are visually flagged.",
      },
      {
        heading: "Priority levels",
        body: "LOW — no urgency, can slip.\nMEDIUM — default, needs to be done this week.\nHIGH — impacts a client deliverable, prioritise.\nURGENT — drop everything, must be done today.\nPriority colours appear on task cards and in the team Workload view.",
        type: "info",
      },
      {
        heading: "Assignments",
        body: "Tasks can have multiple assignees. Each assigned team member sees the task in their personal My Tasks list under Team → Assignments. When a task is completed, all assignees receive a notification.",
      },
      {
        heading: "Linking to campaigns and leads",
        body: "Linking a task to a campaign or lead creates a cross-reference visible from both the task detail and the campaign/lead detail pages. Time logged against a task also appears on the linked client's time tracking summary.",
      },
      {
        heading: "Tasks API",
        body: "GET /api/tasks — list tasks (filters: clientId, assigneeId, status, priority).\nPOST /api/tasks — create a task.\nPATCH /api/tasks/[id] — update status, priority, or assignees.\nDELETE /api/tasks/[id] — delete a task (soft delete).",
        type: "code",
      },
      {
        heading: "Overdue tasks",
        body: "Tasks with a due date in the past and status not DONE are considered overdue. They are highlighted in red in the task list and appear in the team Workload view under the member they are assigned to. No automatic notification is currently sent for overdue tasks — this is a manual review step.",
        type: "warning",
      },
    ],
  },

  /* ── 8. REVIEWS ── */
  {
    id: "reviews",
    title: "Reviews",
    icon: FileText,
    screenGuides: [
      {
        id: "rev-overview",
        title: "Reviews overview",
        href: "/dashboard/reviews",
        summary:
          "Entry point for review response workflows: total counts by status, recent synced reviews, filters by client and platform, and navigation into drafts and allocations.",
      },
      {
        id: "rev-drafts",
        title: "Review Drafts",
        href: "/dashboard/review-drafts",
        summary:
          "Write and edit draft responses before they are allocated. Apply a template, customise, and save. Drafts in this view have not yet been assigned to a platform for posting.",
      },
      {
        id: "rev-allocations",
        title: "Review Allocations",
        href: "/dashboard/review-allocations",
        summary:
          "Managers assign approved drafts to team members for posting to the client's platform account. Each allocation records the assignee, target platform, and deadline.",
      },
      {
        id: "rev-my",
        title: "My Assigned Reviews",
        href: "/dashboard/my-assigned-reviews",
        summary:
          "Writer-centric inbox showing reviews currently allocated to the signed-in user. Complete drafts or mark as posted from here.",
      },
      {
        id: "rev-used",
        title: "Used Reviews",
        href: "/dashboard/used-reviews",
        summary:
          "Archive of responses that have been marked as posted. Useful for tone reference, compliance checks, and reporting on volume.",
      },
      {
        id: "rev-analytics",
        title: "Review Analytics",
        href: "/dashboard/review-analytics",
        summary:
          "Aggregate stats: total reviews by client, response rate (drafted / total synced), average sentiment score, and review velocity (reviews per week) over a selectable period.",
      },
      {
        id: "rev-templates",
        title: "Review templates",
        href: "/dashboard/review-templates",
        summary:
          "Maintain reusable snippets with variable placeholders. Edit individual templates at /dashboard/review-templates/[templateId]/edit.",
      },
      {
        id: "rev-requests",
        title: "Review Requests",
        href: "/dashboard/review-requests",
        summary:
          "Configure and send campaigns asking customers to leave a review. Emails sent via the configured provider (Resend or SMTP).",
      },
    ],
    content: [
      {
        heading: "Review lifecycle",
        body: "Reviews follow a structured path: DRAFT (writer creates a response draft) → ALLOCATED (manager assigns it to a team member to post on a specific platform) → POSTED (team member has published the response on the platform). At any stage a review can be REJECTED and returned for revision.",
      },
      {
        heading: "Syncing reviews",
        body: "Reviews are synced from Google Business Profile via the /api/cron/google-reviews cron job (daily) or triggered manually from Clients → Google Reviews. Synced reviews appear in the Reviews overview queue with status UNRESPONDED.",
        type: "info",
      },
      {
        heading: "Draft responses",
        body: "From the Reviews overview, click a synced review to open the draft editor. Apply a template as a starting point, then customise the response. Save as draft — it appears in Review Drafts for manager review and allocation.",
      },
      {
        heading: "Templates & placeholders",
        body: "Review response templates support variable placeholders: {{clientName}}, {{reviewerName}}, {{rating}}, {{date}}. These are substituted automatically when a draft is created from a template. Create and manage templates at /dashboard/review-templates.",
      },
      {
        heading: "Allocation workflow",
        body: "A manager opens Review Allocations and assigns draft responses to the team member responsible for posting. The assignee sees the task in My Assigned Reviews. After posting on the platform, they mark it as POSTED in the app.",
      },
      {
        heading: "Review Requests",
        body: "Use /dashboard/review-requests to send emails asking clients' customers to leave a Google or platform review. Configure the recipient list, email template, and send via the configured email provider. Sent requests are logged with timestamps.",
      },
      {
        heading: "Review analytics metrics",
        body: "Response rate: number of drafts created / total reviews synced in the period.\nVelocity: average reviews synced per week.\nSentiment: star rating distribution (1–5 stars).\nTime to respond: average days from review sync to POSTED status.",
      },
    ],
    workflows: [
      {
        name: "Review Response Lifecycle",
        description: "How a review moves from sync through to a published response.",
        phases: [
          { steps: [{ label: "SYNCED", variant: "neutral", sublabel: "Pulled from Google / platform" }] },
          { steps: [{ label: "DRAFT", variant: "active", sublabel: "Writer creates response" }] },
          { steps: [{ label: "ALLOCATED", variant: "active", sublabel: "Assigned for posting" }] },
          {
            steps: [
              { label: "POSTED", variant: "success", terminal: true, sublabel: "Published on platform" },
              { label: "REJECTED", variant: "danger", terminal: true, sublabel: "Returned for revision" },
            ],
          },
        ],
      },
    ],
  },

  /* ── 9. TEAM ── */
  {
    id: "team",
    title: "Team",
    icon: Users2,
    screenGuides: [
      {
        id: "team-overview",
        title: "Team overview",
        href: "/team",
        summary:
          "Summary of team structure with member count, role distribution, and quick links into members, roles, workload, and performance views.",
      },
      {
        id: "team-users",
        title: "Users",
        href: "/team/members",
        summary:
          "Directory of all team members. Add a new member at /team/members/new. Click a row to view profile, assigned tasks, and role. Deactivating a member revokes their session and login.",
      },
      {
        id: "team-roles",
        title: "Roles",
        href: "/team/roles",
        summary:
          "Define permission bundles. Standard roles: Viewer (read-only), Editor (read + write), Manager (all except admin). Create custom roles at /team/roles/new.",
      },
      {
        id: "team-assignments",
        title: "Assignments",
        href: "/team/assignments",
        summary:
          "Cross-team view of open task assignments. Managers can reassign tasks from here or view workload before making new assignments.",
      },
      {
        id: "team-performance",
        title: "Performance",
        href: "/team/performance",
        summary:
          "Per-member output over a selectable date range: tasks completed, reviews handled, time entries logged, and campaigns contributed to.",
      },
      {
        id: "team-workload",
        title: "Workload",
        href: "/team/workload",
        summary:
          "Live balance of open (non-DONE) tasks per member. Use this before assigning new work to identify team members with capacity.",
      },
      {
        id: "team-activity",
        title: "Activity",
        href: "/team/activity",
        summary:
          "Recent platform actions by all team members, sourced from the audit log. Useful for accountability and troubleshooting unexpected data changes.",
      },
      {
        id: "team-review-assignments",
        title: "Review Assignments",
        href: "/team/review-assignments",
        summary:
          "Operational view of which writers own which review response allocations and their current status.",
      },
    ],
    content: [
      {
        heading: "Members & roles",
        body: "Add team members at /team/members. Assign a role at /team/roles — roles define which modules a member can access (read, write, or no access) and whether they hold admin privileges. Deactivating a member revokes their login immediately.",
      },
      {
        heading: "Role permissions",
        body: "ADMIN — full access including Admin section, user management, audit log, and webhooks.\nMANAGER — full read/write on all client modules; no Admin section access.\nEDITOR — read/write on assigned modules; cannot manage team members or invoices.\nVIEWER — read-only access across the platform.\nCustom roles can be created with granular per-module toggles.",
        type: "info",
      },
      {
        heading: "Workload calculation",
        body: "Workload is calculated as the number of open tasks (status ≠ DONE) assigned to each team member. The workload view optionally weights tasks by priority: URGENT counts as 4, HIGH as 3, MEDIUM as 2, LOW as 1. Use this to balance the team before assigning high-priority work.",
      },
      {
        heading: "Performance metrics",
        body: "Performance tracks: tasks completed, review allocations completed, time entries logged (hours), invoices created, campaigns managed, and leads closed. Select a date range and optionally filter by team member from the performance page.",
      },
      {
        heading: "Activity feed",
        body: "/team/activity shows a paginated audit log feed: who performed what action, on which record, at what time. Use it to diagnose unexpected changes or verify that a team member completed a task. Activity feed is also accessible to admins in more detail at /dashboard/admin/audit-log.",
      },
      {
        heading: "Team API",
        body: "GET /api/team/members — list all members.\nPOST /api/team/members — invite a new member.\nPATCH /api/team/members/[id] — update profile or role.\nDELETE /api/team/members/[id] — deactivate a member.",
        type: "code",
      },
    ],
  },

  /* ── 10. ANALYTICS HUB ── */
  {
    id: "analytics-hub",
    title: "Analytics Hub",
    icon: BarChart3,
    content: [
      {
        heading: "What the analytics hub is",
        body: "The Analytics section in the sidebar groups shortcuts to the same metrics available in their home modules. Use it for a consolidated reporting pass without navigating through each module separately.",
        type: "info",
      },
      {
        heading: "Overview dashboard",
        body: "The Analytics Overview at /dashboard/analytics shows high-level KPIs: total active clients, MRR (from paid invoices this month), open leads value, campaigns in flight, posts published this month, tasks completed this week, and hours logged. All numbers are clickable links to the relevant module.",
      },
      {
        heading: "Social analytics shortcut",
        body: "Opens /dashboard/social-analytics — same data as the Social Analytics section, accessed via the analytics hub for convenience.",
      },
      {
        heading: "Review analytics shortcut",
        body: "Opens /dashboard/review-analytics — response rate, sentiment, and velocity charts.",
      },
      {
        heading: "Budget & pacing shortcut",
        body: "Opens /dashboard/budget-pacing — campaign spend health across all active campaigns.",
      },
      {
        heading: "Pipeline shortcut",
        body: "Opens /dashboard/leads with the kanban view active. The pipeline summary widget shows total value by stage and weighted forecast.",
      },
      {
        heading: "SEO shortcut",
        body: "Opens /dashboard/seo — keyword rank table for quick review of position changes.",
      },
      {
        heading: "Team performance shortcut",
        body: "Opens /team/performance — output summary for the current month per team member.",
      },
      {
        heading: "Time tracking shortcut",
        body: "Opens /dashboard/time-tracking — billable vs non-billable hours. Useful for cross-referencing time worked against invoices sent.",
      },
      {
        heading: "Date ranges",
        body: "Date range pickers on individual analytics screens default to the current calendar month. Some screens support custom ranges. Changing the date range on one screen does not persist to other screens — each module maintains its own filter state.",
        type: "warning",
      },
    ],
    screenGuides: [
      {
        id: "ana-overview",
        title: "Analytics — Overview",
        href: "/dashboard/analytics",
        summary:
          "High-level KPIs and summary charts: MRR, open lead pipeline value, active campaigns, posts published, tasks completed.",
      },
      {
        id: "ana-social",
        title: "Analytics — Social",
        href: "/dashboard/social-analytics",
        summary:
          "Engagement trends, per-platform breakdowns, and top posts. Same as Social Analytics topic, accessible from the hub.",
      },
      {
        id: "ana-reviews",
        title: "Analytics — Reviews",
        href: "/dashboard/review-analytics",
        summary: "Review response rate, sentiment distribution, and weekly velocity chart.",
      },
      {
        id: "ana-budget",
        title: "Analytics — Budget & pacing",
        href: "/dashboard/budget-pacing",
        summary: "Campaign spend health view — pacing status, percent consumed, and alerts.",
      },
      {
        id: "ana-pipeline",
        title: "Analytics — Pipeline",
        href: "/dashboard/leads",
        summary:
          "Lead funnel by stage, weighted pipeline value, and conversion rates by source.",
      },
      {
        id: "ana-seo",
        title: "Analytics — SEO",
        href: "/dashboard/seo",
        summary: "Keyword rankings and rank change trends across all tracked clients.",
      },
      {
        id: "ana-team",
        title: "Analytics — Team",
        href: "/team/performance",
        summary: "Team throughput and output metrics for a selectable date window.",
      },
      {
        id: "ana-time",
        title: "Analytics — Time",
        href: "/dashboard/time-tracking",
        summary:
          "Billable and non-billable hours logged. Cross-reference with invoices to check billing accuracy.",
      },
    ],
  },

  /* ── 11. SOCIAL ANALYTICS ── */
  {
    id: "social-analytics",
    title: "Social Analytics",
    icon: BarChart2,
    screenGuides: [
      {
        id: "social-dash",
        title: "Social analytics dashboard",
        href: "/dashboard/social-analytics",
        summary:
          "Date-range engagement trends shown as line charts per platform. Per-client breakdowns. Top-performing posts gallery sorted by engagement rate. Export charts as PNG using browser print.",
      },
    ],
    content: [
      {
        heading: "How metrics are collected",
        body: "After a post is published, the platform waits 24 hours before fetching performance data (platform APIs return more stable numbers after 24 h). The cron job /api/cron/sync-post-metrics runs every 6 hours and fetches metrics for any published post that has not yet been synced and is older than 24 hours.",
        type: "info",
      },
      {
        heading: "Metrics collected",
        body: "Per post: reach (unique accounts exposed to the post), impressions (total times displayed), likes, comments, shares, saves, link clicks, video views (video posts only), and engagement rate.\n\nEngagement rate formula: (likes + comments + shares + saves) / reach × 100.",
      },
      {
        heading: "Platform differences",
        body: "Facebook & Instagram: reach and impressions are available for business accounts connected via Meta API.\nLinkedIn: impressions and clicks available; reach is approximated.\nTwitter/X: impressions, likes, retweets, replies, and link clicks.\nNote: platform API limits mean data may lag up to 48 hours during high traffic periods.",
        type: "warning",
      },
      {
        heading: "Analytics dashboard",
        body: "/dashboard/social-analytics shows: engagement trend line charts per client and per platform over a selectable date range, a summary table with totals, and a 'Top Posts' gallery sorted by engagement rate. Use the client selector to focus on one account.",
      },
      {
        heading: "Best-performing posts",
        body: "The gallery section surfaces the top 10 posts by engagement rate in the selected date range. Each card shows the post copy preview, platform, scheduled date, engagement rate, and raw counts for each metric.",
      },
      {
        heading: "Per-Post Metrics API",
        body: "GET /api/scheduled-posts/[id]/metrics\nReturns: { reach, impressions, likes, comments, shares, saves, clicks, engagementRate, videoViews?, fetchedAt, platform }.\n\nIf the response is empty, the post may not yet have been synced — check that it has been published and the cron has run.",
        type: "code",
      },
      {
        heading: "Social analytics summary API",
        body: "GET /api/social-analytics?clientId=X&from=YYYY-MM-DD&to=YYYY-MM-DD\nReturns aggregate metrics grouped by platform and date for the given client and range.",
        type: "code",
      },
      {
        heading: "Missing data",
        body: "If metrics are missing for a published post, check: (1) the post has status PUBLISHED in the database, (2) the platform API credentials are valid and not rate-limited, (3) the sync cron has run since the 24-hour window elapsed. You can manually trigger the cron from the Cron Jobs reference.",
        type: "warning",
      },
    ],
  },

  /* ── 12. AUTOMATED REPORTS ── */
  {
    id: "reports",
    title: "Automated Reports",
    icon: Mail,
    screenGuides: [
      {
        id: "rep-list",
        title: "Scheduled Reports",
        href: "/dashboard/reports",
        summary:
          "All automated report schedules: name, client, frequency, last sent date, next send date, and active/paused toggle. Click a row to edit the schedule or trigger a send.",
      },
      {
        id: "rep-new",
        title: "New Report Schedule",
        href: "/dashboard/reports/new",
        summary:
          "Configure a new automated report: pick sections to include, frequency (WEEKLY, MONTHLY, QUARTERLY), day/time, timezone, and recipient email addresses (internal + client).",
      },
    ],
    content: [
      {
        heading: "Report schedules",
        body: "A report schedule defines: name, which client it covers, which sections to include (campaigns, leads, SEO, social analytics, reviews), frequency (WEEKLY, MONTHLY, QUARTERLY), day of week (for weekly) or day of month (for monthly), send time, timezone, and a list of recipient email addresses.",
      },
      {
        heading: "Report sections",
        body: "Available sections you can toggle per schedule:\n- Campaign Performance: status, spend, pacing summary\n- Lead Pipeline: stage distribution, new leads this period, conversion rate\n- SEO Rankings: keyword movements, competitor comparison\n- Social Engagement: post count, aggregate engagement, top posts\n- Reviews: response rate, new reviews, sentiment\n- Time Summary: billable hours logged for the client",
        type: "info",
      },
      {
        heading: "Recipient types",
        body: "Recipients can be tagged as INTERNAL (agency team) or CLIENT. Both receive the same PDF email. The distinction is for filtering in the send history log — useful when you want to audit whether clients received reports.",
      },
      {
        heading: "Automatic delivery",
        body: "The cron job /api/cron/send-reports runs daily at 08:00 UTC. It queries for all active report schedules where nextSendAt ≤ now, generates the PDF, emails all recipients via the configured email provider, logs the result in ReportSendLog, and advances nextSendAt to the next cycle.",
      },
      {
        heading: "Send Now",
        body: "To send a report immediately without waiting for the scheduled time, open the schedule detail page and click 'Send Now'. This calls POST /api/report-schedules/[id]/send-now which generates and emails the report synchronously and updates lastSentAt. The schedule's nextSendAt is not changed.",
        type: "info",
      },
      {
        heading: "Report send history",
        body: "Every send (scheduled or manual) is logged in ReportSendLog with: schedule ID, client, sentAt timestamp, recipient list, and status (SUCCESS or FAILED with errorMessage). View the history from the report schedule detail page.",
      },
      {
        heading: "PDF branding",
        body: "Reports are generated as PDFs with agency branding: logo (from agency profile), client name, report name, and date range in the header. Each section is formatted as a summary table or chart-as-image. Configure agency branding in Settings.",
      },
      {
        heading: "Report schedules API",
        body: "GET /api/report-schedules — list all schedules.\nPOST /api/report-schedules — create a schedule.\nPATCH /api/report-schedules/[id] — update config, toggle active.\nDELETE /api/report-schedules/[id] — remove a schedule.\nPOST /api/report-schedules/[id]/send-now — immediate send.",
        type: "code",
      },
    ],
  },

  /* ── 13. INVOICES ── */
  {
    id: "invoices",
    title: "Invoices",
    icon: DollarSign,
    screenGuides: [
      {
        id: "inv-all",
        title: "All Invoices",
        href: "/dashboard/invoices",
        summary:
          "Invoice list filterable by client, status, and date range. Each row shows invoice number, client, total, status badge, due date, and issue date. Open a row for the full invoice detail and actions.",
      },
      {
        id: "inv-ar",
        title: "Accounts Receivable",
        href: "/dashboard/invoices/accounts-receivable",
        summary:
          "Finance-focused view showing outstanding and aging invoices grouped into buckets: Current (due in future), 1–30 days overdue, 31–60 days, 61–90 days, and 90+ days. Use this for follow-up prioritisation.",
        keywords: ["AR", "aging", "overdue", "receivable"],
      },
      {
        id: "inv-new",
        title: "New Invoice",
        href: "/dashboard/invoices/new",
        summary:
          "Invoice builder: select client, set issue date and due date, add line items (description, quantity, unit price), optional notes and tax rate. Total is calculated automatically. Save as DRAFT until ready to send.",
      },
      {
        id: "inv-detail",
        title: "Invoice detail",
        summary:
          "From All Invoices, open any invoice. URL: /dashboard/invoices/[invoiceId] — preview PDF, send to client, mark as paid, or cancel from this page.",
        keywords: ["detail", "view", "pdf"],
      },
    ],
    content: [
      {
        heading: "Invoice lifecycle",
        body: "DRAFT — editable, not visible to client, no email sent.\nSENT — locked, emailed to client contact, visible in portal (if configured).\nPAID — paidAt timestamp recorded, removed from Accounts Receivable outstanding.\nOVERDUE — due date has passed and status is still SENT (system flag, updated by cron).\nCANCELLED — voided, removed from all financial totals.",
      },
      {
        heading: "Line items",
        body: "Each invoice contains one or more line items. Line item fields: description, quantity (decimal), unit price, and optional discount percentage. Tax is applied at the invoice level (single rate). The total is: sum of (quantity × unitPrice × (1 − discount)) × (1 + taxRate).",
      },
      {
        heading: "Item master",
        body: "Pre-define common billable items (retainer, ad spend, copywriting hour) in Settings → Item Master. When creating an invoice, select an item from the master list to auto-fill description and default unit price. This speeds up invoice creation and ensures consistent line item naming.",
        type: "info",
      },
      {
        heading: "Sending an invoice",
        body: "From the invoice detail page, click 'Send Invoice'. This calls POST /api/invoices/[id]/send, which generates a PDF, emails it to the client's primary contact (and any CC addresses on the invoice), sets status to SENT, and records sentAt. DRAFT invoices must be sent through this action — they cannot be emailed manually.",
      },
      {
        heading: "Marking as paid",
        body: "When payment is received (via bank transfer, card, or other method), click 'Mark as Paid' on the invoice detail page. This calls POST /api/invoices/[id]/mark-paid with an optional paidAt date (defaults to now). The status changes to PAID and the invoice is removed from the Accounts Receivable outstanding list.",
      },
      {
        heading: "Recurring invoices",
        body: "Set a recurrence interval (MONTHLY, QUARTERLY, or ANNUALLY) on an invoice. The cron /api/cron/invoices/generate-recurring runs daily and auto-generates a new DRAFT invoice for each active recurring template, advancing the nextInvoiceDate. Review and send the generated draft manually.",
        type: "info",
      },
      {
        heading: "Accounts Receivable aging",
        body: "The Accounts Receivable view groups SENT and OVERDUE invoices into aging buckets. Use it to prioritise follow-up: 90+ days overdue should be escalated immediately. All totals exclude CANCELLED and DRAFT invoices.",
      },
      {
        heading: "Invoice API",
        body: "GET /api/invoices — list (filters: clientId, status).\nPOST /api/invoices — create a DRAFT.\nPATCH /api/invoices/[id] — update a DRAFT.\nPOST /api/invoices/[id]/send — send to client.\nPOST /api/invoices/[id]/mark-paid — record payment.\nDELETE /api/invoices/[id] — cancel (DRAFT only).",
        type: "code",
      },
    ],
    workflows: [
      {
        name: "Invoice Lifecycle",
        description: "Status progression from creation to payment or cancellation.",
        phases: [
          { steps: [{ label: "DRAFT", variant: "neutral", sublabel: "Editable — not sent" }] },
          { steps: [{ label: "SENT", variant: "active", sublabel: "Emailed — locked" }] },
          {
            steps: [
              { label: "PAID", variant: "success", terminal: true, sublabel: "Payment recorded" },
              { label: "OVERDUE", variant: "warn", terminal: false, sublabel: "Past due date" },
              { label: "CANCELLED", variant: "danger", terminal: true, sublabel: "Voided" },
            ],
          },
        ],
      },
    ],
  },

  /* ── 14. TIME TRACKING ── */
  {
    id: "time-tracking",
    title: "Time Tracking",
    icon: Clock,
    screenGuides: [
      {
        id: "time-home",
        title: "Time Tracking",
        href: "/dashboard/time-tracking",
        summary:
          "Weekly grid showing hours logged per team member. Filter by member or client. Click any cell to see individual entries for that member/day. Navigate weeks using prev/next arrows.",
      },
      {
        id: "time-new",
        title: "Log time",
        href: "/dashboard/time-tracking/new",
        summary:
          "Single entry form: date, client, optional linked task, duration in minutes, billable toggle, optional hourly rate, and a description of work done.",
      },
    ],
    content: [
      {
        heading: "Logging time",
        body: "Log time at /dashboard/time-tracking/new. Required fields: date, client, duration in minutes (minimum 1), and a description. Optional: link to a task, mark as billable (default true), set an hourly rate override (otherwise uses the team member's default rate from their profile).",
      },
      {
        heading: "Billable vs non-billable",
        body: "Mark entries as billable or non-billable. Billable entries are included in the profitability summary and can be exported as a basis for invoice line items. Non-billable entries (internal meetings, admin, training) are tracked separately and excluded from billing calculations.",
        type: "info",
      },
      {
        heading: "Hourly rate",
        body: "Each time entry can have an optional hourly rate override. If omitted, the team member's default billable rate (from their profile) is used. The billable value of an entry is: (durationMinutes / 60) × hourlyRate.",
      },
      {
        heading: "Weekly timesheet",
        body: "The main time tracking dashboard shows a weekly grid (Mon–Sun) with total minutes per member per day. Totals row shows weekly sum per member. Totals column shows daily sum across all members. Use the client filter to see only time for a specific client.",
      },
      {
        heading: "Linking time to tasks",
        body: "When logging time, optionally link the entry to a task (by task ID). Linked entries are displayed on the task detail page under 'Time Logged'. The task's total time is the sum of all linked entries.",
      },
      {
        heading: "Profitability summary",
        body: "Cross-reference billed invoices against logged billable hours per client. High hours / low invoice value indicates scope creep. Low hours / high invoice value may indicate efficiency gains or under-logging.",
        type: "info",
      },
      {
        heading: "Time Entries API",
        body: "GET /api/time-entries — list entries (filters: clientId, userId, from, to).\nPOST /api/time-entries — create an entry.\nPATCH /api/time-entries/[id] — edit an entry.\nDELETE /api/time-entries/[id] — delete an entry.\n\nGET /api/time-entries/summary?clientId=X&from=YYYY-MM-DD&to=YYYY-MM-DD\nReturns: { totalMinutes, billableMinutes, nonBillableMinutes, billableValue, entries[] }",
        type: "code",
      },
    ],
  },

  /* ── 15. INTEGRATIONS ── */
  {
    id: "integrations",
    title: "Integrations",
    icon: Zap,
    screenGuides: [
      {
        id: "int-list",
        title: "Integrations",
        href: "/dashboard/integrations",
        summary:
          "Active inbound connectors listed with type, status (ACTIVE/PAUSED), last event time, and processed/error counts. Copy the ingest URL and rotate API keys from each card.",
      },
      {
        id: "int-new",
        title: "New Integration",
        href: "/dashboard/integrations/new",
        summary:
          "Choose provider type, name the integration, assign to a client (optional), configure field mapping, and generate the API key. Copy the key immediately — it is shown only once.",
      },
    ],
    content: [
      {
        heading: "What integrations do",
        body: "Integrations allow external systems (ad platforms, form tools, CRMs) to push data into Skynexia DM via an inbound webhook. The most common use case is auto-creating Lead records from Facebook Lead Ads or Typeform submissions without manual CSV uploads.",
      },
      {
        heading: "Supported integration types",
        body: "FACEBOOK_LEAD_ADS — receives lead form submissions from Facebook's lead generation ads.\nGOOGLE_ADS — receives conversion and lead data from Google Ads.\nTYPEFORM — receives form submissions from Typeform webhooks.\nGENERIC_WEBHOOK — accepts any JSON payload with a custom field mapping.",
      },
      {
        heading: "Field mapping",
        body: "When creating an integration, configure field mapping to translate incoming JSON keys to Lead model fields. For example: { \"full_name\": \"name\", \"email_address\": \"email\", \"phone_number\": \"phone\" }. Top-level JSON keys only (nested paths are not supported). Unmapped keys are stored in the event log but not applied to the Lead.",
        type: "info",
      },
      {
        heading: "API key security",
        body: "Each integration has a unique API key. The key is shown only once on creation — copy and store it securely. If lost, rotate the key from the integration card (old key is invalidated immediately). The key is passed in the X-API-Key header on every inbound request.",
        type: "warning",
      },
      {
        heading: "Inbound webhook endpoint",
        body: "POST /api/integrations/[id]/ingest\nHeaders: X-API-Key: your-api-key\nBody: JSON payload from the external system.\n\nThis endpoint is publicly accessible — it does not require a session cookie. Authenticate solely via the X-API-Key header.",
        type: "code",
      },
      {
        heading: "Event processing",
        body: "Each inbound payload is recorded as an IntegrationEvent with status RECEIVED. The processor applies field mapping and attempts to create or update a Lead record. On success, status becomes PROCESSED. On failure (validation error, missing client, etc.), status becomes FAILED with an errorMessage.",
      },
      {
        heading: "Event log",
        body: "View recent events at GET /api/integrations/[id]/events. Each event record contains: receivedAt, raw payload, mapped data, processing status, and errorMessage if failed. Use this to debug missing leads or misconfigured field mappings. The log retains the last 1,000 events per integration.",
        type: "info",
      },
      {
        heading: "Pausing an integration",
        body: "Set an integration to PAUSED to stop processing inbound events without deleting the configuration. Inbound requests to a paused integration are still logged as IntegrationEvents with status IGNORED.",
      },
      {
        heading: "Integration API",
        body: "GET /api/integrations — list all integrations.\nPOST /api/integrations — create an integration.\nPATCH /api/integrations/[id] — update config or toggle paused.\nDELETE /api/integrations/[id] — delete (events are preserved).\nGET /api/integrations/[id]/events — list events.",
        type: "code",
      },
    ],
  },

  /* ── 16. CLIENT PORTAL ── */
  {
    id: "portal",
    title: "Client Portal",
    icon: Globe,
    screenGuides: [
      {
        id: "portal-home",
        title: "Client portal (token URL)",
        summary:
          "Clients open /portal/[token] with no login. Token is issued from the client profile page. Each client has one active token — regenerate if the client loses access or the token is compromised.",
        keywords: ["token", "approval", "client access"],
      },
      {
        id: "portal-campaigns",
        title: "Portal — Campaigns",
        summary:
          "Campaign summaries exposed to clients at /portal/[token]/campaigns. Shows active campaigns, spend % consumed, and status. Read-only.",
      },
      {
        id: "portal-reviews",
        title: "Portal — Reviews",
        summary:
          "Review activity visible to the client at /portal/[token]/reviews. Shows posted responses and volume trends.",
      },
      {
        id: "portal-content",
        title: "Portal — Content approvals",
        summary:
          "Scheduled posts flagged for approval are listed at /portal/[token]/content. Client can APPROVE or REQUEST_CHANGES on each post.",
        keywords: ["approve", "content", "review"],
      },
    ],
    content: [
      {
        heading: "Portal access",
        body: "Each client has a unique portal URL containing a signed HMAC token. Share the URL directly with your client contact. No account or login is needed. The token encodes the client ID and expiry timestamp. It expires after 30 days of inactivity and can be regenerated from the client profile page.",
        type: "warning",
      },
      {
        heading: "Token security",
        body: "Portal tokens are signed using your PORTAL_SECRET environment variable (falls back to AUTH_SECRET if not set). Never share the raw token in insecure channels. If you suspect a token has been compromised, regenerate it immediately — the old token is invalidated instantly.",
        type: "warning",
      },
      {
        heading: "What clients see",
        body: "The client portal exposes: campaign performance summaries, scheduled posts pending approval, review response history, lead pipeline overview (if enabled), and a monthly summary PDF download. The specific sections shown depend on your configuration per client.",
      },
      {
        heading: "Content approvals",
        body: "Scheduled posts with the 'Requires Approval' flag appear in the portal's content approval queue. Clients can click APPROVE to allow the post to publish on schedule, or REQUEST_CHANGES to hold it and send a notification to the agency with their comment.",
      },
      {
        heading: "Portal approval API",
        body: "POST /api/portal/approvals\nHeaders: No session cookie required — token is passed as query param or in request body.\nBody: { token, scheduledPostId, action: 'APPROVED' | 'CHANGES_REQUESTED', comment? }\n\nThe cron job checks approval status before publishing — a post in AWAITING_APPROVAL will not publish until this endpoint returns APPROVED.",
        type: "code",
      },
      {
        heading: "Portal comments",
        body: "Both clients (via token) and agency staff (via session) can add comments on content items and scheduled posts. Comments are threaded per content item. Use them to consolidate feedback that would otherwise arrive by email.",
      },
      {
        heading: "Portal comments API",
        body: "GET /api/portal/comments?token=XXX&contentId=YYY — list comments.\nPOST /api/portal/comments — add a comment.\nBody: { token OR sessionCookie, contentId, body }",
        type: "code",
      },
      {
        heading: "Monthly summary PDF",
        body: "Clients can download a pre-built summary PDF from the portal covering the current calendar month. The PDF includes: campaigns active, posts published, reviews responded to, leads in pipeline, and time summary. Call GET /api/portal/report?token=XXX to generate and return the PDF.",
      },
    ],
    workflows: [
      {
        name: "Scheduled Post with Approval Gate",
        description: "Publishing flow when a post is flagged for client approval via the portal.",
        phases: [
          { steps: [{ label: "DRAFT", variant: "neutral", sublabel: "Post created" }] },
          { steps: [{ label: "SCHEDULED", variant: "active", sublabel: "Publish time set" }] },
          { steps: [{ label: "AWAITING APPROVAL", variant: "warn", sublabel: "Sent to portal" }] },
          {
            steps: [
              { label: "APPROVED", variant: "active", sublabel: "Client approved" },
              { label: "CHANGES REQUESTED", variant: "danger", terminal: true, sublabel: "Returned to agency" },
            ],
          },
          {
            steps: [
              { label: "PUBLISHED", variant: "success", terminal: true, sublabel: "Goes live on platform" },
            ],
          },
        ],
      },
    ],
  },

  /* ── 17. ADMIN ── */
  {
    id: "admin",
    title: "Admin",
    icon: Shield,
    screenGuides: [
      {
        id: "adm-users",
        title: "Users (admin)",
        href: "/dashboard/admin/users",
        summary:
          "Create team accounts, deactivate access, reset passwords, and assign admin vs standard role. Deactivating a user revokes their active session immediately.",
      },
      {
        id: "adm-audit",
        title: "Audit Log",
        href: "/dashboard/admin/audit-log",
        summary:
          "Immutable history of creates, updates, and deletes across every module. Includes actor ID, IP address, resource type, resource ID, action, and timestamp. Filter by actor, resource type, or date range.",
      },
      {
        id: "adm-webhooks",
        title: "Webhooks",
        href: "/dashboard/admin/webhooks",
        summary:
          "Register outbound webhook URLs and shared secrets for HMAC-signed event payloads. Events are delivered as POST requests to the configured URL.",
      },
    ],
    content: [
      {
        heading: "Admin access",
        body: "The Admin section is only visible to users with the ADMIN role. Standard team members cannot access /dashboard/admin routes — the middleware redirects them to the dashboard.",
        type: "warning",
      },
      {
        heading: "User management",
        body: "Admins can: create new team member accounts (sets initial password), deactivate accounts (revokes login and all active sessions), reset passwords, and change role between ADMIN and standard. You cannot delete users — use deactivate to preserve audit history.",
      },
      {
        heading: "Audit log",
        body: "/dashboard/admin/audit-log displays a paginated, immutable trail of all platform actions. Each entry includes: actor (user ID and name), action type (CREATE, UPDATE, DELETE), resource type (Client, Invoice, Lead, etc.), resource ID, changed fields (for UPDATE), client IP, and timestamp. Use filters to narrow by date range, actor, or resource type.",
      },
      {
        heading: "Audit event types",
        body: "CREATE — a new record was created.\nUPDATE — one or more fields were changed (changed fields logged).\nDELETE — a record was soft-deleted or archived.\nLOGIN — a user authenticated successfully.\nLOGOUT — a user signed out.\nPORTAL_APPROVAL — a portal approval action was taken.\nCRON_RUN — a cron job executed (with result summary).",
        type: "info",
      },
      {
        heading: "Outbound webhooks",
        body: "Configure outbound webhook endpoints at /dashboard/admin/webhooks. Each webhook has a URL, a shared secret (for HMAC-SHA256 signature), and a list of event types to subscribe to. Events are delivered via POST with a JSON body and an X-Skynexia-Signature header for verification.",
      },
      {
        heading: "Webhook event types",
        body: "Available event types you can subscribe to: lead.created, lead.stage_changed, invoice.sent, invoice.paid, invoice.overdue, scheduled_post.published, scheduled_post.failed, portal.approval_received, budget_alert.fired, review.allocated, report.sent.",
        type: "info",
      },
      {
        heading: "Webhook signature verification",
        body: "Each outbound webhook request includes the header X-Skynexia-Signature: sha256=<HMAC>. Compute HMAC-SHA256 of the raw request body using your webhook secret and compare to the header value to verify authenticity before processing.",
        type: "code",
      },
      {
        heading: "Admin API",
        body: "GET /api/admin/users — list all users.\nPOST /api/admin/users — create a user.\nPATCH /api/admin/users/[id] — update role or deactivate.\nGET /api/admin/audit-log — paginated audit entries.\nGET /api/admin/webhooks — list webhooks.\nPOST /api/admin/webhooks — register a webhook.\nDELETE /api/admin/webhooks/[id] — remove a webhook.",
        type: "code",
      },
    ],
  },

  /* ── 18. SETTINGS ── */
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    screenGuides: [
      {
        id: "set-account",
        title: "Account Settings",
        href: "/dashboard/settings",
        summary:
          "Update display name, email address, and password for the signed-in user. Changes to email address take effect immediately.",
      },
      {
        id: "set-item-master",
        title: "Item Master",
        href: "/dashboard/settings/item-master",
        summary:
          "Pre-define reusable billing line items: description, default unit price, and category. Used when building invoices to auto-fill line item details. Manage the catalogue here.",
        keywords: ["catalog", "products", "billing", "line items"],
      },
    ],
    content: [
      {
        heading: "Account settings",
        body: "Update your display name, email address, and password from /dashboard/settings. Password changes require confirming your current password. Email changes take effect immediately and update the address used for notifications.",
      },
      {
        heading: "Item Master",
        body: "The Item Master is a catalogue of pre-defined billing items. Create entries for common line items: Monthly Retainer, Google Ads Management, Content Creation (per post), SEO Report, etc. When creating an invoice, selecting an item from the catalogue auto-fills the description and default unit price, speeding up invoice creation.",
      },
      {
        heading: "Required environment variables",
        body: "AUTH_SECRET — 32+ byte random string for session token signing. Changing this invalidates all active sessions.\nMONGODB_URI — MongoDB connection string (e.g. mongodb+srv://...)\nCRON_SECRET — Bearer token sent by Vercel Cron in the Authorization header.\nNEXT_PUBLIC_APP_URL — Public base URL (e.g. https://youragency.com). Used in email links and portal URLs.",
        type: "code",
      },
      {
        heading: "Email provider variables",
        body: 'EMAIL_PROVIDER — "resend" | "smtp" | "console"\n\nIf resend:\n  RESEND_API_KEY — your Resend API key\n  EMAIL_FROM — sender address (e.g. reports@youragency.com)\n\nIf smtp:\n  SMTP_HOST — mail server hostname\n  SMTP_PORT — port (465 for TLS, 587 for STARTTLS)\n  SMTP_USER — SMTP username\n  SMTP_PASS — SMTP password\n  EMAIL_FROM — sender address\n\nIf console:\n  All emails are printed to the server log. Use this in development.',
        type: "code",
      },
      {
        heading: "Optional environment variables",
        body: "PORTAL_SECRET — HMAC secret for portal tokens. Defaults to AUTH_SECRET if not set. Set separately to allow portal tokens to survive AUTH_SECRET rotation.\nGOOGLE_BUSINESS_API_KEY — for Google Reviews sync.\nFACEBOOK_ACCESS_TOKEN — for Facebook/Instagram publishing and metrics.\nLINKEDIN_ACCESS_TOKEN — for LinkedIn publishing and metrics.\nTWITTER_BEARER_TOKEN — for Twitter/X publishing and metrics.",
        type: "code",
      },
      {
        heading: "Changing AUTH_SECRET",
        body: "Rotating AUTH_SECRET invalidates all active user sessions and all portal tokens (unless PORTAL_SECRET is set separately). Users will be logged out and clients will lose portal access. Plan this during a maintenance window and notify affected clients.",
        type: "warning",
      },
    ],
  },

  /* ── 19. CRON JOBS ── */
  {
    id: "cron",
    title: "Cron Jobs",
    icon: Timer,
    content: [
      {
        heading: "Authentication",
        body: "All cron endpoints require the header:\nAuthorization: Bearer {CRON_SECRET}\n\nThe CRON_SECRET environment variable must be set. Vercel Cron sends this header automatically when calling configured endpoints. For manual testing, add the header with curl or an HTTP client.",
        type: "warning",
      },
      {
        heading: "Cron job schedule",
        body: "/api/cron/scheduled-posts         — every 5 min        — publishes due social posts\n/api/cron/send-reports             — 08:00 UTC daily    — emails scheduled report PDFs\n/api/cron/check-budget-pacing      — 09:00 UTC daily    — recalculates pacing, fires alerts\n/api/cron/sync-post-metrics        — every 6 hours      — fetches post engagement metrics\n/api/cron/invoices/generate-recurring — daily           — auto-creates recurring invoice drafts\n/api/cron/google-reviews           — daily              — syncs Google Business Profile reviews",
        type: "code",
      },
      {
        heading: "Manual trigger (curl example)",
        body: 'curl -X POST https://yourdomain.com/api/cron/send-reports \\\n  -H "Authorization: Bearer your-cron-secret"\n\nReplace the path with the desired cron endpoint. Response body indicates how many records were processed.',
        type: "code",
      },
      {
        heading: "Vercel cron configuration",
        body: "Cron schedules are defined in vercel.json at the root of the project. Each entry has a path and a schedule in cron syntax. Vercel's free tier allows up to 2 cron invocations per day; Pro and Enterprise plans support per-minute schedules.",
        type: "info",
      },
      {
        heading: "Error handling",
        body: "If a cron job fails (e.g., the database is unreachable or an API call times out), it returns a non-200 status. Vercel logs the failure. For /api/cron/scheduled-posts, a failed post is marked with status FAILED and the errorMessage field is set. You can manually retry by re-running the cron endpoint — it will retry FAILED posts only if they are within the scheduled time window.",
      },
      {
        heading: "Cron run audit events",
        body: "Each cron invocation logs a CRON_RUN audit event with: which endpoint ran, how many records were processed, how many succeeded, and how many failed. Review these in the Admin → Audit Log filtered by resource type = CRON.",
        type: "info",
      },
      {
        heading: "Local development",
        body: "In local development, crons do not run automatically (no Vercel Cron daemon). Trigger them manually via curl or your HTTP client as shown above. Use EMAIL_PROVIDER=console to see email output without actually sending.",
        type: "info",
      },
    ],
  },

  /* ── 20. WORKFLOWS ── */
  {
    id: "workflows",
    title: "Workflows",
    icon: GitBranch,
    content: [
      {
        heading: "About this section",
        body: "Visual diagrams of the key lifecycle workflows in the platform. Each workflow shows the states a record moves through and the terminal states it can reach. Refer to the relevant module documentation for API calls that trigger each transition.",
        type: "info",
      },
    ],
    workflows: [
      {
        name: "Review Response Lifecycle",
        description: "How a review moves from initial sync through to a published agency response.",
        phases: [
          { steps: [{ label: "SYNCED", variant: "neutral", sublabel: "Pulled from Google" }] },
          { steps: [{ label: "DRAFT", variant: "neutral", sublabel: "Response written" }] },
          { steps: [{ label: "ALLOCATED", variant: "active", sublabel: "Assigned to poster" }] },
          {
            steps: [
              { label: "POSTED", variant: "success", terminal: true, sublabel: "Published" },
              { label: "REJECTED", variant: "danger", terminal: true, sublabel: "Returned for revision" },
            ],
          },
        ],
      },
      {
        name: "Invoice Lifecycle",
        description: "Status progression from invoice creation to payment or cancellation.",
        phases: [
          { steps: [{ label: "DRAFT", variant: "neutral", sublabel: "Editable" }] },
          { steps: [{ label: "SENT", variant: "active", sublabel: "Emailed — locked" }] },
          {
            steps: [
              { label: "PAID", variant: "success", terminal: true, sublabel: "Payment received" },
              { label: "OVERDUE", variant: "warn", sublabel: "Past due date" },
              { label: "CANCELLED", variant: "danger", terminal: true, sublabel: "Voided" },
            ],
          },
        ],
      },
      {
        name: "Lead Pipeline",
        description: "CRM stages from first capture to close.",
        phases: [
          { steps: [{ label: "NEW", variant: "neutral" }] },
          { steps: [{ label: "CONTACTED", variant: "active" }] },
          { steps: [{ label: "QUALIFIED", variant: "active" }] },
          { steps: [{ label: "PROPOSAL", variant: "active" }] },
          { steps: [{ label: "NEGOTIATION", variant: "warn" }] },
          {
            steps: [
              { label: "CLOSED WON", variant: "success", terminal: true },
              { label: "CLOSED LOST", variant: "danger", terminal: true },
            ],
          },
        ],
      },
      {
        name: "Scheduled Post with Approval Gate",
        description: "Publishing flow when a post requires client sign-off via the portal.",
        phases: [
          { steps: [{ label: "DRAFT", variant: "neutral", sublabel: "Created" }] },
          { steps: [{ label: "SCHEDULED", variant: "active", sublabel: "Time set" }] },
          { steps: [{ label: "AWAITING APPROVAL", variant: "warn", sublabel: "Sent to portal" }] },
          {
            steps: [
              { label: "APPROVED", variant: "active", sublabel: "Client approved" },
              { label: "CHANGES REQUESTED", variant: "danger", terminal: true, sublabel: "Returned to agency" },
            ],
          },
          { steps: [{ label: "PUBLISHED", variant: "success", terminal: true, sublabel: "Live on platform" }] },
        ],
      },
      {
        name: "Campaign Budget Lifecycle",
        description: "How budget health changes as spend accumulates.",
        phases: [
          { steps: [{ label: "ACTIVE", variant: "active", sublabel: "Tracking starts" }] },
          {
            steps: [
              { label: "ON TRACK", variant: "success", sublabel: "Within run rate ±10%" },
              { label: "OVER PACING", variant: "warn", sublabel: ">10% above run rate" },
              { label: "UNDER PACING", variant: "neutral", sublabel: ">10% below run rate" },
            ],
          },
          { steps: [{ label: "WARN 75%", variant: "warn", sublabel: "Alert fired" }] },
          { steps: [{ label: "WARN 90%", variant: "warn", sublabel: "Alert fired" }] },
          {
            steps: [
              { label: "EXHAUSTED", variant: "danger", terminal: true, sublabel: "100% consumed" },
              { label: "COMPLETED", variant: "success", terminal: true, sublabel: "End date reached" },
            ],
          },
        ],
      },
      {
        name: "Inbound Integration Event",
        description: "What happens when an external system calls the ingest webhook.",
        phases: [
          { steps: [{ label: "RECEIVED", variant: "neutral", sublabel: "Payload logged" }] },
          { steps: [{ label: "VALIDATING", variant: "active", sublabel: "API key + mapping checked" }] },
          {
            steps: [
              { label: "PROCESSED", variant: "success", terminal: true, sublabel: "Lead created / updated" },
              { label: "FAILED", variant: "danger", terminal: true, sublabel: "Validation or DB error" },
              { label: "IGNORED", variant: "neutral", terminal: true, sublabel: "Integration is paused" },
            ],
          },
        ],
      },
      {
        name: "Automated Report Delivery",
        description: "How a scheduled report is generated and delivered.",
        phases: [
          { steps: [{ label: "SCHEDULED", variant: "neutral", sublabel: "nextSendAt set" }] },
          { steps: [{ label: "CRON PICKS UP", variant: "active", sublabel: "Daily at 08:00 UTC" }] },
          { steps: [{ label: "PDF GENERATED", variant: "active", sublabel: "Sections compiled" }] },
          {
            steps: [
              { label: "EMAIL SENT", variant: "success", terminal: true, sublabel: "Logged as SUCCESS" },
              { label: "FAILED", variant: "danger", terminal: true, sublabel: "Logged with errorMessage" },
            ],
          },
        ],
      },
    ],
  },
];

export function getDocumentationSectionById(id: string): DocSection | undefined {
  return DOCUMENTATION_SECTIONS.find((s) => s.id === id);
}

/** All topic slug values (one folder + page.tsx per id). */
export const DOCUMENTATION_TOPIC_IDS = DOCUMENTATION_SECTIONS.map((s) => s.id);
