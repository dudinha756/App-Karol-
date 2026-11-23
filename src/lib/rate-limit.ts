/** Best-effort per-process guard. Add a shared edge/WAF limiter for distributed protection. */
const hits = new Map<string, number[]>();
export function allowAttempt(key: string, max = 8, windowMs = 15 * 60_000): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, values] of hits) if (!values.some(t => now - t < windowMs)) hits.delete(k);
  }
  const recent = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
