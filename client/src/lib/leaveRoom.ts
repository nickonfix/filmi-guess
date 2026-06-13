import { getSocket, disconnectSocket } from './socket';

/**
 * Leave the current room: tell the server explicitly (so it removes the player
 * and announces "X left" immediately, rather than waiting out the disconnect
 * grace period), then drop the socket and return to the landing page. The short
 * delay lets the leave packet flush before we disconnect.
 */
export function leaveRoom(): void {
  try {
    getSocket().emit('room:leave');
  } catch {
    /* ignore — we disconnect either way */
  }
  setTimeout(() => {
    disconnectSocket();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, 120);
}
