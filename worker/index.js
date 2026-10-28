const TTL = 90_000;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (value, status = 200, extra = {}) => new Response(JSON.stringify(value), { status, headers: { ...headers, ...extra } });

export async function presence(request, env, now = Date.now()) {
  const url = new URL(request.url);
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST' });
  // Do not allow another website to submit or read this site's presence.
  if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'forbidden' }, 403);
  if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) return json({ error: 'unsupported_media_type' }, 415);
  if (Number(request.headers.get('Content-Length') || 0) > 512) return json({ error: 'payload_too_large' }, 413);
  const reader = request.body?.getReader();
  let size = 0;
  const chunks = [];
  if (!reader) return json({ error: 'invalid_payload' }, 400);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 512) { await reader.cancel(); return json({ error: 'payload_too_large' }, 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let body;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json({ error: 'invalid_payload' }, 400); }
  if (!body || !ID.test(body.visitorId || '') || !ID.test(body.tabId || '') || !['heartbeat', 'leave'].includes(body.action)) return json({ error: 'invalid_payload' }, 400);
  if (!env.DB) return json({ error: 'service_unavailable' }, 503);

  // Short-lived rate bucket: raw IPs and browsing paths are never stored.
  const bucket = Math.floor(now / 60_000);
  const address = request.headers.get('CF-Connecting-IP') || 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${bucket}:${address}:${request.headers.get('User-Agent') || ''}`));
  const rateKey = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const limit = await env.DB.prepare('INSERT INTO presence_limits (key, hits, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = hits + 1 RETURNING hits').bind(rateKey, now + 120_000).first();
  if (!limit || limit.hits > 120) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });
  const write = body.action === 'leave'
    ? env.DB.prepare('DELETE FROM presence_sessions WHERE visitor_id = ? AND tab_id = ?').bind(body.visitorId, body.tabId)
    : env.DB.prepare('INSERT INTO presence_sessions (visitor_id, tab_id, expires_at) VALUES (?, ?, ?) ON CONFLICT(visitor_id, tab_id) DO UPDATE SET expires_at = excluded.expires_at').bind(body.visitorId, body.tabId, now + TTL);
  const result = await env.DB.batch([
    env.DB.prepare('DELETE FROM presence_sessions WHERE expires_at <= ?').bind(now),
    env.DB.prepare('DELETE FROM presence_limits WHERE expires_at <= ?').bind(now),
    write,
    env.DB.prepare('SELECT COUNT(DISTINCT visitor_id) AS online FROM presence_sessions WHERE expires_at > ?').bind(now),
  ]);
  return json({ online: result[3].results[0].online, updatedAt: now, interval: 15, expiresIn: 90 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/presence' || url.pathname === '/api/presence/') {
      try { return await presence(request, env); }
      catch (error) { console.error('Presence unavailable', error instanceof Error ? error.name : 'UnknownError'); return json({ error: 'service_unavailable' }, 503); }
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    if (!env.ASSETS) return new Response('Static assets unavailable', { status: 503 });
    return env.ASSETS.fetch(request);
  },
};
