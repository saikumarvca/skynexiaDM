"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PublishNowButtonProps {
  postId: string;
}

export function PublishNowButton({ postId }: PublishNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePublish() {
    setLoading(true);
    try {
      const res = await fetch("/api/scheduled-posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Published to ${data.platform}`);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to publish");
        router.refresh();
      }
    } catch {
      toast.error("Network error while publishing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handlePublish}
      disabled={loading}
    >
      <Send className="mr-1 h-3 w-3" />
      {loading ? "Publishing..." : "Publish Now"}
    </Button>
  );
}
