'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PlatformStatus {
  facebook: boolean;
  instagram: boolean;
  linkedin: boolean;
  twitter: boolean;
}

export function SocialPlatformBanner() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);

  useEffect(() => {
    fetch('/api/social/status')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {});
  }, []);

  if (!status) return null;

  const unconfigured = Object.entries(status)
    .filter(([, v]) => !v)
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));

  if (unconfigured.length === 0) return null;

  return (
    <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <strong>Not configured:</strong> {unconfigured.join(', ')}. Posts will fail to publish on
        these platforms. Configure environment variables in{' '}
        <a href="/dashboard/settings" className="underline">
          Settings
        </a>
        .
      </span>
    </div>
  );
}
