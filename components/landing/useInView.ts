import { type RefObject, useEffect, useState } from "react";

/**
 * Whether at least `share` of the element is on screen. A screenshot zooms only then, so nothing
 * moves where nobody looks, and it starts whole each time it comes back into view.
 */
export function useInView(ref: RefObject<Element | null>, share = 0.4): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView((entry?.intersectionRatio ?? 0) >= share),
      { threshold: share },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, share]);

  return inView;
}
