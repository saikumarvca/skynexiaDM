import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowLeftRight,
  CheckCircle2,
  FilePen,
  FilePlus2,
  FileText,
  Link2,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Trophy,
  UserPlus,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientEventCategory } from "@/models/ClientEvent";

type IconSpec = { icon: LucideIcon; className: string };

const BY_ACTION: Record<string, IconSpec> = {
  REVIEW_POSTED: { icon: CheckCircle2, className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  REVIEW_CONFIRMED_POSTED: { icon: CheckCircle2, className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  REVIEW_SHARED: { icon: Send, className: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
  REVIEW_ASSIGNED: { icon: UserPlus, className: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
  DRAFT_ALLOCATED: { icon: UserPlus, className: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
  REVIEW_REASSIGNED: { icon: ArrowLeftRight, className: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
  DRAFT_CREATED: { icon: FilePlus2, className: "bg-primary/10 text-primary" },
  DRAFT_ADDED: { icon: FilePlus2, className: "bg-primary/10 text-primary" },
  DRAFT_UPDATED: { icon: FilePen, className: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
  DRAFT_STATUS_CHANGED: { icon: FileText, className: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
  REVIEW_STATUS_CHANGED: { icon: FileText, className: "bg-amber-500/14 text-amber-700 dark:text-amber-400" },
  CUSTOMER_DETAILS_UPDATED: { icon: Settings2, className: "bg-amber-500/14 text-amber-700 dark:text-amber-400" },
  REVIEW_DATES_UPDATED: { icon: Settings2, className: "bg-amber-500/14 text-amber-700 dark:text-amber-400" },
  DRAFT_RECYCLED: { icon: RefreshCw, className: "bg-teal-500/12 text-teal-600 dark:text-teal-400" },
  DRAFT_ARCHIVED: { icon: Archive, className: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
  DRAFT_REMOVED: { icon: Archive, className: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
  REVIEW_PROOF_UPLOADED: { icon: Link2, className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  REVIEW_LINK_ADDED: { icon: Link2, className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  UPDATE_PUBLISHED: { icon: Megaphone, className: "bg-primary/10 text-primary" },
  MILESTONE: { icon: Trophy, className: "bg-amber-500/14 text-amber-700 dark:text-amber-400" },
  FEEDBACK: { icon: MessageSquare, className: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
};

const BY_CATEGORY: Record<ClientEventCategory, IconSpec> = {
  REVIEW: { icon: FileText, className: "bg-primary/10 text-primary" },
  DATA: { icon: Settings2, className: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
  FEATURE: { icon: Sparkles, className: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
  SYSTEM: { icon: Wrench, className: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
};

export function ActivityIcon({
  action,
  category,
  size = "md",
}: {
  action: string;
  category: ClientEventCategory;
  size?: "sm" | "md";
}) {
  const spec = BY_ACTION[action] ?? BY_CATEGORY[category];
  const Icon = spec.icon;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === "md" ? "h-9 w-9" : "h-7 w-7",
        spec.className,
      )}
      aria-hidden
    >
      <Icon className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </span>
  );
}
