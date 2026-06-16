/**
 * Recommendation Engine
 * Calculates similarity scores between documents based on multiple factors.
 */

/**
 * Calculate similarity score between two documents (0–1 scale).
 * Weights: Category 40%, Tags 30%, Department 15%, FileType 10%, Recency 5%
 */
export function calculateSimilarity(doc1, doc2) {
  if (!doc1 || !doc2 || doc1.id === doc2.id) return 0;

  let score = 0;

  // 1. Category match (40%)
  if (doc1.categoryId && doc1.categoryId === doc2.categoryId) {
    score += 0.4;
  }

  // 2. Tag overlap (30%)
  const tags1 = Array.isArray(doc1.tags) ? doc1.tags : [];
  const tags2 = Array.isArray(doc2.tags) ? doc2.tags : [];
  if (tags1.length > 0 && tags2.length > 0) {
    const commonTags = tags1.filter(tag =>
      tags2.map(t => t.toLowerCase()).includes(tag.toLowerCase())
    );
    const tagScore = commonTags.length / Math.max(tags1.length, tags2.length);
    score += tagScore * 0.3;
  }

  // 3. Department match (15%)
  if (doc1.departmentId && doc1.departmentId === doc2.departmentId) {
    score += 0.15;
  }

  // 4. File type match (10%)
  if (
    doc1.fileType &&
    doc2.fileType &&
    doc1.fileType.toLowerCase() === doc2.fileType.toLowerCase()
  ) {
    score += 0.1;
  }

  // 5. Recency bonus (5% — prefer newer documents)
  try {
    const daysDiff =
      Math.abs(new Date(doc1.createdAt) - new Date(doc2.createdAt)) /
      (1000 * 60 * 60 * 24);
    score += (1 - Math.min(daysDiff / 365, 1)) * 0.05;
  } catch {
    // Date parsing failed, skip recency score
  }

  return Math.min(score, 1); // Clamp to [0, 1]
}

/**
 * Get top N recommended documents for a given document.
 * @param {Object} targetDoc - The document to find recommendations for
 * @param {Array} allDocs - All available documents
 * @param {number} limit - Maximum number of recommendations
 * @param {number} minScore - Minimum similarity threshold (default 0.1)
 * @returns {Array} Sorted recommendations with scores
 */
export function getTopRecommendations(targetDoc, allDocs, limit = 5, minScore = 0.1) {
  if (!targetDoc || !allDocs?.length) return [];

  const scored = allDocs
    .filter(doc => doc.id !== targetDoc.id && doc.status !== 'archived')
    .map(doc => ({
      ...doc,
      _similarityScore: calculateSimilarity(targetDoc, doc),
    }))
    .filter(doc => doc._similarityScore >= minScore)
    .sort((a, b) => b._similarityScore - a._similarityScore);

  return scored.slice(0, limit);
}

/**
 * Get popular documents sorted by all-time view count.
 * @param {Array} docs - All documents
 * @param {number} limit
 * @param {string} excludeId - Document ID to exclude (e.g., current page)
 */
export function getPopularDocuments(docs, limit = 10, excludeId = null) {
  if (!docs?.length) return [];
  return [...docs]
    .filter(d => d.id !== excludeId && d.status !== 'archived')
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, limit);
}

/**
 * Get trending documents — approximated as most recently updated
 * (since json-server doesn't aggregate per-day views).
 * @param {Array} docs - All documents
 * @param {number} days - Lookback window (informational; filters by updatedAt)
 * @param {number} limit
 * @param {string} excludeId - Document ID to exclude
 */
export function getTrendingDocuments(docs, days = 7, limit = 10, excludeId = null) {
  if (!docs?.length) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recent = docs.filter(
    d => d.id !== excludeId && d.status !== 'archived' && new Date(d.updatedAt) >= cutoff
  );

  // If not enough recent docs, fall back to most viewed
  const pool = recent.length >= limit ? recent : docs.filter(d => d.id !== excludeId);

  return [...pool]
    .sort((a, b) => {
      // Primary: view count, secondary: recency
      const viewDiff = (b.viewCount || 0) - (a.viewCount || 0);
      if (viewDiff !== 0) return viewDiff;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    })
    .slice(0, limit);
}
