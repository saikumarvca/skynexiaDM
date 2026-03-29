"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Home, Users, Users2, Target, Layers, ClipboardList,
  FileText, ClipboardCheck, UserPlus, UserCheck, CheckCircle,
  BarChart3, Settings, Activity, TrendingUp, Loader2, X, ArrowLeft,
  ArrowRight, Hash, CalendarClock, LayoutTemplate, Shield, MessageSquare,
} from "lucide-react";

interface LiveClient {
  _id: string;
  name: string;
  businessName: string;
  status: string;
}
interface LiveCampaign {
  _id: string;
  campaignName: string;
  platform: string;
  status: string;
  clientId?: { businessName?: string };
}
interface LiveLead {
  _id: string;
  name: string;
  email?: string;
  status: string;
  clientId?: { businessName?: string };
}
interface LiveTask {
  _id: string;
  title: string;
  status: string;
  priority: string;
}
interface LiveReview {
  _id: string;
  shortLabel: string;
  status: string;
}
interface LiveContent {
  _id: string;
  title: string;
  category: string;
  platform?: string;
}
interface LiveResults {
  clients: LiveClient[];
  campaigns: LiveCampaign[];
  leads: LiveLead[];
  tasks: LiveTask[];
  reviews: LiveReview[];
  content: LiveContent[];
}

interface SearchItem {
  name: string;
  href: string;
  group: string;
  icon: React.ElementType;
  keywords?: string;
  /** Hidden from search unless user is admin */
  adminOnly?: boolean;
}

interface Group {
  name: string;
  icon: React.ElementType;
  description: string;
}

const GROUPS: Group[] = [
  { name: "Main",      icon: Home,         description: "Dashboard, Analytics, Settings" },
  { name: "Reviews",   icon: FileText,     description: "Drafts, Allocations, Analytics" },
  { name: "Team",      icon: Users2,       description: "Users, Roles, Workload" },
  { name: "Clients",   icon: Users,        description: "Client list, Add client" },
  { name: "Campaigns", icon: Target,       description: "All campaigns, New campaign" },
  { name: "Content",   icon: Layers,       description: "Content bank, SEO, Keywords" },
  { name: "Leads",     icon: TrendingUp,   description: "All leads, Pipeline" },
  { name: "Tasks",     icon: ClipboardList,description: "All tasks, New task" },
  { name: "Analytics", icon: BarChart3,    description: "Dashboard, Reviews, Performance" },
  { name: "Settings",  icon: Settings,     description: "App settings, Notifications" },
];

const ALL_ITEMS: SearchItem[] = [
  // Main
  { name: "Dashboard",       href: "/dashboard",                 group: "Main",      icon: Home },
  { name: "Connect",    href: "/connect-wall",              group: "Main",      icon: MessageSquare, keywords: "slack chat team org" },
  { name: "Analytics",       href: "/dashboard/analytics",       group: "Analytics", icon: BarChart3 },
  { name: "Settings",        href: "/dashboard/settings",        group: "Settings",  icon: Settings },
  { name: "Notifications",   href: "/dashboard/notifications",   group: "Settings",  icon: Activity },

  // Clients
  { name: "All Clients",     href: "/clients",                   group: "Clients",   icon: Users,         keywords: "client list" },
  { name: "Add New Client",  href: "/clients/new",               group: "Clients",   icon: Users,         keywords: "create client" },

  // Campaigns
  { name: "All Campaigns",   href: "/dashboard/campaigns",       group: "Campaigns", icon: Target },
  { name: "New Campaign",    href: "/dashboard/campaigns/new",   group: "Campaigns", icon: Target,        keywords: "create campaign" },

  // Leads
  { name: "All Leads",       href: "/dashboard/leads",           group: "Leads",     icon: TrendingUp },
  { name: "New Lead",        href: "/dashboard/leads/new",       group: "Leads",     icon: TrendingUp,    keywords: "create lead" },

  // Content
  { name: "Content Bank",    href: "/dashboard/content",         group: "Content",   icon: Layers },
  { name: "New Content",     href: "/dashboard/content/new",     group: "Content",   icon: Layers,        keywords: "create content" },
  { name: "Scheduled posts", href: "/dashboard/scheduled-posts", group: "Content",   icon: CalendarClock, keywords: "calendar publish" },
  { name: "New scheduled post", href: "/dashboard/scheduled-posts/new", group: "Content", icon: CalendarClock },
  { name: "SEO / Keywords",  href: "/dashboard/seo",             group: "Content",   icon: Search,        keywords: "seo keywords" },
  { name: "New Keyword",     href: "/dashboard/seo/new",         group: "Content",   icon: Search,        keywords: "add keyword" },

  // Tasks
  { name: "All Tasks",       href: "/dashboard/tasks",           group: "Tasks",     icon: ClipboardList },
  { name: "New Task",        href: "/dashboard/tasks/new",       group: "Tasks",     icon: ClipboardList, keywords: "create task" },

  // Reviews
  { name: "Reviews Overview",    href: "/dashboard/reviews",             group: "Reviews", icon: FileText },
  { name: "Review Drafts",       href: "/dashboard/review-drafts",       group: "Reviews", icon: ClipboardCheck, keywords: "draft bank" },
  { name: "Review Allocations",  href: "/dashboard/review-allocations",  group: "Reviews", icon: UserPlus,       keywords: "assign review" },
  { name: "My Assigned Reviews", href: "/dashboard/my-assigned-reviews", group: "Reviews", icon: UserCheck },
  { name: "Used Reviews",        href: "/dashboard/used-reviews",        group: "Reviews", icon: CheckCircle,    keywords: "posted reviews" },
  { name: "Review Analytics",    href: "/dashboard/review-analytics",    group: "Reviews", icon: BarChart3 },
  { name: "Review templates",     href: "/dashboard/review-templates",    group: "Reviews", icon: LayoutTemplate, keywords: "prefill review" },

  // Analytics
  { name: "Dashboard Analytics", href: "/dashboard/analytics",           group: "Analytics", icon: BarChart3 },
  { name: "Review Analytics",    href: "/dashboard/review-analytics",    group: "Analytics", icon: BarChart3 },
  { name: "Team Performance",    href: "/team/performance",              group: "Analytics", icon: TrendingUp },

  // Team
  { name: "Team Overview",      href: "/team",                       group: "Team", icon: Users2 },
  { name: "Users",              href: "/team/members",               group: "Team", icon: Users,         keywords: "employees staff team members" },
  { name: "Add Team Member",    href: "/team/members/new",           group: "Team", icon: Users,         keywords: "create employee" },
  { name: "Team Roles",         href: "/team/roles",                 group: "Team", icon: UserCheck,     keywords: "permissions" },
  { name: "New Role",           href: "/team/roles/new",             group: "Team", icon: UserCheck },
  { name: "Team Assignments",   href: "/team/assignments",           group: "Team", icon: ClipboardList },
  { name: "New Assignment",     href: "/team/assignments/new",       group: "Team", icon: ClipboardList },
  { name: "Team Workload",      href: "/team/workload",              group: "Team", icon: Loader2 },
  { name: "Team Activity",      href: "/team/activity",              group: "Team", icon: Activity,      keywords: "audit log" },
  { name: "Review Assignments", href: "/team/review-assignments",    group: "Team", icon: ClipboardCheck },

  // Settings
  { name: "Admin users",     href: "/dashboard/admin/users",     group: "Settings", icon: Shield,       keywords: "accounts rbac", adminOnly: true },
  { name: "Settings",        href: "/dashboard/settings",        group: "Settings", icon: Settings },
  { name: "Notifications",   href: "/dashboard/notifications",   group: "Settings", icon: Activity },
];

export function GlobalSearch({ showAdminLinks = false }: { showAdminLinks?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [liveResults, setLiveResults] = useState<LiveResults | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(false);

  const visibleItems = useMemo(
    () => (showAdminLinks ? ALL_ITEMS : ALL_ITEMS.filter((i) => !i.adminOnly)),
    [showAdminLinks]
  );

  const closeModal = () => {
    setOpen(false);
    setQuery("");
    setSelectedGroup(null);
    setActiveIndex(0);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") {
        if (selectedGroup) {
          setSelectedGroup(null);
        } else {
          closeModal();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedGroup]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedGroup(null);
      setActiveIndex(0);
      setLiveResults(null);
      setLiveError(false);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setLiveResults(null);
      setLiveLoading(false);
      return;
    }
    setLiveLoading(true);
    setLiveError(false);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Search failed");
        const data: LiveResults = await res.json();
        setLiveResults(data);
      } catch {
        setLiveError(true);
        setLiveResults(null);
      } finally {
        setLiveLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = query.trim()
    ? visibleItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q) ||
          item.keywords?.toLowerCase().includes(q)
        );
      })
    : visibleItems;

  const groupedResults = filtered.reduce<Record<string, SearchItem[]>>((acc, item) => {
    const group = item.group ?? "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(groupedResults).flat();

  const subItems = selectedGroup
    ? visibleItems.filter((item) => item.group === selectedGroup)
    : [];

  const activeGroup = GROUPS.find((g) => g.name === selectedGroup);

  const navigate = (href: string) => {
    router.push(href);
    closeModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => Math.min(p + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      const item = flatFiltered[activeIndex];
      if (item) navigate(item.href);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <>
      {/* Search trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-10 w-full min-h-10 items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted hover:border-border/80 hover:text-foreground transition-all duration-150 sm:h-9 sm:min-h-0"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">Search pages, features…</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded-md border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground shadow-sm">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-md px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "gs-in 0.15s ease-out" }}
          >
            {/* Input bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70">
              {selectedGroup ? (
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              ) : (
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}

              {selectedGroup && (
                <span className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                  {activeGroup && <activeGroup.icon className="h-3 w-3" />}
                  {selectedGroup}
                </span>
              )}

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); setSelectedGroup(null); }}
                onKeyDown={handleKeyDown}
                placeholder={selectedGroup ? `Search in ${selectedGroup}…` : "Search pages, features, team…"}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
              />

              <div className="flex items-center gap-2 shrink-0">
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="flex items-center justify-center h-5 w-5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex h-5 items-center rounded-md border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                  ESC
                </kbd>
              </div>
            </div>

            <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin">

              {/* ── SEARCH RESULTS ── */}
              {query.trim() ? (
                <div className="py-2">
                  {/* ── LIVE RECORD RESULTS ── */}
                  {liveLoading && (
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Searching records…
                    </div>
                  )}
                  {!liveLoading && liveError && (
                    <div className="px-4 py-2 text-xs text-muted-foreground/60">
                      Could not load record results.
                    </div>
                  )}
                  {!liveLoading && !liveError && liveResults && (() => {
                    const hasClients   = liveResults.clients.length > 0;
                    const hasCampaigns = liveResults.campaigns.length > 0;
                    const hasLeads     = liveResults.leads.length > 0;
                    const hasTasks     = liveResults.tasks.length > 0;
                    const hasReviews   = liveResults.reviews.length > 0;
                    const hasContent   = liveResults.content.length > 0;
                    const hasAny = hasClients || hasCampaigns || hasLeads || hasTasks || hasReviews || hasContent;

                    if (!hasAny) {
                      return (
                        <div className="px-4 py-2 text-xs text-muted-foreground/60">
                          No records found for &ldquo;{query}&rdquo;
                        </div>
                      );
                    }

                    return (
                      <div className="mb-1">
                        {/* Records section header */}
                        <div className="flex items-center gap-2 px-4 py-1.5">
                          <div className="h-4 w-4 rounded-md bg-primary/20 flex items-center justify-center">
                            <Search className="h-2.5 w-2.5 text-primary" />
                          </div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                            Records
                          </p>
                          <div className="flex-1 h-px bg-border/50" />
                        </div>

                        {hasClients && (
                          <div>
                            <div className="flex items-center gap-1.5 px-4 py-1">
                              <Users className="h-3 w-3 text-muted-foreground/50" />
                              <span className="text-[10px] font-medium text-muted-foreground/50">Clients</span>
                            </div>
                            {liveResults.clients.map((c) => (
                              <button
                                key={c._id}
                                onClick={() => navigate(`/clients/${c._id}`)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                              >
                                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="flex-1 text-left font-medium truncate">{c.businessName}</span>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  c.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                                  c.status === "INACTIVE" ? "bg-amber-100 text-amber-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>{c.status}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {hasCampaigns && (
                          <div>
                            <div className="flex items-center gap-1.5 px-4 py-1">
                              <Target className="h-3 w-3 text-muted-foreground/50" />
                              <span className="text-[10px] font-medium text-muted-foreground/50">Campaigns</span>
                            </div>
                            {liveResults.campaigns.map((c) => (
                              <button
                                key={c._id}
                                onClick={() => navigate(`/dashboard/campaigns`)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                              >
                                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="flex-1 text-left font-medium truncate">{c.campaignName}</span>
                                <span className="shrink-0 text-[10px] text-muted-foreground/60 hidden sm:block">
                                  {c.platform}{c.clientId?.businessName ? ` · ${c.clientId.businessName}` : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {hasLeads && (
                          <div>
                            <div className="flex items-center gap-1.5 px-4 py-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
                              <span className="text-[10px] font-medium text-muted-foreground/50">Leads</span>
                            </div>
                            {liveResults.leads.map((l) => (
                              <button
                                key={l._id}
                                onClick={() => navigate(`/dashboard/leads`)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                              >
                                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="flex-1 text-left font-medium truncate">{l.name}</span>
                                <span className="shrink-0 text-[10px] text-muted-foreground/60 hidden sm:block">
                                  {l.email ? `${l.email} · ` : ""}{l.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {hasTasks && (
                          <div>
                            <div className="flex items-center gap-1.5 px-4 py-1">
                              <ClipboardList className="h-3 w-3 text-muted-foreground/50" />
                              <span className="text-[10px] font-medium text-muted-foreground/50">Tasks</span>
                            </div>
                            {liveResults.tasks.map((t) => (
                              <button
                                key={t._id}
                                onClick={() => navigate(`/dashboard/tasks`)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                              >
                                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                                  <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="flex-1 text-left font-medium truncate">{t.title}</span>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  t.priority === "CRITICAL" ? "bg-red-100 text-red-700" :
                                  t.priority === "HIGH" ? "bg-amber-100 text-amber-700" :
                                  t.priority === "MEDIUM" ? "bg-blue-100 text-blue-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>{t.priority}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {hasReviews && (
                          <div>
                            <div className="flex items-center gap-1.5 px-4 py-1">
                              <FileText className="h-3 w-3 text-muted-foreground/50" />
                              <span className="text-[10px] font-medium text-muted-foreground/50">Reviews</span>
                            </div>
                            {liveResults.reviews.map((r) => (
                              <button
                                key={r._id}
                                onClick={() => navigate(`/dashboard/reviews`)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                              >
                                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="flex-1 text-left font-medium truncate">{r.shortLabel}</span>
                                <span className="shrink-0 text-[10px] text-muted-foreground/60">{r.status}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {hasContent && (
                          <div>
                            <div className="flex items-center gap-1.5 px-4 py-1">
                              <Layers className="h-3 w-3 text-muted-foreground/50" />
                              <span className="text-[10px] font-medium text-muted-foreground/50">Content</span>
                            </div>
                            {liveResults.content.map((ci) => (
                              <button
                                key={ci._id}
                                onClick={() => navigate(`/dashboard/content`)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                              >
                                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="flex-1 text-left font-medium truncate">{ci.title}</span>
                                <span className="shrink-0 text-[10px] text-muted-foreground/60">
                                  {ci.category}{ci.platform ? ` · ${ci.platform}` : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Divider between live results and page results */}
                        <div className="mx-4 my-1 h-px bg-border/50" />
                      </div>
                    );
                  })()}
                  {/* ── END LIVE RECORD RESULTS ── */}

                  {flatFiltered.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                        <Hash className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No results found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          No pages matching &ldquo;{query}&rdquo;
                        </p>
                      </div>
                    </div>
                  ) : (
                    Object.entries(groupedResults).map(([group, items]) => {
                      const grp = GROUPS.find((g) => g.name === group);
                      return (
                        <div key={group} className="mb-1 last:mb-0">
                          <div className="flex items-center gap-2 px-4 py-1.5">
                            {grp && (
                              <div className="h-4 w-4 rounded-md bg-primary/20 flex items-center justify-center">
                                <grp.icon className="h-2.5 w-2.5 text-primary" />
                              </div>
                            )}
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                              {group}
                            </p>
                            <div className="flex-1 h-px bg-border/50" />
                          </div>
                          {items.map((item) => {
                            const globalIndex = flatFiltered.indexOf(item);
                            const isActive = globalIndex === activeIndex;
                            return (
                              <button
                                key={item.href}
                                data-index={globalIndex}
                                onClick={() => navigate(item.href)}
                                onMouseEnter={() => setActiveIndex(globalIndex)}
                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  isActive
                                    ? "bg-primary/10 text-foreground"
                                    : "text-foreground/80 hover:bg-muted/60"
                                }`}
                              >
                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isActive ? "bg-primary" : "bg-muted"
                                }`}>
                                  <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                                </div>
                                <span className="flex-1 text-left font-medium">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground/40 font-mono hidden sm:block">{item.href}</span>
                                {isActive && <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>

              ) : selectedGroup ? (
                /* ── SUB-ITEMS GRID ── */
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {subItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => navigate(item.href)}
                        className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-left transition-all duration-150 hover:bg-primary/8 hover:border-primary/30 hover:shadow-sm hover:-translate-y-px active:translate-y-0 group/card"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 group-hover/card:bg-primary transition-colors">
                          <item.icon className="h-4 w-4 text-primary group-hover/card:text-primary-foreground transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate font-mono">{item.href}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              ) : (
                /* ── GROUP CARDS ── */
                <div className="p-4">
                  <p className="mb-3 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">Browse by section</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {GROUPS.map((group) => {
                      const count = visibleItems.filter((i) => i.group === group.name).length;
                      return (
                        <button
                          key={group.name}
                          onClick={() => setSelectedGroup(group.name)}
                          className="group/card flex flex-col items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5 text-left transition-all duration-150 hover:bg-primary/8 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shadow-sm group-hover/card:bg-primary transition-colors">
                            <group.icon className="h-4.5 w-4.5 text-primary group-hover/card:text-primary-foreground transition-colors" />
                          </div>
                          <div className="min-w-0 w-full">
                            <p className="font-semibold text-sm text-foreground leading-tight group-hover/card:text-primary transition-colors">{group.name}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed line-clamp-2">{group.description}</p>
                          </div>
                          <p className="text-[10px] font-semibold text-muted-foreground/50 flex items-center gap-1 group-hover/card:text-primary transition-colors">
                            {count} pages <ArrowRight className="h-2.5 w-2.5" />
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-border/70 px-4 py-2.5 bg-muted/20">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                {selectedGroup ? (
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground shadow-sm">ESC</kbd>
                    back to groups
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground shadow-sm">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground shadow-sm">↵</kbd>
                      open
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground shadow-sm">ESC</kbd>
                      close
                    </span>
                  </>
                )}
              </div>
              <span className="ml-auto text-[10px] text-muted-foreground/40">
                {visibleItems.length} pages indexed
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes gs-in {
          from { opacity: 0; transform: scale(0.97) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
}
