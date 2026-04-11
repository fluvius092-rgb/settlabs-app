// I18N & Battle Cache
// ===== BATTLE CACHE =====
// 同じ組み合わせのAPI結果をlocalStorageにキャッシュ
const CACHE_KEY = 'scp_battle_cache';
const CACHE_VERSION = 13; // ルール変更時にインクリメント→キャッシュクリア
let battleCache = {};
try {
  const c = JSON.parse(localStorage.getItem(CACHE_KEY));
  if (c && c._ver === CACHE_VERSION) { battleCache = c; }
  else { battleCache = { _ver: CACHE_VERSION }; localStorage.setItem(CACHE_KEY, JSON.stringify(battleCache)); }
} catch(e) { battleCache = { _ver: CACHE_VERSION }; }

function getCacheKey(pId, aiId) { return pId + '_' + aiId; }

function getCachedResult(pId, aiId) {
  const key = getCacheKey(pId, aiId);
  const cached = battleCache[key];
  if (cached && cached.length > 0) {
    // ランダムに1つ選ぶ（同じ組み合わせでも複数パターン保存）
    return cached[Math.floor(Math.random() * cached.length)];
  }
  return null;
}

function saveCacheResult(pId, aiId, result) {
  const key = getCacheKey(pId, aiId);
  if (!battleCache[key]) battleCache[key] = [];
  // 同じ組み合わせは最大5件まで保存（バリエーション確保）
  if (battleCache[key].length < 5) {
    battleCache[key].push({ winner: result.winner, narrative: result.narrative });
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(battleCache));
}

// ===== I18N =====
let currentLang = localStorage.getItem('scp_lang') || 'ja';
const I18N = {
  ja: {
    adDesc: '広告を視聴してパック開封権を獲得',
    watchAd: 'WATCH AD',
    openPack: 'OPEN PACK (5 CARDS)',
    coinPack: 'COIN PACK (100C)',
    sortId: 'SCP番号', sortCostAsc: 'コスト↑', sortCostDesc: 'コスト↓', sortName: '名前', sortType: 'タイプ',
    deckNotSaved: 'デッキが保存されていません。DECKタブでデッキを構築・保存してください。',
    registerPrompt: '対戦に参加するにはプレイヤー名を登録してください',
    registerPlaceholder: 'プレイヤー名',
    registerBtn: '登録',
    tapToSelect: '— タップで選択',
    deckSaved: 'デッキを保存しました！',
    enterName: '名前を入力してください',
    remaining: (n) => `— 残り ${n} 枚`,
    playerWin: (p, d, a) => `${p} - ${d} - ${a} でプレイヤーの勝利！`,
    enemyWin: (p, d, a, name) => `${p} - ${d} - ${a} で${name}の勝利...`,
    drawResult: (p, d, a) => `${p} - ${d} - ${a} で引き分け！`,
    battleLeaveTitle: 'WARNING',
    battleLeaveMsg: 'バトル中にタブを離れると<br><strong style="color:var(--lose)">敗北</strong>扱いになります。',
    battleLeaveNote: '※ 敗北コインは付与されません',
    battleLeaveYes: '離脱する',
    battleLeaveNo: '戻る',
    flipAll: 'FLIP ALL',
    tapToContinue: 'タップで続行',
    tutDocHeader: (docId) => `SCP財団 // 文書番号: ${docId} // 機密レベル: LEVEL-1`,
    tutSkip: 'SKIP',
    tutNext: 'NEXT →',
    tutStart: 'START',
    tut0title: '新任職員オリエンテーション',
    tut0body: 'ようこそ、新任エージェント。\n本資料はSCPカードバトルシステムの操作手順を説明する機密文書である。\n\n全セクションを確認し、戦闘準備を完了せよ。',
    tut1title: 'PACK — 広告視聴プロトコル',
    tut1body: '手順1: 「WATCH AD」ボタンを押下し、30秒の広告視聴を完了せよ。\n\n視聴完了後、5枚のSCPカードが封入されたパックの開封権が付与される。\nコイン100枚でも開封可能である。',
    tut2title: 'COLLECTION — SCP档案閲覧',
    tut2body: '取得したSCPカードはCOLLECTIONタブで一覧できる。\n\n各カードにはオブジェクトクラス（Safe / Euclid / Keter / Thaumiel）とコスト値が設定されている。\n未取得カードはロック状態で表示される。',
    tut3title: 'DECK — 戦術編成指令',
    tut3body: '5枚のカードでデッキを編成せよ。\n\nコスト上限は25。この制約の中で最適な編成を見極めることが、エージェントとしての腕の見せ所である。\n\n編成完了後「SAVE DECK」で保存を忘れるな。',
    tut4title: 'BATTLE — SCP対戦プロトコル',
    tut4body: 'プレイヤー名を登録後、自動マッチメイキングで対戦相手が選出される。\n\n全5ラウンド制。各ラウンドで手札から1枚を選出し、勝敗が判定される。\n\n勝利でRP+30とコイン50枚が付与される。',
    tut5title: 'RANK — 階級査定制度',
    tut5body: 'ランクポイント(RP)に応じて階級が決定される。\n\nDクラス → Eクラス → Cクラス → Bクラス → Aクラス\n\nDクラスでは敗北してもRPは減少しない。\n上位を目指して戦闘を重ねよ。',
    tut6title: 'オリエンテーション完了',
    tut6body: 'ブリーフィングは以上である。\n\nまずはPACKタブで広告を視聴し、最初のカードパックを開封せよ。\n\n幸運を祈る、エージェント。\n\n——O5-██',
    narrativePrompt: 'narrativeは以下の戦闘報告書形式で記述すること（150〜250字の日本語）。各項目の間には必ず改行(\\n)を入れること:\n\n戦闘報告: [対戦概要1行]\\n経過: [戦闘の展開を2〜3文で。どちらが攻撃し、どう対処したか具体的に]\\n結果: [勝敗の決定打を1文で]\\n所見: [担当研究員のコメント1文。「——Dr.██████」で締める]\n\n文体はSCP財団の公式文書・実験報告書に準拠。客観的・簡潔に記述。「[データ削除済]」「█████」「[編集済]」等のSCP文書表現を適度に使用可。',
  },
  en: {
    adDesc: 'Watch an ad to earn pack opening rights',
    watchAd: 'WATCH AD',
    openPack: 'OPEN PACK (5 CARDS)',
    coinPack: 'COIN PACK (100C)',
    sortId: 'SCP#', sortCostAsc: 'Cost↑', sortCostDesc: 'Cost↓', sortName: 'Name', sortType: 'Type',
    deckNotSaved: 'No deck saved. Please build and save a deck in the DECK tab.',
    registerPrompt: 'Register a player name to join battles',
    registerPlaceholder: 'Player Name',
    registerBtn: 'REGISTER',
    tapToSelect: '— Tap to select',
    deckSaved: 'Deck saved!',
    enterName: 'Please enter a name',
    remaining: (n) => `— ${n} left`,
    playerWin: (p, d, a) => `${p} - ${d} - ${a} Player wins!`,
    enemyWin: (p, d, a, name) => `${p} - ${d} - ${a} ${name} wins...`,
    drawResult: (p, d, a) => `${p} - ${d} - ${a} Draw!`,
    battleLeaveTitle: 'WARNING',
    battleLeaveMsg: 'Leaving during battle counts as a<br><strong style="color:var(--lose)">DEFEAT</strong>.',
    battleLeaveNote: '* No defeat coins will be awarded',
    battleLeaveYes: 'LEAVE',
    battleLeaveNo: 'BACK',
    flipAll: 'FLIP ALL',
    tapToContinue: 'TAP TO CONTINUE',
    tutDocHeader: (docId) => `SCP Foundation // Doc#: ${docId} // Clearance: LEVEL-1`,
    tutSkip: 'SKIP',
    tutNext: 'NEXT →',
    tutStart: 'START',
    tut0title: 'New Personnel Orientation',
    tut0body: 'Welcome, new agent.\nThis document is a classified briefing on the SCP Card Battle system.\n\nReview all sections and complete combat preparations.',
    tut1title: 'PACK — Ad Viewing Protocol',
    tut1body: 'Step 1: Press "WATCH AD" and complete the 30-second ad viewing.\n\nUpon completion, you will be granted access to open a pack containing 5 SCP cards.\nAlternatively, 100 coins can be used.',
    tut2title: 'COLLECTION — SCP Archive',
    tut2body: 'Acquired SCP cards can be viewed in the COLLECTION tab.\n\nEach card has an Object Class (Safe / Euclid / Keter / Thaumiel) and a cost value.\nUnacquired cards are shown in locked state.',
    tut3title: 'DECK — Tactical Assembly',
    tut3body: 'Assemble a deck of 5 cards.\n\nCost limit is 25. Finding the optimal composition within this constraint is your skill as an agent.\n\nDon\'t forget to "SAVE DECK" after assembly.',
    tut4title: 'BATTLE — SCP Combat Protocol',
    tut4body: 'After registering your name, auto-matchmaking will select an opponent.\n\n5 rounds total. Select 1 card from your hand each round.\n\nVictory awards RP+30 and 50 coins.',
    tut5title: 'RANK — Classification System',
    tut5body: 'Your rank is determined by Rank Points (RP).\n\nD-Class → E-Class → C-Class → B-Class → A-Class\n\nD-Class personnel suffer no RP loss on defeat.\nKeep fighting to climb the ranks.',
    tut6title: 'Orientation Complete',
    tut6body: 'Briefing concluded.\n\nProceed to the PACK tab and open your first card pack.\n\nGood luck, agent.\n\n——O5-██',
    narrativePrompt: 'Write the narrative as a battle report (150-250 chars in English). Separate each section with newlines(\\n):\n\nBattle Report: [1-line summary]\\nProgress: [2-3 sentences on how the battle unfolded]\\nResult: [1 sentence on the decisive moment]\\nFindings: [1 comment from the researcher. End with "——Dr.██████"]\n\nUse SCP Foundation official document style. Write objectively and concisely. Use SCP expressions like "[DATA EXPUNGED]", "█████", "[REDACTED]" moderately.',
  }
};
function t(key, ...args) {
  const val = I18N[currentLang][key];
  if (typeof val === 'function') return val(...args);
  return val || key;
}
function getDesc(scp) { return (currentLang === 'en' && scp.desc_en) ? scp.desc_en : scp.desc; }
function getPower(scp) { return (currentLang === 'en' && scp.power_en) ? scp.power_en : scp.power; }
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('scp_lang', lang);
  applyLang();
}
function applyLang() {
  // Update lang toggle buttons
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
  // Update static HTML text
  // Collection sort buttons
  const sortLabels = [t('sortId'), t('sortCostAsc'), t('sortCostDesc'), t('sortName'), t('sortType')];
  document.querySelectorAll('#tab-collection .df-sort').forEach((b, i) => {
    if (sortLabels[i]) b.textContent = sortLabels[i];
  });
  // Deck sort buttons
  document.querySelectorAll('#tab-deck .df-sort').forEach((b, i) => {
    if (sortLabels[i]) b.textContent = sortLabels[i];
  });
  // Battle warnings
  const deckWarn = document.getElementById('deckWarning');
  if (deckWarn) deckWarn.textContent = t('deckNotSaved');
  const regPrompt = document.getElementById('registerPrompt');
  if (regPrompt) regPrompt.textContent = t('registerPrompt');
  const regInput = document.getElementById('playerNameInput');
  if (regInput) regInput.placeholder = t('registerPlaceholder');
  const regBtn = document.getElementById('registerBtn');
  if (regBtn) regBtn.textContent = t('registerBtn');
  const tapHint = document.getElementById('tapHint');
  if (tapHint) tapHint.textContent = t('tapToSelect');
}
