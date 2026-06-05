const KEY = 'filmiGuess_name';

export function getSavedName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEY) || '';
}

export function saveName(name: string): void {
  localStorage.setItem(KEY, name);
}
