// Normalize a string for comparison
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple Levenshtein distance
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function isCorrectAnswer(submitted: string, correctAnswer: string, aliases: string[]): boolean {
  const norm = normalize(submitted);
  if (!norm) return false;

  const normCorrect = normalize(correctAnswer);
  const normAliases = aliases.map(normalize);

  // Exact match
  if (norm === normCorrect) return true;

  // Alias match
  if (normAliases.includes(norm)) return true;

  // Partial match: submitted contains the full answer (e.g. "that's shah rukh khan")
  if (norm.includes(normCorrect)) return true;

  // Levenshtein fuzzy match for long answers (typos forgiven)
  const dist = levenshtein(norm, normCorrect);
  const tolerance = normCorrect.length > 8 ? 2 : normCorrect.length > 5 ? 1 : 0;
  if (dist <= tolerance) return true;

  // Check aliases with fuzzy
  for (const alias of normAliases) {
    if (levenshtein(norm, alias) <= (alias.length > 6 ? 1 : 0)) return true;
  }

  return false;
}
