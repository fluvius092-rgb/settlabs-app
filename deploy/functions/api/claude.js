// Cloudflare Pages Function: /api/claude
// Anthropic Messages API への認証付きプロキシ
// 環境変数: ANTHROPIC_KEY
// レート制限: IPあたり 1時間 5回（KVストア "RL" バインド時）

const RATE_LIMIT_PER_HOUR = 5;
const RATE_TTL_SEC = 3600;

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  // レート制限（KVバインド "RL" がある場合のみ）
  if (env.RL) {
    const key = `rl:${ip}:${Math.floor(Date.now() / 1000 / RATE_TTL_SEC)}`;
    const cnt = parseInt(await env.RL.get(key) || '0', 10);
    if (cnt >= RATE_LIMIT_PER_HOUR) {
      return new Response(JSON.stringify({error: {message: 'Rate limit exceeded. Try again in 1h.'}}), {
        status: 429,
        headers: {'content-type': 'application/json'},
      });
    }
    await env.RL.put(key, String(cnt + 1), {expirationTtl: RATE_TTL_SEC + 60});
  }

  if (!env.ANTHROPIC_KEY) {
    return new Response(JSON.stringify({error: {message: 'ANTHROPIC_KEY not configured on server'}}), {
      status: 500,
      headers: {'content-type': 'application/json'},
    });
  }

  // ペイロード検証（max_tokens上限・モデル制限）
  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({error: {message: 'Invalid JSON'}}), {
      status: 400,
      headers: {'content-type': 'application/json'},
    });
  }
  // モデルホワイトリスト
  const allowedModels = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  if (!allowedModels.includes(payload.model)) {
    return new Response(JSON.stringify({error: {message: 'Model not allowed'}}), {
      status: 400,
      headers: {'content-type': 'application/json'},
    });
  }
  // max_tokens 上限
  payload.max_tokens = Math.min(payload.max_tokens || 4000, 8000);

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
      'cache-control': 'no-store',
    },
  });
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', {status: 405});
  }
  return onRequestPost(context);
}
