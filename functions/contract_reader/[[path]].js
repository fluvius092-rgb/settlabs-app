// Cloudflare Pages Function
// settlabs.app/contract_reader/* を Vercel の Next.js アプリにプロキシする
//
// ルート: /contract_reader/[[path]] → basePath 込みで Vercel に転送

const VERCEL_ORIGIN = 'https://contract-reader-prod.vercel.app'
const ADSENSE_TAG = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7502065458216315" crossorigin="anonymous"></script>'

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

  const contentType = response.headers.get('content-type') || ''
  const isText = contentType.includes('text/html') || contentType.includes('application/json')
  if (isText) {
    let body = await response.text()
    body = body.replaceAll('契約書かんたん読み', '契約書かんたん要約')
    if (contentType.includes('text/html')) {
      body = body.replace('href="/manifest.json"', 'href="/contract_reader/manifest.json"')
      body = body.replace('</head>', ADSENSE_TAG + '</head>')
    }
    const newHeaders = new Headers(response.headers)
    newHeaders.delete('content-length')
    return new Response(body, {
      status:     response.status,
      statusText: response.statusText,
      headers:    newHeaders,
    })
  }

  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers:    response.headers,
  })
}
