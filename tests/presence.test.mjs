import { test } from 'node:test';
import assert from 'node:assert/strict';
import { presence } from '../worker/index.js';
const visitorId = '4c147967-9b70-4165-87c3-2518bcf0b516';
const tabId = '62cb6fca-fd10-45e6-aa6e-a4c1abc3591b';
const req = (body = { visitorId, tabId, action: 'heartbeat' }, extra = {}) => new Request('https://example.test/api/presence', { method: 'POST', headers: { Origin: 'https://example.test', 'Content-Type': 'application/json', ...extra }, body: typeof body === 'string' ? body : JSON.stringify(body) });
test('rejects cross-origin writes before reaching the database', async () => assert.equal((await presence(req(undefined, { Origin: 'https://other.test' }), {})).status, 403));
test('rejects malformed identifiers and oversized input', async () => {
  assert.equal((await presence(req({ visitorId: '<script>', tabId, action: 'heartbeat' }), {})).status, 400);
  assert.equal((await presence(req('x'.repeat(513)), {})).status, 413);
  assert.equal((await presence(req('{'), {})).status, 400);
  assert.equal((await presence(req(undefined, { 'Content-Type': 'text/plain' }), {})).status, 415);
});
test('missing database is unavailable, not zero online', async () => {
  const response = await presence(req(), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).online, undefined);
});
test('limits burst requests without returning a fabricated count', async () => {
  const DB = { prepare: () => ({ bind: () => ({ first: async () => ({ hits: 121 }) }) }) };
  const response = await presence(req(), { DB });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');
});

// Run the real SQL against SQLite, the same query semantics used by D1.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0000_presence.sql', import.meta.url), 'utf8'));
  const wrapper = (sql, args = []) => ({
    bind: (...values) => wrapper(sql, values),
    first: async () => sqlite.prepare(sql).get(...args),
    execute: () => /SELECT|RETURNING/i.test(sql) ? { results: sqlite.prepare(sql).all(...args) } : (sqlite.prepare(sql).run(...args), { results: [] }),
  });
  return { prepare: sql => wrapper(sql), batch: async statements => statements.map(s => s.execute()) };
}
test('real SQL deduplicates tabs, handles leave and expires abandoned browsers', async () => {
  const DB = database();
  const at = 1_000_000;
  const tab2 = 'c18a4f70-867e-4bf8-87c4-861151f1fd46';
  const visitor2 = '6d6e6c7e-e3eb-4fb9-a0cf-7ef3a54ccacc';
  const send = async (v, t, action = 'heartbeat', now = at) => {
    const response = await presence(req({ visitorId: v, tabId: t, action }), { DB }, now);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return (await response.json()).online;
  };
  assert.equal(await send(visitorId, tabId), 1);
  assert.equal(await send(visitorId, tab2), 1);
  assert.equal(await send(visitor2, tabId), 2);
  assert.equal(await send(visitorId, tabId, 'leave'), 2);
  assert.equal(await send(visitorId, tab2, 'leave'), 1);
  assert.equal(await send(visitor2, tabId, 'leave'), 0);
  assert.equal(await send(visitorId, tabId), 1);
  assert.equal(await send(visitor2, tabId, 'heartbeat', at + 90_001), 1);
});
