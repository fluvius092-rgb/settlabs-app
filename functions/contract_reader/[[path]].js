// Cloudflare Pages Function
// settlabs.app/contract_reader/* を Vercel の Next.js アプリにプロキシする
//
// ルート: /contract_reader/[[path]] → basePath 込みで Vercel に転送

const VERCEL_ORIGIN = 'https://contract-reader-qv4c.vercel.app'

// Cloudflare 固有ヘッダー（Vercel に転送しない）
const CF_SKIP_HEADERS = new Set([
  'host',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'cf-warp-tag-id',
  'cf-worker',
])

export async function onRequest({ request, params }) {
  const url = new URL(request.url)

  // params.path は配列 e.g. [] / ['api', 'analyze'] / ['_next', 'static', '...']
  const segments = Array.isArray(params.path) ? params.path : []
  const subpath  = segments.length > 0 ? '/' + segments.join('/') : ''

  // basePath 付きの Vercel URL に組み立て
  const targetUrl = `${VERCEL_ORIGIN}/contract_reader${subpath}${url.search}`

  // ヘッダーをコピー（CF 固有ヘッダーは除外）
  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    if (CF_SKIP_HEADERS.has(key.toLowerCase())) continue
    headers.set(key, value)
  }
  // Vercel が正しいホストで処理できるよう明示
  headers.set('X-Forwarded-Host', url.hostname)
  headers.set('X-Forwarded-Proto', 'https')

  const proxyReq = new Request(targetUrl, {
    method:  request.method,
    headers,
    body:    ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    redirect: 'follow',
  })

  const response = await fetch(proxyReq)

  // レスポンスをそのまま返す（ストリーミング対応）
  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers:    response.headers,
  })
}
