"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ActivityItem {
  _id?: string;
  action: string;
  performedBy: string;
  performedAt: string;
  newValue?: unknown;
}

interface ReviewActivityTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem[];
  title?: string;
}

export function ReviewActivityTimeline({
  isOpen,
  onClose,
  activity,
  title = "Activity History",
}: ReviewActivityTimelineProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Timeline of actions and updates for this item.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 pl-6 space-y-4">
              {activity.map((log, i) => (
                <div key={(log as { _id?: string })._id ?? i} className="relative -left-6">
                  <div className="absolute left-0 w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500 -translate-x-1/2 translate-y-1.5" />
                  <div className="text-sm">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground"> by </span>
                    <span className="font-medium">{log.performedBy}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      on {new Date(log.performedAt).toLocaleString()}
                    </span>
                  </div>
                  {log.newValue != null && typeof log.newValue === "object" && Object.keys(log.newValue as object).length > 0 ? (
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-24 overflow-y-auto">
                      {JSON.stringify(log.newValue, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
