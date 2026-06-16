/**
 * Fuzzy matching utility for search typo tolerance.
 * Uses the Levenshtein distance algorithm.
 */

/**
 * Calculate the Levenshtein (edit) distance between two strings.
 */
export function levenshteinDistance(a, b) {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Build a 2D matrix
  const matrix = Array.from({ length: aLen + 1 }, (_, i) =>
    Array.from({ length: bLen + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          1 +
          Math.min(
            matrix[i - 1][j],     // deletion
            matrix[i][j - 1],     // insertion
            matrix[i - 1][j - 1]  // substitution
          );
      }
    }
  }

  return matrix[aLen][bLen];
}

/**
 * Check if query is a fuzzy match for text.
 * @param {string} query
 * @param {string} text
 * @param {number} threshold - Similarity ratio (0–1), default 0.65
 * @returns {boolean}
 */
export function fuzzyMatch(query, text, threshold = 0.65) {
  if (!query || !text) return false;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();

  // Exact substring is always a match
  if (t.includes(q)) return true;

  // Fuzzy score per word in query
  const queryWords = q.split(/\s+/);
  const textWords = t.split(/\s+/);

  // For short queries, check entire string similarity
  if (queryWords.length === 1) {
    const distance = levenshteinDistance(q, t);
    const maxLen = Math.max(q.length, t.length);
    return 1 - distance / maxLen >= threshold;
  }

  // For multi-word queries, check that most words fuzzy-match something in text
  const matchedWords = queryWords.filter(qw =>
    textWords.some(tw => {
      const distance = levenshteinDistance(qw, tw);
      const maxLen = Math.max(qw.length, tw.length);
      return 1 - distance / maxLen >= threshold;
    })
  );

  return matchedWords.length / queryWords.length >= 0.6;
}

/**
 * Calculate a similarity ratio between 0–1 for two strings.
 */
export function stringSimilarity(a, b) {
  if (!a || !b) return 0;
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}
