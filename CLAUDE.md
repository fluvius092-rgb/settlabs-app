# settlabs-app

複数プロジェクトを同居させているリポジトリ。**GitHub:** https://github.com/fluvius092-rgb/settlabs-app

## サブプロジェクト構成

| サブプロジェクト | 役割 | 主要ディレクトリ |
|---|---|---|
| SCP Card Battle | カードゲーム本体（PWA） | リポジトリ直下（`game.js` / `styles.css` / `index.html` / `assets/cards/` / `data/scps.js` ほか） |
| SettLabs ブログ | Astro 製ブログ（開発日誌） | `astro-src/` |
| APDM | 領空侵犯・警戒情報サイト＋自動ツイート | `deploy/apdm/` ほか（下記参照） |
| Cloudflare 配信 | 静的ホスティング & API プロキシ | `deploy/` / `functions/` / `worker/` |

---

## APDM ファイルマップ

APDM は独立リポジトリではなくこのリポジトリ内に同居している。`/jadm` は `/apdm/` への旧称リダイレクト。

| 種類 | パス |
|---|---|
| サイト本体 | `deploy/apdm/index.html` |
| API プロキシ (Cloudflare Pages Functions) | `functions/api/claude.js` |
| 自動ツイートスクリプト | `scripts/apdm-tweet.js` |
| 座標バリデータ | `scripts/apdm-validate-coords.js` |
| 座標一括修正（履歴） | `scripts/fix-apdm-coords.js` / `scripts/fix-apdm-coords-v2.js` |
| GitHub Actions ワークフロー | `.github/workflows/apdm-tweet.yml` |
| 投稿追跡データ | `data/apdm-posted.json` |
| X 画像テンプレート | `assets/apdm-header.html` / `assets/apdm-icon.html` |
| リダイレクト定義 | `deploy/_redirects`（`/jadm` → `/apdm/`） |

### 公開 URL（Cloudflare Pages）

- 本番: https://settlabs.app/apdm/
- pages.dev: https://settlabs-app.pages.dev/apdm/

---

## ブログ（Astro）

- コンテンツ: `astro-src/src/content/blog/*.md`
- テンプレート: `astro-src/src/content/blog/_template.md`
- レイアウト: `astro-src/src/layouts/Base.astro`
- 一覧/詳細ページ: `astro-src/src/pages/blog/`

## APDM データ追加時の必須手順

`deploy/apdm/index.html` の `DEMO` 配列に事案を追加する際の手順:

1. **座標は「事案発生海域・空域の中心」**に置く。陸名のおおよその位置で代替しない。
2. **必ず地図で実際の位置を確認**してから入れる（特に台湾海峡・尖閣・宮古海峡など狭い海域）。
3. 主要座標リファレンスは `scripts/apdm-validate-coords.js` 冒頭コメントを参照。
4. **追加後は必ずバリデータ実行**: `node scripts/apdm-validate-coords.js`
5. LAND bbox に引っかかったが本当に海上の場合、`SEA_OVERRIDES` に座標を追加する。
6. id は連番、`ds:'s'`（static）固定。`level` / `zone` / `region` は既存値から選ぶ。

### よくある失敗パターン

- **台湾海峡** = 西側 (lng 119-120)、`25,122` は実際には台湾**東岸**の太平洋。
- **中国沿岸都市の港湾就役** は岸ぴったりではなく **港湾沖** に置く（陸判定回避）。
- **NK ミサイル** は `lat/lng`（発射地・陸でOK） と `landLat/landLng`（落下地・必ず海上）を分ける。

## 運用メモ

- ファイル一覧が古くなったと感じたら `git log -- <パス>` で最新状態を確認して更新する。
- APDM 関連で「どこに何があるか」を毎回探す手間を省くために、このマップを最初の参照先にする。
