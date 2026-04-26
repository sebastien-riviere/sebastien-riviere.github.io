// MDConvert — YouTube transcript extractor
// GET /transcript?v=VIDEO_ID&lang=fr → { title, events: [{tStartMs, segs}] }
//
// Strategy 0: InnerTube ANDROID API → timedtext XML (works without PoToken)
// Strategy 1: YouTube watch page → extract signed timedtext URL → fetch with cookies
// Strategy 2: Piped API (fmt forced to vtt)
// Strategy 3: Invidious API

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip';

const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.kavin.rocks',
];

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yt.artemislena.eu',
  'https://invidious.privacydev.net',
];

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });

  const url = new URL(request.url);
  const videoId = url.searchParams.get('v');
  const lang = url.searchParams.get('lang') || 'fr';
  if (!videoId) return json({ error: 'missing ?v=' }, 400);

  // Strategy 0: InnerTube ANDROID (avoids PoToken requirement)
  const result0 = await tryInnerTubeAndroid(videoId, lang);
  if (result0) return json(result0);

  // Strategy 1: YouTube watch page + cookies → timedtext
  const result1 = await tryWatchPage(videoId, lang);
  if (result1) return json(result1);

  // Strategy 2: Piped
  for (const base of PIPED_INSTANCES) {
    const result = await tryPiped(base, videoId, lang);
    if (result) return json(result);
  }

  // Strategy 3: Invidious
  for (const base of INVIDIOUS_INSTANCES) {
    const result = await tryInvidious(base, videoId, lang);
    if (result) return json(result);
  }

  return json({ error: 'no_captions' }, 404);
});

// ── Strategy 0: InnerTube ANDROID → timedtext XML ─────────────────────────────
// Uses ANDROID client to get caption URLs without &exp=xpe (no PoToken required)

async function tryInnerTubeAndroid(
  videoId: string,
  preferredLang: string,
): Promise<Record<string, unknown> | null> {
  try {
    // POST directly — no API key needed since 2023, avoids watch-page consent wall on server IPs
    const playerResp = await fetch(
      'https://www.youtube.com/youtubei/v1/player',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': ANDROID_UA,
          'X-YouTube-Client-Name': '3',
          'X-YouTube-Client-Version': '20.10.38',
        },
        body: JSON.stringify({
          context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
          videoId,
        }),
      },
    );
    if (!playerResp.ok) return null;

    // deno-lint-ignore no-explicit-any
    const playerData = await playerResp.json() as any;
    const tracks: Array<Record<string, string>> =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return null;

    const title: string = playerData?.videoDetails?.title || videoId;

    const track =
      tracks.find((t) => t.languageCode?.startsWith(preferredLang)) ||
      tracks.find((t) => t.languageCode?.startsWith('en')) ||
      tracks[0];

    if (!track?.baseUrl) return null;

    // Step 3: Fetch the timedtext XML
    const xmlResp = await fetch(track.baseUrl, {
      headers: { 'User-Agent': BROWSER_UA },
    });
    if (!xmlResp.ok) return null;

    const xml = await xmlResp.text();
    if (!xml || !xml.includes('<timedtext') && !xml.includes('<transcript')) return null;

    const events = parseTimedtextXML(xml);
    if (!events.length) return null;

    return { title, events, source: 'innertube-android' };
  } catch { return null; }
}

// ── Strategy 1: fetch watch page, capture cookies, fetch timedtext with cookies ─

async function tryWatchPage(
  videoId: string,
  preferredLang: string,
): Promise<Record<string, unknown> | null> {
  try {
    const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    if (!pageResp.ok) return null;

    const cookies = pageResp.headers.get('set-cookie') ?? '';
    const cookieHeader = cookies
      .split(',')
      .map((c) => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');

    const html = await pageResp.text();

    const m = html.match(
      /ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var |const |let |\<\/script)/,
    );
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

    const vttUrl = track.baseUrl + '&fmt=vtt';
    const vr = await fetch(vttUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Referer': `https://www.youtube.com/watch?v=${videoId}`,
        'Origin': 'https://www.youtube.com',
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      },
    });
    if (!vr.ok) return null;

    const vtt = await vr.text();
    if (!vtt || !vtt.includes('WEBVTT')) return null;

    const events = parseVTT(vtt);
    if (!events.length) return null;

    return { title, events, source: 'watchpage' };
  } catch { return null; }
}

// ── Strategy 2: Piped ─────────────────────────────────────────────────────────

async function tryPiped(
  base: string,
  videoId: string,
  preferredLang: string,
): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(`${base}/streams/${videoId}`, {
      headers: { 'User-Agent': BROWSER_UA },
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
      subs.find((s) => s.code?.startsWith('en')) ||
      subs[0];

    if (!track?.url) return null;

    const trackUrl = new URL(track.url);
    trackUrl.searchParams.set('fmt', 'vtt');

    const vr = await fetch(trackUrl.toString(), {
      headers: { 'User-Agent': BROWSER_UA },
    });
    if (!vr.ok) return null;

    const vtt = await vr.text();
    if (!vtt || !vtt.includes('WEBVTT')) return null;

    const events = parseVTT(vtt);
    if (!events.length) return null;

    return { title, events, source: `piped:${base}` };
  } catch { return null; }
}

// ── Strategy 3: Invidious ─────────────────────────────────────────────────────

async function tryInvidious(
  base: string,
  videoId: string,
  preferredLang: string,
): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(`${base}/api/v1/captions/${videoId}`, {
      headers: { 'User-Agent': BROWSER_UA },
    });
    if (!r.ok) return null;

    // deno-lint-ignore no-explicit-any
    const j = await r.json() as any;
    const captions: Array<Record<string, string>> = j?.captions ?? [];
    if (!captions.length) return null;

    const track =
      captions.find((c) => c.languageCode?.startsWith(preferredLang)) ||
      captions.find((c) => c.languageCode?.startsWith('en')) ||
      captions[0];

    if (!track?.url) return null;

    const vttUrl = track.url.startsWith('http') ? track.url : base + track.url;
    const vr = await fetch(vttUrl, { headers: { 'User-Agent': BROWSER_UA } });
    if (!vr.ok) return null;

    const vtt = await vr.text();
    if (!vtt || vtt.length < 50 || !vtt.includes('WEBVTT')) return null;

    const events = parseVTT(vtt);
    if (!events.length) return null;

    return { title: videoId, events, source: `invidious:${base}` };
  } catch { return null; }
}

// ── Timedtext XML parser (format 3, from ANDROID InnerTube) ───────────────────
// Parses <p t="MS" d="DUR"><s>word</s>...</p> elements

function parseTimedtextXML(xml: string): Array<Record<string, unknown>> {
  const raw: Array<{ tStartMs: number; text: string }> = [];
  const pRegex = /<p\b[^>]*\bt="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = pRegex.exec(xml)) !== null) {
    const tStartMs = parseInt(m[1]);
    const text = m[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) raw.push({ tStartMs, text });
  }
  // Rolling-window dedup + extract only new content per segment
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
  const pw = prev.split(' ');
  const cw = curr.split(' ');
  for (let i = Math.min(pw.length, cw.length); i >= 1; i--) {
    if (pw.slice(-i).join(' ') === cw.slice(0, i).join(' ')) {
      const rest = cw.slice(i).join(' ');
      if (rest) return rest;
      break;
    }
  }
  return curr;
}

// ── VTT parser → events [{tStartMs, segs: [{utf8}]}] ─────────────────────────

function parseVTT(vtt: string): Array<Record<string, unknown>> {
  const events: Array<Record<string, unknown>> = [];
  const blocks = vtt.split(/\n{2,}/);
  for (const block of blocks) {
    const m = block.match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->/);
    if (!m) continue;
    const tStartMs = (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 + +m[4];
    const text = block
      .split('\n')
      .slice(1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (text) events.push({ tStartMs, segs: [{ utf8: text }] });
  }
  return events;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
