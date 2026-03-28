"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface QueryToastProps {
  /** Query param that must equal "1" to show the toast (then stripped from URL). */
  param?: string;
  message: string;
}

export function QueryToast({ param = "created", message }: QueryToastProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (searchParams.get(param) !== "1") return;
    fired.current = true;
    toast.success(message);
    const q = new URLSearchParams(searchParams.toString());
    q.delete(param);
    const next = q.toString() ? `${pathname}?${q}` : pathname;
    router.replace(next, { scroll: false });
  }, [param, message, pathname, router, searchParams]);

  return null;
}
