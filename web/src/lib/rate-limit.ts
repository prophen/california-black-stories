// Tiny in-memory rate limiter for the Ask API endpoint.
// Note: on serverless hosts each instance has its own counter, so this is
// approximate. Good enough to stop accidental cost blowups on a personal app.
// Pair with a monthly spend cap in the OpenAI dashboard for real protection.

const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = hits.get(key) || [];
  const fresh = prev.filter((t) => now - t < windowMs);
  if (fresh.length >= max) {
    hits.set(key, fresh);
    return false;
  }
  fresh.push(now);
  hits.set(key, fresh);
  // Keep the map from growing forever.
  if (hits.size > 1000) {
    const oldest = hits.keys().next().value;
    if (oldest) hits.delete(oldest);
  }
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function limitResponse() {
  return Response.json(
    { error: "Rate limit exceeded. Please wait a bit and try again." },
    { status: 429 },
  );
}
