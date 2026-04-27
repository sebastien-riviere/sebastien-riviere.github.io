// MDConvert — YouTube transcript extractor
// GET /transcript?v=VIDEO_ID&lang=fr → { title, events: [{tStartMs, segs}] }
//
// Strategy 0a: InnerTube ANDROID → timedtext json3/xml
// Strategy 0b: InnerTube TVHTML5_SIMPLY_EMBEDDED_PLAYER → timedtext json3/xml
// Strategy 1:  YouTube watch page → signed timedtext URL
// Strategy 2:  Piped (instances auto-discovered + fallback)
// Strategy 3:  Invidious (instances auto-discovered + fallback)

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip';

// ── Hardcoded fallback instances ───────────────────────────────────────────────
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

// ── Auto-discovery cache (module-level, persists across requests on same isolate) ─
let pipedInstances: string[] = [...PIPED_FALLBACK];
let invidiousInstances: string[] = [...INVIDIOUS_FALLBACK];
let pipedCacheTs = 0;
let invidiousCacheTs = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

// Kick off instance discovery immediately on worker start
discoverAllInstances();

async function discoverAllInstances() {
  await Promise.all([discoverPiped(), discoverInvidious()]);
}

async function discoverPiped() {
  try {
    const r = await fetch('https://piped-instances.kavin.rocks', {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return;
    // deno-lint-ignore no-explicit-any
    const data = await r.json() as any[];
    const instances: string[] = data
      .filter((i) => i.api_url && typeof i.api_url === 'string')
      .map((i) => i.api_url.replace(/\/$/, ''))
      .filter((u) => u.startsWith('https://'))
      .slice(0, 8);
    if (instances.length >= 2) {
      pipedInstances = instances;
      pipedCacheTs = Date.now();
    }
  } catch { /* keep fallback */ }
}

async function discoverInvidious() {
  try {
    const r = await fetch('https://api.invidious.io/instances.json?sort_by=health', {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return;
    // deno-lint-ignore no-explicit-any
    const data = await r.json() as any[];
    const instances: string[] = data
      .filter(([, info]: [string, Record<string, unknown>]) =>
        info.api === true && typeof info.uri === 'string'
      )
      .slice(0, 8)
      .map(([, info]: [string, Record<string, unknown>]) =>
        (info.uri as string).replace(/\/$/, '')
      );
    if (instances.length >= 2) {
      invidiousInstances = instances;
      invidiousCacheTs = Date.now();
    }
  } catch { /* keep fallback */ }
}

// Refresh cache in background when stale (non-blocking)
function maybeRefresh() {
  if (Date.now() - pipedCacheTs > CACHE_TTL) discoverPiped();
  if (Date.now() - invidiousCacheTs > CACHE_TTL) discoverInvidious();
}

// ── Request handler ────────────────────────────────────────────────────────────

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });

  const url = new URL(request.url);
  const videoId = url.searchParams.get('v');
  const lang = url.searchParams.get('lang') || 'fr';
  if (!videoId) return json({ error: 'missing ?v=' }, 400);

  // Refresh stale caches in background (non-blocking)
  maybeRefresh();

  const result0 = await tryInnerTubeAndroid(videoId, lang);
  if (result0) return json(result0);

  const result0b = await tryInnerTubeTVHTML5(videoId, lang);
  if (result0b) return json(result0b);

  const result1 = await tryWatchPage(videoId, lang);
  if (result1) return json(result1);

  for (const base of pipedInstances) {
    const result = await tryPiped(base, videoId, lang);
    if (result) return json(result);
  }

  for (const base of invidiousInstances) {
    const result = await tryInvidious(base, videoId, lang);
    if (result) return json(result);
  }

  return json({ error: 'no_captions' }, 404);
});

// ── InnerTube strategies ───────────────────────────────────────────────────────

async function tryInnerTubeAndroid(videoId: string, preferredLang: string) {
  return tryInnerTubeClient(videoId, preferredLang, {
    name: 'ANDROID', version: '20.10.38', clientNameHeader: '3',
    userAgent: ANDROID_UA, source: 'innertube-android',
  });
}

async function tryInnerTubeTVHTML5(videoId: string, preferredLang: string) {
  return tryInnerTubeClient(videoId, preferredLang, {
    name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', version: '2.0', clientNameHeader: '85',
    userAgent: BROWSER_UA, source: 'innertube-tv',
  });
}

async function tryInnerTubeClient(
  videoId: string, preferredLang: string,
  client: { name: string; version: string; clientNameHeader: string; userAgent: string; source: string },
): Promise<Record<string, unknown> | null> {
  try {
    const playerResp = await fetch('https://www.youtube.com/youtubei/v1/player', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': client.userAgent,
        'X-YouTube-Client-Name': client.clientNameHeader,
        'X-YouTube-Client-Version': client.version,
      },
      body: JSON.stringify({
        context: { client: { clientName: client.name, clientVersion: client.version } },
        videoId,
      }),
    });
    if (!playerResp.ok) return null;

    // deno-lint-ignore no-explicit-any
    const playerData = await playerResp.json() as any;
    const playStatus: string = playerData?.playabilityStatus?.status ?? '';
    const tracks: Array<Record<string, string>> =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return null;

    const title: string = playerData?.videoDetails?.title || videoId;
    const track =
      tracks.find((t) => t.languageCode?.startsWith(preferredLang)) ||
      tracks.find((t) => t.languageCode?.startsWith('en')) ||
      tracks[0];
    if (!track?.baseUrl) return null;

    const captionHeaders = {
      'User-Agent': client.userAgent,
      'Referer': `https://www.youtube.com/watch?v=${videoId}`,
      'Cookie': 'CONSENT=YES+cb; GPS=1',
    };

    // Try json3 first — native events format, no parsing needed
    const j3Resp = await fetch(track.baseUrl + '&fmt=json3', { headers: captionHeaders });
    if (j3Resp.ok) {
      // deno-lint-ignore no-explicit-any
      const j3 = await j3Resp.json() as any;
      const events = filterJson3Events(j3?.events ?? []);
      if (events.length) return { title, events, source: client.source };
    }

    // Fallback: XML
    const xmlResp = await fetch(track.baseUrl, { headers: captionHeaders });
    if (!xmlResp.ok) return null;
    const xml = await xmlResp.text();
    if (!xml || (!xml.includes('<timedtext') && !xml.includes('<transcript'))) return null;
    const events = parseTimedtextXML(xml);
    if (!events.length) return null;
    return { title, events, source: client.source };
  } catch { return null; }
}

function filterJson3Events(rawEvents: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return rawEvents
    .filter((e) => {
      const segs = e.segs as Array<Record<string, string>> | undefined;
      if (!segs?.length) return false;
      return segs.map((s) => s.utf8 ?? '').join('').trim().length > 0;
    })
    .map((e) => ({
      tStartMs: e.tStartMs,
      segs: (e.segs as Array<Record<string, string>>).filter((s) => s.utf8?.trim()),
    }));
}

// ── Watch page strategy ────────────────────────────────────────────────────────

async function tryWatchPage(videoId: string, preferredLang: string): Promise<Record<string, unknown> | null> {
  try {
    const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
      },
    });
    if (!pageResp.ok) return null;
    const cookies = pageResp.headers.get('set-cookie') ?? '';
    const cookieHeader = cookies.split(',').map((c) => c.split(';')[0].trim()).filter(Boolean).join('; ');
    const html = await pageResp.text();
    const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var |const |let |\<\/script)/);
    if (!m) return null;
    const data = JSON.parse(m[1]);
    const tracks: Array<Record<string, string>> =
      data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return null;
    const title: string = data?.videoDetails?.title || videoId;
    const track =
      tracks.find((t) => t.languageCode?.startsWith(preferredLang)) ||
      tracks.find((t) => t.languageCode?.startsWith('en')) ||
      tracks[0];
    if (!track?.baseUrl) return null;
    const vr = await fetch(track.baseUrl + '&fmt=vtt', {
      headers: { 'User-Agent': BROWSER_UA, 'Referer': `https://www.youtube.com/watch?v=${videoId}`,
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}) },
    });
    if (!vr.ok) return null;
    const vtt = await vr.text();
    if (!vtt || !vtt.includes('WEBVTT')) return null;
    const events = parseVTT(vtt);
    if (!events.length) return null;
    return { title, events, source: 'watchpage' };
  } catch { return null; }
}

// ── Piped strategy ─────────────────────────────────────────────────────────────

async function tryPiped(base: string, videoId: string, preferredLang: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(`${base}/streams/${videoId}`, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    // deno-lint-ignore no-explicit-any
    const j = await r.json() as any;
    if (!j?.subtitles?.length) return null;
    const title: string = j.title || videoId;
    const subs: Array<Record<string, string>> = j.subtitles;
    const track =
      subs.find((s) => s.code?.startsWith(preferredLang) && !s.autoGenerated) ||
      subs.find((s) => s.code?.startsWith('en') && !s.autoGenerated) ||
      subs.find((s) => s.code?.startsWith(preferredLang)) ||
      subs.find((s) => s.code?.startsWith('en')) || subs[0];
    if (!track?.url) return null;
    const trackUrl = new URL(track.url);
    trackUrl.searchParams.set('fmt', 'vtt');
    const vr = await fetch(trackUrl.toString(), {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!vr.ok) return null;
    const vtt = await vr.text();
    if (!vtt || !vtt.includes('WEBVTT')) return null;
    const events = parseVTT(vtt);
    if (!events.length) return null;
    return { title, events, source: `piped:${base}` };
  } catch { return null; }
}

// ── Invidious strategy ─────────────────────────────────────────────────────────

async function tryInvidious(base: string, videoId: string, preferredLang: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(`${base}/api/v1/captions/${videoId}`, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    // deno-lint-ignore no-explicit-any
    const j = await r.json() as any;
    const captions: Array<Record<string, string>> = j?.captions ?? [];
    if (!captions.length) return null;
    const track =
      captions.find((c) => c.languageCode?.startsWith(preferredLang)) ||
      captions.find((c) => c.languageCode?.startsWith('en')) || captions[0];
    if (!track?.url) return null;
    const vttUrl = track.url.startsWith('http') ? track.url : base + track.url;
    const vr = await fetch(vttUrl, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!vr.ok) return null;
    const vtt = await vr.text();
    if (!vtt || vtt.length < 50 || !vtt.includes('WEBVTT')) return null;
    const events = parseVTT(vtt);
    if (!events.length) return null;
    return { title: videoId, events, source: `invidious:${base}` };
  } catch { return null; }
}

// ── Parsers ────────────────────────────────────────────────────────────────────

function parseTimedtextXML(xml: string): Array<Record<string, unknown>> {
  const raw: Array<{ tStartMs: number; text: string }> = [];
  const pRegex = /<p\b[^>]*\bt="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = pRegex.exec(xml)) !== null) {
    const tStartMs = parseInt(m[1]);
    const text = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
    if (text) raw.push({ tStartMs, text });
  }
  const events: Array<Record<string, unknown>> = [];
  let prevText = '';
  for (const { tStartMs, text } of raw) {
    if (text === prevText || prevText.endsWith(text)) continue;
    const newText = stripOverlap(prevText, text);
    prevText = text;
    if (newText) events.push({ tStartMs, segs: [{ utf8: newText }] });
  }
  return events;
}

function stripOverlap(prev: string, curr: string): string {
  if (!prev) return curr;
  const pw = prev.split(' '), cw = curr.split(' ');
  for (let i = Math.min(pw.length, cw.length); i >= 1; i--) {
    if (pw.slice(-i).join(' ') === cw.slice(0, i).join(' ')) {
      const rest = cw.slice(i).join(' ');
      if (rest) return rest;
      break;
    }
  }
  return curr;
}

function parseVTT(vtt: string): Array<Record<string, unknown>> {
  const events: Array<Record<string, unknown>> = [];
  for (const block of vtt.split(/\n{2,}/)) {
    const m = block.match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->/);
    if (!m) continue;
    const tStartMs = (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 + +m[4];
    const text = block.split('\n').slice(1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (text) events.push({ tStartMs, segs: [{ utf8: text }] });
  }
  return events;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(), 'Content-Type': 'application/json' },
  });
}
