/**
 * Natural language search query parser.
 * Extracts date ranges, file types, departments, categories, and uploader
 * from a free-text query string.
 */

// ---------------------------------------------------------------------------
// Date helpers (no external dependency)
// ---------------------------------------------------------------------------
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function subDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}

function subMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - n);
  return d;
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

// ---------------------------------------------------------------------------
// Date patterns (order matters — longer patterns first)
// ---------------------------------------------------------------------------
const DATE_PATTERNS = [
  {
    pattern: /\blast week\b/i,
    resolve: () => ({ start: startOfDay(subDays(new Date(), 7)), end: endOfDay(new Date()) }),
  },
  {
    pattern: /\blast month\b/i,
    resolve: () => ({ start: startOfDay(subMonths(new Date(), 1)), end: endOfDay(new Date()) }),
  },
  {
    pattern: /\blast year\b/i,
    resolve: () => ({ start: startOfDay(subMonths(new Date(), 12)), end: endOfDay(new Date()) }),
  },
  {
    pattern: /\bthis year\b/i,
    resolve: () => ({ start: startOfYear(new Date()), end: endOfDay(new Date()) }),
  },
  {
    pattern: /\bthis month\b/i,
    resolve: () => {
      const now = new Date();
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
    },
  },
  {
    pattern: /\byesterday\b/i,
    resolve: () => {
      const yesterday = subDays(new Date(), 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    },
  },
  {
    pattern: /\btoday\b/i,
    resolve: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }),
  },
  {
    pattern: /\bin (\d{4})\b/i,
    resolve: (match) => {
      const year = parseInt(match[1]);
      return {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31, 23, 59, 59),
      };
    },
  },
];

// ---------------------------------------------------------------------------
// File type keywords
// ---------------------------------------------------------------------------
const FILE_TYPE_MAP = {
  pdf: 'PDF',
  pdfs: 'PDF',
  word: 'DOCX',
  doc: 'DOCX',
  docx: 'DOCX',
  excel: 'XLSX',
  spreadsheet: 'XLSX',
  xlsx: 'XLSX',
  image: 'PNG,JPG,JPEG',
  images: 'PNG,JPG,JPEG',
  photo: 'PNG,JPG,JPEG',
  jpg: 'PNG,JPG,JPEG',
  jpeg: 'PNG,JPG,JPEG',
  png: 'PNG,JPG,JPEG',
};

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a natural language search query into structured filters.
 *
 * @param {string} rawQuery - The raw user input
 * @param {Array} departments - [{id, name}] from API
 * @param {Array} categories - [{id, name}] from API
 * @returns {{
 *   search: string,
 *   dateRange: {start: Date, end: Date} | null,
 *   fileTypes: string[],
 *   departments: string[],
 *   categories: string[],
 *   parsedTokens: string[]  — list of what was extracted (for chips UI)
 * }}
 */
export function parseSearchQuery(rawQuery, departments = [], categories = []) {
  let query = rawQuery || '';

  const result = {
    search: '',
    dateRange: null,
    fileTypes: [],
    departments: [],
    categories: [],
    parsedTokens: [], // Human-readable labels for chips
  };

  // 1. Extract date ranges
  for (const { pattern, resolve } of DATE_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      result.dateRange = resolve(match);
      const label = match[0].replace(/^in /, 'Year: ');
      result.parsedTokens.push(`📅 ${label.charAt(0).toUpperCase() + label.slice(1)}`);
      query = query.replace(pattern, ' ').trim();
      break; // Only one date range
    }
  }

  // 2. Extract file types (word-by-word)
  const words = query.toLowerCase().split(/\s+/);
  const extractedTypes = new Set();
  const consumedWords = new Set();

  words.forEach((word, idx) => {
    const normalized = word.replace(/s$/, ''); // simple plural strip
    const fileType = FILE_TYPE_MAP[word] || FILE_TYPE_MAP[normalized];
    if (fileType && !extractedTypes.has(fileType)) {
      extractedTypes.add(fileType);
      consumedWords.add(idx);
      result.parsedTokens.push(`📄 ${fileType}`);
    }
  });

  if (extractedTypes.size > 0) {
    result.fileTypes = [...extractedTypes];
    // Remove consumed words from query
    const remainingWords = words.filter((_, i) => !consumedWords.has(i));
    query = remainingWords.join(' ').trim();
  }

  // 3. Extract department names
  if (departments.length) {
    for (const dept of departments) {
      const regex = new RegExp(`\\b${escapeRegex(dept.name)}\\b`, 'i');
      if (regex.test(query)) {
        result.departments.push(dept.id);
        result.parsedTokens.push(`🏢 ${dept.name}`);
        query = query.replace(regex, ' ').trim();
      }
    }
  }

  // 4. Extract category names
  if (categories.length) {
    for (const cat of categories) {
      const regex = new RegExp(`\\b${escapeRegex(cat.name)}\\b`, 'i');
      if (regex.test(query)) {
        result.categories.push(cat.id);
        result.parsedTokens.push(`${cat.icon || '🏷️'} ${cat.name}`);
        query = query.replace(regex, ' ').trim();
      }
    }
  }

  // 5. Strip filler words (prepositions, articles)
  const fillerWords = ['in', 'from', 'about', 'the', 'a', 'an', 'by', 'for', 'of', 'uploaded'];
  const cleanedWords = query
    .split(/\s+/)
    .filter(w => w.length > 0 && !fillerWords.includes(w.toLowerCase()));

  result.search = cleanedWords.join(' ').trim();

  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a document matches a given dateRange filter.
 * @param {Object} doc
 * @param {{start: Date, end: Date}} dateRange
 * @returns {boolean}
 */
export function documentMatchesDateRange(doc, dateRange) {
  if (!dateRange) return true;
  const created = new Date(doc.createdAt);
  return created >= dateRange.start && created <= dateRange.end;
}
