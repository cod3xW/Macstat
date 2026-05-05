const ALLOWED_ACTIONS = new Set([
  'today','live','standings','upcoming','nextmatches',
  'match','statistics','lineups','players','events','search'
]);

const ALLOWED_ORIGINS = [
  'https://macstat-git-main-ern2000ylmz-2562s-projects.vercel.app',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
];

// In-memory rate limit (per instance, resets on cold start)
// Provides basic DoS protection within a single serverless instance
const rateMap = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count++;
  }
  rateMap.set(ip, entry);
  // Cleanup old entries periodically
  if (rateMap.size > 500) {
    for (const [key, val] of rateMap) {
      if (now - val.start > RATE_WINDOW) rateMap.delete(key);
    }
  }
  return entry.count <= RATE_LIMIT;
}

function isNumeric(v) { return /^\d{1,10}$/.test(v); }

function sanitizeSearch(v) {
  if (!v || typeof v !== 'string') return '';
  return v.replace(/[^\w\s\-]/g, '').slice(0, 50).trim();
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin || 'null');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Token');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Token kontrolü — zorunlu, koşulsuz
  const appToken = req.headers['x-app-token'];
  if (!appToken || appToken !== process.env.APP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { team, search, action, league, id } = req.query;

  // Input validasyon — whitelist + type check
  if (action !== undefined && !ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  if (team !== undefined && !isNumeric(team)) {
    return res.status(400).json({ error: 'Invalid team' });
  }
  if (id !== undefined && !isNumeric(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (league !== undefined && !isNumeric(league)) {
    return res.status(400).json({ error: 'Invalid league' });
  }

  const BASE = 'https://v3.football.api-sports.io';
  let url;

  if (action === 'search') {
    const q = sanitizeSearch(search);
    if (!q) return res.status(400).json({ error: 'Invalid search query' });
    url = `${BASE}/teams?search=${encodeURIComponent(q)}`;
  } else if (action === 'live') {
    url = `${BASE}/fixtures?live=all`;
  } else if (action === 'today') {
    const today = new Date().toISOString().split('T')[0];
    url = `${BASE}/fixtures?date=${today}`;
  } else if (action === 'standings') {
    if (!league) return res.status(400).json({ error: 'league required' });
    url = `${BASE}/standings?league=${league}&season=2025`;
  } else if (action === 'upcoming') {
    if (!league) return res.status(400).json({ error: 'league required' });
    url = `${BASE}/fixtures?league=${league}&next=10`;
  } else if (action === 'nextmatches') {
    if (!team) return res.status(400).json({ error: 'team required' });
    url = `${BASE}/fixtures?team=${team}&next=5`;
  } else if (action === 'match') {
    if (!id) return res.status(400).json({ error: 'id required' });
    url = `${BASE}/fixtures?id=${id}`;
  } else if (action === 'statistics') {
    if (!id) return res.status(400).json({ error: 'id required' });
    url = `${BASE}/fixtures/statistics?fixture=${id}`;
  } else if (action === 'lineups') {
    if (!id) return res.status(400).json({ error: 'id required' });
    url = `${BASE}/fixtures/lineups?fixture=${id}`;
  } else if (action === 'players') {
    if (!id) return res.status(400).json({ error: 'id required' });
    url = `${BASE}/fixtures/players?fixture=${id}`;
  } else if (action === 'events') {
    if (!id) return res.status(400).json({ error: 'id required' });
    url = `${BASE}/fixtures/events?fixture=${id}`;
  } else if (team && isNumeric(team)) {
    url = `${BASE}/fixtures?team=${team}&last=10`;
  } else {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'x-apisports-key': process.env.API_KEY }
    });
    if (!response.ok) return res.status(502).json({ error: 'Upstream error' });
    const data = await response.json();
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
};
