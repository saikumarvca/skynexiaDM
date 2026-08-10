import { useCallback, useEffect, useState } from "react";

export function useFloatingPanePosition(args: {
  enabled: boolean;
  selectedDraftId: string | null;
  cardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  paneRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const { enabled, selectedDraftId, cardRefs, paneRef } = args;
  const [paneTop, setPaneTop] = useState<number>(96);

  const computePaneTop = useCallback((draftId: string) => {
    const el = cardRefs.current[draftId];
    if (!el) return;
    const cardRect = el.getBoundingClientRect();
    const paneHeight = paneRef.current?.getBoundingClientRect().height ?? 520;
    const minTop = 80; // keep below header
    const maxTop = Math.max(minTop, window.innerHeight - paneHeight - 24);
    const desired = cardRect.top;
    const clamped = Math.max(minTop, Math.min(desired, maxTop));
    setPaneTop(clamped);
  }, [cardRefs, paneRef]);

  useEffect(() => {
    if (!enabled || !selectedDraftId) return;
    const onScrollOrResize = () => computePaneTop(selectedDraftId);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [enabled, selectedDraftId, computePaneTop]);

  return { paneTop, computePaneTop };
}

