#!/usr/bin/env node
// 第2回修正: 本州沿岸近郊で視覚的に領土上に見えていた7件を太平洋遠洋へ移動
const fs = require('fs');
const path = 'deploy/apdm/index.html';
let html = fs.readFileSync(path, 'utf8');

const FIXES = [
  // 統計系 (34,139) 伊豆諸島近郊 → 鳥島東方太平洋遠洋 (33,145)
  {id:22,  lat:33.0, lng:145.0, note:'2025年度スクランブル統計'},
  {id:50,  lat:33.0, lng:145.0, note:'対中国機緊急発進統計'},
  {id:65,  lat:33.0, lng:145.0, note:'2019年度スクランブル統計'},
  {id:66,  lat:33.0, lng:145.0, note:'2020年度スクランブル統計'},
  {id:126, lat:33.0, lng:145.0, note:'2024年度スクランブル統計'},
  // ロシアTu-95日本一周 (36,140) 茨城沖 → 房総東方遠洋 (35,145)
  {id:60,  lat:35.0, lng:145.0, note:'ロシアTu-95 日本一周'},
  // 中露海軍合同パトロール (35,140) 千葉沖 → 房総東方遠洋
  {id:129, lat:35.0, lng:145.0, note:'中露海軍合同パトロール'},
];

let fixed = 0;
for (const f of FIXES) {
  const re = new RegExp(`(  \\{id:${f.id},[^\\n]*?lat:)[-\\d.]+(,lng:)[-\\d.]+`);
  const before = html;
  html = html.replace(re, `$1${f.lat}$2${f.lng}`);
  if (before !== html) { fixed++; console.log(`✓ id:${f.id} → (${f.lat},${f.lng}) — ${f.note}`); }
  else console.log(`✗ NOT MATCHED id:${f.id}`);
}
fs.writeFileSync(path, html);
console.log(`\n${fixed}件 修正完了`);
