// SCP Card Battle - Cloudflare Worker (Anthropic API Proxy) v2.0.0
// Deploy: npx wrangler deploy
//
// Environment variables (set via wrangler secret):
//   ANTHROPIC_API_KEY  - your Anthropic API key
//
// KV namespaces:
//   BATTLE_CACHE - shared battle result cache (all users)
//   RATE_LIMIT   - optional rate limiting

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://settlabs.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const RATE_LIMIT_WINDOW = 5;
const MAX_CACHE_PER_COMBO = 5;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // --- Rate Limiting ---
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.RATE_LIMIT) {
      const key = `rate:${clientIP}`;
      const last = await env.RATE_LIMIT.get(key);
      if (last) {
        return jsonResponse({ error: 'Rate limited. Please wait a few seconds.' }, 429);
      }
      await env.RATE_LIMIT.put(key, '1', { expirationTtl: RATE_LIMIT_WINDOW });
    }

    // --- Parse & Validate Request ---
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const { playerAttacker, playerSupporters, aiAttacker, aiSupporters, lang } = body;
    if (!playerAttacker?.id || !aiAttacker?.id || !Array.isArray(playerSupporters) || !Array.isArray(aiSupporters)) {
      return jsonResponse({ error: 'Missing battle data' }, 400);
    }

    // --- Server-side KV Cache ---
    const pSupKey = playerSupporters.map(s => s.id).sort().join('+');
    const aSupKey = aiSupporters.map(s => s.id).sort().join('+');
    const cacheKey = `bo1:${playerAttacker.id}_${aiAttacker.id}_${pSupKey}_${aSupKey}_${lang || 'ja'}`;

    if (env.BATTLE_CACHE) {
      try {
        const cached = await env.BATTLE_CACHE.get(cacheKey, 'json');
        if (cached && cached.length > 0) {
          const pick = cached[Math.floor(Math.random() * cached.length)];
          return jsonResponse({ ...pick, _cached: true });
        }
      } catch (e) {}
    }

    // --- Build Prompt ---
    const fmtSup = (s) => `  - ${s.id} ${s.name} [${(s.effectTags || []).join(',')}/${s.power || 'mid'}]: ${s.triggerHint || ''}`;
    const isEn = lang === 'en';

    const narrativeFormat = isEn
      ? 'narrative: 150-250 chars English. Format with \\n separators:\nBattle Report: [1-line summary]\\nProgress: [2-3 sentences on how attackers and supporters interacted]\\nResult: [decisive moment]\\nFindings: [researcher comment ending with "——Dr.██████"]\nUse SCP Foundation document style. Use "[DATA EXPUNGED]", "█████" sparingly.'
      : 'narrative: 150〜250字日本語。\\nで区切る形式:\n戦闘報告: [対戦概要1行]\\n経過: [アタッカーとサポーターの相互作用を2〜3文で具体的に]\\n結果: [決定打を1文]\\n所見: [研究員コメント1文。「——Dr.██████」で締める]\nSCP財団公式文書風。「[データ削除済]」「█████」を適度に。';

    const prompt = `あなたはSCP対決の判定者。SCP原作設定に忠実に、アタッカー対決＋サポーター効果を総合判定してください。

【プレイヤー側】
アタッカー: ${playerAttacker.id} ${playerAttacker.name} (${playerAttacker.cls})
サポーター(1):
${playerSupporters.map(fmtSup).join('\n')}

【AI側】
アタッカー: ${aiAttacker.id} ${aiAttacker.name} (${aiAttacker.cls})
サポーター(1):
${aiSupporters.map(fmtSup).join('\n')}

【判定ルール】
1. 原作で確立された相互作用を最優先（例: SCP-999はSCP-682を一時鎮静化）
2. アタッカー単独の相性 → サポーター効果による強化/妨害/治療/復活/無効化を加味
3. 収容クラス・コストは強さ指標ではない（参考のみ）
4. 攻撃を耐えた・反射した・無効化した側を勝者とする（例: SCP-682が適応 → 勝利、SCP-073が反射 → 勝利）
5. サポーター効果は triggerHint に従って判定。effectTags: heal/enhance/revive/defense/summon/transform/disrupt/nullify/mind/cosmic/stealth/info/random
6. 双方有効打なし・拮抗 → draw
7. 各サポーターの発動結果を effectsTriggered に列挙: result は successful / partial / blocked / failed のいずれか

【出力形式】
JSONのみ、コードブロック禁止:
{"winner":"player"|"ai"|"draw","narrative":"...","effectsTriggered":[{"side":"player"|"ai","id":"SCP-XXX","result":"successful"}]}

${narrativeFormat}`;

    // --- Call Anthropic API ---
    try {
      const apiResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 700,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!apiResp.ok) {
        const err = await apiResp.text();
        console.error('Anthropic API error:', apiResp.status, err);
        return jsonResponse({ error: 'API request failed' }, 502);
      }

      const apiData = await apiResp.json();
      let text = apiData.content.map(c => c.text).join('');
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        const winnerMatch = text.match(/"winner"\s*:\s*"(player|ai|draw)"/);
        const narrativeMatch = text.match(/"narrative"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/);
        if (winnerMatch && narrativeMatch) {
          result = { winner: winnerMatch[1], narrative: narrativeMatch[1], effectsTriggered: [] };
        } else {
          console.error('JSON parse failed:', parseErr.message, text.substring(0, 200));
          return jsonResponse({ error: 'Response parse error' }, 502);
        }
      }

      if (!result.effectsTriggered) result.effectsTriggered = [];

      // --- Save to KV Cache ---
      if (env.BATTLE_CACHE) {
        try {
          const existing = await env.BATTLE_CACHE.get(cacheKey, 'json') || [];
          if (existing.length < MAX_CACHE_PER_COMBO) {
            existing.push({ winner: result.winner, narrative: result.narrative, effectsTriggered: result.effectsTriggered });
            await env.BATTLE_CACHE.put(cacheKey, JSON.stringify(existing));
          }
        } catch (e) {}
      }

      return jsonResponse(result);
    } catch (e) {
      console.error('Worker error:', e);
      return jsonResponse({ error: 'Internal error' }, 500);
    }
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
