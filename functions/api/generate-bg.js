// Cloudflare Pages Function: /api/generate-bg
// NoReal app の背景画像生成プロキシ。
// mode=side-by-side: Together.ai Flux Schnell でテキスト→画像を生成
// mode=composite:    Gemini 2.5 Flash Image で selfie + prompt から合成生成

const RATE_LIMIT_PER_DAY = 5;
const MAX_PROMPT_LENGTH = 800;
const MAX_SELFIE_BYTES = 4 * 1024 * 1024;
const TOGETHER_MODEL = 'black-forest-labs/FLUX.1-schnell-Free';
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const IMAGE_WIDTH = 768;
const IMAGE_HEIGHT = 1344;

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function jsonOk(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}

async function generateWithFlux(env, prompt) {
  const res = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.TOGETHER_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: TOGETHER_MODEL,
      prompt,
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      steps: 4,
      n: 1,
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Together.ai error (${res.status}): ${text}`);
  }
  const data = await res.json();
  const url = data?.data?.[0]?.url;
  if (!url) throw new Error('Together.ai returned no image URL');
  return url;
}

async function generateWithGemini(env, prompt, selfieBase64) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const parts = [{ text: prompt }];
  if (selfieBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: selfieBase64,
      },
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini error (${res.status}): ${text}`);
  }
  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p) => p.inline_data || p.inlineData);
  const b64 = imagePart?.inline_data?.data || imagePart?.inlineData?.data;
  if (!b64) throw new Error('Gemini returned no image');
  return b64;
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonError(400, 'Invalid JSON');
    }

    const { category, prompt, mode, selfie } = payload;
    if (typeof prompt !== 'string' || prompt.length === 0 || prompt.length > MAX_PROMPT_LENGTH) {
      return jsonError(400, 'Invalid prompt');
    }
    if (mode !== 'side-by-side' && mode !== 'composite') {
      return jsonError(400, 'Invalid mode');
    }
    if (mode === 'composite') {
      if (typeof selfie !== 'string' || selfie.length === 0) {
        return jsonError(400, 'composite mode requires selfie');
      }
      if (selfie.length > MAX_SELFIE_BYTES) {
        return jsonError(413, 'Selfie too large');
      }
    }

    if (mode === 'side-by-side' && !env.TOGETHER_API_KEY) {
      return jsonError(500, 'TOGETHER_API_KEY missing');
    }
    if (mode === 'composite' && !env.GEMINI_API_KEY) {
      return jsonError(500, 'GEMINI_API_KEY missing');
    }

    try {
      if (env.APDM_RL) {
        const rlKey = `noreal-bg:${ip}:${new Date().toISOString().slice(0, 10)}`;
        const cnt = parseInt((await env.APDM_RL.get(rlKey)) || '0', 10);
        if (cnt >= RATE_LIMIT_PER_DAY) {
          return jsonError(429, 'Daily generation limit reached');
        }
        context.waitUntil(
          env.APDM_RL.put(rlKey, String(cnt + 1), { expirationTtl: 86400 + 300 }),
        );
      }
    } catch (kvErr) {
      console.error('KV error', kvErr);
    }

    try {
      let imageUrl = null;
      let imageBase64 = null;
      if (mode === 'side-by-side') {
        imageUrl = await generateWithFlux(env, prompt);
      } else {
        imageBase64 = await generateWithGemini(env, prompt, selfie);
      }

      return jsonOk({
        id: crypto.randomUUID(),
        category,
        mode,
        prompt,
        imageUrl,
        imageBase64,
        generatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Upstream error', err?.message, err?.stack);
      return jsonError(502, err?.message || 'Upstream error');
    }
  } catch (fatal) {
    console.error('Fatal handler error', fatal?.message, fatal?.stack);
    return jsonError(500, `Fatal: ${fatal?.message || 'unknown'}`);
  }
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  return onRequestPost(context);
}
