// Camping Sofia leaderboard: a small Cloud Run service in front of Firestore.
//   GET  /top    -> { week: [...], all: [...] }   the twenty best scores of this week and of all time
//   POST /score  -> { name, score, parked, time } stores a score and answers with the same lists plus its place
// Only a nickname and the figures of a shift are stored. No addresses, no cookies; the caller's IP is used in
// memory for rate limiting and never written anywhere.
'use strict';
const http = require('http');

const PORT = process.env.PORT || 8080;
const ORIGINS = (process.env.ORIGINS || 'https://camping-sofia.com,https://www.camping-sofia.com').split(',');
const TOP = 20;

// ---- storage: Firestore in the cloud, plain arrays when MEMORY=1 (local runs and tests) ----
let store;
if (process.env.MEMORY === '1') {
  const rows = [];
  store = {
    async add(row) { rows.push(row); },
    async top(week) { return rows.filter((r) => !week || r.week === week).sort((a, b) => b.score - a.score).slice(0, TOP * 4); },
    async place(score, week) { return rows.filter((r) => (!week || r.week === week) && r.score > score).length + 1; },
  };
} else {
  const { Firestore } = require('@google-cloud/firestore');
  const db = new Firestore();
  const col = (week) => (week ? db.collection('weeks').doc(week).collection('scores') : db.collection('scores'));
  store = {
    async add(row) { await Promise.all([col().add(row), col(row.week).add(row)]); },
    async top(week) { return (await col(week).orderBy('score', 'desc').limit(TOP * 4).get()).docs.map((d) => d.data()); },
    async place(score, week) { return (await col(week).where('score', '>', score).count().get()).data().count + 1; },
  };
}

// ISO week, e.g. 2026-W46: the weekly board starts again every Monday (UTC).
function weekOf(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const n = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(n).padStart(2, '0')}`;
}

const pub = (r) => ({ name: r.name, score: r.score, parked: r.parked });
let cache = null, cacheAt = 0;
async function lists(fresh) {
  if (!fresh && cache && Date.now() - cacheAt < 15000) return cache;
  const [week, all] = await Promise.all([store.top(weekOf()), store.top()]);
  // one row per nickname: a player's best
  const bestOf = (rows) => { const seen = new Set(); return rows.filter((r) => { const k = r.name.toLowerCase(); return seen.has(k) ? false : seen.add(k); }).slice(0, TOP).map(pub); };
  cache = { week: bestOf(week), all: bestOf(all) }; cacheAt = Date.now();
  return cache;
}

// A nickname: 1 to 16 visible characters, no markup.
function cleanName(s) {
  if (typeof s !== 'string') return '';
  return s.normalize('NFC').replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
}
// Figures a real shift could have produced. This keeps out typos and lazy cheating, not a determined cheat.
function plausible(b) {
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  return int(b.score, 1, 200000) && int(b.parked, 0, 500) && int(b.time, 0, 36000)
    && b.score <= b.parked * 1400 + 600 && b.time >= b.parked * 4;
}

const hits = new Map();   // ip -> timestamps of recent posts
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 6;
}

function send(res, code, body, origin) {
  const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origin) { h['Access-Control-Allow-Origin'] = origin; h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'; h['Access-Control-Allow-Headers'] = 'Content-Type'; h['Access-Control-Max-Age'] = '86400'; }
  res.writeHead(code, h); res.end(body === undefined ? '' : JSON.stringify(body));
}

http.createServer(async (req, res) => {
  const o = req.headers.origin, origin = o && (ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) ? o : '';
  const path = req.url.split('?')[0];
  try {
    if (req.method === 'OPTIONS') return send(res, 204, undefined, origin);
    if (req.method === 'GET' && path === '/top') return send(res, 200, await lists(), origin);
    if (req.method === 'GET' && path === '/') return send(res, 200, { ok: true }, origin);
    if (req.method === 'POST' && path === '/score') {
      if (o && !origin) return send(res, 403, { error: 'origin' }, origin);
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      if (limited(ip)) return send(res, 429, { error: 'slow down' }, origin);
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 2000) return send(res, 413, { error: 'too large' }, origin); }
      let b;
      try { b = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'json' }, origin); }
      const name = cleanName(b && b.name);
      if (!name || !plausible(b)) return send(res, 400, { error: 'invalid' }, origin);
      const week = weekOf();
      await store.add({ name, score: b.score, parked: b.parked, time: b.time, week, at: new Date() });
      const [placeWeek, placeAll, top] = await Promise.all([store.place(b.score, week), store.place(b.score), lists(true)]);
      return send(res, 200, { placeWeek, placeAll, ...top }, origin);
    }
    return send(res, 404, { error: 'not found' }, origin);
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: 'server' }, origin);
  }
}).listen(PORT, () => console.log(`leaderboard on ${PORT}`));
