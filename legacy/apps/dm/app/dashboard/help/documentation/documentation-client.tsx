"use client";

import { useState, useMemo, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Menu,
  X,
  Info,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Search as SearchIcon,
  ExternalLink,
} from "lucide-react";
import {
  DOCUMENTATION_SECTIONS,
  filterDocumentationSections,
  documentationTopicHref,
  getDocumentationSectionById,
  type ContentBlock,
  type DocSection,
  type ScreenGuide,
  type Workflow,
  type WorkflowStep,
  type StepVariant,
} from "./documentation-data";

const stepColors: Record<StepVariant, string> = {
  neutral: "border-border bg-muted text-foreground",
  active: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  success:
    "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  danger: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  warn: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
};

function splitContentForScreenGuides(blocks: ContentBlock[] | undefined) {
  if (!blocks?.length) return { intro: [] as ContentBlock[], tail: [] as ContentBlock[] };
  const firstCodeIdx = blocks.findIndex((b) => b.type === "code");
  if (firstCodeIdx === -1) {
    return { intro: blocks, tail: [] as ContentBlock[] };
  }
  return {
    intro: blocks.slice(0, firstCodeIdx),
    tail: blocks.slice(firstCodeIdx),
  };
}

function WorkflowDiagram({ workflow }: { workflow: Workflow }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-5">
      <p className="mb-1 text-sm font-semibold">{workflow.name}</p>
      {workflow.description && (
        <p className="mb-4 text-xs text-muted-foreground">{workflow.description}</p>
      )}
      <div className="flex flex-wrap items-start gap-2">
        {workflow.phases.map((phase, pi) => (
          <div key={pi} className="flex items-start gap-2">
            {pi > 0 && (
              <ArrowRight className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {phase.steps.length === 1 ? (
              <StepBox step={phase.steps[0]!} />
            ) : (
              <div className="flex flex-col gap-1.5">
                {phase.steps.map((step, si) => (
                  <StepBox key={si} step={step} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepBox({ step }: { step: WorkflowStep }) {
  const v = step.variant ?? "neutral";
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-1.5 text-center text-[11px] font-semibold leading-tight",
        stepColors[v],
        step.terminal && "ring-1 ring-inset ring-current/20",
      )}
    >
      {step.label}
      {step.sublabel && (
        <div className="mt-0.5 text-[10px] font-normal opacity-70">{step.sublabel}</div>
      )}
    </div>
  );
}

function DocContentBlock({ block }: { block: ContentBlock }) {
  if (block.type === "code") {
    return (
      <div>
        <p className="mb-1.5 text-sm font-semibold">{block.heading}</p>
        <pre className="overflow-x-auto rounded-md border bg-muted/60 px-4 py-3 text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {block.body}
        </pre>
      </div>
    );
  }

  if (block.type === "info") {
    return (
      <div className="rounded-md border border-blue-500/30 bg-blue-500/8 px-4 py-3">
        <div className="mb-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {block.heading}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>
      </div>
    );
  }

  if (block.type === "warning") {
    return (
      <div className="rounded-md border border-yellow-500/30 bg-yellow-500/8 px-4 py-3">
        <div className="mb-1 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
          <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
            {block.heading}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{block.heading}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>
    </div>
  );
}

function ScreenGuidesBlock({
  sectionId,
  guides,
}: {
  sectionId: string;
  guides: ScreenGuide[];
}) {
  if (!guides.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-tight">Screen guides</h3>
      <ul className="space-y-3">
        {guides.map((g) => (
          <li
            key={g.id}
            id={`${sectionId}--${g.id}`}
            className="scroll-mt-24 rounded-lg border border-border/80 bg-muted/20 px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{g.title}</p>
              {g.href ? (
                <Link
                  href={g.href}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open in app
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                </Link>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {g.summary}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarNav({
  sections,
  currentTopicId,
  onSelect,
}: {
  sections: DocSection[];
  currentTopicId: string;
  onSelect?: () => void;
}) {
  return (
    <nav className="space-y-1" aria-label="Documentation topics">
      {sections.map((s) => {
        const Icon = s.icon;
        const isActive = currentTopicId === s.id;
        return (
          <Link
            key={s.id}
            href={documentationTopicHref(s.id)}
            scroll
            onClick={onSelect}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex min-h-[2.75rem] items-center gap-3 rounded-lg px-3 py-2.5 text-sm leading-snug transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-primary/10 font-medium text-primary shadow-sm dark:bg-primary/15 dark:text-primary"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              isActive &&
                "before:pointer-events-none before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-opacity",
                isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1 break-words">{s.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BackToDashboardLink({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      Back to dashboard
    </Link>
  );
}

function DocsSearchField({
  value,
  onChange,
  onSubmitSeek,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmitSeek: () => void;
  id?: string;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmitSeek();
    }
  };
  return (
    <div className="relative isolate pt-0.5">
      <SearchIcon
        className="pointer-events-none absolute left-2.5 top-[calc(50%+0.125rem)] z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        placeholder="Search docs…"
        title="Search topics and screen guides. Press Enter to open the first matching topic."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        role="searchbox"
        className={cn(
          "h-9 min-w-0 border-border/80 bg-background/80 pl-8 pr-2.5 text-sm shadow-sm placeholder:text-muted-foreground/80",
          /* Inset ring + no offset: parent overflow-x-hidden was clipping the default ring into a thick left bar */
          "focus-visible:ring-inset focus-visible:ring-offset-0",
        )}
        autoComplete="off"
        aria-label="Search documentation"
      />
    </div>
  );
}

function TopicBody({ section }: { section: DocSection }) {
  const Icon = section.icon;
  const { intro, tail } = splitContentForScreenGuides(section.content);
  const guides = section.screenGuides ?? [];

  return (
    <section id={section.id} className="scroll-mt-6">
      <div className="mb-5 flex items-center gap-3 border-b pb-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
      </div>

      {intro.length > 0 && (
        <div className="space-y-5">
          {intro.map((block) => (
            <DocContentBlock key={block.heading} block={block} />
          ))}
        </div>
      )}

      {guides.length > 0 && (
        <div
          className={cn(
            intro.length > 0 ? "mt-8" : "",
            tail.length === 0 && !section.workflows?.length ? "" : "mb-8",
          )}
        >
          <ScreenGuidesBlock sectionId={section.id} guides={guides} />
        </div>
      )}

      {tail.length > 0 && (
        <div
          className={cn(
            "space-y-5",
            intro.length > 0 || guides.length > 0 ? "mt-8" : "",
          )}
        >
          {tail.map((block) => (
            <DocContentBlock key={block.heading} block={block} />
          ))}
        </div>
      )}

      {section.workflows && (
        <div
          className={cn(
            "space-y-6",
            intro.length > 0 || guides.length > 0 || tail.length > 0 ? "mt-8" : "",
          )}
        >
          {section.workflows.map((wf) => (
            <WorkflowDiagram key={wf.name} workflow={wf} />
          ))}
        </div>
      )}
    </section>
  );
}

export function DocumentationAppClient({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const filteredSections = useMemo(
    () => filterDocumentationSections(DOCUMENTATION_SECTIONS, query),
    [query],
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const section = getDocumentationSectionById(topicId);

  const goToFirstSearchHit = () => {
    const first = filteredSections[0];
    if (!first) return;
    router.push(documentationTopicHref(first.id));
    setMobileOpen(false);
  };

  const showEmpty = query.trim() && filteredSections.length === 0;
  const topicIndex = section
    ? DOCUMENTATION_SECTIONS.findIndex((s) => s.id === section.id) + 1
    : 0;

  return (
    <div className="flex min-h-0 w-full max-w-full">
      <aside
        className={cn(
          "sticky top-0 hidden max-h-[calc(100dvh-8rem)] w-[17.5rem] shrink-0 self-start overflow-y-auto overflow-x-hidden border-r border-border/70 bg-muted/25 scrollbar-thin md:block",
        )}
      >
        <div className="border-b border-border/50 px-3 pb-5 pt-6">
          <BackToDashboardLink className="text-xs" />
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-[1.125rem] w-[1.125rem] text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold leading-tight tracking-tight">
                Documentation
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Help center
              </span>
            </div>
          </div>
          <div className="mt-4 min-w-0">
            <DocsSearchField
              id="docs-search-desktop"
              value={query}
              onChange={setQuery}
              onSubmitSeek={goToFirstSearchHit}
            />
          </div>
        </div>
        <div className="px-3 py-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Topics
          </p>
          {showEmpty ? (
            <p className="px-3 text-xs text-muted-foreground">No matching topics.</p>
          ) : (
            <SidebarNav
              sections={filteredSections}
              currentTopicId={topicId}
            />
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative z-10 flex max-h-full w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden border-r border-border/60 bg-background shadow-xl">
            <div className="border-b border-border/50 bg-muted/20 px-3 py-4">
              <div className="mb-4">
                <BackToDashboardLink />
              </div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-[1.125rem] w-[1.125rem] text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">Topics</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Documentation
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close sections menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <DocsSearchField
                value={query}
                onChange={setQuery}
                onSubmitSeek={goToFirstSearchHit}
              />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin">
              {showEmpty ? (
                <p className="text-sm text-muted-foreground">No matching topics.</p>
              ) : (
                <SidebarNav
                  sections={filteredSections}
                  currentTopicId={topicId}
                  onSelect={() => setMobileOpen(false)}
                />
              )}
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1 px-0 py-2 sm:px-1 md:px-6 lg:px-10">
        <div className="mb-4 md:mb-6">
          <BackToDashboardLink className="mb-4 md:hidden" />
          <div className="flex flex-wrap items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md border p-2 hover:bg-muted"
              aria-label="Open documentation sections"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <span className="block font-semibold leading-tight">Documentation</span>
                  <span className="text-xs text-muted-foreground">Topics &amp; screens</span>
                </div>
              </div>
              <DocsSearchField
                value={query}
                onChange={setQuery}
                onSubmitSeek={goToFirstSearchHit}
              />
            </div>
          </div>
        </div>

        <div className="mb-8 hidden flex-wrap items-start justify-between gap-4 border-b pb-6 md:flex">
          <div className="min-w-0 flex-1 space-y-3">
            <BackToDashboardLink />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {section ? section.title : "Documentation"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete reference for the Skynexia DM platform
              </p>
            </div>
          </div>
          <span className="shrink-0 self-start rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            {topicIndex > 0 ? `Topic ${topicIndex} of ${DOCUMENTATION_SECTIONS.length}` : "—"}
            {query.trim()
              ? ` · ${filteredSections.length} matching`
              : ""}
          </span>
        </div>

        <div className="mx-auto max-w-3xl space-y-16">
          {showEmpty && (
            <div
              role="status"
              className="rounded-lg border border-dashed bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground"
            >
              No topics match &quot;{query.trim()}&quot;. Clear the search to see all sections in
              the sidebar.
            </div>
          )}

          {!section && (
            <div
              role="status"
              className="rounded-lg border border-dashed bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground"
            >
              Unknown topic &quot;{topicId}&quot;. Choose a section from the sidebar.
            </div>
          )}

          {section && <TopicBody section={section} />}

          {section && !showEmpty && (
            <div className="rounded-lg border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Need further help? </span>
              Contact your account administrator or open an issue in the project
              repository.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
