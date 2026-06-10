'use client';
import { useEffect } from 'react';

/**
 * Trap the browser Back button while the user is inside a room. Pressing Back
 * silently re-pushes the current entry, so the player stays put — the only way
 * out is an explicit Leave button. Pass `active=false` to disable the guard
 * (e.g. on the join screen before the player is actually in the room).
 */
export function useExitGuard(active: boolean): void {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    // Drop a sacrificial history entry pointing at the same URL. A Back press
    // pops this entry (URL is unchanged, so the router stays on this page) and
    // we immediately push another to keep the trap armed.
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [active]);
}
