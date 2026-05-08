#!/usr/bin/env node
// APDM事案データの座標を検証する。データ追加時の再発防止チェッカー。
//
// 使い方: `node scripts/apdm-validate-coords.js`
// 終了ステータス: 問題なし=0 / 問題あり=1
//
// 検査内容:
//   - air/sea/eez ゾーンの lat/lng が内陸でないか（領土上のマーカーを検出）
//   - missile ゾーンは launch=lat/lng が陸でも可（発射地）、ただし
//     landLat/landLng (落下地点) は海上であるべき
//   - 必須フィールドの欠落
//   - title 30字超 / detail 150字超
//   - id 重複
//
// 内陸判定はboundingbox方式で過検出する場合あり。実際は海上の場合は
// このファイルの SEA_OVERRIDES に座標を追加する。
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'deploy', 'apdm', 'index.html');

// 主要陸塊のbounding box（過検出許容、海上はOVERRIDESで個別救済）
// 本州・九州・北海道は沿岸近郊も「視覚的に領土上に見える」リスクとして検出する
const LAND = [
  {name:'台湾本島',          minLat:21.9, maxLat:25.3, minLng:120.0, maxLng:122.0},
  {name:'日本本州・伊豆諸島', minLat:33.5, maxLat:41.5, minLng:132.0, maxLng:141.5},
  {name:'日本九州',           minLat:31.0, maxLat:34.0, minLng:129.5, maxLng:132.0},
  {name:'日本北海道',         minLat:41.5, maxLat:45.5, minLng:140.0, maxLng:145.6},
  {name:'中国大陸 沿岸',      minLat:23.0, maxLat:40.0, minLng:108.0, maxLng:121.5},
  {name:'フィリピン ルソン',  minLat:13.0, maxLat:18.5, minLng:120.0, maxLng:122.5},
  {name:'フィリピン パラワン',minLat:9.0,  maxLat:11.5, minLng:118.0, maxLng:119.5},
  {name:'ベトナム',           minLat:8.5,  maxLat:23.0, minLng:103.0, maxLng:109.5},
  {name:'朝鮮半島南部',       minLat:34.5, maxLat:38.5, minLng:126.0, maxLng:129.5},
  {name:'樺太',               minLat:45.8, maxLat:54.0, minLng:141.5, maxLng:144.5},
];

// 過検出を救済するホワイトリスト（実際は海上の座標）
// 「lat,lng」キーで完全一致。新規データで本当に海上な座標は追加してOK。
const SEA_OVERRIDES = new Set([
  // 日本周辺（boundingbox内だが実は海上）
  '37.5,134.5', // 日本海中央（中露共同爆撃機の合流点）
  '41.5,140.5', // 津軽海峡
  '43,140',     // 北海道西方日本海
  '44,140',     // 留萌沖
  '44.5,141.5', // 宗谷海峡西側
  '45.4,141',   // 礼文島北方海上
  '45.5,143.5', // 宗谷海峡東口
  // 北朝鮮ミサイル落下地点（日本海・太平洋EEZ）
  '40,135',     // 能登半島北方
  '39.5,131',   // 隠岐諸島北方
  '40,131',     // 隠岐諸島北方
  '40.1,131.5', // 隠岐諸島北方
  '39.2,131.2', // 隠岐諸島北方
  '41,131.5',   // 能登半島北方
  '39.5,142',   // 岩手県沖太平洋
  '39.6,142',   // 岩手県沖太平洋
  '40.5,138.5', // 秋田県沖日本海
  // 台湾周辺
  '23,119.8',   // 台湾海峡西側
  '25,122',     // 台湾海峡北端
  '25.2,120',   // 台北西方海峡
]);

function inLand(lat, lng) {
  const k = `${lat},${lng}`;
  if (SEA_OVERRIDES.has(k)) return null;
  for (const r of LAND) {
    if (lat>=r.minLat && lat<=r.maxLat && lng>=r.minLng && lng<=r.maxLng) return r.name;
  }
  return null;
}

function loadDemo() {
  const html = fs.readFileSync(FILE, 'utf8');
  const start = html.indexOf('const DEMO = [');
  if (start < 0) throw new Error('DEMO array not found');
  const end = html.indexOf('];', start) + 2;
  const code = html.slice(start, end);
  return eval('(function(){' + code + ';return DEMO;})()');
}

const REQUIRED = ['id','level','zone','title','country','asset','location','lat','lng','datetime','action','detail','source','region','ds'];
const VALID_LEVEL = new Set(['danger','warning','info']);
const VALID_ZONE = new Set(['air','sea','missile','eez']);

function validate() {
  const DEMO = loadDemo();
  const errors = [];
  const warnings = [];

  // ID重複
  const ids = DEMO.map(d => d.id);
  const dupIds = ids.filter((x,i) => ids.indexOf(x) !== i);
  if (dupIds.length) errors.push(`重複ID: ${[...new Set(dupIds)].join(',')}`);

  for (const d of DEMO) {
    const tag = `id:${d.id}`;

    // 必須フィールド
    for (const k of REQUIRED) {
      if (d[k] === undefined || d[k] === null || d[k] === '') {
        errors.push(`${tag} 必須フィールド欠落: ${k}`);
      }
    }
    if (!VALID_LEVEL.has(d.level)) errors.push(`${tag} 不正なlevel: ${d.level}`);
    if (!VALID_ZONE.has(d.zone))   errors.push(`${tag} 不正なzone: ${d.zone}`);

    // 文字数
    const titleLen = [...(d.title||'')].length;
    const detailLen = [...(d.detail||'')].length;
    if (titleLen > 30)  errors.push(`${tag} title超過(${titleLen}>30): ${d.title}`);
    if (detailLen > 150) errors.push(`${tag} detail超過(${detailLen}>150)`);

    // 座標範囲
    if (typeof d.lat !== 'number' || d.lat < -90 || d.lat > 90)   errors.push(`${tag} 不正なlat: ${d.lat}`);
    if (typeof d.lng !== 'number' || d.lng < -180 || d.lng > 180) errors.push(`${tag} 不正なlng: ${d.lng}`);

    // 内陸チェック（air/sea/eez のみ）
    if (d.zone === 'air' || d.zone === 'sea' || d.zone === 'eez') {
      const land = inLand(d.lat, d.lng);
      if (land) errors.push(`${tag} [${d.zone}] マーカー座標が内陸: ${land} (${d.lat},${d.lng}) — ${d.title}`);
    }

    // missileの落下地点(landLat/landLng)も海上チェック
    if (d.zone === 'missile' && typeof d.landLat === 'number' && typeof d.landLng === 'number') {
      const land = inLand(d.landLat, d.landLng);
      if (land) warnings.push(`${tag} [missile] 落下地点が内陸: ${land} (${d.landLat},${d.landLng}) — ${d.title}`);
    }
  }

  console.log(`検査対象: ${DEMO.length}件\n`);
  if (warnings.length) {
    console.log(`⚠ 警告 ${warnings.length}件:`);
    warnings.forEach(w => console.log('  ' + w));
    console.log();
  }
  if (errors.length) {
    console.error(`✗ エラー ${errors.length}件:`);
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }
  console.log('✓ 検証OK');
}

validate();
