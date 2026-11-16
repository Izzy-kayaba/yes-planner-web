"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function isInternalNavigation(target: EventTarget | null) {
  const element = target instanceof Element ? target.closest("a") : null;
  if (!element || element.target === "_blank" || element.hasAttribute("download")) return false;
  const href = element.getAttribute("href");
  return Boolean(href?.startsWith("/") && !href.startsWith("//"));
}

export function NavigationFeedback() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => setPending(false), [pathname]);
  useEffect(() => {
    const start = (event: MouseEvent) => {
      if (event.button === 0 && isInternalNavigation(event.target)) setPending(true);
    };
    document.addEventListener("click", start, true);
    return () => document.removeEventListener("click", start, true);
  }, []);

  if (!pending) return null;
  return <div className="navigation-progress" role="status" aria-label="Loading page" />;
}
