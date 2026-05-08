#!/usr/bin/env node
// One-shot script to fix APDM marker coordinates that fell on land.
// Run once, then this file can be deleted (kept in repo for audit).
const fs = require('fs');
const path = 'deploy/apdm/index.html';

const FIXES = [
  // 台湾全周演習・領海内（→ 台湾東方海上）
  {id:34,  lat:23.5, lng:122.5, note:'Justice Mission-2025 → 台湾東方海上'},
  {id:42,  lat:23.5, lng:122.5, note:'PLA演習領海内 → 台湾東方海上'},
  {id:88,  lat:23.5, lng:122.5, note:'ペロシ訪台後演習 → 台湾東方海上'},
  {id:97,  lat:23.5, lng:122.5, note:'聯合利剣2023 → 台湾東方海上'},
  {id:109, lat:23.5, lng:122.5, note:'聯合利剣2024A → 台湾東方海上'},
  {id:112, lat:23.5, lng:122.5, note:'聯合利剣2024B → 台湾東方海上'},
  // 台湾ADIZ・統計（→ 台湾南方バシー海峡北）
  {id:32,  lat:21.5, lng:121.0, note:'PLA未発表演習 → バシー海峡北'},
  {id:81,  lat:21.5, lng:121.0, note:'2021統計 → バシー海峡北'},
  {id:91,  lat:21.5, lng:121.0, note:'中国機71機 → バシー海峡北'},
  {id:93,  lat:21.5, lng:121.0, note:'2022統計 → バシー海峡北'},
  {id:108, lat:21.5, lng:121.0, note:'2023統計 → バシー海峡北'},
  {id:121, lat:21.5, lng:121.0, note:'2024統計 → バシー海峡北'},
  // 中露共同爆撃機 (旧 36,135 = 京都府内陸 → 日本海中央)
  {id:61,  lat:37.5, lng:134.5, note:'中露共同 日本一周 → 日本海中央'},
  {id:74,  lat:37.5, lng:134.5, note:'中露共同 日本周回 → 日本海中央'},
  {id:89,  lat:37.5, lng:134.5, note:'中露共同 Quad中 → 日本海中央'},
  {id:106, lat:37.5, lng:134.5, note:'中露共同 2023 → 日本海中央'},
  {id:138, lat:37.5, lng:134.5, note:'中露共同 第10回 → 日本海中央'},
  // ロシア機関連（北海道内陸→海上へ）
  {id:13,  lat:43.5, lng:146.0, note:'Tu-95領空近接 → 北海道東方沖'},
  {id:37,  lat:44.5, lng:141.5, note:'IL-38樺太〜北海道 → 日本海北部'},
  {id:90,  lat:45.5, lng:143.5, note:'中露海軍千島列島 → 宗谷海峡東口'},
];

let html = fs.readFileSync(path, 'utf8');
let fixed = 0;
const notMatched = [];

for (const f of FIXES) {
  const re = new RegExp(`(  \\{id:${f.id},[^\\n]*?lat:)[-\\d.]+(,lng:)[-\\d.]+`);
  const before = html;
  html = html.replace(re, `$1${f.lat}$2${f.lng}`);
  if (before === html) notMatched.push(f.id);
  else { fixed++; console.log(`✓ id:${f.id} (${f.lat},${f.lng}) — ${f.note}`); }
}

if (notMatched.length) {
  console.error('\n✗ NOT MATCHED:', notMatched);
  process.exit(1);
}

fs.writeFileSync(path, html);
console.log(`\n${fixed}件 修正完了`);
