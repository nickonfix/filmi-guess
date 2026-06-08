const KEY = 'filmiGuess_name';
const TOKEN_KEY = 'filmiGuess_token';

export function getSavedName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEY) || '';
}

export function saveName(name: string): void {
  localStorage.setItem(KEY, name);
}

// Server-issued session token proving ownership of a player identity — required to
// reattach to that player via room:rejoin (prevents hijacking by display name alone)
export function getSavedToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
