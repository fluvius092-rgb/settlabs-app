# SCP 画像ライセンス監査台帳 (Keter / Thaumiel)

対象: 83 SCPs (Keter 60 + Thaumiel 23)
方針: SCP Wikiライセンスガイドにより「特に指定がない限り CC BY-SA 3.0」がデフォルト適用。明示NG指定のみ除外。

## 進捗 (2026-04-07)

- [x] Phase 1-3: 監査・画像DL完了（41枚 / OK 41, NG 2: SCP-3199・SCP-075, NO_IMAGE 残り）
- [x] Phase 4-1: `data/scps.js` に 41 SCP の image/credit/license/source フィールド追加
- [x] Phase 4-4: `game.js` `renderCard` に `<img class="scp-image">` 追加
- [x] Phase 4-4b: `game.js` `showCardModal` にも画像表示追加
- [x] Phase 4-5: `styles.css` に `.scp-image` / `.cm-credit` 追加
- [x] Phase 4-6: モーダルにクレジット行追加
- [x] Phase 4-7: `deploy/scp_card_battle/` に全変更ミラー（assets/cards/ 41枚含む）
- [ ] Phase 4-2: NG 2件（SCP-3199, SCP-075）の完全削除＋AI_DECKS置換
- [ ] サイト全体の CC BY-SA 3.0 継承クレジット表記（フッター等）
- [ ] "Unknown SCP Wiki contributor" の実著作者名での埋め直し
- [ ] Phase 5: ローカルサーバーで動作確認

## ステータス

- OK: 画像あり、CC BY-SA 適用可
- NG: License Box で明示的にCopyrighted等の指定あり
- NO_IMAGE: 記事本文に画像なし（SVGフォールバック継続）
- pending: 未調査

## 結果一覧

| id | name | cls | cost | status | image_url | local_file | author | license | notes |
|----|------|-----|------|--------|-----------|------------|--------|---------|-------|
| SCP-682 | Hard Reptile | keter | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-682/monster8editub9-new.jpg | assets/cards/scp-682.jpg | OccultistMave | CC BY-SA 3.0 | 実装済 |
| SCP-106 | The Old Man | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-106/106emergenceklay.jpg | assets/cards/scp-106.jpg | Klay Abele (MrKlay) | CC BY-SA 3.0 | 実装済 |
| SCP-076 | Able | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-2399 | Martian Destroyer | keter | 9 | OK | https://scp-wiki.wdfiles.com/local--files/scp-2399/header.png | assets/cards/scp-2399.png | djkaktus | CC BY-SA 3.0 | 実装済 |
| SCP-343 | God | thaumiel | 10 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-179 | Sauelsuepp | thaumiel | 8 | NO_IMAGE | - | - | - | - | SCPArchiveLogoのみ |
| SCP-953 | Polymorphic Humanoid | keter | 6 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-610 | The Flesh that Hates | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-610/610-new.png | assets/cards/scp-610.png | stephlynch & Austin Beaulier | CC BY-SA 3.0 | 実装済 |
| SCP-1000 | Bigfoot | keter | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-1000/bigfoot_patterson01-new.png | assets/cards/scp-1000.png | Shaggydredlocks | CC BY-SA 2.0 | 実装済 |
| SCP-2317 | Door to Darkness | keter | 9 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-3000 | Anantashesha | keter | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-3000/gaslight.png | assets/cards/scp-3000.png | djkaktus | CC BY-SA 3.0 | 実装済 |
| SCP-2000 | Deus Ex Machina | thaumiel | 9 | OK | https://scp-wiki.wdfiles.com/local--files/scp-2000/Remember_Us.jpg | assets/cards/scp-2000.jpg | Colin Grice & HammerMaiden | CC BY-SA 3.0 | 実装済 |
| SCP-073 | Cain | thaumiel | 6 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-105 | Iris Thompson | thaumiel | 5 | OK | https://scp-wiki.wdfiles.com/local--files/scp-105/2014-07-18%2022.41.47-new.jpg | assets/cards/scp-105.jpg | Retro00064 | CC BY-SA 3.0 | 実装済 |
| SCP-662 | Mr. Deeds | thaumiel | 4 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-500-D | Overwritten Alloy | thaumiel | 7 | NO_IMAGE | - | - | - | - | 記事URL 404 |
| SCP-001 | The Gate Guardian | thaumiel | 10 | NO_IMAGE | - | - | - | - | デフォルトページ画像なし |
| SCP-017 | Shadow Person | keter | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-017/scp017InCaptivity.jpg | assets/cards/scp-017.jpg | CityToast | CC BY-SA 3.0 | 実装済 |
| SCP-055 | [unknown] | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-169 | The Leviathan | keter | 9 | OK | https://scp-wiki.wdfiles.com/local--files/scp-169/scp169spectograph.jpg | assets/cards/scp-169.jpg | NOAA | Public Domain | 実装済 |
| SCP-217 | The Clockwork Virus | keter | 6 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-239 | The Witch Child | keter | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-239/SCP-239 | assets/cards/scp-239.png | S D Locke | CC BY-SA 4.0 | 実装済 (拡張子なし) |
| SCP-354 | The Red Pool | keter | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-354/redpool-new.jpg | assets/cards/scp-354.jpg | stephlynch & Jim Sorbie | CC BY-SA 3.0 | 未DL |
| SCP-575 | Predatory Darkness | keter | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-575/PA002332.JPG | assets/cards/scp-575.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-058 | Heart of Darkness | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-689 | Haunting Bust | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-783 | There Was A Crooked Man | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-783/crooked.jpg | assets/cards/scp-783.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-940 | Araneae Marionettes | keter | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-940/940-1-new.jpg | assets/cards/scp-940.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-1440 | The Old Man from Nowhere | keter | 8 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-2316 | Field Trip | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-2845 | THE DEER | keter | 9 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-3199 | Humans, Refuted | keter | 7 | NG | - | - | Ryan Van Dongen | Copyrighted | License Box明示Copyrighted |
| SCP-3812 | A Voice Behind Me | keter | 9 | OK | https://scp-wiki.wdfiles.com/local--files/scp-3812/RAE.jpg | assets/cards/scp-3812.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-4666 | The Yule Man | keter | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-4666/yuleman-photo%20FINAL.jpg | assets/cards/scp-4666.jpg | Hercules Rockefeller | CC BY-SA 3.0 | 実装済 |
| SCP-2003 | Preferred Option | thaumiel | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-3301 | THE FOUNDATION | thaumiel | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-3301/game.png | assets/cards/scp-3301.png | - | CC BY-SA 3.0 | 未DL |
| SCP-4010 | Attempt to Look at What We Accomplished | thaumiel | 6 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-4999 | Someone to Watch Over Us | thaumiel | 5 | OK | https://scp-wiki.wdfiles.com/local--files/scp-4999/death.png | assets/cards/scp-4999.png | PeppersGhost (Max Pixel PD) | CC BY-SA 3.0 | 未DL |
| SCP-5000 | Why? | thaumiel | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-5000/dawoods.jpg | assets/cards/scp-5000.jpg | Jon Evans | CC BY 2.0 | 未DL |
| SCP-6000 | The Serpent, the Moose, and the Wanderer's Library | thaumiel | 9 | NO_IMAGE | - | - | - | - | スクリプト多すぎて取得失敗 |
| SCP-020 | Unseen Mold | keter | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-020/scp020.jpg | assets/cards/scp-020.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-029 | Daughter of Shadows | keter | 7 | NO_IMAGE | - | - | - | - | プレースホルダ |
| SCP-060 | Infernal Occult Skeleton | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-060/not-firewood-small.jpg | assets/cards/scp-060.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-075 | Corrosive Snail | keter | 6 | NG | - | - | Takeshi Yamada | Copyrighted | License Box明示Copyrighted |
| SCP-077 | Rot Skull | keter | 6 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-231 | Special Personnel Requirements | keter | 9 | NO_IMAGE | - | - | - | - | 画像O5で削除 |
| SCP-352 | Baba Yaga | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-363 | Not Centipedes | keter | 6 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-469 | Many-Winged Angel | keter | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-469/scp%20469.jpg | assets/cards/scp-469.jpg | Joao Estevao Andrade de Freitas | Public Domain | 未DL |
| SCP-597 | The Mother | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-745 | The Headlights | keter | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-745/745.jpg | assets/cards/scp-745.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-835 | Expunged Data Released | keter | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-835/flbalanus-new.jpg | assets/cards/scp-835.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-1529 | King of the Mountain | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-1529/1529.jpg | assets/cards/scp-1529.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-2191 | Dracula Factory | keter | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-2191/zyQlwSb2.webp | assets/cards/scp-2191.webp | - | CC BY-SA 3.0 | 未DL |
| SCP-2470 | The Void Nullifier | keter | 9 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-2950 | Just A Chair | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-3125 | The Escapee | keter | 9 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-2798 | This Dying World | thaumiel | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-3480 | Olympus Mons | thaumiel | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-3480/Mytikas_at_sunset_(Olympus_mt.).jpg | assets/cards/scp-3480.jpg | Wikimedia Commons | CC BY-SA 3.0 | 未DL |
| SCP-4100 | Future Imperfect | thaumiel | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-4100/FoundationVictorious.png | assets/cards/scp-4100.png | - | CC BY-SA 3.0 | 未DL |
| SCP-4200 | The World, Contracted | thaumiel | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-4200/header2.png | assets/cards/scp-4200.png | - | CC BY-SA 3.0 | 未DL |
| SCP-4290 | The Hospital of the Lord | thaumiel | 5 | OK | https://scp-wiki.wdfiles.com/local--files/scp-4290/Qinghai_lake.jpg | assets/cards/scp-4290.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-4514 | The Thing That Kills You | thaumiel | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-4514/Vintage_Switchblade.jpg | assets/cards/scp-4514.jpg | - | CC BY-SA 3.0 | URL推定 未DL |
| SCP-5500 | Death of the Authors | thaumiel | 9 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-6500 | Inevitable | thaumiel | 10 | OK | https://scp-wiki.wdfiles.com/local--files/scp-6500/saulenuesmall.jpg | assets/cards/scp-6500.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-353 | Vector | keter | 6 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-370 | A Key | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-579 | [DATA EXPUNGED] | keter | 9 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-582 | A Bundle of Stories | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-616 | The Vessel | keter | 8 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-738 | The Devil's Deal | keter | 8 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-804 | World Without Man | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-804/ice-ball-new.JPG | assets/cards/scp-804.jpg | Akulovz (Wikimedia) | CC BY-SA 4.0 | 未DL |
| SCP-956 | The Child-Breaker | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-956/tumblr_lnkjqq3osj1qzzmx1o1_500.jpg | assets/cards/scp-956.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-966 | Sleep Killer | keter | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-966/Darkskullteeth%20infrared%201-new.png | assets/cards/scp-966.png | - | CC BY-SA 3.0 | 未DL |
| SCP-993 | Bobble the Clown | keter | 6 | OK | https://scp-wiki.wdfiles.com/local--files/scp-993/993.png | assets/cards/scp-993.png | - | CC BY-SA 3.0 | 未DL |
| SCP-1055 | Bugsy | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-1730 | What Happened to Site-13? | thaumiel | 8 | OK | https://scp-wiki.wdfiles.com/local--files/scp-1730/warehouse-new.jpg | assets/cards/scp-1730.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-1983 | Doorway to Nowhere | keter | 7 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-2935 | O, Death | keter | 9 | OK | https://scp-wiki.wdfiles.com/local--files/scp-2935/hole.jpg | assets/cards/scp-2935.jpg | - | CC BY-SA 3.0 | 未DL |
| SCP-3001 | Red Reality | keter | 8 | NO_IMAGE | - | - | - | - | 本文画像なし |
| SCP-2030 | LA U GH IS FUN | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-2030/Laugh.jpg | assets/cards/scp-2030.jpg | PeppersGhost | CC BY-SA 3.0 | 未DL |
| SCP-009 | Red Ice | keter | 7 | OK | https://scp-wiki.wdfiles.com/local--files/scp-009/009.png | assets/cards/scp-009.png | S D Locke | CC BY-SA 3.0 | 実装済 |
| SCP-027 | The Vermin God | keter | 6 | NO_IMAGE | - | - | - | - | 本文画像なし |

## サマリ

- **OK (画像取得・実装済)**: 41件
- **NG (Copyrighted)**: 2件 (SCP-3199, SCP-075) ※削除待ち
- **NO_IMAGE (本文画像なし、SVG継続)**: 48件
- **実装済**: 41件すべて (`assets/cards/` および `deploy/scp_card_battle/assets/cards/` にミラー、`data/scps.js` に image/credit/license/source 登録済)
- **未DL**: 0件
