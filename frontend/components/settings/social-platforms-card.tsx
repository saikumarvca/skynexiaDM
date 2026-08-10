"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, CheckCircle2, XCircle } from "lucide-react";

interface PlatformStatus {
  facebook: boolean;
  instagram: boolean;
  linkedin: boolean;
  twitter: boolean;
}

const PLATFORMS = [
  {
    key: "facebook" as const,
    label: "Facebook",
    envVars: ["FACEBOOK_ACCESS_TOKEN", "FACEBOOK_PAGE_ID"],
  },
  {
    key: "instagram" as const,
    label: "Instagram",
    envVars: ["FACEBOOK_ACCESS_TOKEN", "FACEBOOK_PAGE_ID"],
  },
  {
    key: "linkedin" as const,
    label: "LinkedIn",
    envVars: ["LINKEDIN_ACCESS_TOKEN"],
  },
  {
    key: "twitter" as const,
    label: "Twitter / X",
    envVars: ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN"],
  },
];

export function SocialPlatformsCard() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/social/status")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Social Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Configure environment variables to enable social media publishing.
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Checking platform status...
          </p>
        ) : (
          <ul className="space-y-2">
            {PLATFORMS.map((p) => {
              const connected = status?.[p.key] ?? false;
              return (
                <li
                  key={p.key}
                  className="flex items-start justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Requires: {p.envVars.join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {connected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          Connected
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Not configured
                        </span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Set these variables in your <code>.env.local</code> file or hosting
          environment to enable publishing.
        </p>
      </CardContent>
    </Card>
  );
}
