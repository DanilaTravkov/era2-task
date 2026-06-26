# ERA2 Frontend Queue Notes

## Generation Queue

The generation queue screen is available at `/queue` through the app router. The page stays thin and renders the `widgets/generation-queue` composition, while queue state, selectors, actions, persistence, and the mock engine remain in `features/generation-queue`.

The global generation status bar is mounted once at app level and reads the same queue context as the `/queue` screen. When active queued or running tasks exist, the bar floats above the current route; clicking the compact state or the "Open queue" action routes to `/queue`.

Queue state is persisted in `localStorage` under `era2:generation-queue:v1` after hydration. On reload, stored tasks are restored before falling back to the seed dataset. Restored `running` tasks are intentionally normalized back to `queued`; this avoids pretending that client-only timers kept running while the tab was closed, then the mock engine fills available slots again with the existing `MAX_CONCURRENT = 2` rule.

The visual system follows the warm coal queue theme from `тз.md` §5: accent `#E85420`, neutral queued state, orange running state, green done state, red failed state, and muted canceled state. Geist Variable and Geist Mono are imported locally; `Inter` is kept as the sans-serif fallback if Geist cannot load.
