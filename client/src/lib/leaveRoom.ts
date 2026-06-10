import { disconnectSocket } from './socket';

/**
 * Leave the current room: drop the socket connection (so the server removes the
 * player) and return to the landing page. The hard navigation wipes all in-memory
 * game state, so there's nothing else to reset.
 */
export function leaveRoom(): void {
  disconnectSocket();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
