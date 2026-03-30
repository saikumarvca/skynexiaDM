import { useState } from "react";
import type { ReviewDraft } from "@/types/reviews";

type ActivityRow = { action: string; performedBy: string; performedAt: string };

async function fetchActivity(entityType: string, entityId: string) {
  const res = await fetch(
    `/api/review-activity?entityType=${entityType}&entityId=${entityId}`,
  );
  if (!res.ok) return [];
  return res.json() as Promise<ActivityRow[]>;
}

export function useDraftActivity() {
  const [activityDraft, setActivityDraft] = useState<ReviewDraft | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  const openActivity = async (d: ReviewDraft) => {
    setActivityDraft(d);
    const logs = await fetchActivity("DRAFT", d._id);
    setActivity(logs);
  };

  const closeActivity = () => {
    setActivityDraft(null);
    setActivity([]);
  };

  return { activityDraft, activity, openActivity, closeActivity };
}

