import { useEffect, useMemo } from "react";
import { selectActiveTasks } from "../model/selectors";
import { useQueue } from "../model/useQueue";

const DEFAULT_FAVICON = "/favicon.svg";
const ACTIVE_FAVICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#0e0b0a"/>
  <circle cx="22" cy="10" r="6" fill="#E85420"/>
  <text x="12" y="23" text-anchor="middle" fill="white" font-family="system-ui,-apple-system,sans-serif" font-size="18" font-weight="700">E</text>
</svg>
`)}`;

function getFaviconLink() {
  const current = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (current) return current;

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = DEFAULT_FAVICON;
  document.head.append(link);
  return link;
}

export function GenerationFaviconStatus() {
  const { state } = useQueue();
  const hasActiveTasks = useMemo(
    () => selectActiveTasks(state.tasks).length > 0,
    [state.tasks],
  );

  useEffect(() => {
    const link = getFaviconLink();
    const fallbackHref = link.getAttribute("href") || DEFAULT_FAVICON;

    link.setAttribute("href", hasActiveTasks ? ACTIVE_FAVICON : DEFAULT_FAVICON);

    return () => link.setAttribute("href", fallbackHref);
  }, [hasActiveTasks]);

  return null;
}
