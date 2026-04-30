// MDConvert — YouTube transcript extractor (Cloudflare Workers)
// GET /transcript?v=VIDEO_ID&lang=fr
// Secrets: SUPADATA_KEY (optional)
// Bindings: AI (Cloudflare Workers AI, optional)

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip';

const PIPED_FALLBACK = [
  'https://api.piped.private.coffee',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.kavin.rocks',
  'https://watchapi.whatever.social',
];
const INVIDIOUS_FALLBACK = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yt.artemislena.eu',
  'https://invidious.privacydev.net',
];

let pipedInstances = [...PIPED_FALLBACK];
let invidiousInstances = [...INVIDIOUS_FALLBACK];
let pipedCacheTs = 0, invidiousCacheTs = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function discoverPiped() {
  try {
    const r = await fetch('https://piped-instances.kavin.rocks', { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return;
    const data = await r.json();
    const instances = data.filter(i => i.api_url?.startsWith('https://')).map(i => i.api_url.replace(/\/$/, '')).slice(0, 8);
    if (instances.length >= 2) { pipedInstances = instances; pipedCacheTs = Date.now(); }
  } catch {}
}

async function discoverInvidious() {
  try {
    const r = await fetch('https://api.invidious.io/instances.json?sort_by=health', { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return;
    const data = await r.json();
    const instances = data.filter(([, i]) => i.api === true && i.uri?.startsWith('https://')).slice(0, 8).map(([, i]) => i.uri.replace(/\/$/, ''));
    if (instances.length >= 2) { invidiousInstances = instances; invidiousCacheTs = Date.now(); }
  } catch {}
}

function maybeRefresh() {
  if (Date.now() - pipedCacheTs > CACHE_TTL) discoverPiped();
  if (Date.now() - invidiousCacheTs > CACHE_TTL) discoverInvidious();
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });

    const url = new URL(request.url);
    const videoId = url.searchParams.get('v');
    const lang = url.searchParams.get('lang') || 'fr';
    if (!videoId) return json({ error: 'missing ?v=' }, 400);

    maybeRefresh();

    // Strategy 1: InnerTube (works from residential IPs, blocked from cloud — kept for completeness)
    const r0 = await tryInnerTubeClient(videoId, lang, { name: 'ANDROID', version: '20.10.38', id: '3', ua: ANDROID_UA, src: 'android' });
    if (r0) return json(r0);

    const r0b = await tryInnerTubeClient(videoId, lang, { name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', version: '2.0', id: '85', ua: BROWSER_UA, src: 'tv' });
    if (r0b) return json(r0b);

    // Strategy 2: Watch page HTML parsing
    const r1 = await tryWatchPage(videoId, lang);
    if (r1) return json(r1);

    // Strategy 3: Supadata API (requires SUPADATA_KEY secret — reliable, handles ASR)
    const rSup = await trySupadata(videoId, lang, env);
    if (rSup) return json(rSup);

    // Strategy 4: Piped instances (auto-discovered, works for manual captions)
    for (const base of pipedInstances) {
      const r = await tryPiped(base, videoId, lang);
      if (r) return json(r);
    }

    // Strategy 5: Invidious instances (auto-discovered)
    for (const base of invidiousInstances) {
      const r = await tryInvidious(base, videoId, lang);
      if (r) return json(r);
    }

    // Strategy 6: Whisper via Cloudflare Workers AI (audio transcription, no caption dependency)
    const rWhisper = await tryWhisper(videoId, lang, env);
    if (rWhisper) return json(rWhisper);

    return json({ error: 'no_captions' }, 404);
  }
};

// ── InnerTube ──────────────────────────────────────────────────────────────

async function tryInnerTubeClient(videoId, lang, client) {
  try {
    const r = await fetch('https://www.youtube.com/youtubei/v1/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': client.ua, 'X-YouTube-Client-Name': client.id, 'X-YouTube-Client-Version': client.version },
      body: JSON.stringify({ context: { client: { clientName: client.name, clientVersion: client.version, hl: 'en', gl: 'US', ...(client.name === 'ANDROID' ? { androidSdkVersion: 30, userAgent: client.ua } : {}) } }, videoId }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const tracks = d?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return null;
    const title = d?.videoDetails?.title || videoId;
    const track = tracks.find(t => t.languageCode?.startsWith(lang)) || tracks.find(t => t.languageCode?.startsWith('en')) || tracks[0];
    if (!track?.baseUrl) return null;
    const hdrs = { 'User-Agent': client.ua, 'Referer': `https://www.youtube.com/watch?v=${videoId}`, 'Cookie': 'CONSENT=YES+cb; GPS=1' };
    const j3r = await fetch(track.baseUrl + '&fmt=json3', { headers: hdrs });
    if (j3r.ok) {
      const j3 = await j3r.json();
      const events = (j3?.events ?? []).filter(e => e.segs?.some(s => s.utf8?.trim())).map(e => ({ tStartMs: e.tStartMs, segs: e.segs.filter(s => s.utf8?.trim()) }));
      if (events.length) return { title, events, source: client.src };
    }
    const xr = await fetch(track.baseUrl, { headers: hdrs });
    if (!xr.ok) return null;
    const xml = await xr.text();
    if (!xml || (!xml.includes('<timedtext') && !xml.includes('<transcript'))) return null;
    const events = parseXML(xml);
    return events.length ? { title, events, source: client.src } : null;
  } catch { return null; }
}

// ── Watch Page ─────────────────────────────────────────────────────────────

async function tryWatchPage(videoId, lang) {
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'fr-FR,fr;q=0.9', 'Cookie': 'CONSENT=YES+cb' } });
    if (!r.ok) return null;
    const cookies = r.headers.get('set-cookie')?.split(',').map(c => c.split(';')[0].trim()).filter(Boolean).join('; ') ?? '';
    const html = await r.text();
    const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var |const |let |<\/script)/);
    if (!m) return null;
    const data = JSON.parse(m[1]);
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return null;
    const title = data?.videoDetails?.title || videoId;
    const track = tracks.find(t => t.languageCode?.startsWith(lang)) || tracks.find(t => t.languageCode?.startsWith('en')) || tracks[0];
    if (!track?.baseUrl) return null;
    const vr = await fetch(track.baseUrl + '&fmt=vtt', { headers: { 'User-Agent': BROWSER_UA, 'Referer': `https://www.youtube.com/watch?v=${videoId}`, ...(cookies ? { 'Cookie': cookies } : {}) } });
    if (!vr.ok) return null;
    const vtt = await vr.text();
    if (!vtt?.includes('WEBVTT')) return null;
    const events = parseVTT(vtt);
    return events.length ? { title, events, source: 'watchpage' } : null;
  } catch { return null; }
}

// ── Supadata API ───────────────────────────────────────────────────────────

async function trySupadata(videoId, lang, env) {
  if (!env?.SUPADATA_KEY) return null;
  try {
    // Try with requested lang first, then without lang filter
    for (const qs of [`videoId=${videoId}&lang=${lang}`, `videoId=${videoId}`]) {
      const r = await fetch(`https://api.supadata.ai/v1/youtube/transcript?${qs}`, {
        headers: { 'x-api-key': env.SUPADATA_KEY, 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const content = j?.content ?? [];
      if (!content.length) continue;
      const events = content
        .map(c => ({ tStartMs: Math.round((c.offset ?? c.start ?? 0) * 1000), segs: [{ utf8: (c.text ?? c.content ?? '').trim() }] }))
        .filter(e => e.segs[0].utf8);
      if (events.length) return { title: j?.title || videoId, events, source: 'supadata' };
    }
    return null;
  } catch { return null; }
}

// ── Piped ──────────────────────────────────────────────────────────────────

async function tryPiped(base, videoId, lang) {
  try {
    const r = await fetch(`${base}/streams/${videoId}`, { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j?.subtitles?.length) return null;
    const subs = j.subtitles;
    const track = subs.find(s => s.code?.startsWith(lang) && !s.autoGenerated) || subs.find(s => s.code?.startsWith(lang)) || subs[0];
    if (!track?.url) return null;
    const u = new URL(track.url); u.searchParams.set('fmt', 'vtt');
    const vr = await fetch(u.toString(), { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(6000) });
    if (!vr.ok) return null;
    const vtt = await vr.text();
    if (!vtt?.includes('WEBVTT')) return null;
    const events = parseVTT(vtt);
    return events.length ? { title: j.title || videoId, events, source: `piped:${base}` } : null;
  } catch { return null; }
}

// ── Invidious ──────────────────────────────────────────────────────────────

async function tryInvidious(base, videoId, lang) {
  try {
    const r = await fetch(`${base}/api/v1/captions/${videoId}`, { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    const captions = j?.captions ?? [];
    if (!captions.length) return null;
    const track = captions.find(c => c.languageCode?.startsWith(lang)) || captions.find(c => c.languageCode?.startsWith('en')) || captions[0];
    if (!track?.url) return null;
    const vttUrl = track.url.startsWith('http') ? track.url : base + track.url;
    const vr = await fetch(vttUrl, { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(6000) });
    if (!vr.ok) return null;
    const vtt = await vr.text();
    if (!vtt || vtt.length < 50 || !vtt.includes('WEBVTT')) return null;
    const events = parseVTT(vtt);
    return events.length ? { title: videoId, events, source: `invidious:${base}` } : null;
  } catch { return null; }
}

// ── Whisper (Cloudflare Workers AI) ───────────────────────────────────────

async function tryWhisper(videoId, lang, env) {
  if (!env?.AI) return null;
  try {
    // Get lowest-bitrate audio stream from Piped
    let audioUrl = null;
    for (const base of pipedInstances) {
      try {
        const r = await fetch(`${base}/streams/${videoId}`, { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(6000) });
        if (!r.ok) continue;
        const j = await r.json();
        const streams = (j?.audioStreams ?? []).sort((a, b) => (a.bitrate ?? 0) - (b.bitrate ?? 0));
        if (streams.length) { audioUrl = streams[0].url; break; }
      } catch {}
    }
    if (!audioUrl) return null;

    // Fetch audio with 10 MB cap (≈ 10 min @ 128 kbps)
    const audioResp = await fetch(audioUrl, { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(45000) });
    if (!audioResp.ok) return null;

    const reader = audioResp.body.getReader();
    const chunks = [];
    let totalSize = 0;
    const MAX_BYTES = 10 * 1024 * 1024;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
      if (totalSize >= MAX_BYTES) { reader.cancel(); break; }
    }

    const audioBuffer = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) { audioBuffer.set(chunk, offset); offset += chunk.length; }

    const result = await env.AI.run('@cf/openai/whisper', { audio: [...audioBuffer] });
    if (!result?.text?.trim()) return null;

    // Build events — use word timestamps if available, else chunk the text
    let events;
    if (result.words?.length > 3) {
      events = [];
      let segStartMs = Math.round(result.words[0].start * 1000);
      let segStartSec = result.words[0].start;
      let segWords = [];
      for (const w of result.words) {
        segWords.push(w.word);
        if (w.end - segStartSec >= 5) {
          events.push({ tStartMs: segStartMs, segs: [{ utf8: segWords.join('').trim() }] });
          segStartMs = Math.round(w.end * 1000);
          segStartSec = w.end;
          segWords = [];
        }
      }
      if (segWords.length) events.push({ tStartMs: segStartMs, segs: [{ utf8: segWords.join('').trim() }] });
    } else {
      const words = result.text.trim().split(/\s+/);
      const CHUNK = 25;
      events = [];
      for (let i = 0; i < words.length; i += CHUNK) {
        events.push({ tStartMs: i * 200, segs: [{ utf8: words.slice(i, i + CHUNK).join(' ') }] });
      }
    }

    return events.length ? { title: videoId, events, source: 'whisper' } : null;
  } catch { return null; }
}

// ── Parsers ────────────────────────────────────────────────────────────────

function parseXML(xml) {
  const raw = [];
  const re = /<p\b[^>]*\bt="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
    if (text) raw.push({ tStartMs: parseInt(m[1]), text });
  }
  const events = [];
  let prev = '';
  for (const { tStartMs, text } of raw) {
    if (text === prev || prev.endsWith(text)) continue;
    const pw = prev.split(' '), cw = text.split(' ');
    let newText = text;
    for (let i = Math.min(pw.length, cw.length); i >= 1; i--) {
      if (pw.slice(-i).join(' ') === cw.slice(0, i).join(' ')) { newText = cw.slice(i).join(' ') || text; break; }
    }
    prev = text;
    if (newText) events.push({ tStartMs, segs: [{ utf8: newText }] });
  }
  return events;
}

function parseVTT(vtt) {
  const events = [];
  for (const block of vtt.split(/\n{2,}/)) {
    const m = block.match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->/);
    if (!m) continue;
    const tStartMs = (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 + +m[4];
    const text = block.split('\n').slice(1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (text) events.push({ tStartMs, segs: [{ utf8: text }] });
  }
  return events;
}

function cors() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...cors(), 'Content-Type': 'application/json' } }); }
