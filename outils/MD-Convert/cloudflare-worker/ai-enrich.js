// === MD CONVERT — WORKER IA (Mistral, UE / RGPD) ===
//
// Deux routes :
//   POST /enrich  → texte déjà extrait → note Obsidian      (PDF natif, DOCX, TXT, URL)
//   POST /vision  → image (base64) lue DIRECTEMENT par Pixtral → note Obsidian
//                   (photos, scans : contourne l'OCR local, qualité max)
//
// La conversion des fichiers reste locale dans le navigateur ; le worker ne reçoit
// que du texte ou une image, et appelle Mistral avec LA clé du worker.
//
// Secret obligatoire : MISTRAL_API_KEY
// Variable optionnelle : ALLOWED_ORIGINS (origines séparées par des virgules)

const DEFAULT_ALLOWED = [
  'https://sebastien-riviere.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
];

const MAX_CHARS = 250000;           // texte : ~60k tokens en entrée (cours/vidéos longs)
const MAX_IMAGE_CHARS = 8000000;    // image base64 : ~6 Mo
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const TEXT_MODEL = 'mistral-small-latest';
const VISION_MODEL = 'pixtral-12b-2409';

const SYSTEM_PROMPT = `Tu transformes une source en NOTE Markdown propre, prête pour Obsidian.
Règles strictes :
- Commence par un frontmatter YAML : title, aliases: [], source (si fournie), created, tags (3 à 6, inférés du contenu), type: source.
- Structure le corps avec des titres sémantiques (## / ###), des listes et des tableaux si pertinent. N'utilise JAMAIS "Page 1", "Page 2".
- N'invente RIEN, n'ajoute aucune information absente de la source. Pour une image, retranscris fidèlement le texte lisible.
- Réponds UNIQUEMENT avec le Markdown final, sans phrase d'introduction ni commentaire.`;

function allowedOrigins(env) {
  if (env && env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
  }
  return DEFAULT_ALLOWED;
}

function corsHeaders(origin, env) {
  const allow = allowedOrigins(env);
  const ok = origin && allow.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allow[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  });
}

function buildUserText(payload) {
  const today = new Date().toISOString().slice(0, 10);
  const instruction = (payload.instruction || '').toString().slice(0, 1000);
  const title = (payload.title || '').toString().slice(0, 300);
  const sourceUrl = (payload.sourceUrl || '').toString().slice(0, 500);
  return {
    today, instruction, title, sourceUrl,
    header:
      `Titre suggéré : ${title || '—'}\n` +
      `Source : ${sourceUrl || '—'}\n` +
      `Date : ${today}\n` +
      (instruction ? `Consigne spécifique de l'utilisateur : ${instruction}\n` : ''),
  };
}

// Retire un éventuel bloc de code ```markdown ... ``` ajouté par le modèle
function stripFences(md) {
  let s = (md || '').trim();
  s = s.replace(/^```[a-zA-Z]*\s*\n?/, '');
  s = s.replace(/\n?```\s*$/, '');
  return s.trim();
}

async function callMistral(env, model, messages, maxTokens) {
  let res;
  try {
    res = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.MISTRAL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, temperature: 0.2, max_tokens: maxTokens || 8000, messages }),
    });
  } catch {
    return { error: 'provider_unreachable', status: 502 };
  }
  if (res.status === 429) return { error: 'quota', status: 429 };
  if (!res.ok) return { error: 'provider_' + res.status, status: 502 };
  let data;
  try { data = await res.json(); } catch { return { error: 'provider_bad_json', status: 502 }; }
  const md = data && data.choices && data.choices[0] && data.choices[0].message
    && (data.choices[0].message.content || '').trim();
  if (!md) return { error: 'empty_response', status: 502 };
  return { markdown: stripFences(md) };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, cors);

    const allow = allowedOrigins(env);
    if (origin && !allow.includes(origin)) return json({ ok: false, error: 'origin_forbidden' }, 403, cors);
    if (!env.MISTRAL_API_KEY) return json({ ok: false, error: 'server_not_configured' }, 500, cors);

    let payload;
    try { payload = await request.json(); }
    catch { return json({ ok: false, error: 'bad_request' }, 400, cors); }

    const isVision = new URL(request.url).pathname.endsWith('/vision');

    let messages;
    if (isVision) {
      const image = (payload && payload.image || '').toString();
      if (!image.startsWith('data:image/')) return json({ ok: false, error: 'bad_image' }, 400, cors);
      if (image.length > MAX_IMAGE_CHARS) return json({ ok: false, error: 'too_large' }, 413, cors);
      const u = buildUserText(payload);
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: u.header + '\nLis ce document/image et mets-le en note.' },
          { type: 'image_url', image_url: image },
        ] },
      ];
      const r = await callMistral(env, VISION_MODEL, messages, 8000);
      if (r.error) return json({ ok: false, error: r.error }, r.status, cors);
      return json({ ok: true, markdown: r.markdown }, 200, cors);
    }

    // Route texte (/enrich)
    const text = (payload && payload.text || '').toString();
    if (!text.trim()) return json({ ok: false, error: 'empty_text' }, 400, cors);
    if (text.length > MAX_CHARS) return json({ ok: false, error: 'too_large' }, 413, cors);
    const u = buildUserText(payload);
    messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: u.header + `\n--- TEXTE À METTRE EN NOTE ---\n${text}` },
    ];
    const r = await callMistral(env, TEXT_MODEL, messages, 16000);
    if (r.error) return json({ ok: false, error: r.error }, r.status, cors);
    return json({ ok: true, markdown: r.markdown }, 200, cors);
  },
};
