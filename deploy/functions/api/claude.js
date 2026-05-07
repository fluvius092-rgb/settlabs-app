// Cloudflare Pages Function: /api/claude
// Anthropic Messages API への認証付きプロキシ + 24hサーバー側キャッシュ
//
// 環境変数:
//   ANTHROPIC_KEY (必須・暗号化)  — Anthropic API キー
// KV バインド (任意):
//   CACHE  — レスポンスキャッシュ（推奨：DAU増加でも料金一定）
//   RL     — IP単位レート制限（1時間5回）

const RATE_LIMIT_PER_HOUR = 5;
const CACHE_TTL_SEC = 24 * 3600;
const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];

async function bodyHash(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  // ペイロード読込・検証
  let bodyText;
  try {
    bodyText = await request.text();
  } catch {
    return jsonError(400, 'Failed to read body');
  }

  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return jsonError(400, 'Invalid JSON');
  }
  if (!ALLOWED_MODELS.includes(payload.model)) {
    return jsonError(400, 'Model not allowed');
  }
  payload.max_tokens = Math.min(payload.max_tokens || 4000, 8000);

  // 検証後のbodyで安定したcache keyを作成
  const sanitizedBody = JSON.stringify(payload);
  const hash = await bodyHash(sanitizedBody);
  const cacheKey = `claude:${hash}`;

  // キャッシュチェック（KV "CACHE" バインド時）
  if (env.APDM_CACHE) {
    const cached = await env.APDM_CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-cache': 'HIT',
          'cache-control': 'no-store',
        },
      });
    }
  }

  // レート制限（キャッシュミス時のみカウント）
  if (env.APDM_RL) {
    const rlKey = `rl:${ip}:${Math.floor(Date.now() / 1000 / 3600)}`;
    const cnt = parseInt((await env.APDM_RL.get(rlKey)) || '0', 10);
    if (cnt >= RATE_LIMIT_PER_HOUR) {
      return jsonError(429, 'Rate limit exceeded. Try again in 1h.');
    }
    await env.APDM_RL.put(rlKey, String(cnt + 1), { expirationTtl: 3700 });
  }

  if (!env.ANTHROPIC_KEY) {
    return jsonError(500, 'ANTHROPIC_KEY not configured on server');
  }

  // 上流呼び出し
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: sanitizedBody,
  });

  const responseText = await upstream.text();

  // 成功レスポンスのみキャッシュ（24h TTL）
  if (upstream.ok && env.APDM_CACHE) {
    try {
      // `await` しないことでレスポンスを早く返す（"writing in background"）
      context.waitUntil(env.APDM_CACHE.put(cacheKey, responseText, { expirationTtl: CACHE_TTL_SEC }));
    } catch (e) {
      // KV書き込み失敗してもレスポンスは返す
    }
  }

  return new Response(responseText, {
    status: upstream.status,
    headers: {
      'content-type': 'application/json',
      'x-cache': upstream.ok ? 'MISS' : 'BYPASS',
      'cache-control': 'no-store',
    },
  });
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  return onRequestPost(context);
}
