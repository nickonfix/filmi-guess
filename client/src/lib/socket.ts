'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Public backend used by the deployed site (Fly.io).
// Must match the `app` name in server/fly.toml -> https://<app>.fly.dev
const PROD_SERVER_URL = 'https://filmi-guess-server.fly.dev';

function getServerUrl(): string {
  if (process.env.NEXT_PUBLIC_SERVER_URL) return process.env.NEXT_PUBLIC_SERVER_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Local development talks to the local server; anything else is production.
    if (host === 'localhost' || host === '127.0.0.1') return `http://${host}:3001`;
    return PROD_SERVER_URL;
  }
  return PROD_SERVER_URL;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getServerUrl(), {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
