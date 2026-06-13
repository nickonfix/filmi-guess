'use client';
import { useEffect } from 'react';

/**
 * Trap the browser Back button (and mobile back gesture) while the user is
 * inside a room. The only way out is an explicit Leave button.
 *
 * How it works: we keep a "buffer" history entry pointing at the current URL
 * sitting in front of wherever the user came from. A Back press pops that
 * buffer (the URL is unchanged, so the router stays on this page) and we
 * immediately push it again to re-arm the trap. We also re-arm whenever the
 * page is shown again (bfcache restore) or becomes visible, since mobile
 * browsers can drop history state across those transitions.
 *
 * Pass `active=false` to disable the guard (e.g. the join screen before the
 * player is actually in a room).
 */
export function useExitGuard(active: boolean): void {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    let armed = true;

    const arm = () => {
      // Only push a buffer entry if we're not already sitting on one this tick,
      // to avoid stacking dozens of identical entries on rapid re-arms.
      window.history.pushState({ exitGuard: true }, '', window.location.href);
    };

    // Seed the trap.
    arm();

    const onPopState = () => {
      if (!armed) return;
      // Back was pressed — re-push so the navigation is absorbed and we stay put.
      arm();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      // Restored from the bfcache (common on mobile back/forward) — re-seed.
      if (e.persisted) arm();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') arm();
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      armed = false;
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active]);
}
