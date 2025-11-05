/**
 * Suddivide un testo in chunk sovrapposti.
 * Replicato dalla logica dell'app originale per coerenza.
 */
export function chunkText(text, maxChars = 2000, overlap = 200) {
  if (typeof text !== 'string') {
    text = String(text ?? '');
  }
  const normalized = text.trim();
  if (!normalized) return [];

  if (!Number.isFinite(maxChars) || maxChars <= 0) maxChars = 2000;
  if (!Number.isFinite(overlap) || overlap < 0) overlap = 0;
  if (overlap >= maxChars) {
    overlap = Math.floor(maxChars / 4);
  }

  const chunks = [];
  const n = normalized.length;
  let start = 0;

  while (start < n) {
    const end = Math.min(start + maxChars, n);
    chunks.push(normalized.slice(start, end));
    if (end === n) break;
    start = end - overlap;
  }

  return chunks;
}
