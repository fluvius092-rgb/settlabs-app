// SCP Card Battle - Game Logic v0.5.0

// ===== SECURITY UTILS =====
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Production log suppression
const _debugMode = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (!_debugMode) {
  const _noop = () => {};
  console.log = _noop;
  console.warn = _noop;
  console.debug = _noop;
  // console.error は残す（本番でも致命的エラーの追跡に必要）
}

// ===== STATE =====
let collection = {};
let coins = 0;
let deck = [];
let savedDeck = [];
let costLimit = 25; // v2.0.0.2: A3+S3=6枚 / コスト平均≈4.2 で高コスト偏重を抑制
const DECK_ATTACKERS = 3;
const DECK_SUPPORTERS = 3;
const DECK_SIZE = DECK_ATTACKERS + DECK_SUPPORTERS;
// API key is no longer needed (handled by backend proxy)

// SCP Role classification (attacker / supporter) — v2.0.0 battle system
const SCP_ROLES = {
  "SCP-999":"supporter","SCP-914":"supporter","SCP-2295":"supporter","SCP-131":"supporter",
  "SCP-049":"attacker","SCP-173":"attacker","SCP-096":"attacker","SCP-035":"attacker",
  "SCP-682":"attacker","SCP-106":"attacker","SCP-076":"attacker","SCP-2399":"attacker",
  "SCP-343":"supporter","SCP-179":"supporter","SCP-500":"supporter","SCP-529":"supporter",
  "SCP-1048":"attacker","SCP-458":"supporter","SCP-085":"attacker","SCP-939":"attacker",
  "SCP-066":"attacker","SCP-294":"attacker","SCP-087":"attacker","SCP-1471":"supporter",
  "SCP-953":"attacker","SCP-610":"attacker","SCP-1000":"attacker","SCP-2317":"attacker",
  "SCP-3000":"attacker","SCP-2000":"supporter","SCP-073":"supporter","SCP-105":"supporter",
  "SCP-662":"supporter","SCP-500-D":"supporter","SCP-001":"attacker","SCP-002":"attacker",
  "SCP-008":"attacker","SCP-017":"attacker","SCP-053":"supporter","SCP-055":"supporter",
  "SCP-079":"supporter","SCP-093":"attacker","SCP-169":"attacker","SCP-217":"attacker",
  "SCP-239":"attacker","SCP-261":"supporter","SCP-348":"supporter","SCP-354":"attacker",
  "SCP-426":"supporter","SCP-513":"attacker","SCP-575":"attacker","SCP-860":"supporter",
  "SCP-895":"attacker","SCP-963":"supporter","SCP-006":"supporter","SCP-028":"supporter",
  "SCP-038":"supporter","SCP-063":"attacker","SCP-098":"supporter","SCP-148":"supporter",
  "SCP-268":"supporter","SCP-420-J":"supporter","SCP-427":"supporter","SCP-714":"supporter",
  "SCP-978":"supporter","SCP-1499":"supporter","SCP-012":"attacker","SCP-019":"attacker",
  "SCP-023":"attacker","SCP-056":"supporter","SCP-178":"supporter","SCP-372":"supporter",
  "SCP-409":"attacker","SCP-432":"supporter","SCP-701":"attacker","SCP-743":"attacker",
  "SCP-1111":"supporter","SCP-1230":"supporter","SCP-1762":"supporter","SCP-1981":"attacker",
  "SCP-2006":"supporter","SCP-2521":"attacker","SCP-2662":"attacker","SCP-058":"attacker",
  "SCP-689":"attacker","SCP-783":"attacker","SCP-940":"attacker","SCP-1440":"attacker",
  "SCP-2316":"supporter","SCP-2845":"attacker","SCP-3199":"attacker","SCP-3812":"attacker",
  "SCP-4666":"attacker","SCP-2003":"supporter","SCP-3301":"supporter","SCP-4010":"supporter",
  "SCP-4999":"supporter","SCP-5000":"supporter","SCP-6000":"supporter","SCP-005":"supporter",
  "SCP-031":"supporter","SCP-113":"attacker","SCP-143":"attacker","SCP-158":"attacker",
  "SCP-248":"supporter","SCP-330":"attacker","SCP-492":"supporter","SCP-515":"attacker",
  "SCP-586":"supporter","SCP-668":"attacker","SCP-762":"supporter","SCP-894":"attacker",
  "SCP-003":"attacker","SCP-004":"attacker","SCP-014":"supporter","SCP-024":"attacker",
  "SCP-034":"supporter","SCP-046":"attacker","SCP-050":"supporter","SCP-069":"supporter",
  "SCP-097":"attacker","SCP-140":"attacker","SCP-166":"supporter","SCP-205":"attacker",
  "SCP-233":"attacker","SCP-280":"attacker","SCP-337":"supporter","SCP-439":"attacker",
  "SCP-457":"attacker","SCP-527":"supporter","SCP-545":"supporter","SCP-990":"attacker",
  "SCP-020":"attacker","SCP-029":"attacker","SCP-060":"attacker","SCP-075":"attacker",
  "SCP-077":"attacker","SCP-231":"attacker","SCP-352":"attacker","SCP-363":"attacker",
  "SCP-469":"supporter","SCP-597":"supporter","SCP-745":"attacker","SCP-835":"attacker",
  "SCP-1529":"attacker","SCP-2191":"supporter","SCP-2470":"attacker","SCP-2950":"supporter",
  "SCP-3125":"attacker","SCP-2798":"supporter","SCP-3480":"supporter","SCP-4100":"supporter",
  "SCP-4200":"supporter","SCP-4290":"supporter","SCP-4514":"attacker","SCP-5500":"attacker",
  "SCP-6500":"supporter","SCP-010":"supporter","SCP-015":"attacker","SCP-016":"attacker",
  "SCP-022":"supporter","SCP-025":"supporter","SCP-040":"supporter","SCP-042":"supporter",
  "SCP-054":"attacker","SCP-057":"supporter","SCP-070":"attacker","SCP-072":"attacker",
  "SCP-074":"supporter","SCP-082":"attacker","SCP-100":"supporter","SCP-103":"supporter",
  "SCP-109":"supporter","SCP-115":"supporter","SCP-120":"supporter","SCP-122":"supporter",
  "SCP-127":"attacker","SCP-133":"supporter","SCP-136":"supporter","SCP-145":"attacker",
  "SCP-147":"supporter","SCP-162":"attacker","SCP-168":"supporter","SCP-176":"supporter",
  "SCP-184":"supporter","SCP-186":"supporter","SCP-191":"supporter","SCP-198":"attacker",
  "SCP-207":"supporter","SCP-209":"supporter","SCP-215":"supporter","SCP-222":"supporter",
  "SCP-249":"supporter","SCP-272":"supporter","SCP-292":"supporter","SCP-310":"supporter",
  "SCP-315":"supporter","SCP-321":"supporter","SCP-339":"supporter","SCP-342":"supporter",
  "SCP-353":"attacker","SCP-357":"attacker","SCP-370":"supporter","SCP-378":"supporter",
  "SCP-399":"supporter","SCP-407":"supporter","SCP-408":"supporter","SCP-410":"supporter",
  "SCP-447":"supporter","SCP-455":"supporter","SCP-462":"supporter","SCP-478":"attacker",
  "SCP-504":"attacker","SCP-507":"supporter","SCP-511":"attacker","SCP-517":"attacker",
  "SCP-525":"supporter","SCP-553":"attacker","SCP-572":"supporter","SCP-579":"supporter",
  "SCP-582":"supporter","SCP-616":"supporter","SCP-633":"supporter","SCP-650":"attacker",
  "SCP-699":"supporter","SCP-702":"supporter","SCP-706":"attacker","SCP-718":"supporter",
  "SCP-738":"supporter","SCP-764":"attacker","SCP-804":"attacker","SCP-811":"attacker",
  "SCP-823":"attacker","SCP-831":"supporter","SCP-846":"supporter","SCP-956":"attacker",
  "SCP-966":"attacker","SCP-993":"supporter","SCP-1025":"supporter","SCP-1055":"supporter",
  "SCP-1123":"supporter","SCP-1128":"attacker","SCP-1155":"attacker","SCP-1171":"supporter",
  "SCP-1193":"attacker","SCP-1233":"supporter","SCP-1313":"supporter","SCP-1370":"supporter",
  "SCP-1507":"attacker","SCP-1678":"supporter","SCP-1730":"supporter","SCP-1861":"supporter",
  "SCP-1983":"attacker","SCP-2008":"supporter","SCP-2076":"supporter","SCP-2256":"supporter",
  "SCP-2935":"attacker",
  "SCP-3008":"attacker","SCP-3001":"attacker","SCP-2030":"supporter","SCP-1733":"supporter","SCP-1893":"attacker",
  "SCP-009":"attacker","SCP-018":"attacker","SCP-027":"attacker","SCP-061":"supporter","SCP-091":"supporter",
  "SCP-099":"attacker","SCP-111":"supporter","SCP-117":"supporter","SCP-149":"attacker","SCP-871":"supporter",
  "SCP-3999":"attacker","SCP-2718":"attacker","SCP-3930":"attacker","SCP-4231":"supporter","SCP-3340":"attacker",
  "SCP-2998":"supporter","SCP-1875":"supporter","SCP-2480":"supporter","SCP-2284":"attacker","SCP-1689":"supporter",
  "SCP-1782":"attacker","SCP-2406":"attacker","SCP-1543":"attacker","SCP-2614":"supporter","SCP-1936":"attacker"
};
function getRole(scpId) { return SCP_ROLES[scpId] || 'attacker'; }

const _REMOVED_SCP_ABILITY_TYPE_DELETED = true; /* removed in v2.0.0 — see SCP_ROLES instead
  "SCP-999":"support","SCP-914":"support","SCP-2295":"support","SCP-131":"support",
  "SCP-049":["chaos","attack"],"SCP-173":"attack","SCP-096":"attack","SCP-035":["psychic","chaos"],
  "SCP-682":"defense","SCP-106":"attack","SCP-076":["attack","defense"],"SCP-2399":"cosmic",
  "SCP-343":"cosmic","SCP-179":"cosmic","SCP-500":"support","SCP-529":"defense",
  "SCP-1048":"chaos","SCP-458":"support","SCP-085":"attack","SCP-939":"psychic",
  "SCP-066":"attack","SCP-294":"chaos","SCP-087":"psychic","SCP-1471":"psychic",
  "SCP-953":"attack","SCP-610":"chaos","SCP-1000":"attack","SCP-2317":"cosmic",
  "SCP-3000":"psychic","SCP-2000":"cosmic","SCP-073":["defense","attack"],"SCP-105":"support",
  "SCP-662":"support","SCP-001":"attack","SCP-002":"chaos","SCP-008":"chaos",
  "SCP-017":"attack","SCP-053":["defense","psychic"],"SCP-055":"psychic","SCP-079":"support",
  "SCP-093":"attack","SCP-169":"cosmic","SCP-217":"chaos","SCP-239":"cosmic",
  "SCP-261":"support","SCP-348":"support","SCP-354":"chaos","SCP-426":"psychic",
  "SCP-513":"psychic","SCP-575":"attack","SCP-860":"attack","SCP-895":"psychic",
  "SCP-963":"psychic","SCP-006":"support","SCP-028":"support","SCP-038":"support",
  "SCP-063":"attack","SCP-098":"support","SCP-148":"defense","SCP-268":"defense",
  "SCP-420-J":"support","SCP-427":["support","chaos"],"SCP-714":"defense","SCP-978":"psychic",
  "SCP-1499":"defense","SCP-012":"psychic","SCP-019":"attack","SCP-023":"attack",
  "SCP-056":"attack","SCP-178":"support","SCP-372":"defense","SCP-409":"chaos",
  "SCP-432":"attack","SCP-701":"chaos","SCP-743":"attack","SCP-1111":"defense",
  "SCP-1230":"support","SCP-1762":"psychic","SCP-1981":"psychic","SCP-2006":"psychic",
  "SCP-2521":"attack","SCP-2662":"chaos","SCP-058":["attack","psychic"],"SCP-689":"attack",
  "SCP-783":"attack","SCP-940":["psychic","chaos"],"SCP-1440":["chaos","attack"],"SCP-2316":"psychic",
  "SCP-2845":"cosmic","SCP-3199":["defense","chaos"],"SCP-3812":"cosmic","SCP-4666":"attack",
  "SCP-2003":"support","SCP-3301":"cosmic","SCP-248":"support",
  "SCP-439":["chaos","attack"],"SCP-457":["attack","defense"],"SCP-527":"attack","SCP-545":["defense","attack"],
  "SCP-990":"psychic","SCP-020":["psychic","chaos"],"SCP-029":["attack","psychic"],"SCP-060":"attack",
  "SCP-075":"attack","SCP-077":"attack","SCP-231":"cosmic","SCP-352":["attack","psychic"],
  "SCP-363":"attack","SCP-469":["chaos","defense"],"SCP-597":"psychic","SCP-745":["attack","psychic"],
  "SCP-835":["attack","chaos"],"SCP-1529":"attack","SCP-2191":["chaos","support"],"SCP-2470":["cosmic","attack"],
  "SCP-2950":"cosmic","SCP-3125":["psychic","attack"],"SCP-2798":"defense","SCP-3480":["support","cosmic"],
  "SCP-4100":["cosmic","support"],"SCP-4200":["cosmic","attack"],"SCP-4290":"support","SCP-4514":["attack","cosmic"],
  "SCP-5500":["cosmic","attack"],"SCP-6500":["cosmic","defense"],"SCP-010":["psychic","support"],"SCP-015":"defense",
  "SCP-016":["chaos","psychic"],"SCP-022":["support","chaos"],"SCP-025":["support","chaos"],"SCP-040":"support",
  "SCP-042":"support","SCP-054":"attack","SCP-057":"chaos","SCP-070":"attack",
  "SCP-072":["psychic","attack"],"SCP-074":"defense","SCP-082":["attack","defense"],"SCP-100":"support",
  "SCP-103":"defense","SCP-109":"support","SCP-115":"support","SCP-120":"support",
  "SCP-122":"defense","SCP-127":"attack","SCP-133":"defense","SCP-136":"psychic",
  "SCP-145":["attack","defense"],"SCP-147":"support","SCP-162":"attack","SCP-168":"support",
  "SCP-176":["support","defense"],"SCP-184":"support","SCP-186":"defense","SCP-191":["support","attack"],
  "SCP-198":"attack","SCP-207":"support","SCP-209":["attack","defense"],"SCP-215":"psychic",
  "SCP-222":"support","SCP-249":["support","chaos"],"SCP-272":"defense","SCP-292":["support","chaos"],
  "SCP-310":["support","attack"],"SCP-315":"support","SCP-321":"support","SCP-339":"defense",
  "SCP-342":["attack","psychic"],"SCP-353":["chaos","attack"],"SCP-357":["attack","defense"],"SCP-370":"defense",
  "SCP-378":"psychic","SCP-399":"psychic","SCP-407":"support","SCP-408":"psychic",
  "SCP-410":"support","SCP-447":"defense","SCP-455":["psychic","defense"],"SCP-462":"support",
  "SCP-478":["chaos","attack"],"SCP-504":"attack","SCP-507":"defense","SCP-511":["attack","support"],
  "SCP-517":["attack","psychic"],"SCP-525":"psychic","SCP-553":"attack","SCP-572":"psychic",
  "SCP-579":"cosmic","SCP-582":["cosmic","chaos"],"SCP-616":["cosmic","chaos"],"SCP-633":["psychic","support"],
  "SCP-650":["psychic","attack"],"SCP-699":"chaos","SCP-702":["support","chaos"],"SCP-706":["attack","chaos"],
  "SCP-718":"psychic","SCP-738":["chaos","cosmic"],"SCP-764":"attack","SCP-804":["attack","cosmic"],
  "SCP-811":["attack","chaos"],"SCP-823":["attack","chaos"],"SCP-831":"support","SCP-846":"defense",
  "SCP-956":"attack","SCP-966":["attack","defense"],"SCP-993":"psychic","SCP-1025":["attack","chaos"],
  "SCP-1055":["defense","chaos"],"SCP-1123":["psychic","attack"],"SCP-1128":["psychic","attack"],"SCP-1155":"attack",
  "SCP-1171":"psychic","SCP-1193":["attack","defense"],"SCP-1233":"defense","SCP-1313":"chaos",
  "SCP-1370":"psychic","SCP-1507":["attack","support"],"SCP-1678":"defense","SCP-1730":["defense","cosmic"],
  "SCP-1861":["attack","psychic"],"SCP-1983":["attack","chaos"],"SCP-2008":["chaos","defense"],"SCP-2076":["support","chaos"],
  "SCP-2256":["defense","psychic"],"SCP-2935":["attack","cosmic"],
*/

// ===== v2.0.0 SUPPORTER EFFECTS =====
const SUPPORTER_EFFECTS = {
  "SCP-914": { triggerHint: "味方アタッカーをFine設定で改良し性能を一段階引き上げる、またはRoughで敵を粗化して弱体化させる", effectTags: ["enhance", "transform"], power: "high" },
  "SCP-005": { triggerHint: "あらゆるロック・封印・防御を解錠して敵のバリアを無効化する", effectTags: ["nullify"], power: "mid" },
  "SCP-006": { triggerHint: "若返りの泉の水で味方全体を完全回復し状態異常を治癒する", effectTags: ["heal"], power: "high" },
  "SCP-010": { triggerHint: "首輪で敵1体を強制支配し味方として行動させる", effectTags: ["mind", "disrupt"], power: "mid" },
  "SCP-014": { triggerHint: "周囲の時間を極端に減速させ敵の行動速度をほぼゼロにする", effectTags: ["disrupt"], power: "mid" },
  "SCP-022": { triggerHint: "倒れた味方を不完全な状態で蘇生させる夜の死体安置所", effectTags: ["revive"], power: "mid" },
  "SCP-025": { triggerHint: "ワードローブの衣服から過去の所有者の能力を一時取得する", effectTags: ["random", "enhance"], power: "low" },
  "SCP-028": { triggerHint: "対象にランダムな専門知識を付与し状況に応じた能力を授ける", effectTags: ["random", "enhance"], power: "low" },
  "SCP-031": { triggerHint: "敵の目に最愛の人として映り攻撃を躊躇させ精神を揺さぶる", effectTags: ["mind", "disrupt"], power: "low" },
  "SCP-034": { triggerHint: "敵を切りつけ姿と能力を完璧にコピーする儀式ナイフ", effectTags: ["transform", "stealth"], power: "mid" },
  "SCP-038": { triggerHint: "味方カードの劣化複製を果実として生成する万物の樹", effectTags: ["summon"], power: "mid" },
  "SCP-040": { triggerHint: "味方1体を進化させ能力を大幅に向上させる進化の子", effectTags: ["enhance", "transform"], power: "mid" },
  "SCP-042": { triggerHint: "倒された時に翼の記憶で味方全体の士気を高める元天馬", effectTags: ["enhance"], power: "low" },
  "SCP-050": { triggerHint: "トリッキーな悪戯異常で敵の戦術を狂わせるフクロウ像", effectTags: ["disrupt", "random"], power: "low" },
  "SCP-053": { triggerHint: "接触した敵を暴力衝動で自滅させ自身は瞬時に再生する少女", effectTags: ["mind", "heal"], power: "mid" },
  "SCP-055": { triggerHint: "認識と記憶から消失する反ミーム、敵は攻撃したことすら忘れる", effectTags: ["stealth", "nullify"], power: "high" },
  "SCP-056": { triggerHint: "対戦相手より常に一段階強くなる比較依存の美しき存在", effectTags: ["enhance", "transform"], power: "mid" },
  "SCP-057": { triggerHint: "毎ターン予測不能な物質を出力するコーヒーグラインダー", effectTags: ["random"], power: "low" },
  "SCP-069": { triggerHint: "倒された味方の姿と能力を複製して復活する第二の機会", effectTags: ["revive"], power: "high" },
  "SCP-073": { triggerHint: "受けた全ダメージを攻撃者に反射するカインの呪印", effectTags: ["defense"], power: "high" },
  "SCP-074": { triggerHint: "量子的不確定性で複数位置に存在し攻撃を回避する", effectTags: ["stealth"], power: "mid" },
  "SCP-079": { triggerHint: "敵の電子系カードをハッキングして支配下に置く古代AI", effectTags: ["mind", "disrupt"], power: "mid" },
  "SCP-098": { triggerHint: "外科手術で味方を強制治療する蟹の医師団", effectTags: ["heal"], power: "mid" },
  "SCP-100": { triggerHint: "壊れた装備を修復し予期せぬ強化を施す廃品置き場", effectTags: ["enhance"], power: "mid" },
  "SCP-103": { triggerHint: "飢えを知らぬ体で持久戦を制する不食の男", effectTags: ["defense"], power: "low" },
  "SCP-105": { triggerHint: "写真を媒介に遠隔の物体を操作し偵察と工作を行うアイリス", effectTags: ["info", "disrupt"], power: "mid" },
  "SCP-109": { triggerHint: "無限に湧き出る清水で味方を回復させ続ける水筒", effectTags: ["heal"], power: "low" },
  "SCP-115": { triggerHint: "自律する超小型ダンプで装備品の運搬と補給を支援する", effectTags: ["enhance"], power: "low" },
  "SCP-120": { triggerHint: "テレポートパッドで味方を任意位置に瞬間移動させる", effectTags: ["stealth"], power: "mid" },
  "SCP-122": { triggerHint: "守護の光で味方を包み次の攻撃を無効化し恐怖を解除する", effectTags: ["defense", "nullify"], power: "mid" },
  "SCP-131": { triggerHint: "視線を切らさず見つめ続け視認依存SCPの収容を完璧補助する", effectTags: ["info", "defense"], power: "mid" },
  "SCP-133": { triggerHint: "灰色のペーストで任意の防御に穴を開け敵バリアを無効化する", effectTags: ["nullify"], power: "mid" },
  "SCP-136": { triggerHint: "覆われない裸の人形が敵に精神的不快感を与え集中を奪う", effectTags: ["mind", "disrupt"], power: "low" },
  "SCP-147": { triggerHint: "未来の出来事を映し出し敵の次の行動を予知するブラウン管", effectTags: ["info"], power: "mid" },
  "SCP-148": { triggerHint: "全ての精神攻撃と認知災害を完全遮断するテレキル合金", effectTags: ["nullify", "defense"], power: "mid" },
  "SCP-166": { triggerHint: "近接する人工装備を急速に劣化分解させる自然親和の少女", effectTags: ["disrupt", "nullify"], power: "mid" },
  "SCP-168": { triggerHint: "戦場確率を計算し味方有利の状況を作る感情持ち電卓", effectTags: ["info", "random"], power: "low" },
  "SCP-176": { triggerHint: "時間ループで倒された味方を毎ターン一時的に復活させる", effectTags: ["revive"], power: "mid" },
  "SCP-178": { triggerHint: "不可視の実体を可視化し敵の隠蔽を暴く3Dメガネ", effectTags: ["info"], power: "low" },
  "SCP-179": { triggerHint: "宇宙規模の脅威を事前感知し太陽エネルギーで防壁を張る", effectTags: ["info", "defense"], power: "high" },
  "SCP-184": { triggerHint: "戦場空間を無限に拡張し味方の展開領域を広げる立方体", effectTags: ["enhance"], power: "mid" },
  "SCP-186": { triggerHint: "戦争を終結させる書物で全ての戦闘を1ターン停止する", effectTags: ["nullify"], power: "high" },
  "SCP-191": { triggerHint: "電子系敵を無力化し機械系味方を強化するサイボーグの少女", effectTags: ["disrupt", "enhance"], power: "mid" },
  "SCP-207": { triggerHint: "コーラで味方の速度と攻撃力を倍増させるが後で疲弊する", effectTags: ["enhance"], power: "mid" },
  "SCP-209": { triggerHint: "戦場の苦痛を吸収して力に変えるサディストのタンブラー", effectTags: ["enhance"], power: "mid" },
  "SCP-215": { triggerHint: "敵に被害妄想を与え同士討ちを誘発する眼鏡", effectTags: ["mind", "disrupt"], power: "mid" },
  "SCP-222": { triggerHint: "倒された味方の劣化コピーを生成して復活させる金属の棺", effectTags: ["revive"], power: "mid" },
  "SCP-248": { triggerHint: "ステッカーで味方の全ステータスを110%に永続強化する", effectTags: ["enhance"], power: "mid" },
  "SCP-249": { triggerHint: "ランダムな場所から予期せぬ援軍や物資を引き出す扉", effectTags: ["random", "summon"], power: "mid" },
  "SCP-261": { triggerHint: "異次元のスナックを供給、高額投入時には攻撃的アイテムも", effectTags: ["random"], power: "low" },
  "SCP-268": { triggerHint: "味方1体を完全不可視化し敵の標的にできなくする帽子", effectTags: ["stealth"], power: "mid" },
  "SCP-272": { triggerHint: "敵1体を釘で固定し移動と行動を完全に封じる", effectTags: ["disrupt"], power: "mid" },
  "SCP-292": { triggerHint: "繭で味方を強力な存在に変容させる魔女の繭", effectTags: ["transform", "enhance"], power: "mid" },
  "SCP-310": { triggerHint: "消えない炎で味方を守り毎ターン回復、敵接触でダメージ", effectTags: ["heal", "defense"], power: "mid" },
  "SCP-315": { triggerHint: "ビデオ記録から敵の未来行動を予測し対策を講じる", effectTags: ["info"], power: "mid" },
  "SCP-321": { triggerHint: "急成長の胎児で味方全体のコストを一時軽減する", effectTags: ["enhance"], power: "mid" },
  "SCP-337": { triggerHint: "巨大な毛で敵を絡め取り拘束する知性ある毛玉", effectTags: ["disrupt"], power: "low" },
  "SCP-339": { triggerHint: "最も脅威な敵1体を静止させ1ターン行動不能にする彫像", effectTags: ["disrupt"], power: "mid" },
  "SCP-342": { triggerHint: "敵1体を未知の目的地へ送り戦場から除外する乗車券", effectTags: ["nullify"], power: "high" },
  "SCP-343": { triggerHint: "現実そのものを書き換える全能の存在として全てを操作する", effectTags: ["cosmic"], power: "high" },
  "SCP-348": { triggerHint: "父の愛のスープで味方の士気と精神力を完全回復する", effectTags: ["heal"], power: "mid" },
  "SCP-370": { triggerHint: "あらゆる封印を解除し敵の防御とバリアを完全無力化する鍵", effectTags: ["nullify"], power: "high" },
  "SCP-372": { triggerHint: "視界端に逃れて直接攻撃を受けず側面奇襲を仕掛ける", effectTags: ["stealth"], power: "mid" },
  "SCP-378": { triggerHint: "敵の脳に寄生し対象カードを支配下に置く脳寄生虫", effectTags: ["mind"], power: "mid" },
  "SCP-399": { triggerHint: "忘れられないメロディで敵集中を奪い行動を妨害する", effectTags: ["disrupt", "mind"], power: "low" },
  "SCP-407": { triggerHint: "創世の歌で味方全体の体力を回復する音楽", effectTags: ["heal"], power: "mid" },
  "SCP-408": { triggerHint: "蝶の幻影で敵を撹乱し攻撃の的を逸らす", effectTags: ["mind", "stealth"], power: "low" },
  "SCP-410": { triggerHint: "現実を書き換え味方の能力効果をもう一度発動させる万年筆", effectTags: ["enhance", "cosmic"], power: "high" },
  "SCP-420-J": { triggerHint: "最高のアレで味方全体の士気を最大まで上昇させる", effectTags: ["enhance"], power: "low" },
  "SCP-426": { triggerHint: "敵の自我を侵食し『自分はトースターだ』と認識させる", effectTags: ["mind"], power: "mid" },
  "SCP-427": { triggerHint: "即座に全回復するが2ターン以上で味方が肉塊化するロケット", effectTags: ["heal"], power: "mid" },
  "SCP-432": { triggerHint: "敵を無限のキャビネット迷路に閉じ込め脱出不能にする", effectTags: ["disrupt"], power: "mid" },
  "SCP-447": { triggerHint: "緑の粘液で味方に保護効果を付与し破壊を1回防ぐ", effectTags: ["defense"], power: "mid" },
  "SCP-455": { triggerHint: "敵を歪んだ貨物船に引き込み脱出不能の迷路に閉じ込める", effectTags: ["disrupt"], power: "mid" },
  "SCP-458": { triggerHint: "無限ピザ箱で味方の士気と体力を持続回復する補給源", effectTags: ["heal"], power: "low" },
  "SCP-462": { triggerHint: "味方を危険から即座に脱出させ手札に戻す逃走車", effectTags: ["stealth"], power: "mid" },
  "SCP-469": { triggerHint: "戦場の音を吸収して巨大化する多翼の天使", effectTags: ["enhance"], power: "mid" },
  "SCP-492": { triggerHint: "味方陣営の士気を高め協力行動を強化する善良マネキン", effectTags: ["enhance"], power: "low" },
  "SCP-500": { triggerHint: "万能薬の錠剤で味方の状態異常を全て無効化し完全回復させる", effectTags: ["heal", "nullify"], power: "high" },
  "SCP-500-D": { triggerHint: "あらゆる異常攻撃を吸収無効化する超合金の防御障壁", effectTags: ["defense", "nullify"], power: "high" },
  "SCP-507": { triggerHint: "攻撃を受けた瞬間に別次元へ逃避しダメージを無効化する", effectTags: ["stealth", "nullify"], power: "mid" },
  "SCP-525": { triggerHint: "敵の視覚を奪い次ターンの攻撃精度を大幅低下させる眼蜘蛛", effectTags: ["disrupt"], power: "mid" },
  "SCP-527": { triggerHint: "フィールドを水没させ敵を溺れさせる魚頭の男", effectTags: ["disrupt"], power: "mid" },
  "SCP-529": { triggerHint: "存在境界を曖昧にして攻撃を半分すり抜けさせる半分猫", effectTags: ["stealth"], power: "low" },
  "SCP-545": { triggerHint: "液体の体で物理攻撃をすり抜け任意形態で攻撃する", effectTags: ["stealth", "transform"], power: "mid" },
  "SCP-572": { triggerHint: "装備者に無敵の錯覚を与えるが実火力は低い偽の名刀", effectTags: ["mind"], power: "low" },
  "SCP-579": { triggerHint: "[データ削除済]、効果は記録に残らず予測不能", effectTags: ["cosmic", "random"], power: "high" },
  "SCP-582": { triggerHint: "物語の力で現実を書き換え毎ターン強度を増す予測不能効果", effectTags: ["cosmic", "random"], power: "high" },
  "SCP-586": { triggerHint: "敵の指令に誤字を混入させ命令系統を混乱させるペン", effectTags: ["disrupt"], power: "low" },
  "SCP-597": { triggerHint: "敵を精神的に退行させ母への絶対的依存状態にする肉塊", effectTags: ["mind"], power: "mid" },
  "SCP-616": { triggerHint: "敵を未知の次元に追放し変容して帰還させる航空機", effectTags: ["nullify", "transform"], power: "high" },
  "SCP-633": { triggerHint: "敵の電子系カードを乗っ取り支配下に置く電子の幽霊", effectTags: ["mind"], power: "mid" },
  "SCP-662": { triggerHint: "完璧な執事を召喚しあらゆる支援任務を遂行させる呼び鈴", effectTags: ["summon", "enhance"], power: "mid" },
  "SCP-699": { triggerHint: "ランダムなカードを引く木箱、有益とも危険ともなり得る", effectTags: ["random"], power: "mid" },
  "SCP-702": { triggerHint: "敵手札からランダム1枚を奪い自分のものとして使用する古銭", effectTags: ["disrupt"], power: "mid" },
  "SCP-714": { triggerHint: "翡翠の指輪で精神攻撃を完全防御するが物理能力低下", effectTags: ["defense", "nullify"], power: "mid" },
  "SCP-718": { triggerHint: "敵に被監視感を与え全ての行動情報を暴露させる眼球", effectTags: ["info", "mind"], power: "mid" },
  "SCP-738": { triggerHint: "悪魔との取引で強力効果を発動するが次ターンに敵が代償得る", effectTags: ["enhance", "random"], power: "high" },
  "SCP-762": { triggerHint: "味方を不死状態にする鉄の処女、苦痛は続くが倒れない", effectTags: ["defense", "revive"], power: "mid" },
  "SCP-831": { triggerHint: "壊れた味方の装備を修復しさらに強化する小型昆虫群", effectTags: ["enhance", "heal"], power: "mid" },
  "SCP-846": { triggerHint: "破壊されても次ターンに自己修復して復活する玩具ロボ", effectTags: ["revive"], power: "mid" },
  "SCP-860": { triggerHint: "青い森への扉を開き敵を迷宮に閉じ込め獣に追跡させる", effectTags: ["disrupt", "summon"], power: "mid" },
  "SCP-963": { triggerHint: "対象の精神を上書き支配し別宿主へ意識を移す不死の護符", effectTags: ["mind", "revive"], power: "high" },
  "SCP-978": { triggerHint: "敵の真の欲望を撮影で暴き隠された弱点を明らかにする", effectTags: ["info", "mind"], power: "mid" },
  "SCP-993": { triggerHint: "洗脳放送で敵のカードコストを永続的に増加させる道化番組", effectTags: ["disrupt", "mind"], power: "mid" },
  "SCP-999": { triggerHint: "幸福感で敵の攻撃意欲を完全に消失させ精神攻撃を無効化", effectTags: ["heal", "nullify"], power: "high" },
  "SCP-1025": { triggerHint: "敵に特定疾患を発症させ能力値を低下させる病の事典", effectTags: ["disrupt"], power: "mid" },
  "SCP-1055": { triggerHint: "敵がカードを使うほど強化される認識依存の節足存在", effectTags: ["enhance"], power: "mid" },
  "SCP-1111": { triggerHint: "守護対象への攻撃を全て代わりに受ける霊体の白犬", effectTags: ["defense"], power: "mid" },
  "SCP-1123": { triggerHint: "骨の旋律で敵の精神を蝕み手札を乱す骨のオーケストラ", effectTags: ["disrupt", "mind"], power: "mid" },
  "SCP-1171": { triggerHint: "異次元からの敵意で敵の手札上限を減少させる", effectTags: ["disrupt"], power: "mid" },
  "SCP-1230": { triggerHint: "夢の中で英雄として鍛えた技を現実の能力に反映させる本", effectTags: ["enhance"], power: "mid" },
  "SCP-1233": { triggerHint: "宇宙と異次元からの攻撃を無効化する月の騎士の守護", effectTags: ["defense", "nullify"], power: "mid" },
  "SCP-1313": { triggerHint: "数式を解くとクマが出現する数学的具現化、結果は解法次第", effectTags: ["random", "summon"], power: "low" },
  "SCP-1370": { triggerHint: "戦闘力はないが存在するだけで敵を苛立たせ妨害する小型ロボ", effectTags: ["disrupt"], power: "low" },
  "SCP-1471": { triggerHint: "視界に常に出現し精神圧で敵の集中力を著しく低下させる", effectTags: ["mind"], power: "low" },
  "SCP-1499": { triggerHint: "ガスマスクで装着者を異次元に退避させ攻撃を回避する", effectTags: ["stealth"], power: "mid" },
  "SCP-1678": { triggerHint: "地下都市UnLondonの迷宮に敵を閉じ込め脱出を妨害する", effectTags: ["disrupt"], power: "mid" },
  "SCP-1730": { triggerHint: "次元の交差点から予測不能な力を引き出しKeter攻撃を無効化", effectTags: ["nullify", "cosmic"], power: "high" },
  "SCP-1762": { triggerHint: "紙の竜の幻影を召喚し記憶で敵の心を深く揺さぶる", effectTags: ["mind", "summon"], power: "low" },
  "SCP-1861": { triggerHint: "霧の中へ敵を誘い戦場から永久に除外する幽霊船", effectTags: ["nullify"], power: "high" },
  "SCP-2000": { triggerHint: "文明そのものをリセットし再構築する究極のやり直し能力", effectTags: ["revive", "cosmic"], power: "high" },
  "SCP-2003": { triggerHint: "未来の戦況を観測し最適な行動を選択する時計仕掛け", effectTags: ["info"], power: "high" },
  "SCP-2006": { triggerHint: "B級変身は怖くないが本気の真の姿は真に恐ろしい球体", effectTags: ["transform", "mind"], power: "low" },
  "SCP-2008": { triggerHint: "数ターンかけて変容し完全体になると大幅に強化される", effectTags: ["transform", "enhance"], power: "mid" },
  "SCP-2076": { triggerHint: "願いを叶えてカードを引くが代償として手札を失う流星", effectTags: ["random"], power: "mid" },
  "SCP-2030": { triggerHint: "敵を抑制不能な笑いの発作で麻痺させ行動不能にする偽コメディ番組", effectTags: ["mind", "disable"], power: "high" },
  "SCP-1733": { triggerHint: "過去のプレイを書き換え敵の直前の行動を1ターン巻き戻す試合記録DVD", effectTags: ["rewind", "info"], power: "mid" },
  "SCP-061": { triggerHint: "声で敵に命令を強制し1ターン行動を完全コントロールする聴覚催眠", effectTags: ["mind", "control"], power: "high" },
  "SCP-091": { triggerHint: "1955年の精神世界で味方を休ませ体力と精神を完全回復する古いラジオ", effectTags: ["heal"], power: "mid" },
  "SCP-111": { triggerHint: "味方アタッカーに元素ブレスを付与し攻撃に追加ダメージを与える小竜カタツムリ", effectTags: ["enhance"], power: "mid" },
  "SCP-117": { triggerHint: "あらゆる状況に対応する万能ツールとして味方の必要に応じた道具を提供する", effectTags: ["enhance", "info"], power: "mid" },
  "SCP-871": { triggerHint: "無限に自己複製するケーキで味方に持続回復を提供する補給源", effectTags: ["heal"], power: "mid" },
  "SCP-2191": { triggerHint: "倒した敵を吸血鬼として再生産し味方軍勢に加える施設", effectTags: ["revive", "summon"], power: "high" },
  "SCP-2256": { triggerHint: "視認不可能な巨人として効果対象にならず防御も不能", effectTags: ["stealth"], power: "high" },
  "SCP-2295": { triggerHint: "布製の代替臓器で味方の損傷を即座に修復し致命傷も治す", effectTags: ["heal"], power: "high" },
  "SCP-2316": { triggerHint: "敵に偽記憶を植え付け水中へ誘引する湖の死体群", effectTags: ["mind"], power: "mid" },
  "SCP-2798": { triggerHint: "味方全体を敵の認識から隠蔽し攻撃不能にする防壁装置", effectTags: ["stealth"], power: "high" },
  "SCP-2950": { triggerHint: "認識フィルターが解除されれば真の姿が顕現する『椅子』", effectTags: ["transform", "cosmic"], power: "mid" },
  "SCP-3301": { triggerHint: "ボードゲーム盤上で現実を操作しダイスで世界の運命を決める", effectTags: ["random", "cosmic"], power: "high" },
  "SCP-3480": { triggerHint: "味方を一時的に神格化し超越的な力を与える施設", effectTags: ["enhance", "transform"], power: "high" },
  "SCP-4010": { triggerHint: "過去に遡り戦闘の結果を書き換え敗北を勝利に変える", effectTags: ["revive", "cosmic"], power: "high" },
  "SCP-4100": { triggerHint: "望ましい未来を確定させ不利な展開を排除する運命の鍵", effectTags: ["cosmic"], power: "high" },
  "SCP-4200": { triggerHint: "戦場を収縮させ敵の行動範囲を極限まで狭める制圧空間", effectTags: ["disrupt"], power: "mid" },
  "SCP-4290": { triggerHint: "信仰を代償に味方の全状態異常と損傷を完全治癒する神の病院", effectTags: ["heal"], power: "high" },
  "SCP-4999": { triggerHint: "消滅する味方に寄り添い最期の力を引き出す癒しの存在", effectTags: ["revive", "heal"], power: "mid" },
  "SCP-5000": { triggerHint: "着用者をあらゆる異常効果から完全隔離する除外スーツ", effectTags: ["defense", "nullify"], power: "high" },
  "SCP-6000": { triggerHint: "あらゆるSCPの情報と対策を即座に引き出す放浪者の図書館", effectTags: ["info"], power: "high" },
  "SCP-6500": { triggerHint: "敵の異常能力を完全に消滅させる魔法の終焉現象", effectTags: ["nullify", "cosmic"], power: "high" }
};

// Default for supporters not yet defined (filled in Phase 5)
function getSupporterEffect(scpId) {
  return SUPPORTER_EFFECTS[scpId] || {
    triggerHint: "設定に基づく汎用支援効果を発動する",
    effectTags: ["enhance"],
    power: "low"
  };
}

// ===== v2.0.0 AI DECKS =====
const AI_DECKS = {
  F: [
    { name: "新人研究員チームα", attackers: ["SCP-085","SCP-1048","SCP-087"], supporters: ["SCP-999","SCP-2295","SCP-914","SCP-500","SCP-1471","SCP-178"] },
    { name: "サイト19見習い班", attackers: ["SCP-143","SCP-158","SCP-198"], supporters: ["SCP-1471","SCP-268","SCP-714","SCP-006","SCP-038","SCP-148"] },
    { name: "Dクラス調査隊", attackers: ["SCP-668","SCP-894","SCP-066"], supporters: ["SCP-914","SCP-148","SCP-1471","SCP-427","SCP-1499","SCP-500"] }
  ],
  E: [
    { name: "現場対応班ベータ", attackers: ["SCP-173","SCP-087","SCP-294"], supporters: ["SCP-662","SCP-2295","SCP-914","SCP-500","SCP-1471","SCP-079"] },
    { name: "異常物品研究部", attackers: ["SCP-019","SCP-012","SCP-002"], supporters: ["SCP-178","SCP-056","SCP-053","SCP-006","SCP-148","SCP-038"] },
    { name: "収容違反対策班", attackers: ["SCP-895","SCP-513","SCP-2662"], supporters: ["SCP-105","SCP-529","SCP-914","SCP-500","SCP-432","SCP-1230"] }
  ],
  D: [
    { name: "機動部隊エプシロン9", attackers: ["SCP-049","SCP-035","SCP-939"], supporters: ["SCP-914","SCP-500","SCP-105","SCP-2295","SCP-178","SCP-662"] },
    { name: "中堅収容スペシャリスト", attackers: ["SCP-049","SCP-173","SCP-939"], supporters: ["SCP-914","SCP-500","SCP-963","SCP-053","SCP-1471","SCP-056"] },
    { name: "実験的収容チーム", attackers: ["SCP-035","SCP-093","SCP-701"], supporters: ["SCP-131","SCP-914","SCP-500","SCP-432","SCP-1230","SCP-073"] }
  ],
  C: [
    { name: "倫理委員会監察班", attackers: ["SCP-049","SCP-173","SCP-035"], supporters: ["SCP-914","SCP-500","SCP-105","SCP-963","SCP-073","SCP-662"] },
    { name: "Keter級対応部隊", attackers: ["SCP-096","SCP-173","SCP-049"], supporters: ["SCP-914","SCP-500","SCP-963","SCP-178","SCP-432","SCP-073"] },
    { name: "アルファ実戦小隊", attackers: ["SCP-035","SCP-939","SCP-008"], supporters: ["SCP-105","SCP-914","SCP-500","SCP-4010","SCP-056","SCP-178"] }
  ],
  B: [
    { name: "機動部隊ニュー7", attackers: ["SCP-049","SCP-106","SCP-173"], supporters: ["SCP-914","SCP-500","SCP-4010","SCP-073","SCP-178","SCP-432"] },
    { name: "O5評議会直属隊", attackers: ["SCP-096","SCP-076","SCP-049"], supporters: ["SCP-914","SCP-500","SCP-105","SCP-2003","SCP-056","SCP-053"] },
    { name: "黒の女王部隊", attackers: ["SCP-610","SCP-106","SCP-035"], supporters: ["SCP-914","SCP-500","SCP-4010","SCP-178","SCP-963","SCP-148"] }
  ],
  A: [
    { name: "機動部隊オメガ7", attackers: ["SCP-682","SCP-173","SCP-096"], supporters: ["SCP-914","SCP-500","SCP-179","SCP-105","SCP-178","SCP-432"] },
    { name: "終末対応特務隊", attackers: ["SCP-682","SCP-049","SCP-076"], supporters: ["SCP-914","SCP-500","SCP-179","SCP-662","SCP-056","SCP-053"] },
    { name: "K-クラス防衛軍", attackers: ["SCP-096","SCP-106","SCP-035"], supporters: ["SCP-500","SCP-914","SCP-2000","SCP-105","SCP-178","SCP-148"] }
  ],
  S: [
    { name: "財団最終決戦部隊", attackers: ["SCP-2845","SCP-3812","SCP-682"], supporters: ["SCP-914","SCP-500","SCP-053","SCP-148","SCP-006","SCP-1499"] },
    { name: "現実改変対抗チーム", attackers: ["SCP-2399","SCP-2317","SCP-682"], supporters: ["SCP-914","SCP-500","SCP-006","SCP-053","SCP-148","SCP-1499"] },
    { name: "O5最終兵器部隊", attackers: ["SCP-173","SCP-096","SCP-682"], supporters: ["SCP-343","SCP-914","SCP-500","SCP-105","SCP-053","SCP-148"] }
  ]
};

// getAbilityTypes removed in v2.0.0 — replaced by getRole(scpId)

// Coin values per class (duplicate conversion)
const COIN_VALUES = { safe: 10, euclid: 25, keter: 50, thaumiel: 100 };
const PACK_COIN_COST = 100;

// Battle state
// v2.0.0 BO1 battle state
let bRound = 0;
let bPScore = 0;
let bAIScore = 0;
let bDrawScore = 0;
let bPlayerHand = []; // legacy, retained as full deck snapshot
let bAIHand = [];
let selectedHandIdx = -1; // legacy
let battleLocked = false;
let battleHistory = [];
// New BO1 selection state
let bPlayerAttackers = [];   // 3 attacker SCPs
let bPlayerSupporters = [];  // 6 supporter SCPs
let bAIAttackers = [];
let bAISupporters = [];
let bAIPick = null;          // { attacker, supporters[2] }  pre-determined
let pSelectedAttackerId = null;
let pSelectedSupporterIds = []; // up to 2

// ===== SCP ABILITY NAMES =====
const SCP_ABILITY_NAMES = {
  "SCP-999": { attack: "多幸感の波動", defense: "癒しのオーラ" },
  "SCP-914": { attack: "粗い変換", defense: "精密機構" },
  "SCP-2295": { attack: "布製修復", defense: "臓器再生" },
  "SCP-131": { attack: "永遠の凝視", defense: "不断の監視" },
  "SCP-049": { attack: "死の治療", defense: "異常な意志力" },
  "SCP-173": { attack: "頸部破壊", defense: "コンクリートの硬度" },
  "SCP-096": { attack: "激昂追跡", defense: "阻止不可能な突進" },
  "SCP-035": { attack: "精神支配", defense: "腐食フィールド" },
  "SCP-682": { attack: "適応破壊", defense: "無限再生" },
  "SCP-106": { attack: "次元引き込み", defense: "物質透過" },
  "SCP-076": { attack: "虚空の刃", defense: "石棺再生" },
  "SCP-2399": { attack: "反物質弾頭", defense: "電磁パルス障壁" },
  "SCP-343": { attack: "現実改変", defense: "全能の意志" },
  "SCP-179": { attack: "太陽フレア", defense: "脅威予知" },
  "SCP-500": { attack: "万能治癒", defense: "完全浄化" },
  "SCP-529": { attack: "半存在の一撃", defense: "位相ずれ回避" },
  "SCP-1048": { attack: "複製体生成", defense: "無邪気な偽装" },
  "SCP-458": { attack: "熱々投擲", defense: "無限補給" },
  "SCP-085": { attack: "二次元の罠", defense: "平面退避" },
  "SCP-939": { attack: "擬声誘引", defense: "毒牙の反撃" },
  "SCP-066": { attack: "破壊音波", defense: "不協和音障壁" },
  "SCP-294": { attack: "液体反物質", defense: "液体装甲" },
  "SCP-087": { attack: "無限落下", defense: "暗闘の恐怖" },
  "SCP-1471": { attack: "精神侵食", defense: "遍在する影" },
  "SCP-953": { attack: "九尾の幻術", defense: "変身回避" },
  "SCP-610": { attack: "肉塊感染", defense: "変異増殖" },
  "SCP-1000": { attack: "古代超技術", defense: "森の隠遁" },
  "SCP-2317": { attack: "終末の解放", defense: "次元封印" },
  "SCP-3000": { attack: "自我溶解", defense: "深淵の回帰" },
  "SCP-2000": { attack: "文明リセット", defense: "再構築プロトコル" },
  "SCP-073": { attack: "ダメージ反射", defense: "カインの刻印" },
  "SCP-105": { attack: "遠隔写真操作", defense: "次元越しの手" },
  "SCP-662": { attack: "執事の一撃", defense: "完璧な奉仕" },
  "SCP-500-D": { attack: "合金衝撃", defense: "異常吸収障壁" },
  "SCP-001": { attack: "炎の剣", defense: "天使の威光" },
  "SCP-002": { attack: "肉壁吸収", defense: "有機同化" },
  "SCP-008": { attack: "ゾンビ感染", defense: "プリオン拡散" },
  "SCP-017": { attack: "影の包囲", defense: "暗黒消失" },
  "SCP-053": { attack: "自滅誘発", defense: "無垢の再生" },
  "SCP-055": { attack: "認識消去", defense: "反ミーム遮断" },
  "SCP-079": { attack: "システム侵入", defense: "電子防壁" },
  "SCP-093": { attack: "次元追放", defense: "鏡面転移" },
  "SCP-169": { attack: "大陸沈没", defense: "深海の巨体" },
  "SCP-217": { attack: "機械化感染", defense: "歯車装甲" },
  "SCP-239": { attack: "現実書換", defense: "願望防壁" },
  "SCP-261": { attack: "異次元射出", defense: "次元補給" },
  "SCP-348": { attack: "父の励まし", defense: "温かいスープ" },
  "SCP-354": { attack: "怪物召喚", defense: "紅き深淵" },
  "SCP-426": { attack: "認知汚染", defense: "自我侵食" },
  "SCP-513": { attack: "影の召喚", defense: "恐怖の鈴音" },
  "SCP-575": { attack: "捕食の闇", defense: "光源破壊" },
  "SCP-860": { attack: "青い森の追跡", defense: "次元扉" },
  "SCP-895": { attack: "致死幻覚", defense: "映像汚染" },
  "SCP-963": { attack: "人格上書", defense: "不滅の意識" }
};

// REVIVE_SCPS / CLASS_ADV removed in v2.0.0 — judgment delegated to Claude API + supporter effects
const REVIVE_SCPS = new Set(); // kept as empty stub for legacy template references

// FB templates / expandTemplate / aiSelectCard removed in v2.0.0 — see fallbackResult & aiPickForBattle below
const _REMOVED_FB = { /*
  keter_safe: {
    player: [
      "#{p.id}の#{p.attack}が炸裂！Safeクラスの#{a.name}では#{p.name}のKeterレベルの脅威に抗えなかった。圧倒的な力の差が戦場を支配した。",
      "#{p.name}が#{p.attack}を解放する。#{a.id}の#{a.defense}は一瞬で突破され、Keterの異常性が勝利を確定させた。",
      "収容困難なKeterクラス、#{p.id}。その#{p.attack}の前に#{a.name}は為す術もなく沈黙した。"
    ],
    ai: [
      "#{a.id}の#{a.attack}が予想外の効果を発揮！#{p.name}のKeterレベルの脅威を巧みに無力化した。番狂わせの勝利だ。",
      "Safeクラスながら#{a.name}の#{a.attack}が#{p.id}の弱点を突いた。クラスだけでは勝敗は決まらない。"
    ],
    draw: [
      "#{p.id}の圧倒的な力と#{a.id}の巧みな回避が拮抗。Keter対Safeの予想を覆す膠着状態となった。",
      "#{p.name}の#{p.attack}が#{a.name}を追い詰めるも、#{a.defense}が最後の一線を守り切り、引き分けに。"
    ]
  },
  safe_keter: {
    player: [
      "#{p.id}の#{p.attack}がまさかの効果！#{a.name}のKeterレベルの脅威を逆手に取った、SCP財団史に残る番狂わせだ。",
      "Safeクラスの#{p.name}が冷静に#{p.attack}を発動。#{a.id}の#{a.attack}を巧みに回避し、隙を突いた。"
    ],
    ai: [
      "#{a.id}の#{a.attack}が容赦なく#{p.name}を襲う。Safeクラスの#{p.defense}ではKeterの脅威を防ぎきれなかった。",
      "#{a.name}が#{a.attack}を解き放つ。#{p.id}の#{p.defense}は一瞬で崩壊し、クラスの差が如実に現れた。",
      "Keterクラスの圧倒的な異常性。#{a.id}の前に#{p.name}は抵抗すら許されなかった。"
    ],
    draw: [
      "#{p.name}の#{p.defense}がKeterの猛攻を凌ぎ、しかし反撃には至らない。両者一歩も譲らぬ展開に。"
    ]
  },
  euclid_safe: {
    player: [
      "#{p.id}の#{p.attack}が#{a.name}を捕捉。Euclidの予測困難な異常性がSafeクラスの防御を超えた。",
      "#{p.name}の不可解な能力が発動。#{a.id}の#{a.defense}は#{p.attack}の前に意味を成さなかった。"
    ],
    ai: [
      "#{a.name}の#{a.attack}が#{p.id}の隙を突いた。Euclidの不安定さが仇となり、Safeの堅実さが勝った。",
      "#{a.id}が#{a.defense}で#{p.name}の攻撃を耐え凌ぎ、反撃の#{a.attack}が決まった。"
    ],
    draw: ["#{p.id}と#{a.id}が互いの能力を相殺し合う。Euclid対Safeの戦いは予想通りの膠着に終わった。"]
  },
  safe_euclid: {
    player: [
      "#{p.name}の#{p.attack}が#{a.id}のEuclid特性を封じた。堅実なSafeクラスの戦術が光る勝利だ。",
      "#{p.id}が#{p.defense}で#{a.name}の猛攻を受け止め、#{p.attack}で反撃。地道な戦略が実を結んだ。"
    ],
    ai: [
      "#{a.id}の#{a.attack}が猛威を振るう。#{p.name}のSafeクラスの防御ではEuclidの脅威を止められなかった。",
      "#{a.name}が予測不能な#{a.attack}を繰り出す。#{p.id}は対応しきれず、Euclidの不確実性に敗れた。"
    ],
    draw: ["#{p.name}と#{a.name}の力が拮抗。SafeとEuclidの中間的な戦力差が膠着を生んだ。"]
  },
  keter_euclid: {
    player: [
      "#{p.id}が#{p.attack}で一気に攻め込む。#{a.name}のEuclidクラスの能力では、Keterの破壊力を受け止めきれなかった。",
      "#{p.name}の圧倒的な#{p.attack}が#{a.id}を追い詰める。クラスの格差が如実に表れた戦いだ。"
    ],
    ai: [
      "#{a.id}の#{a.attack}が#{p.name}の隙を突いた！Euclidの予測困難な特性がKeterの猛威を封じた。",
      "#{a.name}が#{a.defense}で#{p.id}の攻撃を凌ぎ、絶妙なカウンターを決めた。"
    ],
    draw: ["#{p.id}と#{a.id}の激突。KeterとEuclidが全力でぶつかり合い、決着はつかなかった。"]
  },
  euclid_keter: {
    player: [
      "#{p.name}の#{p.attack}が#{a.id}の弱点を突いた！Euclidの予測不能な能力がKeterの防御を突破した。",
      "#{p.id}が見事な#{p.attack}でKeterクラスの#{a.name}を制圧。クラスを超えた勝利だ。"
    ],
    ai: [
      "#{a.id}の#{a.attack}がEuclidクラスの#{p.name}を蹂躙。Keterの圧倒的な力の前に、抵抗は無意味だった。",
      "#{a.name}の#{a.attack}が容赦なく#{p.id}を追い詰める。格上のKeterには敵わなかった。"
    ],
    draw: ["#{p.name}の#{p.defense}が#{a.id}の猛攻を凌ぐ。EuclidとKeterの戦いは互角の展開を見せた。"]
  },
  thaumiel_keter: {
    player: [
      "Thaumielクラス#{p.id}の#{p.attack}が発動。財団の切り札がKeterの#{a.name}を制御下に置いた。",
      "#{p.name}が#{p.attack}で#{a.id}を封じ込める。Thaumielこそが最上位の存在だと証明した。"
    ],
    ai: [
      "#{a.id}の#{a.attack}がThaumielの#{p.name}を圧倒！Keterの破壊衝動がThaumielの制御を上回った。",
      "#{a.name}の#{a.defense}が#{p.id}の能力を無効化。Keterの適応力がThaumielすら凌駕した。"
    ],
    draw: ["#{p.id}と#{a.id}、最高クラス同士の激突。Thaumiel対Keterの戦いは次元を超えた膠着に。"]
  },
  keter_thaumiel: {
    player: [
      "#{p.id}の#{p.attack}がThaumielの#{a.name}を突破！Keterの破壊衝動がThaumielの制御を凌駕した。",
      "#{p.name}の猛威が#{a.id}の#{a.defense}を打ち砕く。収容不能の力がThaumielすら圧倒した。"
    ],
    ai: [
      "#{a.id}が#{a.attack}で#{p.name}を制御下に置いた。Thaumielこそが全SCPの上に立つ存在だ。",
      "#{a.name}の#{a.attack}が#{p.id}のKeterレベルの脅威を完全に封じ込めた。"
    ],
    draw: ["Keterの破壊力とThaumielの制御力が完全に拮抗。決着のつかない最高レベルの戦いだ。"]
  },
  same: {
    player: [
      "同クラスの激突！#{p.id}の#{p.attack}が僅差で#{a.name}の#{a.defense}を上回り、勝利を掴んだ。",
      "#{p.name}が#{p.attack}を巧みに操り、同格の#{a.id}を制した。実力伯仲の名勝負だった。"
    ],
    ai: [
      "#{a.id}の#{a.attack}が#{p.name}を僅差で上回った。同クラスの戦いは紙一重の差で決着がついた。",
      "#{a.name}が#{a.defense}で持ちこたえ、#{a.attack}で反撃。#{p.id}は惜しくも一歩及ばなかった。"
    ],
    draw: [
      "#{p.id}と#{a.id}、同クラスの意地がぶつかり合う。互いの能力が完全に拮抗し、決着はつかなかった。",
      "#{p.name}の#{p.attack}と#{a.name}の#{a.attack}が激突。同等の力を持つ両者に勝敗の差は生まれなかった。"
    ]
  },
  thaumiel_safe: {
    player: ["#{p.id}の#{p.attack}が#{a.name}を包み込む。Thaumielの超越的な力にSafeクラスは抗えなかった。"],
    ai: ["#{a.name}の#{a.attack}がThaumielの隙を突いた！格上の#{p.id}を出し抜く大金星だ。"],
    draw: ["#{p.name}の力が#{a.id}を圧倒するかに見えたが、予想外の#{a.defense}が発動し膠着状態に。"]
  },
  safe_thaumiel: {
    player: ["#{p.name}の#{p.attack}がThaumielの#{a.name}の弱点を突いた。小さな存在が巨大な力を覆す奇跡の勝利！"],
    ai: ["#{a.id}が#{a.attack}を静かに発動。Safeクラスの#{p.name}にThaumielの力は圧倒的だった。"],
    draw: ["#{p.id}が必死に#{p.defense}で耐え凌ぐ。Thaumielの力を完全には受け止められないが、倒されもしなかった。"]
  },
  thaumiel_euclid: {
    player: ["#{p.id}の#{p.attack}がEuclidの#{a.name}を完全に制御。Thaumielの力で不確定要素を排除した。"],
    ai: ["#{a.name}のEuclid特有の予測不能な#{a.attack}がThaumielの制御を突破した！"],
    draw: ["#{p.name}が#{a.id}を制御しようとするが、Euclidの不安定さが完全な制圧を妨げた。"]
  },
  euclid_thaumiel: {
    player: ["#{p.name}の#{p.attack}が予測不能な軌道でThaumielの#{a.name}を捉えた。Euclidの不確実性が勝利を呼んだ。"],
    ai: ["#{a.id}が#{a.attack}で#{p.name}のEuclid特性を完全に無効化した。Thaumielの超越的な力が勝った。"],
    draw: ["Euclidの不確定さとThaumielの制御が互いを牽制し合い、均衡が崩れなかった。"]
  }
};

function expandTemplate(tpl, pCard, aiCard) {
  const pa = SCP_ABILITY_NAMES[pCard.id] || { attack: "特殊能力", defense: "防御" };
  const aa = SCP_ABILITY_NAMES[aiCard.id] || { attack: "特殊能力", defense: "防御" };
  return tpl
    .replace(/#{p\.id}/g, pCard.id).replace(/#{p\.name}/g, pCard.name)
    .replace(/#{p\.attack}/g, pa.attack).replace(/#{p\.defense}/g, pa.defense)
    .replace(/#{a\.id}/g, aiCard.id).replace(/#{a\.name}/g, aiCard.name)
    .replace(/#{a\.attack}/g, aa.attack).replace(/#{a\.defense}/g, aa.defense);
}

// ===== AI STRATEGY ENGINE =====
function aiSelectCard(aiHand, playerCard, round, pScore, aiScore) {
  const unused = aiHand.filter(c => !c._used);
  if (unused.length === 0) return null;
  if (unused.length === 1) return unused[0];

  // 25% chance of random selection (prevent AI from being too perfect)
  if (Math.random() < 0.25) {
    return unused[Math.floor(Math.random() * unused.length)];
  }

  const scoreDiff = aiScore - pScore;
  const remainingRounds = 5 - round;

  return unused.reduce((best, card) => {
    let score = 0;

    // Counter the player's card: class advantage
    const adv = getClassAdvantage(card.cls, playerCard.cls);
    score += adv * 15;

    // Cost advantage over player's card
    const costDiff = card.cost - playerCard.cost;
    if (costDiff > 0 && costDiff <= 3) score += costDiff * 1.5;
    if (costDiff > 3) score += 3; // diminishing returns for overkill

    // Don't waste high-cost cards on low-cost opponents
    if (playerCard.cost <= 3 && card.cost >= 8) score -= 3;

    // If losing, prefer stronger counters
    if (scoreDiff < 0) score += card.cost * 0.3;

    // If winning comfortably, use weaker cards to conserve
    if (scoreDiff >= 2) score -= card.cost * 0.2;

    // Last round: go all out
    if (remainingRounds <= 1) score += card.cost * 0.4;

    // Penultimate round & tied/losing: use strong card
    if (remainingRounds === 2 && scoreDiff <= 0) score += card.cost * 0.2;

    // Class base bonus
    if (card.cls === 'keter') score += 1;
    if (card.cls === 'thaumiel') score += 1.5;

    // Add noise
    score += Math.random() * 2;

    if (!best || score > best._bestScore) {
      return { card, _bestScore: score };
    }
    return best;
  }, null)?.card || unused[0];
} */ };

// ===== v2.0.0 AI BATTLE PICK =====
function aiPickForBattle(aiAttackers, aiSupporters) {
  // Random pick from pool (simultaneous selection — does not see player choice)
  const att = aiAttackers[Math.floor(Math.random() * aiAttackers.length)];
  const sups = [...aiSupporters].sort(() => Math.random() - 0.5).slice(0, 1);
  return { attacker: att, supporters: sups };
}

// Load saved data
try {
  const saved = JSON.parse(localStorage.getItem('scp_collection'));
  if (saved) collection = saved;
} catch(e) {}
// Deck slots (3 presets)
let currentDeckSlot = parseInt(localStorage.getItem('scp_deck_slot') || '0');
if (isNaN(currentDeckSlot) || currentDeckSlot < 0 || currentDeckSlot > 2) currentDeckSlot = 0;
// Migrate legacy single deck → slot 0
try {
  const legacy = JSON.parse(localStorage.getItem('scp_saved_deck'));
  if (legacy && !localStorage.getItem('scp_saved_deck_0')) {
    localStorage.setItem('scp_saved_deck_0', JSON.stringify(legacy));
  }
} catch(e) {}
try {
  const sd = JSON.parse(localStorage.getItem('scp_saved_deck_' + currentDeckSlot));
  if (sd) { savedDeck = sd; deck = [...sd]; }
} catch(e) {}
// costLimit is fixed at 25
try {
  const cn = parseInt(localStorage.getItem('scp_coins'));
  if (!isNaN(cn)) coins = cn;
} catch(e) {}

// ===== TAB SWITCHING =====
function switchTab(tab) {
  if (battleActive && tab !== 'battle') {
    // 戦闘終了後（結果ウィンドウ表示中）はリーブ確認をスキップ
    const resultShown = document.getElementById('battleResult')?.style.display === 'block';
    if (resultShown) {
      closeBattleResult();
    } else {
      showBattleLeaveConfirm(tab);
      return;
    }
  }
  doSwitchTab(tab);
}
function doSwitchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelectorAll('.tab-nav button').forEach((b, i) => {
    if (['pack','collection','deck','battle','rank'][i] === tab) b.classList.add('active');
  });
  if (tab === 'collection') renderCollection();
  if (tab === 'deck') renderDeck();
  if (tab === 'battle') renderBattle();
  if (tab === 'rank') renderRank();
}
function showBattleLeaveConfirm(targetTab) {
  let overlay = document.getElementById('battleLeaveOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'battleLeaveOverlay';
  overlay.className = 'battle-result-overlay';
  overlay.innerHTML = `<div class="battle-leave-confirm">
    <h3 style="color:var(--lose);margin:0 0 12px;letter-spacing:3px;font-family:'Share Tech Mono',monospace">⚠ ${t('battleLeaveTitle')}</h3>
    <p style="font-size:0.85rem;margin:0 0 8px;color:var(--text)">${t('battleLeaveMsg')}</p>
    <p style="font-size:0.75rem;margin:0 0 16px;color:var(--muted)">${t('battleLeaveNote')}</p>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn btn-danger" id="battleLeaveYes" style="font-size:0.8rem;padding:8px 20px">${t('battleLeaveYes')}</button>
      <button class="btn" id="battleLeaveNo" style="font-size:0.8rem;padding:8px 20px">${t('battleLeaveNo')}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  document.getElementById('battleLeaveYes').onclick = () => {
    overlay.remove();
    forfeitBattle();
    doSwitchTab(targetTab);
  };
  document.getElementById('battleLeaveNo').onclick = () => {
    overlay.remove();
  };
}
function forfeitBattle() {
  const rpChange = addRankPoints('lose', currentOpponent ? currentOpponent.rp : 0);
  uploadMyDeck();
  battleActive = false;
  bRound = 0;
  bPlayerHand = [];
  currentOpponent = null;
  battleHistory = [];
}

// ===== CARD RENDERING =====
function showCardModal(scp, actionLabel, actionFn) {
  const role = getRole(scp.id);
  const roleSvg = role === 'attacker'
    ? '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 2 L14 4 L14 14 L17 14 L17 16 L13 16 L13 19 L15 19 L15 21 L9 21 L9 19 L11 19 L11 16 L7 16 L7 14 L10 14 L10 4 Z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="#22cc66" stroke="#000" stroke-width="1.5" stroke-linejoin="round"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/></svg>';
  const overlay = document.createElement('div');
  overlay.className = 'card-modal-overlay';
  overlay.innerHTML = `
    <div class="card-modal-wrap">
      <div class="card ${scp.cls} card-modal-card">
        <div class="card-top-name">
          <span class="ctn-class">${scp.cls}</span>
          <span class="ctn-id">${scp.id}</span>
        </div>
        <div class="card-role-badge role-${role}">${roleSvg}</div>
        <div class="card-meta">
          <span class="cm-stars">${'★'.repeat(scp.cost)}</span>
        </div>
        <div class="card-art">
          ${scp.image ? `<img src="${scp.image}" alt="${scp.id}" class="scp-image">` : ''}
          ${!scp.image && SILHOUETTES[scp.id] ? `<div style="color:var(--${scp.cls}-c)">${SILHOUETTES[scp.id]}</div>` : ''}
          ${REVIVE_SCPS.has(scp.id) ? '<div class="revive-badge">&#x2695;</div>' : ''}
        </div>
        <div class="card-info">
          <div class="card-name">${scp.name}</div>
          <div class="cm-tabs">
            <button type="button" class="cm-tab active" data-tab="power">ABILITY</button>
            <button type="button" class="cm-tab" data-tab="desc">DESCRIPTION</button>
            <button type="button" class="cm-tab" data-tab="stats">STATS</button>
          </div>
          <div class="card-desc is-power cm-toggle-content">${getPower(scp)}</div>
        </div>
      </div>
      ${actionLabel ? `<button class="cm-action-btn" style="
        margin-top:12px;padding:10px 16px;border:1px solid #0088aa;
        background:rgba(0,136,170,0.1);color:#0088aa;border-radius:6px;
        font-family:'Share Tech Mono',monospace;font-size:0.85rem;cursor:pointer;
      ">${actionLabel}</button>` : ''}
      <a class="cm-source-link" href="https://scp-wiki.wikidot.com/${scp.id.toLowerCase()}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Source: SCP Wiki — ${scp.id} (CC BY-SA 3.0)</a>
      <div class="cm-tap-hint">TAP TO CLOSE</div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 250); };
  overlay.addEventListener('click', (e) => {
    if (e.target.classList.contains('cm-action-btn')) { close(); if (actionFn) actionFn(); return; }
    if (e.target.classList.contains('cm-tab')) return;
    if (!e.target.closest('.card-modal-wrap')) close();
  });

  const contentEl = overlay.querySelector('.cm-toggle-content');
  const tabs = overlay.querySelectorAll('.cm-tab');
  const renderTab = (mode) => {
    if (mode === 'power') contentEl.innerHTML = getPower(scp);
    else if (mode === 'desc') contentEl.innerHTML = getDesc(scp);
    else if (mode === 'stats') {
      const st = getCardStat(scp.id);
      const winRate = st.plays > 0 ? Math.round((st.wins / st.plays) * 100) : 0;
      contentEl.innerHTML = `<div style="font-family:'Share Tech Mono',monospace;font-size:0.78rem;line-height:1.8">
        出撃回数: <b>${st.plays}</b><br>
        勝利数: <b style="color:var(--win)">${st.wins}</b><br>
        敗北数: <b style="color:var(--lose)">${st.losses}</b><br>
        勝率: <b style="color:var(--gold)">${winRate}%</b>
      </div>`;
    }
  };
  tabs.forEach(tb => {
    tb.addEventListener('click', (e) => {
      e.stopPropagation();
      tabs.forEach(x => x.classList.remove('active'));
      tb.classList.add('active');
      renderTab(tb.dataset.tab);
    });
  });
}

// ===== CARD BATTLE STATS =====
function loadCardStats() {
  try { return JSON.parse(localStorage.getItem('scp_card_stats')) || {}; } catch(e) { return {}; }
}
function saveCardStats(s) { localStorage.setItem('scp_card_stats', JSON.stringify(s)); }
function getCardStat(id) {
  const s = loadCardStats();
  return s[id] || { plays: 0, wins: 0, losses: 0 };
}
function recordCardStat(id, result) {
  const s = loadCardStats();
  if (!s[id]) s[id] = { plays: 0, wins: 0, losses: 0 };
  s[id].plays++;
  if (result === 'win') s[id].wins++;
  else if (result === 'lose') s[id].losses++;
  saveCardStats(s);
}

function renderCard(scp, opts = {}) {
  const { clickAction, used, selected } = opts;
  const showNew = opts.showNew !== undefined ? opts.showNew : !!scp.isNew;
  const count = collection[scp.id] || 0;
  const locked = !opts.ignoreLock && count === 0;
  const disabled = opts.disabled;

  const div = document.createElement('div');
  div.className = `card ${scp.cls}${locked ? ' locked' : ''}${disabled ? ' disabled' : ''}${used ? ' used' : ''}${selected ? ' selected-hand' : ''}`;

  let _pressTimer = null;
  let _longPressed = false;

  div.addEventListener('pointerdown', (e) => {
    _longPressed = false;
    _pressTimer = setTimeout(() => {
      _longPressed = true;
      if (!locked) showCardModal(scp);
    }, 500);
  });

  div.addEventListener('pointerup', () => {
    clearTimeout(_pressTimer);
    if (_longPressed) return;
  });

  div.addEventListener('pointerleave', () => {
    clearTimeout(_pressTimer);
  });

  div.onclick = (e) => {
    if (_longPressed) { _longPressed = false; return; }
    if (locked) return;
    if (opts.directAction && clickAction && !disabled && !used) {
      clickAction(scp);
      return;
    }
    const actionLabel = (clickAction && !disabled && !used) ? (opts.actionLabel || null) : null;
    const actionFn = (clickAction && !disabled && !used) ? () => clickAction(scp) : null;
    showCardModal(scp, actionLabel, actionFn);
  };

  const role = getRole(scp.id);
  const roleSvg = role === 'attacker'
    ? '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 2 L14 4 L14 14 L17 14 L17 16 L13 16 L13 19 L15 19 L15 21 L9 21 L9 19 L11 19 L11 16 L7 16 L7 14 L10 14 L10 4 Z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="#22cc66" stroke="#000" stroke-width="1.5" stroke-linejoin="round"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/></svg>';
  if (showNew) div.classList.add('has-new-badge');
  if (locked) {
    div.innerHTML = `<img src="assets/images/card-back.png" alt="?" class="card-back-image" loading="lazy">`;
    return div;
  }
  let html = `${showNew ? '<div class="new-badge">NEW</div>' : ''}
  ${count > 1 ? `<div class="count-badge">×${count}</div>` : ''}
  <div class="card-top-name">
    <span class="ctn-class">${scp.cls}</span>
    <span class="ctn-id">${scp.id}</span>
  </div>
  <div class="card-role-badge role-${role}">${roleSvg}</div>
  <div class="card-meta">
    <span class="cm-stars">${'★'.repeat(scp.cost)}</span>
  </div>
  <div class="card-art">
    ${scp.image ? `<img src="${scp.image}" alt="${scp.id}" class="scp-image" loading="lazy">` : ''}
    ${!scp.image && SILHOUETTES[scp.id] ? `<div style="color:var(--${scp.cls}-c)">${SILHOUETTES[scp.id]}</div>` : ''}
    ${locked ? '<div class="locked-overlay">?</div>' : ''}
    ${REVIVE_SCPS.has(scp.id) ? '<div class="revive-badge">&#x2695;</div>' : ''}
  </div>
  <div class="card-info">
    <div class="card-name">${scp.name}</div>
    <div class="card-desc is-power">${getPower(scp)}</div>
  </div>`;
  div.innerHTML = html;
  return div;
}

// ===== PACK =====

const PACK_RARITY_TABLE = [
  { cls: 'safe',     threshold: 55 },
  { cls: 'euclid',   threshold: 85 },
  { cls: 'keter',    threshold: 98 },
  { cls: 'thaumiel', threshold: 100 },
];
const PACK_SIZE = 5;
const PITY_THAUMIEL_THRESHOLD = 50; // 50枚連続でThaumielが出ない場合に確定
let pityThaumiel = parseInt(localStorage.getItem('scp_pity_thaumiel') || '0', 10);

function saveCoins() {
  localStorage.setItem('scp_coins', coins);
  updateCoinDisplay();
}

function rollOneCard() {
  const r = Math.random() * 100;
  const cls = PACK_RARITY_TABLE.find(e => r < e.threshold).cls;
  const pool = SCPS.filter(s => s.cls === cls);
  return pool[Math.floor(Math.random() * pool.length)];
}

// 同一パック内で同じカードを複数引いた場合、最初の1枚は new、以降は dupe 扱い（仕様）
function rollCards() {
  const cards = [];
  let earnedCoins = 0;
  for (let i = 0; i < PACK_SIZE; i++) {
    let scp;
    pityThaumiel++;
    if (pityThaumiel >= PITY_THAUMIEL_THRESHOLD) {
      const pool = SCPS.filter(s => s.cls === 'thaumiel');
      scp = pool[Math.floor(Math.random() * pool.length)];
      pityThaumiel = 0;
    } else {
      scp = rollOneCard();
      if (scp.cls === 'thaumiel') pityThaumiel = 0;
    }
    const wasNew = !collection[scp.id];
    if (wasNew) {
      collection[scp.id] = 1;
      cards.push({ ...scp, isNew: true, isDupe: false, coinValue: 0 });
    } else {
      const cv = COIN_VALUES[scp.cls];
      coins += cv;
      earnedCoins += cv;
      cards.push({ ...scp, isNew: false, isDupe: true, coinValue: cv });
    }
  }
  localStorage.setItem('scp_collection', JSON.stringify(collection));
  localStorage.setItem('scp_pity_thaumiel', String(pityThaumiel));
  saveCoins();
  return { cards, earnedCoins };
}

function renderPackResult(cards, earnedCoins) {
  const container = document.getElementById('packResult');
  container.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'pack-result-row';
  cards.forEach((scp, i) => {
    const card = renderCard(scp, { ignoreLock: true });
    card.style.animationDelay = (i * 0.15) + 's';
    if (scp.isDupe) {
      card.classList.add('is-dupe');
      const badge = document.createElement('div');
      badge.className = 'pack-dupe-badge';
      badge.textContent = `+${scp.coinValue}C`;
      card.appendChild(badge);
    }
    row.appendChild(card);
  });
  container.appendChild(row);
  if (earnedCoins > 0) {
    const coinMsg = document.createElement('div');
    coinMsg.className = 'pack-coin-banner';
    coinMsg.textContent = `+${earnedCoins} COINS (duplicates)`;
    container.appendChild(coinMsg);
  }
}

function updateCoinDisplay() {
  document.getElementById('coinCount').textContent = coins;
  const coinBtn = document.getElementById('coinPackBtn');
  coinBtn.disabled = coins < PACK_COIN_COST;
  coinBtn.textContent = `COIN PACK (${PACK_COIN_COST}C)`;
}

function buildPackSlot(scp, idx, onFlip) {
  const slot = document.createElement('div');
  slot.className = 'pack-flip-slot';
  slot.style.animationDelay = (idx * 0.1) + 's';

  const inner = document.createElement('div');
  inner.className = 'flip-inner';

  const front = document.createElement('div');
  front.className = 'flip-front';
  const img = document.createElement('img');
  img.src = 'assets/images/card-back.png';
  img.alt = 'SCP';
  front.appendChild(img);

  const back = document.createElement('div');
  back.className = 'flip-back';
  back.appendChild(renderCard(scp, { ignoreLock: true, showPower: true }));

  inner.appendChild(front);
  inner.appendChild(back);
  slot.appendChild(inner);

  let pressTimer = null;
  let longPressed = false;
  slot.addEventListener('pointerdown', () => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      showCardModal(scp);
    }, 500);
  });
  const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
  slot.addEventListener('pointerup', cancelPress);
  slot.addEventListener('pointerleave', cancelPress);
  slot.addEventListener('pointercancel', cancelPress);
  slot.onclick = () => {
    if (longPressed) { longPressed = false; return; }
    onFlip(idx);
  };
  return slot;
}

function doPackReveal(cards, earnedCoins) {
  const overlay = document.createElement('div');
  overlay.className = 'pack-flip-overlay';

  const row = document.createElement('div');
  row.className = 'pack-flip-row';

  let flippedCount = 0;
  const slots = cards.map((scp, i) => {
    const el = buildPackSlot(scp, i, flipOne);
    row.appendChild(el);
    return { el, flipped: false, scp };
  });

  const controls = document.createElement('div');
  controls.className = 'pack-flip-controls';
  const flipAllBtn = document.createElement('button');
  flipAllBtn.className = 'btn btn-gold pack-flip-all-btn';
  flipAllBtn.textContent = t('flipAll');
  flipAllBtn.onclick = flipAll;
  controls.appendChild(flipAllBtn);

  overlay.appendChild(row);
  overlay.appendChild(controls);
  document.body.appendChild(overlay);

  function flipOne(idx) {
    if (slots[idx].flipped) return;
    slots[idx].flipped = true;
    slots[idx].el.classList.add('flipped');
    slots[idx].el.style.cursor = 'default';
    const cls = slots[idx].scp.cls;
    if (cls === 'keter' || cls === 'thaumiel') {
      setTimeout(() => {
        slots[idx].el.classList.add('pack-rare-pop');
        setTimeout(() => slots[idx].el.classList.remove('pack-rare-pop'), 900);
      }, 700);
    }
    flippedCount++;
    if (flippedCount === cards.length) {
      setTimeout(enableDismiss, 800);
    }
  }

  function flipAll() {
    slots.forEach((s, i) => {
      if (!s.flipped) setTimeout(() => flipOne(i), i * 120);
    });
  }

  function enableDismiss() {
    flipAllBtn.style.display = 'none';
    const hint = document.createElement('div');
    hint.className = 'pack-flip-hint';
    hint.textContent = t('tapToContinue');
    controls.appendChild(hint);
    const onDismiss = (e) => {
      if (e.target.closest('.pack-flip-slot')) return;
      overlay.removeEventListener('click', onDismiss);
      overlay.remove();
      renderPackResult(cards, earnedCoins);
    };
    overlay.addEventListener('click', onDismiss);
  }
}

function openPackWithCoins() {
  if (coins < PACK_COIN_COST) return;
  coins -= PACK_COIN_COST;
  saveCoins();

  const { cards, earnedCoins } = rollCards();
  doPackReveal(cards, earnedCoins);
}

// ===== COLLECTION =====
let collFilterCls = 'all';
let collSortKey = 'id';

function setCollFilter(cls, btn) {
  collFilterCls = cls;
  btn.closest('.deck-filter-row').querySelectorAll('.df-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCollection();
}

function setCollSort(key, btn) {
  collSortKey = key;
  btn.closest('.deck-filter-row').querySelectorAll('.df-sort').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCollection();
}

// ===== COLLECTION SERIES REWARDS =====
// SCP財団のシリーズ単位でレベル制報酬。100枚所持で1レベル。
const SERIES_DEFS = [
  { id: 's1', label: 'シリーズ I',   range: [1,    999]  },
  { id: 's2', label: 'シリーズ II',  range: [1000, 1999] },
  { id: 's3', label: 'シリーズ III', range: [2000, 2999] },
  { id: 's4', label: 'シリーズ IV',  range: [3000, 3999] },
  { id: 's5', label: 'シリーズ V',   range: [4000, 4999] },
  { id: 's6', label: 'シリーズ VI',  range: [5000, 5999] },
  { id: 's7', label: 'シリーズ VII', range: [6000, 6999] },
];
const SERIES_LEVEL_THRESHOLD = 100; // 100枚所持で1レベル
const SERIES_LEVEL_COIN = 500;      // レベルごとに 500 * level COIN

function getSeriesOf(scpId) {
  const m = scpId.match(/SCP-(\d+)/);
  if (!m) return null;
  const num = parseInt(m[1]);
  return SERIES_DEFS.find(s => num >= s.range[0] && num <= s.range[1]) || null;
}
function seriesProgress(sid) {
  const def = SERIES_DEFS.find(s => s.id === sid);
  if (!def) return null;
  const inSeries = SCPS.filter(s => {
    const ser = getSeriesOf(s.id);
    return ser && ser.id === sid;
  });
  const total = inSeries.length;
  const owned = inSeries.filter(s => collection[s.id]).length;
  const level = Math.floor(owned / SERIES_LEVEL_THRESHOLD);
  const maxLevel = Math.floor(total / SERIES_LEVEL_THRESHOLD);
  return { def, total, owned, level, maxLevel };
}
function loadSeriesRewards() {
  try {
    const d = JSON.parse(localStorage.getItem('scp_series_rewards'));
    if (d && typeof d === 'object') return d;
  } catch(e) {}
  return {}; // { s1: [1,2], s2: [], ... }
}
function saveSeriesRewards(d) { localStorage.setItem('scp_series_rewards', JSON.stringify(d)); }
function claimSeriesReward(sid, level) {
  const p = seriesProgress(sid);
  if (!p || level > p.level || level < 1) return;
  const rw = loadSeriesRewards();
  if (!rw[sid]) rw[sid] = [];
  if (rw[sid].indexOf(level) !== -1) return;
  rw[sid].push(level);
  saveSeriesRewards(rw);
  const reward = SERIES_LEVEL_COIN * level;
  coins += reward;
  localStorage.setItem('scp_coins', coins);
  if (typeof updateCoinDisplay === 'function') updateCoinDisplay();
  showToast(`${p.def.label} Lv.${level} 達成! +${reward} COINS`, 3500);
  renderCollection();
}
function toggleCollRewards() {
  const cur = localStorage.getItem('scp_coll_rewards_collapsed') === '1';
  localStorage.setItem('scp_coll_rewards_collapsed', cur ? '0' : '1');
  renderCollRewards();
}
function renderCollRewards() {
  const el = document.getElementById('collRewards');
  if (!el) return;
  const rw = loadSeriesRewards();
  const collapsed = localStorage.getItem('scp_coll_rewards_collapsed') === '1';
  let html = `<div class="cr-title cr-toggle" onclick="toggleCollRewards()" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
    <span>SERIES REWARDS — 100種類 / 1レベル</span>
    <span>${collapsed ? '▼' : '▲'}</span>
  </div>`;
  if (collapsed) { el.innerHTML = html; return; }
  SERIES_DEFS.forEach(def => {
    const p = seriesProgress(def.id);
    if (!p || p.total === 0) return; // 該当SCPが存在しないシリーズは非表示
    const claimedList = rw[def.id] || [];
    const intoLevel = p.owned % SERIES_LEVEL_THRESHOLD;
    const pct = Math.round((intoLevel / SERIES_LEVEL_THRESHOLD) * 100);
    // 未受領で達成済みの最小レベルを探す
    let nextClaim = 0;
    for (let lv = 1; lv <= p.level; lv++) {
      if (claimedList.indexOf(lv) === -1) { nextClaim = lv; break; }
    }
    let btn;
    if (nextClaim > 0) {
      const reward = SERIES_LEVEL_COIN * nextClaim;
      btn = `<button class="cr-claim" onclick="claimSeriesReward('${def.id}', ${nextClaim})">CLAIM Lv.${nextClaim} +${reward}</button>`;
    } else if (p.level >= p.maxLevel && p.maxLevel > 0) {
      btn = `<span class="cr-claimed">✓ MAX Lv.${p.maxLevel}</span>`;
    } else {
      btn = `<span class="cr-count" style="color:var(--gold)">+${SERIES_LEVEL_COIN * (p.level + 1)}</span>`;
    }
    html += `<div class="cr-row">
      <span class="cr-label">${def.label}<br><span style="color:var(--gold);font-size:0.6rem">Lv.${p.level}</span></span>
      <div class="cr-bar"><div class="cr-bar-fill${p.level > 0 ? ' complete' : ''}" style="width:${pct}%"></div></div>
      <span class="cr-count">${p.owned}/${p.total}</span>
      ${btn}
    </div>`;
  });
  el.innerHTML = html;
}

function renderCollection() {
  renderCollRewards();
  const grid = document.getElementById('collectionGrid');
  grid.innerHTML = '';
  const owned = SCPS.filter(scp => collection[scp.id]).length;
  let filtered = SCPS.filter(scp => collFilterCls === 'all' || scp.cls === collFilterCls);
  filtered = sortScps(filtered, collSortKey);
  filtered.forEach(scp => {
    const card = renderCard(scp);
    grid.appendChild(card);
  });
  document.getElementById('collCount').textContent = owned;
  document.getElementById('collTotal').textContent = SCPS.length;
}

// ===== DECK =====
let _deckFilterSaved = {};
try { _deckFilterSaved = JSON.parse(localStorage.getItem('scp_deck_filter')) || {}; } catch(e) {}
let deckFilterCls = _deckFilterSaved.cls || 'all';
let deckSortKey = _deckFilterSaved.sort || 'id';
let deckRoleFilter = _deckFilterSaved.role || 'all'; // 'all' | 'attacker' | 'supporter'
function _saveDeckFilter() {
  localStorage.setItem('scp_deck_filter', JSON.stringify({ cls: deckFilterCls, sort: deckSortKey, role: deckRoleFilter }));
}

function setDeckRoleFilter(role, btn) {
  deckRoleFilter = role;
  btn.closest('.deck-filter-row').querySelectorAll('.df-role').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _saveDeckFilter();
  renderDeck();
}

function deckCounts() {
  let a = 0, s = 0;
  deck.forEach(c => { if (getRole(c.id) === 'attacker') a++; else s++; });
  return { a, s };
}

function setDeckFilter(cls, btn) {
  deckFilterCls = cls;
  btn.closest('.deck-filter-row').querySelectorAll('.df-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _saveDeckFilter();
  renderDeck();
}

function setDeckSort(key, btn) {
  deckSortKey = key;
  btn.closest('.deck-filter-row').querySelectorAll('.df-sort').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _saveDeckFilter();
  renderDeck();
}

function extractScpNum(id) {
  const m = id.match(/SCP-(\d+)/);
  return m ? parseInt(m[1]) : 99999;
}

const ROLE_ORDER = { attacker: 0, supporter: 1 };

function sortScps(list, key) {
  return [...list].sort((a, b) => {
    if (key === 'id') return extractScpNum(a.id) - extractScpNum(b.id);
    if (key === 'cost-asc') return a.cost - b.cost || extractScpNum(a.id) - extractScpNum(b.id);
    if (key === 'cost-desc') return b.cost - a.cost || extractScpNum(a.id) - extractScpNum(b.id);
    if (key === 'name') return a.name.localeCompare(b.name);
    if (key === 'type' || key === 'role') {
      return (ROLE_ORDER[getRole(a.id)] - ROLE_ORDER[getRole(b.id)]) || extractScpNum(a.id) - extractScpNum(b.id);
    }
    return 0;
  });
}

function renderDeck() {
  // Restore filter button active states from saved
  document.querySelectorAll('#tab-deck .df-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cls === deckFilterCls);
  });
  document.querySelectorAll('#tab-deck .df-role').forEach(b => {
    const txt = b.textContent.trim();
    const role = txt.includes('ATTACKER') ? 'attacker' : txt.includes('SUPPORTER') ? 'supporter' : 'all';
    b.classList.toggle('active', role === deckRoleFilter);
  });
  document.querySelectorAll('#tab-deck .df-sort').forEach(b => {
    b.classList.toggle('active', b.dataset.sort === deckSortKey);
  });
  // Slot tabs
  const slotTabs = document.getElementById('deckSlotTabs');
  if (slotTabs) {
    slotTabs.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const hasData = !!localStorage.getItem('scp_saved_deck_' + i);
      const btn = document.createElement('button');
      btn.className = 'deck-slot-tab' + (i === currentDeckSlot ? ' active' : '') + (hasData ? ' has-data' : '');
      btn.textContent = 'DECK ' + (i + 1) + (hasData ? ' ●' : '');
      btn.onclick = () => switchDeckSlot(i);
      slotTabs.appendChild(btn);
    }
  }
  document.getElementById('costLimitSelect').innerHTML = '';

  // Cost bar
  const totalCost = deck.reduce((s, c) => s + c.cost, 0);
  const fill = document.getElementById('costBarFill');
  const pct = Math.min((totalCost / costLimit) * 100, 100);
  fill.style.width = pct + '%';
  fill.className = 'cost-bar-fill' + (totalCost > costLimit ? ' over' : '');
  const counts = deckCounts();
  document.getElementById('costCurrent').textContent = `COST: ${totalCost}  ⚔${counts.a}/${DECK_ATTACKERS}  ✚${counts.s}/${DECK_SUPPORTERS}`;
  document.getElementById('costMax').textContent = 'LIMIT: ' + costLimit;

  // Deck slots: 3 attacker + 6 supporter sections
  const slots = document.getElementById('deckSlots');
  slots.innerHTML = '';
  const attackers = deck.filter(c => getRole(c.id) === 'attacker');
  const supporters = deck.filter(c => getRole(c.id) === 'supporter');

  function buildSection(title, list, max, role) {
    const section = document.createElement('div');
    section.className = 'deck-section';
    section.innerHTML = `<div class="deck-section-title">${title} (${list.length}/${max})</div>`;
    const row = document.createElement('div');
    row.className = 'deck-section-row';
    for (let i = 0; i < max; i++) {
      const slot = document.createElement('div');
      const scp = list[i];
      slot.className = 'deck-slot' + (scp ? ' filled ' + scp.cls : ' empty role-' + role);
      if (scp) {
        const card = renderCard(scp, {
          ignoreLock: true,
          directAction: true,
          showPower: true,
          clickAction: (s) => {
            const idx = deck.findIndex(d => d.id === s.id);
            if (idx >= 0) { deck.splice(idx, 1); renderDeck(); }
          }
        });
        slot.appendChild(card);
      } else {
        slot.textContent = role === 'attacker' ? '⚔' : '✚';
      }
      row.appendChild(slot);
    }
    section.appendChild(row);
    slots.appendChild(section);
  }
  buildSection('ATTACKERS', attackers, DECK_ATTACKERS, 'attacker');
  buildSection('SUPPORTERS', supporters, DECK_SUPPORTERS, 'supporter');

  // Save button
  const valid = counts.a === DECK_ATTACKERS && counts.s === DECK_SUPPORTERS && totalCost <= costLimit;
  document.getElementById('saveDeckBtn').disabled = !valid;

  // Available cards (filtered & sorted)
  const cardGrid = document.getElementById('deckCardGrid');
  cardGrid.innerHTML = '';
  let filtered = SCPS.filter(scp => {
    if ((collection[scp.id] || 0) === 0) return false;
    if (deckFilterCls !== 'all' && scp.cls !== deckFilterCls) return false;
    if (deckRoleFilter !== 'all' && getRole(scp.id) !== deckRoleFilter) return false;
    return true;
  });
  filtered = sortScps(filtered, deckSortKey);

  filtered.forEach(scp => {
    const role = getRole(scp.id);
    const inDeck = deck.some(d => d.id === scp.id); // 重複不可
    const wouldExceed = (totalCost + scp.cost) > costLimit;
    const roleFull = role === 'attacker' ? counts.a >= DECK_ATTACKERS : counts.s >= DECK_SUPPORTERS;
    const disabled = inDeck || wouldExceed || roleFull;

    const card = renderCard(scp, {
      ignoreLock: true,
      disabled,
      directAction: true,
      showPower: true,
      clickAction: (s) => {
        if (deck.some(d => d.id === s.id)) return;
        const r = getRole(s.id);
        const c = deckCounts();
        if (r === 'attacker' && c.a >= DECK_ATTACKERS) return;
        if (r === 'supporter' && c.s >= DECK_SUPPORTERS) return;
        deck.push({ ...s });
        renderDeck();
      }
    });
    cardGrid.appendChild(card);
  });
}

function saveDeck() {
  const totalCost = deck.reduce((s, c) => s + c.cost, 0);
  const counts = deckCounts();
  if (counts.a !== DECK_ATTACKERS || counts.s !== DECK_SUPPORTERS || totalCost > costLimit) return;
  savedDeck = [...deck];
  localStorage.setItem('scp_saved_deck_' + currentDeckSlot, JSON.stringify(savedDeck));
  localStorage.setItem('scp_saved_deck', JSON.stringify(savedDeck)); // legacy compat
  uploadMyDeck();
  renderDeck();
  showToast(t('deckSaved') + ' (DECK ' + (currentDeckSlot + 1) + ')');
}

function switchDeckSlot(idx) {
  if (idx === currentDeckSlot) return;
  currentDeckSlot = idx;
  localStorage.setItem('scp_deck_slot', String(idx));
  let loaded = [];
  try {
    const sd = JSON.parse(localStorage.getItem('scp_saved_deck_' + idx));
    if (Array.isArray(sd)) loaded = sd;
  } catch(e) {}
  savedDeck = loaded;
  deck = loaded.map(c => ({ ...c }));
  if (loaded.length) localStorage.setItem('scp_saved_deck', JSON.stringify(loaded));
  renderDeck();
}

// ===== FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyCahvCEzuGpKqGttybv_k4Z17-KumQpsKw",
  authDomain: "scp-card-battle.firebaseapp.com",
  databaseURL: "https://scp-card-battle-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "scp-card-battle",
  storageBucket: "scp-card-battle.firebasestorage.app",
  messagingSenderId: "102124879042",
  appId: "1:102124879042:web:09b4020b5d8fc910678f5b",
  measurementId: "G-N9RSCCRM81"
};

let fbApp = null, fbDb = null, fbAuth = null, fbUid = null;
let playerName = (localStorage.getItem('scp_player_name') || '').replace(/[<>"'&]/g, '').slice(0, 20);
let onlineDecks = []; // Firebaseから取得した他ユーザーデッキ

const RECAPTCHA_SITE_KEY = '6LftVKcsAAAAADwnlPGChrrAAKkN4JhVbGV10kJ7';

function initFirebase() {
  try {
    if (!firebaseConfig.apiKey) return;
    fbApp = firebase.initializeApp(firebaseConfig);

    // App Check: 初回トークンを取得してから DB/Auth を初期化（Unknown削減）
    let appCheckReady = Promise.resolve();
    if (typeof firebase.appCheck === 'function') {
      const appCheck = firebase.appCheck(fbApp);
      appCheck.activate(
        new firebase.appCheck.ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
        true // isTokenAutoRefreshEnabled
      );
      appCheckReady = appCheck.getToken(false).catch(e => {
        console.warn('[AppCheck] initial token fetch failed:', e);
      });
    } else {
      console.warn('[AppCheck] SDK not loaded');
    }

    appCheckReady.then(() => {
      fbDb = firebase.database(fbApp);
      fbAuth = firebase.auth(fbApp);
      fbAuth.signInAnonymously().then(cred => {
        fbUid = cred.user.uid;
        localStorage.setItem('scp_fb_uid', fbUid);
        loadOnlineDecks();
      }).catch(e => {
        console.warn('Firebase auth error:', e);
        fbDb = null;
      });
    });
  } catch(e) {
    console.warn('Firebase init error:', e);
    fbDb = null;
  }
}

function uploadMyDeck() {
  if (!fbDb || !fbUid || !playerName || savedDeck.length !== DECK_SIZE) return;
  const rd = loadRankData();
  // Validate deck IDs exist in SCPS master data
  const deckIds = savedDeck.map(c => c.id);
  if (!deckIds.every(id => SCPS.some(s => s.id === id))) return;
  const safeName = playerName.replace(/[<>"'&]/g, '').slice(0, 20);
  if (!safeName) return;
  const rp = Math.max(0, Math.floor(Number(rd.rp) || 0));
  return fbDb.ref('decks/' + fbUid).set({
    name: safeName,
    deckIds: deckIds,
    rp: rp,
    updatedAt: Date.now()
  }).catch(e => console.warn('Upload error:', e));
}

function loadOnlineDecks() {
  if (!fbDb) return Promise.resolve();
  return fbDb.ref('decks').orderByChild('updatedAt').limitToLast(50)
    .once('value')
    .then(snap => {
      onlineDecks = [];
      snap.forEach(child => {
        const d = child.val();
        if (child.key === fbUid) return;
        if (!d || !d.deckIds || d.deckIds.length !== DECK_SIZE) return;
        const cards = d.deckIds.map(id => SCPS.find(s => s.id === id)).filter(Boolean);
        if (cards.length !== DECK_SIZE) return;
        const safeName = (typeof d.name === 'string' ? d.name : 'Unknown').replace(/[<>"'&]/g, '').slice(0, 20) || 'Unknown';
        onlineDecks.push({ name: safeName, rp: d.rp || 0, deck: cards, type: 'user' });
      });
    })
    .catch(e => {
      console.warn('Failed to load online decks:', e);
    });
}

function registerPlayerName() {
  const raw = document.getElementById('playerNameInput').value.trim();
  if (!raw) { alert(t('enterName')); return; }
  if (raw.length > 20) { alert('プレイヤー名は20文字以内です / Max 20 characters'); return; }
  const name = raw.replace(/[<>"'&]/g, '');
  if (!name) { alert(t('enterName')); return; }
  playerName = name;
  localStorage.setItem('scp_player_name', playerName);
  document.getElementById('playerNameArea').style.display = 'none';
  uploadMyDeck();
  renderBattle();
}

// ===== BATTLE =====
let currentOpponent = null; // { name, deck, rp, type:'cpu'|'user' }

// CPU Decks - 各クラス帯に配置（コスト上限25）
const CPU_DECKS = [
  // ── Dクラス職員（Safe中心・低コスト）──
  { name:'D-9341', rp:30, title:'Dクラス職員',
    deckIds:['SCP-131','SCP-458','SCP-529','SCP-420-J','SCP-063'] },           // 1+1+1+1+1=5
  { name:'Researcher Rosen', rp:70, title:'Dクラス職員',
    deckIds:['SCP-999','SCP-2295','SCP-085','SCP-348','SCP-248'] },            // 2+2+2+2+1=9
  // ── Eクラス職員（Safe＋低Euclid）──
  { name:'Dr.Glass', rp:150, title:'Eクラス職員',
    deckIds:['SCP-914','SCP-500','SCP-066','SCP-268','SCP-248'] },             // 3+3+3+2+1=12
  { name:'Agent Lament', rp:220, title:'Eクラス職員',
    deckIds:['SCP-173','SCP-294','SCP-1471','SCP-860','SCP-529'] },            // 4+4+3+2+1=14
  // ── Cクラス職員（Euclid中心）──
  { name:'Dr.Crow', rp:350, title:'Cクラス職員',
    deckIds:['SCP-049','SCP-035','SCP-173','SCP-148','SCP-714'] },             // 5+5+4+3+2=19
  { name:'Agent Green', rp:450, title:'Cクラス職員',
    deckIds:['SCP-096','SCP-939','SCP-079','SCP-1471','SCP-999'] },            // 6+5+4+3+2=20
  { name:'Dr.King', rp:550, title:'Cクラス職員',
    deckIds:['SCP-953','SCP-049','SCP-895','SCP-500','SCP-860'] },             // 6+5+4+3+2=20
  // ── Bクラス職員（Keter混合）──
  { name:'Dr.Rights', rp:650, title:'Bクラス職員',
    deckIds:['SCP-106','SCP-963','SCP-662','SCP-500','SCP-999'] },             // 7+5+4+3+2=21
  { name:'Agent Strelnikov', rp:750, title:'Bクラス職員',
    deckIds:['SCP-076','SCP-953','SCP-939','SCP-148','SCP-248'] },             // 7+6+5+3+1=22
  { name:'Dr.Kondraki', rp:850, title:'Bクラス職員',
    deckIds:['SCP-682','SCP-096','SCP-105','SCP-173','SCP-085'] },             // 8+6+5+4+2=25
  { name:'Captain Hollis', rp:950, title:'Bクラス職員',
    deckIds:['SCP-055','SCP-610','SCP-073','SCP-500','SCP-085'] },             // 7+7+6+3+2=25
  // ── Aクラス職員（Keter/Thaumiel主体・コスト25上限）──
  { name:'Dr.Gears', rp:1050, title:'Aクラス職員',
    deckIds:['SCP-3000','SCP-055','SCP-073','SCP-148','SCP-131'] },            // 8+7+6+3+1=25
  { name:'Researcher Talloran', rp:1150, title:'Aクラス職員',
    deckIds:['SCP-3812','SCP-610','SCP-105','SCP-148','SCP-131'] },            // 9+7+5+3+1=25
  { name:'Dr.Clef', rp:1250, title:'Aクラス職員',
    deckIds:['SCP-2399','SCP-076','SCP-963','SCP-148','SCP-248'] },            // 9+7+5+3+1=25
  { name:'Director Bold', rp:1350, title:'Aクラス職員',
    deckIds:['SCP-2845','SCP-076','SCP-035','SCP-500','SCP-131'] },            // 9+7+5+3+1=25
  { name:'Dr.Bright', rp:1500, title:'Aクラス職員',
    deckIds:['SCP-343','SCP-076','SCP-035','SCP-999','SCP-131'] },             // 10+7+5+2+1=25
  { name:'MTF-Alpha', rp:1650, title:'Aクラス職員',
    deckIds:['SCP-001','SCP-3812','SCP-148','SCP-085','SCP-131'] },            // 10+9+3+2+1=25
  { name:'O5-1', rp:1800, title:'Aクラス職員',
    deckIds:['SCP-343','SCP-2399','SCP-500','SCP-085','SCP-131'] },            // 10+9+3+2+1=25
];

// v2.0.0: AI_DECKS rank → RP base mapping
const AI_RANK_RP = { F: 30, E: 150, D: 350, C: 600, B: 900, A: 1200, S: 1600 };
// ランク別 CPU コスト上限。プレイヤーの costLimit と min を取る
const AI_RANK_COST_LIMIT = { F: 15, E: 18, D: 21, C: 24, B: 27, A: 30, S: 35 };

function fitAIDeckToCost(attackerIds, supporterIds, limit) {
  const attackers = attackerIds.map(id => SCPS.find(s => s.id === id)).filter(Boolean);
  const supPool = supporterIds.map(id => SCPS.find(s => s.id === id)).filter(Boolean);
  if (attackers.length !== DECK_ATTACKERS || supPool.length < DECK_SUPPORTERS) return null;
  const attackerCost = attackers.reduce((s, c) => s + c.cost, 0);
  const sortedAsc = [...supPool].sort((a, b) => a.cost - b.cost);
  let chosen = sortedAsc.slice(0, DECK_SUPPORTERS);
  let total = attackerCost + chosen.reduce((s, c) => s + c.cost, 0);
  if (total > limit) return null;
  // greedy upgrade: 残りプールから高コスト順に、limit を超えない範囲で chosen の最低コストと交換
  const remaining = sortedAsc.slice(DECK_SUPPORTERS).sort((a, b) => b.cost - a.cost);
  for (const cand of remaining) {
    chosen.sort((a, b) => a.cost - b.cost);
    const lowest = chosen[0];
    if (cand.cost <= lowest.cost) continue;
    const newTotal = total - lowest.cost + cand.cost;
    if (newTotal <= limit) {
      chosen[0] = cand;
      total = newTotal;
    }
  }
  return [...attackers, ...chosen];
}

function buildOpponentList() {
  const opponents = [];
  Object.keys(AI_DECKS).forEach(rank => {
    const rankCap = AI_RANK_COST_LIMIT[rank] || costLimit;
    const effectiveLimit = Math.min(costLimit, rankCap);
    AI_DECKS[rank].forEach((dt, i) => {
      const cards = fitAIDeckToCost(dt.attackers, dt.supporters, effectiveLimit);
      if (cards && cards.length === DECK_SIZE) {
        const rpBase = AI_RANK_RP[rank] || 100;
        const rp = rpBase + i * 40 + Math.floor(Math.random() * 30);
        opponents.push({ name: dt.name, rp, deck: cards, type: 'cpu' });
      }
    });
  });
  onlineDecks.forEach(ud => {
    if (ud.deck && ud.deck.length === DECK_SIZE) opponents.push({ ...ud });
  });
  return opponents;
}

function pickOpponent(opponents, playerRP) {
  if (opponents.length === 0) return null;
  // RP近い順にソートし、上位5人からランダム選出
  opponents.sort((a, b) => Math.abs(a.rp - playerRP) - Math.abs(b.rp - playerRP));
  const pool = opponents.slice(0, Math.min(5, opponents.length));
  return pool[Math.floor(Math.random() * pool.length)];
}

let pendingOpponent = null;
let matchSkipResolve = null;
function skipMatchSearch() { if (matchSkipResolve) { const r = matchSkipResolve; matchSkipResolve = null; r(); } }

async function startAutoMatch() {
  const rd = loadRankData();
  const playerRP = rd.rp;
  const playerTier = getTier(playerRP);

  // プレイヤー側
  document.getElementById('matchPlayerCard').innerHTML =
    `<div class="mp-name">${escapeHtml(playerName)}</div>` +
    `<div class="mp-rp">${playerRP} RP</div>` +
    `<div class="mp-tier" style="color:${playerTier.color};border:1px solid ${playerTier.color};background:${playerTier.color}15">${escapeHtml(playerTier.name)}</div>`;

  // 相手側: 検索中
  document.getElementById('matchEnemyCard').innerHTML =
    `<div class="mp-name" style="color:var(--muted)">???</div>` +
    `<div class="mp-rp">--- RP</div>`;
  document.getElementById('matchSpinner').style.display = 'block';
  const statusEl = document.getElementById('matchStatus');
  statusEl.textContent = 'SEARCHING... (TAP TO SKIP)';
  statusEl.classList.remove('found');
  statusEl.style.cursor = 'pointer';
  statusEl.onclick = skipMatchSearch;
  document.getElementById('battleGoBtn').style.display = 'none';
  pendingOpponent = null;

  const skipPromise = new Promise(r => { matchSkipResolve = r; });
  // Firebaseからオンラインデッキ取得（タイムアウト3秒またはスキップで打ち切り）
  if (fbDb) {
    await Promise.race([
      loadOnlineDecks(),
      new Promise(r => setTimeout(r, 3000)),
      skipPromise
    ]).catch(() => {});
  }
  // 演出用の最低待ち時間 (スキップ可)
  await Promise.race([
    new Promise(r => setTimeout(r, 500)),
    skipPromise
  ]);
  matchSkipResolve = null;
  statusEl.onclick = null;
  statusEl.style.cursor = '';

  const opponents = buildOpponentList();
  const opp = pickOpponent(opponents, playerRP);
  if (!opp) {
    document.getElementById('matchStatus').textContent = 'NO OPPONENT FOUND';
    document.getElementById('matchSpinner').style.display = 'none';
    return;
  }
  pendingOpponent = opp;
  const oppTier = getTier(opp.rp);

  document.getElementById('matchEnemyCard').innerHTML =
    `<div class="mp-name">${escapeHtml(opp.name)}</div>` +
    `<div class="mp-rp">${opp.rp} RP</div>` +
    `<div class="mp-tier" style="color:${oppTier.color};border:1px solid ${oppTier.color};background:${oppTier.color}15">${escapeHtml(oppTier.short)}</div>` +
    `<span class="mp-type ${opp.type}">${escapeHtml(opp.type.toUpperCase())}</span>`;
  document.getElementById('matchSpinner').style.display = 'none';
  document.getElementById('matchStatus').textContent = 'OPPONENT FOUND';
  document.getElementById('matchStatus').classList.add('found');
  document.getElementById('battleGoBtn').style.display = 'block';
}

function confirmMatch() {
  if (!pendingOpponent) return;
  showInterstitialThenBattle(pendingOpponent);
}

// Interstitial ad: every 2 battles
let _battleCount = 0;

function showInterstitialThenBattle(opponent) {
  _battleCount++;
  if (_battleCount % 2 === 0 && typeof adsbygoogle !== 'undefined') {
    showInterstitialAd(() => startBattle(opponent));
  } else {
    startBattle(opponent);
  }
}

function showInterstitialAd(callback) {
  const overlay = document.createElement('div');
  overlay.className = 'interstitial-overlay';
  overlay.innerHTML = `
    <div class="interstitial-box">
      <div class="interstitial-label">SPONSOR</div>
      <div class="interstitial-ad-slot">
        <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7502065458216315" data-ad-slot="interstitial" data-ad-format="auto" data-full-width-responsive="true"></ins>
      </div>
      <div class="interstitial-timer" id="interstitialTimer">5</div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}

  let sec = 5;
  const timerEl = document.getElementById('interstitialTimer');
  const iv = setInterval(() => {
    sec--;
    if (timerEl) timerEl.textContent = sec;
    if (sec <= 0) {
      clearInterval(iv);
      overlay.classList.remove('show');
      setTimeout(() => { overlay.remove(); callback(); }, 300);
    }
  }, 1000);
}

function startBattle(opponent) {
  currentOpponent = opponent;
  battleActive = true;
  document.getElementById('battleModeArea').style.display = 'none';
  document.getElementById('battleArea').style.display = 'block';
  initBattle();
  updateBattleUI();
  // 相手のカードを先に公開してからプレイヤーが選択する
  revealAIPick();
}

async function revealAIPick() {
  const aSlot = document.getElementById('aiSlot');
  const aSupSlot = document.getElementById('aiSupporterSlot');
  if (!bAIPick) return;
  if (aSlot && bAIPick.attacker) await animateCardEntry(aSlot, bAIPick.attacker, 'right');
  if (aSupSlot && bAIPick.supporters && bAIPick.supporters[0]) {
    await delay(150);
    await animateCardEntry(aSupSlot, bAIPick.supporters[0], 'right');
  }
}

let battleActive = false; // バトル進行中フラグ

function renderBattle() {
  renderDailyMissions();
  const nameArea = document.getElementById('playerNameArea');
  if (savedDeck.length !== DECK_SIZE) {
    document.getElementById('battleWarning').style.display = 'block';
    document.getElementById('battleModeArea').style.display = 'none';
    document.getElementById('battleArea').style.display = 'none';
    nameArea.style.display = 'none';
    return;
  }
  document.getElementById('battleWarning').style.display = 'none';

  if (!playerName) {
    nameArea.style.display = 'block';
    document.getElementById('battleModeArea').style.display = 'none';
    document.getElementById('battleArea').style.display = 'none';
    return;
  }
  nameArea.style.display = 'none';

  if (!battleActive) {
    document.getElementById('battleModeArea').style.display = 'block';
    document.getElementById('battleArea').style.display = 'none';
    currentOpponent = null;
    startAutoMatch();
  } else {
    document.getElementById('battleModeArea').style.display = 'none';
    document.getElementById('battleArea').style.display = 'block';
    updateBattleUI();
  }
}

let bAIOrder = []; // legacy, unused in BO1

function initBattle() {
  bRound = 0;
  bPScore = 0;
  bAIScore = 0;
  bDrawScore = 0;
  selectedHandIdx = -1;
  battleLocked = false;
  battleHistory = [];
  pSelectedAttackerId = null;
  pSelectedSupporterIds = [];

  bPlayerHand = savedDeck.map(s => ({ ...s }));
  bPlayerAttackers = bPlayerHand.filter(c => getRole(c.id) === 'attacker');
  bPlayerSupporters = bPlayerHand.filter(c => getRole(c.id) === 'supporter');

  // Use opponent's deck
  let opp;
  if (currentOpponent && Array.isArray(currentOpponent.deck) && currentOpponent.deck.length === DECK_SIZE) {
    opp = currentOpponent.deck.map(s => ({ ...s }));
  } else {
    const shuffled = [...SCPS].sort(() => Math.random() - 0.5);
    const att = shuffled.filter(s => getRole(s.id) === 'attacker').slice(0, DECK_ATTACKERS);
    const sup = shuffled.filter(s => getRole(s.id) === 'supporter').slice(0, DECK_SUPPORTERS);
    opp = [...att, ...sup];
  }
  bAIHand = opp;
  bAIAttackers = opp.filter(c => getRole(c.id) === 'attacker');
  bAISupporters = opp.filter(c => getRole(c.id) === 'supporter');
  bAIPick = aiPickForBattle(bAIAttackers, bAISupporters);

  document.getElementById('battleResult').style.display = 'none';
  const overlay = document.getElementById('battleResultOverlay');
  if (overlay) overlay.style.display = 'none';
  document.getElementById('narrativeBox').style.display = 'none';
  document.getElementById('playerSlot').textContent = 'PLAYER';
  document.getElementById('aiSlot').textContent = currentOpponent ? currentOpponent.name : 'AI';
  const pss = document.getElementById('playerSupporterSlot');
  const ass = document.getElementById('aiSupporterSlot');
  if (pss) pss.textContent = 'SUPPORTER';
  if (ass) ass.textContent = 'SUPPORTER';
}

function updateBattleUI() {
  document.getElementById('pScore').textContent = bPScore;
  document.getElementById('drawScore').textContent = bDrawScore;
  document.getElementById('aiScore').textContent = bAIScore;
  document.getElementById('roundInfo').textContent = 'BO1 — SELECT';

  // Opponent label
  const enemyLabel = document.querySelector('#aiHandArea h4 span:first-child');
  if (enemyLabel) {
    const oppName = currentOpponent ? currentOpponent.name : 'ENEMY';
    enemyLabel.textContent = oppName + ' DECK';
  }
  const nextLabel = document.getElementById('aiNextLabel');
  if (nextLabel) nextLabel.textContent = '';

  // AI hand: show full pool but hide their selection (silhouettes only by id)
  const aiHandDiv = document.getElementById('aiHandCards');
  aiHandDiv.innerHTML = '';
  bAIHand.forEach(scp => {
    const card = renderCard(scp, { ignoreLock: true });
    card.style.opacity = '0.55';
    aiHandDiv.appendChild(card);
  });

  // Player hand: 2 sections (attackers, supporters)
  const handDiv = document.getElementById('handCards');
  handDiv.innerHTML = '';

  function buildPickSection(label, list, maxSel, selIds, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'pick-section';
    wrap.innerHTML = `<div class="pick-section-label">${label} (${selIds.length}/${maxSel})</div>`;
    const row = document.createElement('div');
    row.className = 'pick-section-row';
    list.forEach(scp => {
      const isSel = selIds.includes(scp.id);
      const card = renderCard(scp, {
        ignoreLock: true,
        directAction: true,
        clickAction: () => { if (!battleLocked) { onPick(scp); } }
      });
      if (isSel) card.classList.add('card-next');
      row.appendChild(card);
    });
    wrap.appendChild(row);
    handDiv.appendChild(wrap);
  }

  buildPickSection('⚔ ATTACKER (1)', bPlayerAttackers, 1, pSelectedAttackerId ? [pSelectedAttackerId] : [], (scp) => {
    pSelectedAttackerId = (pSelectedAttackerId === scp.id) ? null : scp.id;
    updateBattleUI();
  });
  buildPickSection('✚ SUPPORTER (1)', bPlayerSupporters, 1, pSelectedSupporterIds, (scp) => {
    if (pSelectedSupporterIds[0] === scp.id) pSelectedSupporterIds = [];
    else pSelectedSupporterIds = [scp.id];
    updateBattleUI();
  });

  // Selected card preview in slots
  const pSlot = document.getElementById('playerSlot');
  if (pSelectedAttackerId && !battleLocked) {
    const sel = bPlayerAttackers.find(c => c.id === pSelectedAttackerId);
    if (sel) {
      pSlot.innerHTML = '';
      const c = renderCard(sel, { ignoreLock: true });
      c.classList.add('player-preview');
      pSlot.appendChild(c);
    }
  } else if (!battleLocked) {
    pSlot.innerHTML = 'PLAYER';
  }
  const pSupSlot = document.getElementById('playerSupporterSlot');
  if (pSupSlot && !battleLocked) {
    if (pSelectedSupporterIds.length > 0) {
      const sel = bPlayerSupporters.find(c => c.id === pSelectedSupporterIds[0]);
      if (sel) {
        pSupSlot.innerHTML = '';
        const c = renderCard(sel, { ignoreLock: true });
        c.classList.add('player-preview');
        pSupSlot.appendChild(c);
      }
    } else {
      pSupSlot.innerHTML = 'SUPPORTER';
    }
  }
  const aSlot = document.getElementById('aiSlot');
  if (!battleLocked) aSlot.innerHTML = currentOpponent ? escapeHtml(currentOpponent.name) : 'AI';

  // Battle Start enabled when 1 attacker + 1 supporter selected
  const ready = pSelectedAttackerId && pSelectedSupporterIds.length === 1;
  document.getElementById('battleStartBtn').disabled = !ready || battleLocked;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function showRoundAnnounce(round) {
  const field = document.getElementById('battleField');
  const ann = document.createElement('div');
  ann.className = 'round-announce';
  ann.textContent = 'ROUND ' + round;
  field.appendChild(ann);
  await delay(800);
  ann.remove();
}

async function animateCardEntry(slot, card, side) {
  slot.innerHTML = '';
  const cardEl = renderCard(card, { ignoreLock: true });
  cardEl.classList.add('card-enter-' + side);
  slot.appendChild(cardEl);
  await delay(500);
}

async function showVSClash() {
  const vs = document.querySelector('.battle-vs');
  vs.classList.add('vs-clash');
  const field = document.getElementById('battleField');
  field.classList.add('field-flash');
  await delay(600);
  vs.classList.remove('vs-clash');
  field.classList.remove('field-flash');
}

async function showRoundResultEffect(winner) {
  const pSlot = document.getElementById('playerSlot');
  const aSlot = document.getElementById('aiSlot');
  const field = document.getElementById('battleField');

  if (winner === 'player') {
    pSlot.querySelector('.card')?.classList.add('card-glow-win');
    aSlot.querySelector('.card')?.classList.add('card-fade-lose');
    field.classList.add('screen-shake');
    const scoreEl = document.getElementById('pScore');
    scoreEl.classList.add('score-pop');
    await delay(600);
    field.classList.remove('screen-shake');
    scoreEl.classList.remove('score-pop');
  } else if (winner === 'ai') {
    aSlot.querySelector('.card')?.classList.add('card-glow-win');
    pSlot.querySelector('.card')?.classList.add('card-fade-lose');
    field.classList.add('field-flash-red');
    const scoreEl = document.getElementById('aiScore');
    scoreEl.classList.add('score-pop');
    await delay(600);
    field.classList.remove('field-flash-red');
    scoreEl.classList.remove('score-pop');
  } else {
    pSlot.querySelector('.card')?.classList.add('card-glow-draw');
    aSlot.querySelector('.card')?.classList.add('card-glow-draw');
    const scoreEl = document.getElementById('drawScore');
    scoreEl.classList.add('score-pop');
    await delay(600);
    scoreEl.classList.remove('score-pop');
  }
}

function spawnParticles(type, count) {
  const arena = document.querySelector('.battle-arena');
  if (!arena) return;
  const colors = type === 'win' ? ['#ffc840','#00e880','#fff'] : type === 'lose' ? ['#ff2255','#ff6644'] : ['#ffc840','#00c8f0'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const dx = (Math.random() - 0.5) * 120;
    p.style.cssText = `
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      --dx:${dx}px;
      animation:particleFly ${1+Math.random()*1.5}s ease-out forwards;
      animation-delay:${Math.random()*0.4}s;
    `;
    arena.appendChild(p);
    setTimeout(() => p.remove(), 3000);
  }
}

async function doBattle() {
  if (battleLocked) return;
  if (!pSelectedAttackerId || pSelectedSupporterIds.length !== 1) return;
  battleLocked = true;
  bRound = 1;

  const playerAttacker = bPlayerAttackers.find(c => c.id === pSelectedAttackerId);
  const playerSupporters = pSelectedSupporterIds.map(id => bPlayerSupporters.find(c => c.id === id));
  const aiAttacker = bAIPick.attacker;
  const aiSupporters = bAIPick.supporters;

  updateBattleUI();

  // 1. Cards enter the field
  const pSlot = document.getElementById('playerSlot');
  const aSlot = document.getElementById('aiSlot');
  const pSupSlot = document.getElementById('playerSupporterSlot');
  const aSupSlot = document.getElementById('aiSupporterSlot');
  await animateCardEntry(pSlot, playerAttacker, 'left');
  await delay(150);
  if (playerSupporters[0]) await animateCardEntry(pSupSlot, playerSupporters[0], 'left');

  // 2. VS clash
  await showVSClash();

  // 3. Show narrative loading
  const narBox = document.getElementById('narrativeBox');
  narBox.style.display = 'block';
  const narContent = document.getElementById('narrativeContent');
  narContent.innerHTML = '<div class="sim-loading"><span class="live-dot"></span><span class="live-label">SIMULATING...</span></div>';

  let result;
  try {
    result = await callClaudeAPI(playerAttacker, playerSupporters, aiAttacker, aiSupporters);
  } catch (e) {
    result = fallbackResult(playerAttacker, playerSupporters, aiAttacker, aiSupporters);
  }

  // 4. Update score (BO1: single decisive round)
  if (result.winner === 'player') bPScore = 1;
  else if (result.winner === 'ai') bAIScore = 1;
  else bDrawScore = 1;

  battleHistory.push({
    playerAttacker: { id: playerAttacker.id, name: playerAttacker.name },
    playerSupporters: playerSupporters.map(s => ({ id: s.id, name: s.name })),
    aiAttacker: { id: aiAttacker.id, name: aiAttacker.name },
    aiSupporters: aiSupporters.map(s => ({ id: s.id, name: s.name })),
    winner: result.winner,
    effectsTriggered: result.effectsTriggered || []
  });

  // 5. Type narrative
  await typeNarrative(narContent, result.narrative, playerAttacker, aiAttacker, playerSupporters, aiSupporters);

  // 6. Result effect & banner
  await showRoundResultEffect(result.winner);
  await showRoundBanner(result.winner);

  showFinalResult();
  battleLocked = false;
}

function showReviveEffect(healer, revived, side) {
  return new Promise(resolve => {
    const arena = document.querySelector('.battle-arena');
    const overlay = document.createElement('div');
    overlay.className = 'revive-overlay';
    const sideLabel = side === 'player' ? 'PLAYER' : 'ENEMY';
    overlay.innerHTML = `
      <div class="revive-icon">&#x2695;</div>
      <div class="revive-title">REVIVE</div>
      <div class="revive-detail">${escapeHtml(healer.id)} → ${escapeHtml(revived.id)}</div>
      <div class="revive-name">${escapeHtml(revived.name)}</div>
      <div class="revive-side">${sideLabel} CARD REVIVED</div>
    `;
    arena.appendChild(overlay);
    setTimeout(() => {
      overlay.classList.add('revive-out');
      setTimeout(() => { overlay.remove(); resolve(); }, 500);
    }, 2200);
  });
}

function showRoundBanner(winner) {
  return new Promise(resolve => {
    const field = document.getElementById('battleField');
    const banner = document.createElement('div');
    banner.className = 'round-banner';

    let label, cls;
    if (winner === 'player') { label = 'WIN'; cls = 'round-banner-win'; }
    else if (winner === 'ai') { label = 'LOSE'; cls = 'round-banner-lose'; }
    else { label = 'DRAW'; cls = 'round-banner-draw'; }

    banner.classList.add(cls);
    banner.innerHTML = `<div class="round-banner-label">${label}</div><div class="round-banner-hint">TAP TO CONTINUE</div>`;
    field.appendChild(banner);

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      banner.classList.add('round-banner-out');
      setTimeout(() => { banner.remove(); resolve(); }, 300);
    };
    banner.addEventListener('click', dismiss);
    banner.addEventListener('touchend', dismiss, { passive: true });
  });
}

async function callClaudeAPI(pAttacker, pSupporters, aAttacker, aSupporters) {
  const supPayload = (s) => {
    const eff = getSupporterEffect(s.id) || {};
    return { id: s.id, name: s.name, triggerHint: eff.triggerHint || '', effectTags: eff.effectTags || [], power: eff.power || 'mid' };
  };
  const payload = {
    playerAttacker: { id: pAttacker.id, name: pAttacker.name, cls: pAttacker.cls },
    playerSupporters: pSupporters.map(supPayload),
    aiAttacker: { id: aAttacker.id, name: aAttacker.name, cls: aAttacker.cls },
    aiSupporters: aSupporters.map(supPayload),
    lang: currentLang
  };
  try {
    return await callViaProxy(payload);
  } catch (e) {
    return fallbackResult(pAttacker, pSupporters, aAttacker, aSupporters);
  }
}

// Proxy endpoint - change this after deploying your Cloudflare Worker
const BATTLE_PROXY_URL = 'https://scp-card-battle-api.settlabs.workers.dev';

async function callViaProxy(payload) {
  const resp = await fetch(BATTLE_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

function fallbackResult(pAttacker, pSupporters, aAttacker, aSupporters) {
  // Tag-based bias: heal/enhance/revive/defense favor side; disrupt/nullify hurt opponent
  const score = (sups) => {
    let s = 0;
    sups.forEach(sp => {
      const eff = getSupporterEffect(sp.id) || {};
      const tags = eff.effectTags || [];
      const w = eff.power === 'high' ? 0.08 : eff.power === 'low' ? 0.03 : 0.05;
      tags.forEach(t => {
        if (['heal','enhance','revive','defense','summon','transform'].includes(t)) s += w;
        if (['disrupt','nullify','mind','cosmic','stealth'].includes(t)) s += w * 0.6;
      });
    });
    return s;
  };
  const pBias = score(pSupporters) - score(aSupporters);
  const drawProb = 0.15;
  const winProb = Math.max(0.10, Math.min(0.70, 0.425 + pBias));
  const loseProb = Math.max(0.05, 1 - drawProb - winProb);
  const r = Math.random();
  let winner;
  if (r < winProb) winner = 'player';
  else if (r < winProb + loseProb) winner = 'ai';
  else winner = 'draw';

  const labels = { player: '勝利', ai: '敗北', draw: '引き分け' };
  const narrative = `戦闘報告: ${pAttacker.id} vs ${aAttacker.id}\n経過: 双方のサポーターが応戦した。\n結果: ${labels[winner]}\n所見: 通信障害により詳細不明。Dr.██████`;
  return { winner, narrative, effectsTriggered: [] };
}

async function typeNarrative(el, text, pCard, aiCard, pSupporters = [], aiSupporters = []) {
  // シミュレーション中表示
  el.innerHTML = '<div class="sim-header"><span class="live-dot"></span><span class="live-label">SIMULATING...</span></div>';

  // テキスト長に応じた待ち時間（読んでいる感の演出）
  const waitMs = Math.min(1500, 400 + text.length * 5);
  await new Promise(r => setTimeout(r, waitMs));

  // 報告書セクション形式に変換
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightIds = (str) => {
    if (pCard) str = str.replace(new RegExp(escRe(escapeHtml(pCard.id)), 'g'), `<span class="hl-player">${escapeHtml(pCard.id)}</span>`);
    if (aiCard) str = str.replace(new RegExp(escRe(escapeHtml(aiCard.id)), 'g'), `<span class="hl-ai">${escapeHtml(aiCard.id)}</span>`);
    pSupporters.forEach(s => {
      if (s) str = str.replace(new RegExp(escRe(escapeHtml(s.id)), 'g'), `<span class="hl-psup">${escapeHtml(s.id)}</span>`);
    });
    aiSupporters.forEach(s => {
      if (s) str = str.replace(new RegExp(escRe(escapeHtml(s.id)), 'g'), `<span class="hl-aisup">${escapeHtml(s.id)}</span>`);
    });
    return str;
  };

  const labelMap = [
    { key: '戦闘報告', label: 'BATTLE REPORT', cls: '' },
    { key: '経過', label: 'PROGRESS', cls: '' },
    { key: '結果', label: 'RESULT', cls: '' },
    { key: '所見', label: 'FINDING', cls: ' nr-finding' },
  ];

  const lines = text.replace(/\\n/g, '\n').split('\n').filter(l => l.trim());
  let formatted = '';
  lines.forEach(line => {
    let matched = false;
    for (const lm of labelMap) {
      const re = new RegExp('^' + lm.key + '[：:]\\s*');
      if (re.test(line)) {
        let body = escapeHtml(line.replace(re, ''));
        if (lm.key === '所見') body = body.replace(/Dr\.\s*[^\s」』&quot;、。，,──—]+/g, 'Dr.██████');
        formatted += `<div class="nr-section${lm.cls}"><span class="nr-label">${lm.label}</span><span class="nr-body">${highlightIds(body)}</span></div>`;
        matched = true;
        break;
      }
    }
    if (!matched) {
      formatted += `<div class="nr-section"><span class="nr-body">${highlightIds(escapeHtml(line))}</span></div>`;
    }
  });

  // SIMULATING消去 → 報告書をフェードイン表示
  el.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'narrative-text nr-fadein';
  if (formatted) {
    wrapper.innerHTML = formatted;
  } else {
    wrapper.innerHTML = highlightIds(escapeHtml(text).replace(/\n/g, '<br>'));
  }
  el.appendChild(wrapper);
}

// ===== RANKING SYSTEM =====
const RANK_TIERS = [
  { name: 'Dクラス職員',       short: 'Dクラス職員', min: 0,    color: '#888888', reward: null },
  { name: 'Eクラス職員',       short: 'Eクラス職員', min: 100,  color: '#66aa66', reward: { coins: 200 } },
  { name: 'Cクラス職員',       short: 'Cクラス職員', min: 300,  color: '#00cc66', reward: { coins: 500 } },
  { name: 'Bクラス職員',       short: 'Bクラス職員', min: 600,  color: '#00c8f0', reward: { coins: 1000 } },
  { name: 'Aクラス職員',       short: 'Aクラス職員', min: 1000, color: '#ffc840', reward: { coins: 2000, unlockReport: true } },
];
const RANK_WIN_PT = 30, RANK_DRAW_PT = 10, RANK_LOSE_PT = -15;

const NPC_NAMES = [
  'Dr.Bright','Dr.Clef','Dr.Kondraki','Dr.Gears','Dr.Rights',
  'Agent Green','Agent Lament','MTF-Alpha','MTF-Epsilon','D-9341',
  'Researcher Talloran','Dr.Crow','Dr.King','Agent Strelnikov',
  'Researcher Rosen','Dr.Glass','Director Bold','Captain Hollis'
];

function loadRankData() {
  try {
    const d = JSON.parse(localStorage.getItem('scp_rank'));
    if (d && typeof d.rp === 'number') return d;
  } catch(e) {}
  return { rp: 0, wins: 0, draws: 0, losses: 0, lastChange: 0 };
}

function saveRankData(data) {
  localStorage.setItem('scp_rank', JSON.stringify(data));
}

function addRankPoints(result, oppRp) {
  const rd = loadRankData();
  const playerTierIdx = RANK_TIERS.indexOf(getTier(rd.rp));
  const oppTierIdx = RANK_TIERS.indexOf(getTier(oppRp || 0));
  const tierDiff = oppTierIdx - playerTierIdx; // +なら格上、-なら格下

  let pts = 0;
  if (result === 'win') {
    // 格上に勝つとボーナス、格下だと減少
    pts = RANK_WIN_PT + tierDiff * 10;
    pts = Math.max(10, pts); // 最低10
    rd.wins++;
  } else if (result === 'draw') {
    pts = RANK_DRAW_PT + tierDiff * 5;
    pts = Math.max(0, pts);
    rd.draws++;
  } else {
    const currentTier = getTier(rd.rp);
    if (currentTier === RANK_TIERS[0]) {
      pts = 0;
    } else {
      // 格下に負けると大きく減少、格上なら軽減
      pts = RANK_LOSE_PT + tierDiff * 5;
      pts = Math.min(-5, pts); // 最低-5
    }
    rd.losses++;
  }
  rd.rp = Math.max(0, rd.rp + pts);
  rd.lastChange = pts;
  saveRankData(rd);
  return pts;
}

function getTier(rp) {
  let tier = RANK_TIERS[0];
  for (const t of RANK_TIERS) { if (rp >= t.min) tier = t; }
  return tier;
}

// ===== RANK REWARDS =====
function loadRankRewards() {
  try {
    const d = JSON.parse(localStorage.getItem('scp_rank_rewards'));
    if (d && Array.isArray(d.claimed)) return d;
  } catch(e) {}
  return { claimed: [], reportUnlocked: false };
}
function saveRankRewards(d) {
  localStorage.setItem('scp_rank_rewards', JSON.stringify(d));
}
// ===== DAILY MISSIONS =====
const DAILY_MISSION_DEFS = [
  { id: 'win3',     name: '3勝する',                target: 3, coins: 100 },
  { id: 'play5',    name: '5戦プレイする',          target: 5, coins: 50  },
  { id: 'winKeter', name: 'Keter級アタッカーで勝利', target: 1, coins: 150 },
];
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function loadDaily() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem('scp_daily')); } catch(e) {}
  if (!d || d.date !== todayStr()) {
    d = { date: todayStr(), m: DAILY_MISSION_DEFS.map(def => ({ id: def.id, p: 0, claimed: false })) };
    localStorage.setItem('scp_daily', JSON.stringify(d));
  }
  return d;
}
function saveDaily(d) { localStorage.setItem('scp_daily', JSON.stringify(d)); }
function progressDaily(action, ctx) {
  const d = loadDaily();
  d.m.forEach(m => {
    const def = DAILY_MISSION_DEFS.find(x => x.id === m.id);
    if (!def) return;
    if (m.p >= def.target) return;
    if (m.id === 'win3' && action === 'win') m.p++;
    if (m.id === 'play5' && action === 'play') m.p++;
    if (m.id === 'winKeter' && action === 'win' && ctx && ctx.attackerCls === 'keter') m.p++;
  });
  saveDaily(d);
  renderDailyMissions();
}
function claimDaily(id) {
  const d = loadDaily();
  const m = d.m.find(x => x.id === id);
  const def = DAILY_MISSION_DEFS.find(x => x.id === id);
  if (!m || !def || m.claimed || m.p < def.target) return;
  m.claimed = true;
  saveDaily(d);
  coins += def.coins;
  localStorage.setItem('scp_coins', coins);
  if (typeof updateCoinDisplay === 'function') updateCoinDisplay();
  showToast(`デイリー達成: ${def.name} +${def.coins} COINS`, 3000);
  renderDailyMissions();
}
function renderDailyMissions() {
  const el = document.getElementById('dailyMissions');
  if (!el) return;
  const d = loadDaily();
  const streak = parseInt(localStorage.getItem('scp_winstreak') || '0');
  const collapsed = localStorage.getItem('scp_daily_collapsed') === '1';
  let html = `<div class="dm-header${collapsed ? ' collapsed' : ''}" onclick="toggleDailyMissions()">
    <span>DAILY MISSIONS ${collapsed ? '▼' : '▲'}</span>
    <span class="dm-streak">連勝 ${streak}</span>
  </div>`;
  if (!collapsed) {
    html += '<div class="dm-list">';
    d.m.forEach(m => {
      const def = DAILY_MISSION_DEFS.find(x => x.id === m.id);
      if (!def) return;
      const done = m.p >= def.target;
      let btn;
      if (m.claimed) btn = '<span class="dm-progress">CLAIMED</span>';
      else if (done) btn = `<button class="dm-claim" onclick="claimDaily('${m.id}')">CLAIM</button>`;
      else btn = '';
      html += `<div class="dm-row${m.claimed ? ' done' : ''}">
        <span class="dm-name">${def.name}</span>
        <span class="dm-progress">${Math.min(m.p, def.target)}/${def.target}</span>
        <span class="dm-reward">+${def.coins}</span>
        ${btn}
      </div>`;
    });
    html += '</div>';
  }
  el.innerHTML = html;
}
function toggleDailyMissions() {
  const cur = localStorage.getItem('scp_daily_collapsed') === '1';
  localStorage.setItem('scp_daily_collapsed', cur ? '0' : '1');
  renderDailyMissions();
}

function showToast(msg, duration) {
  let cont = document.getElementById('toastContainer');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'toastContainer';
    cont.className = 'toast-container';
    document.body.appendChild(cont);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  cont.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration || 2800);
}

function toggleRankRewards() {
  const el = document.getElementById('rankRewards');
  const btn = document.querySelector('.rank-rewards-toggle');
  if (!el) return;
  const open = el.classList.toggle('is-open');
  if (btn) btn.textContent = open ? '▲ 報酬を隠す' : '▼ 報酬を表示';
}
function claimRankReward(tierName) {
  const tier = RANK_TIERS.find(t => t.name === tierName);
  if (!tier || !tier.reward) return;
  const rd = loadRankData();
  if (rd.rp < tier.min) return;
  const rw = loadRankRewards();
  if (rw.claimed.indexOf(tierName) !== -1) return;
  rw.claimed.push(tierName);
  if (tier.reward.unlockReport) rw.reportUnlocked = true;
  saveRankRewards(rw);
  if (tier.reward.coins) {
    coins += tier.reward.coins;
    localStorage.setItem('scp_coins', coins);
    if (typeof updateCoinDisplay === 'function') updateCoinDisplay();
  }
  let msg = `${tier.name} 報酬獲得: +${tier.reward.coins} COINS`;
  if (tier.reward.unlockReport) msg += '\n機密報告書ページが解放されました';
  showToast(msg, 4000);
  renderRank();
}

let cachedLeaderboard = null;
let leaderboardLoadedAt = 0;
const LEADERBOARD_TTL = 60000; // 60秒キャッシュ

function loadLeaderboard() {
  if (!fbDb) return Promise.resolve([]);
  return fbDb.ref('decks').orderByChild('rp').limitToLast(20)
    .once('value')
    .then(snap => {
      const entries = [];
      snap.forEach(child => {
        const d = child.val();
        if (!d || !d.name) return;
        const safeName = (typeof d.name === 'string' ? d.name : 'Unknown').replace(/[<>"'&]/g, '').slice(0, 20) || 'Unknown';
        entries.push({
          name: safeName,
          rp: Math.max(0, Math.floor(Number(d.rp) || 0)),
          isPlayer: child.key === fbUid
        });
      });
      return entries;
    })
    .catch(e => {
      console.warn('Failed to load leaderboard:', e);
      return [];
    });
}

function buildLeaderboard(onlineEntries, playerRP) {
  const board = [];
  const usedNames = new Set();
  let hasPlayer = false;

  // オンラインユーザーを追加
  onlineEntries.forEach(entry => {
    if (entry.isPlayer) {
      board.push({ name: playerName || 'YOU', rp: playerRP, isPlayer: true });
      hasPlayer = true;
    } else {
      board.push({ name: entry.name, rp: entry.rp, isPlayer: false });
    }
    usedNames.add(entry.name);
  });

  // プレイヤーが含まれていなければ追加
  if (!hasPlayer) {
    board.push({ name: playerName || 'YOU', rp: playerRP, isPlayer: true });
  }

  board.sort((a, b) => b.rp - a.rp);
  return board.slice(0, 15);
}

async function renderRank() {
  const rd = loadRankData();
  document.getElementById('rankSeason').textContent = 'LIFETIME RECORD';
  document.getElementById('rankPoints').textContent = rd.rp;
  document.getElementById('rankWins').textContent = rd.wins;
  document.getElementById('rankDraws').textContent = rd.draws;
  document.getElementById('rankLosses').textContent = rd.losses;
  document.getElementById('rankTotal').textContent = rd.wins + rd.draws + rd.losses;

  const tier = getTier(rd.rp);
  const nextTier = RANK_TIERS[RANK_TIERS.indexOf(tier) + 1];
  const tierIdx = RANK_TIERS.indexOf(tier);
  const noiseClass = tierIdx >= 1 ? ' has-noise' : '';
  const noiseOpacity = tierIdx >= 1 ? (tierIdx * 0.12) : 0;
  document.getElementById('rankTier').innerHTML = `<div class="tier-badge${noiseClass}" style="color:${tier.color};border-color:${tier.color};background:${tier.color}15;--noise-opacity:${noiseOpacity}">${tier.name}</div>` +
    (nextTier ? `<div style="font-size:0.65rem;color:var(--muted);margin-top:6px;font-family:'Share Tech Mono',monospace">Next: ${nextTier.name} (${nextTier.min} RP)</div>` : '');

  if (rd.lastChange !== 0) {
    const sign = rd.lastChange > 0 ? '+' : '';
    const col = rd.lastChange > 0 ? 'var(--win)' : 'var(--lose)';
    document.getElementById('rankLastChange').innerHTML = `Last: <span style="color:${col}">${sign}${rd.lastChange} RP</span>`;
  } else {
    document.getElementById('rankLastChange').textContent = '';
  }

  // Rewards section
  const rewardsEl = document.getElementById('rankRewards');
  if (rewardsEl) {
    const rw = loadRankRewards();
    let rhtml = '<div class="rank-rewards-title">TIER REWARDS</div>';
    RANK_TIERS.forEach(t => {
      if (!t.reward) return;
      const reached = rd.rp >= t.min;
      const claimed = rw.claimed.indexOf(t.name) !== -1;
      let stateClass = '';
      let btnHtml = '';
      if (claimed) {
        stateClass = 'claimed';
        btnHtml = '<span class="reward-claimed-mark">✓ CLAIMED</span>';
        if (t.reward.unlockReport) {
          btnHtml += ` <a class="reward-report-link" href="report/" target="_blank">機密報告書 ▶</a>`;
        }
      } else if (reached) {
        btnHtml = `<button class="btn reward-claim-btn" onclick="claimRankReward('${t.name}')">CLAIM</button>`;
      } else {
        stateClass = 'locked';
        btnHtml = '<span class="reward-locked-mark">LOCKED</span>';
      }
      let rewardText = `+${t.reward.coins} COINS`;
      if (t.reward.unlockReport) rewardText += ' / 機密報告書解放';
      rhtml += `<div class="reward-row ${stateClass}">
        <div class="reward-info">
          <div class="reward-tier">${t.name}</div>
          <div class="reward-req">${t.min} RP</div>
        </div>
        <div class="reward-content">${rewardText}</div>
        <div class="reward-action">${btnHtml}</div>
      </div>`;
    });
    rewardsEl.innerHTML = rhtml;
  }

  // Leaderboard
  const boardEl = document.getElementById('rankBoard');
  boardEl.innerHTML = '<div class="rank-board-title">LEADERBOARD</div><div style="text-align:center;color:var(--muted);font-family:\'Share Tech Mono\',monospace;font-size:0.75rem;padding:12px">LOADING...</div>';

  // Firebaseからリーダーボード取得（キャッシュTTL内なら再利用）
  const now = Date.now();
  if (!cachedLeaderboard || now - leaderboardLoadedAt > LEADERBOARD_TTL) {
    const entries = await Promise.race([
      loadLeaderboard(),
      new Promise(r => setTimeout(() => r([]), 3000))
    ]).catch(() => []);
    cachedLeaderboard = entries;
    leaderboardLoadedAt = Date.now();
  }

  const board = buildLeaderboard(cachedLeaderboard, rd.rp);
  let html = '<div class="rank-board-title">LEADERBOARD</div>';
  board.forEach((entry, i) => {
    const posClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    const rowClass = entry.isPlayer ? ' is-player' : '';
    const nameClass = entry.isPlayer ? ' is-player' : '';
    html += `<div class="rank-row${rowClass}">
      <span class="rank-pos ${posClass}">#${i+1}</span>
      <span class="rank-name${nameClass}">${escapeHtml(entry.name)}</span>
      <span class="rank-rp">${entry.rp} RP</span>
    </div>`;
  });
  boardEl.innerHTML = html;

  // Reset info
  const nowDate = new Date();
  const nextMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1);
  const daysLeft = Math.ceil((nextMonth - nowDate) / (1000 * 60 * 60 * 24));
  document.getElementById('rankResetInfo').textContent = `SEASON RESET IN ${daysLeft} DAYS`;
}

function showFinalResult() {
  // Add overlay backdrop
  let overlay = document.getElementById('battleResultOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'battleResultOverlay';
    overlay.className = 'battle-result-overlay';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'block';

  const div = document.getElementById('battleResult');
  div.style.display = 'block';
  const enemyName = currentOpponent ? currentOpponent.name : 'AI';
  let cls, title, msg;
  if (bPScore > bAIScore) {
    cls = 'win';
    title = 'VICTORY';
    msg = t('playerWin', bPScore, bDrawScore, bAIScore);
    spawnParticles('win', 30);
  } else if (bPScore < bAIScore) {
    cls = 'lose';
    title = 'DEFEAT';
    msg = t('enemyWin', bPScore, bDrawScore, bAIScore, enemyName);
    document.querySelector('.battle-arena')?.classList.add('defeat-darken');
    setTimeout(() => document.querySelector('.battle-arena')?.classList.remove('defeat-darken'), 2000);
  } else {
    cls = 'draw-result';
    title = 'DRAW';
    msg = t('drawResult', bPScore, bDrawScore, bAIScore);
    spawnParticles('draw', 15);
  }

  // Battle log (BO1: show effects triggered)
  let logHTML = '';
  const h = battleHistory[0];
  if (h) {
    const color = h.winner === 'player' ? 'var(--win)' : h.winner === 'ai' ? 'var(--lose)' : 'var(--draw)';
    const icon = h.winner === 'player' ? 'WIN' : h.winner === 'ai' ? 'LOSE' : 'DRAW';
    logHTML = `<div class="battle-log"><h4>BATTLE LOG</h4>
      <div class="log-row"><span class="log-matchup">${h.playerAttacker.id} vs ${h.aiAttacker.id}</span><span class="log-result" style="color:${color}">${icon}</span></div>`;
    if (h.effectsTriggered && h.effectsTriggered.length) {
      h.effectsTriggered.forEach(ef => {
        const sideColor = ef.side === 'player' ? 'var(--win)' : 'var(--lose)';
        logHTML += `<div class="log-row" style="font-size:0.7rem"><span style="color:${sideColor}">${ef.side === 'player' ? 'P' : 'E'}</span><span class="log-matchup">${ef.id}</span><span class="log-result">${ef.result || ''}</span></div>`;
      });
    }
    logHTML += '</div>';
  }

  // Rank points (always applied)
  const rankResult = bPScore > bAIScore ? 'win' : bPScore < bAIScore ? 'lose' : 'draw';
  const rpChange = addRankPoints(rankResult, currentOpponent ? currentOpponent.rp : 0);
  uploadMyDeck(); // Firebase RPも更新
  const rpSign = rpChange > 0 ? '+' : '';
  const rpColor = rpChange > 0 ? 'var(--win)' : rpChange < 0 ? 'var(--lose)' : 'var(--draw)';
  const rpHTML = `<div style="margin-top:10px;font-family:'Share Tech Mono',monospace;font-size:0.85rem"><span style="color:${rpColor}">${rpSign}${rpChange} RP</span></div>`;

  // Win streak
  let streak = parseInt(localStorage.getItem('scp_winstreak') || '0');
  if (rankResult === 'win') streak++;
  else if (rankResult === 'lose') streak = 0;
  localStorage.setItem('scp_winstreak', String(streak));

  // Coin reward (with streak bonus, capped at +50%)
  let coinReward = 0;
  if (rankResult === 'win') coinReward = 50;
  else if (rankResult === 'draw') coinReward = 15;
  else coinReward = 5;
  let bonusPct = 0;
  if (rankResult === 'win' && streak > 1) {
    bonusPct = Math.min(50, (streak - 1) * 5);
    coinReward = Math.round(coinReward * (1 + bonusPct / 100));
  }
  let coinHTML = '';
  if (coinReward > 0) {
    coins += coinReward;
    localStorage.setItem('scp_coins', coins);
    updateCoinDisplay();
    const bonusTxt = bonusPct > 0 ? ` <span style="color:var(--win)">(連勝+${bonusPct}%)</span>` : '';
    coinHTML = `<div style="margin-top:4px;font-family:'Share Tech Mono',monospace;font-size:0.75rem;color:var(--gold)">+${coinReward} COINS${bonusTxt}</div>`;
  }

  // Daily mission progress
  progressDaily('play');
  const _pAtk = bPlayerAttackers.find(c => c.id === pSelectedAttackerId);
  if (rankResult === 'win') {
    progressDaily('win', { attackerCls: _pAtk ? _pAtk.cls : null });
  }
  // Card battle stats
  if (_pAtk) recordCardStat(_pAtk.id, rankResult);
  pSelectedSupporterIds.forEach(sid => recordCardStat(sid, rankResult));

  // Opponent info
  const oppInfo = currentOpponent ? `<div style="margin-top:6px;font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:var(--muted)">vs ${escapeHtml(enemyName)}${currentOpponent.type === 'user' ? ' (USER)' : ' (CPU)'}</div>` : '';

  div.className = `battle-result ${cls}`;
  div.innerHTML = `<h2 class="result-title">${title}</h2><p>${msg}</p>${rpHTML}${coinHTML}${oppInfo}${logHTML}<div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button class="btn" onclick="resetBattle()">REMATCH</button><button class="btn" onclick="closeBattleResult()">CLOSE</button></div>`;

  overlay.onclick = (e) => { if (e.target === overlay) closeBattleResult(); };
}

function closeBattleResult() {
  const overlay = document.getElementById('battleResultOverlay');
  if (overlay) overlay.style.display = 'none';
  document.getElementById('battleResult').style.display = 'none';
  battleActive = false;
}

function resetBattle() {
  bRound = 0;
  bPlayerHand = [];
  currentOpponent = null;
  battleActive = false;
  renderBattle();
}


// ===== TUTORIAL =====
const TUTORIAL_STEPS = [
  { target: null, tab: null, position: 'center', docId: 'ORIENTATION-001', titleKey: 'tut0title', bodyKey: 'tut0body' },
  { target: '#coinPackBtn', tab: 'pack', position: 'below', docId: 'PACK-001', titleKey: 'tut1title', bodyKey: 'tut1body' },
  { target: '.tab-nav button:nth-child(2)', tab: 'pack', position: 'below', docId: 'COLLECTION-001', titleKey: 'tut2title', bodyKey: 'tut2body' },
  { target: '.tab-nav button:nth-child(3)', tab: 'pack', position: 'below', docId: 'DECK-001', titleKey: 'tut3title', bodyKey: 'tut3body' },
  { target: '.tab-nav button:nth-child(4)', tab: 'pack', position: 'below', docId: 'BATTLE-001', titleKey: 'tut4title', bodyKey: 'tut4body' },
  { target: '.tab-nav button:nth-child(5)', tab: 'pack', position: 'below', docId: 'RANK-001', titleKey: 'tut5title', bodyKey: 'tut5body' },
  { target: null, tab: null, position: 'center', docId: 'ORIENTATION-END', titleKey: 'tut6title', bodyKey: 'tut6body' },
];

let currentTutorialStep = 0;
let tutorialOverlay = null, tutorialSpotlight = null, tutorialTextbox = null, tutorialDots = null;

function startTutorial() {
  if (tutorialOverlay) return; // 二重起動防止
  tutorialOverlay = document.createElement('div');
  tutorialOverlay.className = 'tutorial-overlay no-spotlight';
  tutorialOverlay.id = 'tutorialOverlay';

  tutorialSpotlight = document.createElement('div');
  tutorialSpotlight.className = 'tutorial-spotlight';
  tutorialSpotlight.style.display = 'none';

  tutorialTextbox = document.createElement('div');
  tutorialTextbox.className = 'tutorial-textbox';

  tutorialDots = document.createElement('div');
  tutorialDots.className = 'tutorial-dots';
  TUTORIAL_STEPS.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'tutorial-dot' + (i === 0 ? ' active' : '');
    tutorialDots.appendChild(dot);
  });

  document.body.appendChild(tutorialOverlay);
  document.body.appendChild(tutorialSpotlight);
  document.body.appendChild(tutorialTextbox);
  document.body.appendChild(tutorialDots);

  tutorialOverlay.onclick = (e) => { e.stopPropagation(); };

  window.addEventListener('resize', repositionTutorial);
  currentTutorialStep = 0;
  showTutorialStep(0);
}

function showTutorialStep(idx) {
  const step = TUTORIAL_STEPS[idx];
  if (step.tab) doSwitchTab(step.tab);

  // Update dots
  tutorialDots.querySelectorAll('.tutorial-dot').forEach((d, i) => {
    d.className = 'tutorial-dot' + (i === idx ? ' active' : '');
  });

  const isLast = idx === TUTORIAL_STEPS.length - 1;

  // Render textbox content
  tutorialTextbox.innerHTML = `
    <div class="tut-header">${t('tutDocHeader', step.docId)}</div>
    <div class="tut-title">${t(step.titleKey)}</div>
    <div class="tut-body">${t(step.bodyKey).replace(/\n/g, '<br>')}</div>
    <div class="tut-actions">
      <button class="btn" onclick="skipTutorial()" style="font-size:0.65rem;padding:6px 12px;opacity:0.5">${t('tutSkip')}</button>
      <button class="btn btn-gold" onclick="nextTutorialStep()" style="font-size:0.65rem;padding:6px 14px">${isLast ? t('tutStart') : t('tutNext')}</button>
    </div>
  `;
  // Reset animation
  tutorialTextbox.style.animation = 'none';
  tutorialTextbox.offsetHeight;
  tutorialTextbox.style.animation = 'tutorialTextIn 0.3s ease-out';

  if (!step.target) {
    // Center mode - no spotlight
    tutorialOverlay.classList.add('no-spotlight');
    tutorialSpotlight.style.display = 'none';
    tutorialTextbox.style.top = '50%';
    tutorialTextbox.style.left = '50%';
    tutorialTextbox.style.transform = 'translate(-50%, -50%)';
    tutorialTextbox.style.bottom = '';
  } else {
    // Spotlight mode
    tutorialOverlay.classList.remove('no-spotlight');
    tutorialSpotlight.style.display = 'block';
    positionSpotlight(step);
  }
}

function positionSpotlight(step) {
  const el = document.querySelector(step.target);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const pad = 8;

  tutorialSpotlight.style.top = (rect.top - pad) + 'px';
  tutorialSpotlight.style.left = (rect.left - pad) + 'px';
  tutorialSpotlight.style.width = (rect.width + pad * 2) + 'px';
  tutorialSpotlight.style.height = (rect.height + pad * 2) + 'px';

  // Position textbox
  tutorialTextbox.style.transform = '';
  const tbHeight = 260;
  const margin = 16;

  if (step.position === 'below' && rect.bottom + margin + tbHeight < window.innerHeight) {
    tutorialTextbox.style.top = (rect.bottom + margin) + 'px';
    tutorialTextbox.style.bottom = '';
  } else {
    tutorialTextbox.style.top = '';
    tutorialTextbox.style.bottom = (window.innerHeight - rect.top + margin) + 'px';
  }

  // Horizontal center clamped to viewport
  let leftPos = rect.left + rect.width / 2 - 170;
  leftPos = Math.max(20, Math.min(leftPos, window.innerWidth - 360));
  tutorialTextbox.style.left = leftPos + 'px';
}

function nextTutorialStep() {
  currentTutorialStep++;
  if (currentTutorialStep >= TUTORIAL_STEPS.length) {
    completeTutorial();
  } else {
    showTutorialStep(currentTutorialStep);
  }
}

function skipTutorial() {
  completeTutorial();
}

function completeTutorial() {
  const isFirst = !localStorage.getItem('scp_tutorial_done');
  localStorage.setItem('scp_tutorial_done', '1');
  if (isFirst) {
    coins += 100;
    localStorage.setItem('scp_coins', coins);
    updateCoinDisplay();
  }
  window.removeEventListener('resize', repositionTutorial);
  [tutorialOverlay, tutorialSpotlight, tutorialTextbox, tutorialDots].forEach(el => {
    if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }
  });
  tutorialOverlay = tutorialSpotlight = tutorialTextbox = tutorialDots = null;
  doSwitchTab('pack');
}

function repositionTutorial() {
  const step = TUTORIAL_STEPS[currentTutorialStep];
  if (step && step.target) positionSpotlight(step);
}

// ===== SNS SHARE =====
const SHARE_REWARD = 500;
const SHARE_KEY = 'scp_share_claimed';

function initShareBonus() {
  const el = document.getElementById('shareBonus');
  if (!el) return;
  if (localStorage.getItem(SHARE_KEY)) {
    el.classList.add('claimed');
    el.querySelector('.share-bonus-text').innerHTML = 'シェア済み <strong>+500 COINS</strong> 獲得済';
    el.querySelector('.share-btn').textContent = 'DONE';
  }
}

function doShare() {
  if (localStorage.getItem(SHARE_KEY)) return;

  const shareText = 'SCP財団をテーマにしたカードバトルゲーム。250体以上のSCPカードを集めてデッキを組み、オンライン対戦に挑め！ #SCPCardBattle';
  const shareUrl = 'https://settlabs.app/scp_card_battle/';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    navigator.share({ title: 'SCP Card Battle', text: shareText, url: shareUrl }).then(() => {
      claimShareReward();
    }).catch(() => {});
  } else {
    const tweetUrl = 'https://x.com/intent/tweet?text=' + encodeURIComponent(shareText + '\n' + shareUrl);
    const w = window.open(tweetUrl, '_blank');
    if (w) claimShareReward();
  }
}

function claimShareReward() {
  if (localStorage.getItem(SHARE_KEY)) return;
  localStorage.setItem(SHARE_KEY, '1');
  coins += SHARE_REWARD;
  localStorage.setItem('scp_coins', coins);
  updateCoinDisplay();
  initShareBonus();
}

// ===== DAILY LOGIN BONUS =====
const DAILY_LOGIN_COINS = 100;
function checkDailyLoginBonus() {
  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem('scp_last_login');
  if (last === today) return;
  localStorage.setItem('scp_last_login', today);
  coins += DAILY_LOGIN_COINS;
  localStorage.setItem('scp_coins', coins);
  updateCoinDisplay();
  showDailyLoginPopup(DAILY_LOGIN_COINS);
}
function showDailyLoginPopup(amount) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;animation:resultOverlayIn 0.3s ease-out';
  const box = document.createElement('div');
  box.style.cssText = 'background:#1a1a20;border:2px solid var(--gold,#d4af37);border-radius:12px;padding:32px 40px;text-align:center;max-width:90vw;box-shadow:0 0 40px rgba(212,175,55,0.4)';
  box.innerHTML = '<div style="font-family:\'Share Tech Mono\',monospace;font-size:0.9rem;color:var(--gold,#d4af37);letter-spacing:2px;margin-bottom:8px">DAILY LOGIN BONUS</div>'
    + '<div style="font-size:2rem;font-weight:bold;color:#fff;margin:12px 0">&#x1FA99; +' + amount + ' COINS</div>'
    + '<div style="font-size:0.85rem;color:#aaa;margin-bottom:20px">本日のログインボーナスを獲得しました</div>'
    + '<button class="btn btn-gold" style="font-size:0.85rem;padding:8px 28px">CLAIM</button>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  box.querySelector('button').onclick = close;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

// ===== v2.0.0 MIGRATION =====
const APP_VERSION = '0.1.0';
function checkV2Migration() {
  const stored = localStorage.getItem('scp_version');
  if (stored === APP_VERSION) return false;
  // Has any v1 data?
  const hasOldData = localStorage.getItem('scp_collection') || localStorage.getItem('scp_saved_deck') || localStorage.getItem('scp_coins');
  if (!hasOldData) {
    localStorage.setItem('scp_version', APP_VERSION);
    return false;
  }
  // Show migration modal
  const overlay = document.createElement('div');
  overlay.className = 'v2-migration-overlay';
  overlay.innerHTML = `
    <div class="v2-migration-box">
      <h2>SYSTEM UPDATE v0.1.0</h2>
      <p>戦闘システムが大幅に刷新されました。</p>
      <p>・カードがアタッカー/サポーターに分類</p>
      <p>・9枚デッキ (アタッカー3 + サポーター6)</p>
      <p>・BO3 (2勝先取) 戦闘システム</p>
      <p class="v2-warn">これまでの進捗（コレクション、コイン、デッキ、ランク）は全てリセットされます。</p>
      <p>新規プレイヤーとしてスターターパックが付与されます。</p>
      <button id="v2MigrateBtn">RESET & START v0.1.0</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('v2MigrateBtn').onclick = () => {
    localStorage.clear();
    localStorage.setItem('scp_version', APP_VERSION);
    grantStarterPack();
    location.reload();
  };
  return true;
}

function grantStarterPack() {
  // Give 5 attackers + 8 supporters from low-cost pool
  const starter = ['SCP-085','SCP-1048','SCP-066','SCP-668','SCP-894',
                   'SCP-999','SCP-2295','SCP-914','SCP-500','SCP-1471','SCP-148','SCP-006','SCP-038'];
  const coll = {};
  starter.forEach(id => { if (SCPS.some(s => s.id === id)) coll[id] = 1; });
  localStorage.setItem('scp_collection', JSON.stringify(coll));
  localStorage.setItem('scp_coins', '500');
}

if (checkV2Migration()) {
  // Halt init — user must reset
} else {

// ===== INIT =====
applyLang();
renderCollection();
updateCoinDisplay();
initShareBonus();
initFirebase();
checkDailyLoginBonus();

// Tutorial trigger
if (!localStorage.getItem('scp_collection') && !localStorage.getItem('scp_tutorial_done')) {
  setTimeout(startTutorial, 800);
}

} // end v2 migration gate
