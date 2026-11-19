// =====================================================
//  큐브 왕국 모험 - 직육면체 RPG
// =====================================================
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const TILE = 48, VIEW_W = 15, VIEW_H = 11;
  const W = 44, H = 32;
  const STEP_MS = 140;
  const SAVE_KEY = "cubeKingdomSave";
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const START = { x: 21, y: 14 };
  const REVIVE = { x: 23, y: 15 };

  const canvas = $("game");
  const ctx = canvas.getContext("2d");
  canvas.width = VIEW_W * TILE;
  canvas.height = VIEW_H * TILE;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0);
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // =====================================================
  //  지역
  // =====================================================
  const ZONES = [
    { id: "castle", name: "🏰 큐브 드래곤의 성", rect: [18, 1, 25, 9], topic: "all" },
    { id: "forest", name: "🌲 개념의 숲", rect: [2, 2, 16, 13], topic: "concept",
      monster: { emoji: "🍄", name: "꼭짓점 버섯" }, guardian: { emoji: "🐗", name: "숲의 수호자 멧돼지" } },
    { id: "cave", name: "🦇 겨냥도 동굴", rect: [27, 2, 41, 13], topic: "sketch",
      monster: { emoji: "🦇", name: "점선 박쥐" }, guardian: { emoji: "💀", name: "동굴의 수호자 해골" } },
    { id: "desert", name: "🌵 전개도 사막", rect: [2, 19, 16, 29], topic: "net",
      monster: { emoji: "🦂", name: "전개도 전갈" }, guardian: { emoji: "🐍", name: "사막의 수호자 큰뱀" } },
    { id: "garden", name: "🗿 모서리 정원", rect: [27, 19, 41, 29], topic: "edge",
      monster: { emoji: "🤖", name: "모서리 로봇" }, guardian: { emoji: "🗿", name: "정원의 수호자 석상" } },
    { id: "village", name: "🏡 큐브 마을", rect: [17, 11, 26, 18] },
  ];
  const PIECE_ZONES = ["forest", "cave", "desert", "garden"];
  const zoneAt = (x, y) => ZONES.find((z) => x >= z.rect[0] && x <= z.rect[2] && y >= z.rect[1] && y <= z.rect[3]);
  const zoneById = (id) => ZONES.find((z) => z.id === id);

  const STATS = {
    normal:   { hp: 2, dmg: 15, xp: 25,  coins: 10 },
    guardian: { hp: 4, dmg: 20, xp: 80,  coins: 40 },
    boss:     { hp: 8, dmg: 25, xp: 300, coins: 200 },
  };

  // =====================================================
  //  지도 만들기
  // =====================================================
  // . 풀  = 길  c 동굴바닥  s 모래  p 돌바닥  C 성 바닥   (걸을 수 있음)
  // T 나무  W 바위  K 선인장  P 기둥  X 성벽  G 성문  H 집  F 분수 (막힘)
  const WALKABLE = new Set([".", "=", "c", "s", "p", "C"]);
  let map;

  function buildMap() {
    const rng = mulberry32(5052);
    const m = Array.from({ length: H }, () => Array(W).fill("."));
    const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y][x] = ch; };
    const scatter = (x0, y0, x1, y1, ch, p) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (rng() < p) m[y][x] = ch; };
    const road = (x0, y0, x1, y1) => fill(x0, y0, x1, y1, "=");

    fill(27, 2, 41, 13, "c");
    fill(2, 19, 16, 29, "s");
    fill(27, 19, 41, 29, "p");
    scatter(2, 2, 16, 13, "T", 0.22);
    scatter(27, 2, 41, 13, "W", 0.15);
    scatter(2, 19, 16, 29, "K", 0.09);
    scatter(27, 19, 41, 29, "P", 0.08);
    scatter(2, 14, 16, 18, "T", 0.06);
    scatter(27, 14, 41, 18, "T", 0.06);
    scatter(17, 19, 26, 29, "T", 0.07);

    fill(17, 11, 26, 18, ".");      // 마을
    fill(17, 0, 26, 10, "X");       // 성벽
    fill(18, 1, 25, 9, "C");        // 성 안
    m[10][21] = "G"; m[10][22] = "G";

    road(2, 16, 41, 16); road(21, 11, 22, 29);
    road(9, 4, 9, 28); road(34, 4, 34, 28);
    road(4, 7, 15, 7); road(28, 7, 40, 7);
    road(4, 24, 15, 24); road(28, 24, 40, 24);

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const inCastle = x >= 17 && x <= 26 && y <= 10;
      if (!inCastle && (x < 2 || x > W - 3 || y < 2 || y > H - 3)) m[y][x] = "T";
    }

    [[18, 12], [25, 12], [18, 18], [25, 18]].forEach(([x, y]) => (m[y][x] = "H"));
    m[14][24] = "F";
    return m;
  }

  function openGate() { map[10][21] = "C"; map[10][22] = "C"; }
  const gateOpen = () => map[10][21] === "C";

  // 시작점에서 갈 수 있는 칸 찾기 (몬스터를 막힌 곳에 두지 않으려고)
  function reachable(m) {
    const seen = new Set([`${START.x},${START.y}`]);
    const q = [[START.x, START.y]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k)) continue;
        const ch = m[ny][nx];
        if (WALKABLE.has(ch) || ch === "G") { seen.add(k); q.push([nx, ny]); }
      }
    }
    return seen;
  }

  // =====================================================
  //  등장인물
  // =====================================================
  const NPCS = [
    { id: "elder", emoji: "👴", name: "촌장 할아버지", x: 19, y: 14 },
    { id: "owl", emoji: "🦉", name: "부엉이 박사", x: 19, y: 17 },
    { id: "bear", emoji: "🐻", name: "곰 상인", x: 25, y: 15 },
  ];

  let monsters = [];

  function spawnMonsters() {
    const reach = reachable(map);
    monsters = [];
    let id = 0;
    PIECE_ZONES.forEach((zid, zi) => {
      const z = zoneById(zid);
      const rng = mulberry32(777 + zi * 31);
      const [x0, y0, x1, y1] = z.rect;
      const cand = [];
      for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++)
        if (WALKABLE.has(map[y][x]) && map[y][x] !== "=" && reach.has(`${x},${y}`)) cand.push([x, y]);
      const chosen = [];
      let tries = 0;
      while (chosen.length < 4 && tries++ < 500) {
        const c = cand[Math.floor(rng() * cand.length)];
        if (chosen.every(([cx, cy]) => Math.abs(cx - c[0]) + Math.abs(cy - c[1]) >= 4)) chosen.push(c);
      }
      chosen.forEach(([x, y], i) => {
        const type = i === 0 ? "guardian" : "normal";
        const look = type === "guardian" ? z.guardian : z.monster;
        monsters.push({ id: id++, zone: zid, type, ...look, ...STATS[type], x, y, rx: x, ry: y, homeX: x, homeY: y, alive: true, respawnAt: 0 });
      });
    });
    monsters.push({ id: id++, zone: "castle", type: "boss", emoji: "🐉", name: "큐브 드래곤", ...STATS.boss,
      x: 21, y: 4, rx: 21, ry: 4, homeX: 21, homeY: 4, alive: true, respawnAt: 0 });
  }

  // =====================================================
  //  플레이어 & 저장
  // =====================================================
  let P = null;

  function newPlayer(name, char) {
    return {
      name, char, x: START.x, y: START.y, hp: 100, maxHp: 100, lv: 1, xp: 0,
      coins: 30, potions: 1, hints: 1,
      pieces: { forest: false, cave: false, desert: false, garden: false },
      bossDefeated: false, correct: 0, total: 0,
    };
  }
  const xpNeed = (lv) => 50 + lv * 50;

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch {}
  }
  function loadSave() {
    try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  // =====================================================
  //  상태창
  // =====================================================
  function updateHud() {
    $("hudLv").textContent = `Lv.${P.lv}`;
    $("hudName").textContent = P.name;
    $("hudHp").style.width = `${(P.hp / P.maxHp) * 100}%`;
    $("hudHpText").textContent = `${P.hp}/${P.maxHp}`;
    $("hudXp").style.width = `${Math.min(100, (P.xp / xpNeed(P.lv)) * 100)}%`;
    $("hudCoins").textContent = P.coins;
    $("hudPotions").textContent = P.potions;
    $("hudHints").textContent = P.hints;
    $("hudPieces").textContent = PIECE_ZONES.map((z) => (P.pieces[z] ? "🟧" : "⬜")).join("");
  }
  const pieceCount = () => PIECE_ZONES.filter((z) => P.pieces[z]).length;

  let bannerTimer = null;
  function showBanner(text) {
    const b = $("zoneBanner");
    b.textContent = text;
    b.classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.remove("show"), 2200);
  }

  // =====================================================
  //  대화창
  // =====================================================
  let dialog = null;

  function say(name, pages, onDone) {
    dialog = { name, pages: [].concat(pages), i: 0, onDone };
    renderDialog();
  }
  function ask(name, text, options) {
    dialog = { name, pages: [text], i: 0, options };
    renderDialog();
  }
  function renderDialog() {
    const d = dialog;
    $("dialog").classList.remove("hidden");
    $("dlgName").textContent = d.name;
    $("dlgText").innerHTML = d.pages[d.i];
    const last = d.i === d.pages.length - 1;
    const opts = $("dlgOptions");
    opts.innerHTML = "";
    if (last && d.options) {
      d.options.forEach((o) => {
        const b = document.createElement("button");
        b.innerHTML = o.label;
        b.addEventListener("click", (e) => { e.stopPropagation(); closeDialog(); o.fn && o.fn(); });
        opts.appendChild(b);
      });
    }
    $("dlgNext").classList.toggle("hidden", !!(last && d.options));
  }
  function advanceDialog() {
    if (!dialog || (dialog.options && dialog.i === dialog.pages.length - 1)) return;
    dialog.i++;
    if (dialog.i >= dialog.pages.length) {
      const cb = dialog.onDone;
      closeDialog();
      cb && cb();
    } else renderDialog();
  }
  function closeDialog() {
    dialog = null;
    $("dialog").classList.add("hidden");
  }
  $("dialog").addEventListener("click", advanceDialog);

  // =====================================================
  //  NPC 대화
  // =====================================================
  function introTalk() {
    const n = escapeHtml(P.name);
    say("촌장 할아버지", [
      `어서 오너라, <b>${n}</b>!`,
      "큰일이야! 🐉 <b>큐브 드래곤</b>이 우리 마을의 <b>큐브 조각 4개</b>를 빼앗아 갔단다.",
      "🌲숲, 🦇동굴, 🌵사막, 🗿정원의 <b>수호자</b>들이 조각을 지키고 있지. 수학 문제를 맞혀서 물리치면 조각을 되찾을 수 있어!",
      "몬스터에게 부딪히면 <b>퀴즈 배틀</b>이 시작된단다. 맞히면 공격, 틀리면 다치니 조심하렴.",
      "모르는 게 있으면 🦉<b>부엉이 박사</b>에게, 다치면 ⛲<b>분수</b>에 가 보렴. 조각 4개를 모으면 북쪽 성문이 열릴 거야. 행운을 빈다!",
    ]);
  }

  function talkElder() {
    const left = PIECE_ZONES.filter((z) => !P.pieces[z]).map((z) => zoneById(z).name);
    if (P.bossDefeated) return say("촌장 할아버지", ["고맙다, 영웅이여! 덕분에 큐브 왕국이 평화로워졌어. 🎉", "몬스터들과 계속 연습해서 레벨을 올려 보렴!"]);
    if (!left.length) return say("촌장 할아버지", ["큐브 조각을 모두 모았구나! 북쪽 성문이 열렸단다.", "🐉 큐브 드래곤은 모든 단원의 문제를 낸다. 물약을 챙겨 가거라!"]);
    say("촌장 할아버지", [`지금까지 큐브 조각 <b>${pieceCount()} / 4</b>개를 모았구나.`, `남은 곳: ${left.join(", ")}`, "왕관을 쓴 👑 수호자를 찾아 물리치렴!"]);
  }

  const NOTES = {
    concept: ["📐 <b>직육면체</b>: 직사각형 6개로 둘러싸인 도형<br>📐 <b>정육면체</b>: 정사각형 6개로 둘러싸인 도형",
      "둘 다 <b>면 6개 · 모서리 12개 · 꼭짓점 8개</b>예요!",
      "정육면체는 직육면체예요. 하지만 직육면체는 정육면체가 <b>아닐 수도</b> 있어요.",
      "서로 평행한 면(3쌍)을 <b>밑면</b>, 밑면과 수직인 면을 <b>옆면</b>이라고 해요. 한 면과 수직인 면은 4개!"],
    sketch: ["<b>겨냥도</b>: 직육면체 모양을 잘 알 수 있게 그린 그림이에요.",
      "보이는 모서리는 <b>실선</b>, 보이지 않는 모서리는 <b>점선</b>으로 그려요.",
      "보이는 면 3 · 안 보이는 면 3<br>실선 모서리 9 · 점선 모서리 3<br>보이는 꼭짓점 7 · 안 보이는 꼭짓점 1"],
    net: ["<b>전개도</b>: 정육면체를 모서리를 따라 잘라서 펼친 그림이에요. 모두 11가지가 있어요!",
      "접었을 때 <b>겹치는 면이 없어야</b> 해요. 네모 4칸이 2×2로 뭉쳐 있으면 전개도가 아니에요.",
      "일자로 이어진 3칸에서 <b>양 끝 칸</b>은 접으면 서로 마주 봐요. 마주 보는 면은 바로 붙어 있지 않아요!"],
    edge: ["정육면체 모서리 길이의 합 = <b>한 모서리 × 12</b>",
      "직육면체 모서리 길이의 합 = <b>(가로 + 세로 + 높이) × 4</b>",
      "반대로 합을 알면 ÷ 12 를 해서 정육면체의 한 모서리를 구할 수 있어요."],
  };
  function talkOwl() {
    ask("부엉이 박사", "부엉! 무엇을 공부해 볼까?", [
      { label: "📐 개념", fn: () => say("부엉이 박사", NOTES.concept) },
      { label: "📐 겨냥도", fn: () => say("부엉이 박사", NOTES.sketch) },
      { label: "🧩 전개도", fn: () => say("부엉이 박사", NOTES.net) },
      { label: "📏 모서리 길이", fn: () => say("부엉이 박사", NOTES.edge) },
      { label: "괜찮아요", fn: null },
    ]);
  }

  function talkBear(msg) {
    ask("곰 상인", msg || `어서 오세요~ 🪙 <b>${P.coins}</b>코인 있으시네요. 뭘 드릴까요?`, [
      { label: "🧪 회복 물약 (20🪙)", fn: () => buy("potions", 20, "회복 물약") },
      { label: "💡 힌트 카드 (30🪙)", fn: () => buy("hints", 30, "힌트 카드") },
      { label: "그만 볼래요", fn: null },
    ]);
  }
  function buy(item, price, label) {
    if (P.coins < price) return talkBear("앗, 코인이 모자라요! 몬스터를 물리치면 코인을 얻을 수 있어요.");
    P.coins -= price;
    P[item]++;
    updateHud(); save();
    talkBear(`${label} 하나 여기 있어요! 🪙 ${P.coins}코인 남았어요. 더 필요하세요?`);
  }

  // 💡 힌트 카드 설명: 배틀에서 보기 2개를 지워 줘요 (보기 3개 이상인 문제)

  // =====================================================
  //  이동
  // =====================================================
  const mover = { moving: false, fromX: 0, fromY: 0, t: 0, face: 1 };
  const held = new Set();
  const KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
  const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  let lastZone = null;
  let battleCooldownUntil = 0;
  let playing = false;

  const busy = () => !playing || !!dialog || !!battle;

  function tryMove(dx, dy) {
    if (dx) mover.face = dx;
    const nx = P.x + dx, ny = P.y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;

    const npc = NPCS.find((n) => n.x === nx && n.y === ny);
    if (npc) { held.clear(); return ({ elder: talkElder, owl: talkOwl, bear: () => talkBear() })[npc.id](); }

    const mon = monsters.find((m) => m.alive && m.y === ny && (m.x === nx || (m.type === "boss" && m.x + 1 === nx)));
    if (mon) { held.clear(); return startBattle(mon); }

    const ch = map[ny][nx];
    if (ch === "F") {
      held.clear();
      P.hp = P.maxHp; updateHud(); save();
      return say("⛲ 분수", "시원한 물을 마셨어요. 체력이 모두 회복됐어요! 💚");
    }
    if (ch === "G") {
      held.clear();
      return say("🚪 성문", `성문이 굳게 닫혀 있어요. 큐브 조각이 4개 있어야 열려요. (지금 ${pieceCount()} / 4)`);
    }
    if (!WALKABLE.has(ch)) return;

    mover.moving = true; mover.fromX = P.x; mover.fromY = P.y; mover.t = 0;
    P.x = nx; P.y = ny;
  }

  function onStepDone() {
    const z = zoneAt(P.x, P.y);
    const zid = z ? z.id : "field";
    if (zid !== lastZone) {
      lastZone = zid;
      showBanner(z ? z.name : "🌼 들판");
      if (zid === "castle" && !P.bossDefeated) say("🐉 큐브 드래곤", "크하하! 조각을 다 모아 오다니 대단하군. 하지만 내 문제는 쉽지 않을걸!");
    }
  }

  window.addEventListener("keydown", (e) => {
    if (!playing) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (dialog && (e.code === "Enter" || e.code === "Space")) { advanceDialog(); return; }
    if (battle && e.code === "Enter") { const nb = battle.answered && $("nextBtn"); if (nb && document.activeElement !== nb) { nb.click(); e.preventDefault(); } return; }
    if (KEYMAP[e.code]) held.add(KEYMAP[e.code]);
  });
  window.addEventListener("keyup", (e) => { if (KEYMAP[e.code]) held.delete(KEYMAP[e.code]); });
  window.addEventListener("blur", () => held.clear());

  document.querySelectorAll("#dpad button").forEach((b) => {
    const dir = b.dataset.dir;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); if (dialog) advanceDialog(); else held.add(dir); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => held.delete(dir)));
  });

  // =====================================================
  //  몬스터 움직임
  // =====================================================
  let aiTimer = 0;
  function monsterTick(now) {
    for (const m of monsters) {
      if (!m.alive) {
        if (m.type === "normal" && now > m.respawnAt && !(P.x === m.homeX && P.y === m.homeY)) {
          m.alive = true; m.x = m.homeX; m.y = m.homeY; m.rx = m.x; m.ry = m.y;
        }
        continue;
      }
      if (m.type !== "normal" || Math.random() > 0.45) continue;
      const [dx, dy] = pickOne(Object.values(DIRV));
      const nx = m.x + dx, ny = m.y + dy;
      const z = zoneById(m.zone).rect;
      if (nx < z[0] || nx > z[2] || ny < z[1] || ny > z[3]) continue;
      if (!WALKABLE.has(map[ny][nx])) continue;
      if (monsters.some((o) => o !== m && o.alive && o.x === nx && o.y === ny)) continue;
      if (nx === P.x && ny === P.y) {
        if (!busy() && !mover.moving && now > battleCooldownUntil) { held.clear(); startBattle(m); }
        continue;
      }
      m.x = nx; m.y = ny;
    }
  }

  // =====================================================
  //  그리기
  // =====================================================
  function drawEmoji(e, cx, cy, size, flip) {
    ctx.save();
    ctx.font = `${size}px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(cx, cy);
    if (flip) ctx.scale(-1, 1);
    ctx.fillText(e, 0, 0);
    ctx.restore();
  }

  function drawTile(ch, x, y, sx, sy) {
    const alt = (x + y) % 2 === 0;
    const h = hash(x, y);
    const base = (c1, c2) => { ctx.fillStyle = alt ? c1 : c2; ctx.fillRect(sx, sy, TILE, TILE); };
    const grass = () => {
      base("#8fd27f", "#86cb76");
      if (h % 5 === 0) { ctx.fillStyle = "#6fb85f"; ctx.fillRect(sx + (h % 30) + 6, sy + ((h >> 5) % 30) + 6, 4, 6); }
    };
    switch (ch) {
      case ".": grass(); break;
      case "=": base("#e6c486", "#e1be7e");
        if (h % 4 === 0) { ctx.fillStyle = "#cfa968"; ctx.fillRect(sx + (h % 34) + 4, sy + ((h >> 4) % 34) + 4, 5, 4); }
        break;
      case "T": grass(); drawEmoji(h % 3 === 0 ? "🌲" : "🌳", sx + TILE / 2, sy + TILE / 2, 40); break;
      case "c": base("#4b4458", "#504a5e"); break;
      case "W":
        base("#4b4458", "#504a5e");
        ctx.fillStyle = "#8a8796";
        ctx.beginPath(); ctx.ellipse(sx + 24, sy + 28, 19, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#a9a6b6";
        ctx.beginPath(); ctx.ellipse(sx + 19, sy + 22, 8, 5, -0.4, 0, Math.PI * 2); ctx.fill();
        break;
      case "s": base("#f2d98e", "#efd486"); break;
      case "K": base("#f2d98e", "#efd486"); drawEmoji("🌵", sx + TILE / 2, sy + TILE / 2, 36); break;
      case "p":
        base("#cfd3dc", "#c8ccd6");
        ctx.strokeStyle = "#b4b9c6"; ctx.lineWidth = 2; ctx.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
        break;
      case "P":
        base("#cfd3dc", "#c8ccd6");
        ctx.fillStyle = "#9aa0b0"; ctx.fillRect(sx + 13, sy + 40, 22, 5);
        ctx.fillStyle = "#eef0f5"; ctx.fillRect(sx + 15, sy + 10, 18, 31);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(sx + 12, sy + 5, 24, 6);
        ctx.fillStyle = "#d5d8e0"; ctx.fillRect(sx + 27, sy + 11, 4, 29);
        break;
      case "C":
        base("#8b3a3a", "#843636");
        if (x === 21 || x === 22) {
          ctx.fillStyle = "#c0392b"; ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = "#f1c40f"; ctx.fillRect(x === 21 ? sx : sx + TILE - 3, sy, 3, TILE);
        }
        break;
      case "X":
        ctx.fillStyle = "#5a5870"; ctx.fillRect(sx, sy, TILE, TILE);
        ctx.strokeStyle = "#44425a"; ctx.lineWidth = 2;
        for (let r = 0; r < 3; r++) {
          ctx.strokeRect(sx + (r % 2 ? -12 : 0), sy + r * 16, 24, 16);
          ctx.strokeRect(sx + (r % 2 ? 12 : 24), sy + r * 16, 24, 16);
        }
        break;
      case "G":
        ctx.fillStyle = "#5a5870"; ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#7a4a1e"; ctx.fillRect(sx + 2, sy + 4, TILE - 4, TILE - 4);
        ctx.fillStyle = "#3d2410";
        for (let i = 0; i < 4; i++) ctx.fillRect(sx + 7 + i * 10, sy + 6, 3, TILE - 8);
        break;
      case "H": grass(); drawEmoji("🏠", sx + TILE / 2, sy + TILE / 2, 42); break;
      case "F": grass(); drawEmoji("⛲", sx + TILE / 2, sy + TILE / 2, 40); break;
      default: grass();
    }
  }

  function drawLabel(text, cx, y, bg) {
    ctx.font = "bold 12px system-ui, sans-serif";
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(cx - w / 2, y - 9, w, 18, 6) : ctx.rect(cx - w / 2, y - 9, w, 18);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, y + 1);
  }

  function shadow(cx, cy, r) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  }

  function render(now) {
    const k = mover.moving ? mover.t : 1;
    const px = mover.moving ? mover.fromX + (P.x - mover.fromX) * k : P.x;
    const py = mover.moving ? mover.fromY + (P.y - mover.fromY) * k : P.y;
    const camX = Math.max(0, Math.min(W - VIEW_W, px - (VIEW_W - 1) / 2));
    const camY = Math.max(0, Math.min(H - VIEW_H, py - (VIEW_H - 1) / 2));

    const x0 = Math.floor(camX), y0 = Math.floor(camY);
    for (let y = y0; y <= y0 + VIEW_H && y < H; y++)
      for (let x = x0; x <= x0 + VIEW_W && x < W; x++)
        drawTile(map[y][x], x, y, Math.round((x - camX) * TILE), Math.round((y - camY) * TILE));

    const toS = (tx, ty) => [(tx - camX) * TILE + TILE / 2, (ty - camY) * TILE + TILE / 2];
    const bob = Math.sin(now / 250) * 2;
    const ents = [];

    NPCS.forEach((n) => ents.push({ y: n.y, draw: () => {
      const [cx, cy] = toS(n.x, n.y);
      shadow(cx, cy + 18, 14);
      drawEmoji(n.emoji, cx, cy + bob * 0.5, 36);
      drawLabel(n.name, cx, cy - 28, "rgba(59,53,97,0.9)");
    } }));

    monsters.forEach((m) => {
      if (!m.alive) return;
      m.rx += (m.x - m.rx) * 0.2; m.ry += (m.y - m.ry) * 0.2;
      ents.push({ y: m.ry, draw: () => {
        const [cx, cy] = toS(m.rx, m.ry);
        if (m.type === "boss") {
          shadow(cx + TILE / 2, cy + 34, 34);
          drawEmoji("🐉", cx + TILE / 2, cy + bob, 84);
          drawLabel("👑 큐브 드래곤", cx + TILE / 2, cy - 48, "rgba(185,28,28,0.95)");
        } else if (m.type === "guardian") {
          shadow(cx, cy + 19, 17);
          drawEmoji(m.emoji, cx, cy + bob, 42);
          drawEmoji("👑", cx, cy - 22 + bob, 18);
        } else {
          shadow(cx, cy + 16, 12);
          drawEmoji(m.emoji, cx, cy + bob, 32);
        }
      } });
    });

    ents.push({ y: py, draw: () => {
      const [cx, cy] = toS(px, py);
      shadow(cx, cy + 18, 14);
      drawCharacter(ctx, cx, cy + 21, 46, charById(P.char), { flip: mover.face < 0, walk: mover.moving ? k : 0 });
    } });

    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
  }

  // =====================================================
  //  배틀
  // =====================================================
  let battle = null;

  function startBattle(m) {
    const z = zoneById(m.zone);
    battle = { m, hp: m.hp, combo: 0, topic: z.topic, q: null, answered: false };
    $("battle").classList.remove("hidden");
    $("bMonster").classList.toggle("boss", m.type === "boss");
    $("bMonEmoji").textContent = m.emoji;
    $("bMonName").textContent = (m.type === "normal" ? "" : "👑 ") + m.name;
    $("bPlayerName").textContent = `${P.name} Lv.${P.lv}`;
    const bc = $("bPlayerCanvas"), bctx = bc.getContext("2d");
    bctx.clearRect(0, 0, bc.width, bc.height);
    drawCharacter(bctx, 50, 106, 96, charById(P.char));
    $("bCombo").textContent = `⚔️ ${m.name}이(가) 나타났다!`;
    updateBattleBars();
    nextQuestion();
  }

  function updateBattleBars() {
    $("bPlayerHp").style.width = `${(P.hp / P.maxHp) * 100}%`;
    $("bPlayerHpText").textContent = `HP ${P.hp} / ${P.maxHp}`;
    $("bMonHp").style.width = `${(Math.max(0, battle.hp) / battle.m.hp) * 100}%`;
    $("bMonHpText").textContent = `HP ${Math.max(0, battle.hp)} / ${battle.m.hp}`;
    $("potionBtn").textContent = `🧪 물약 (${P.potions})`;
    $("hintBtn").textContent = `💡 힌트 (${P.hints})`;
    updateHud();
  }

  function setItemsEnabled(on) {
    const q = battle && battle.q;
    $("potionBtn").disabled = !on || P.potions <= 0 || P.hp >= P.maxHp;
    $("hintBtn").disabled = !on || P.hints <= 0 || !q || q.kind !== "choice" || q.choices.length < 3 || battle.hintUsed;
    $("fleeBtn").disabled = !on;
  }

  function nextQuestion() {
    const q = Q.make(battle.topic);
    battle.q = q;
    battle.answered = false;
    battle.hintUsed = false;
    $("qTag").textContent = q.tag;
    $("qText").innerHTML = q.kind === "ox" ? `${q.text}<br><small style="color:#6b7280">맞으면 ⭕, 틀리면 ❌</small>` : q.text;
    $("qVisual").innerHTML = q.visual || "";
    $("qVisual").classList.remove("locked");
    $("feedback").classList.add("hidden");
    $("feedback").innerHTML = "";

    const box = $("qAnswer");
    if (q.kind === "choice" || q.kind === "ox") {
      box.innerHTML = `<div class="${q.kind === "ox" ? "ox" : "choices"}">` +
        q.choices.map((c) => `<button class="choice" data-v="${c}">${c === "O" ? "⭕" : c === "X" ? "❌" : c}</button>`).join("") + `</div>`;
      box.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => submit(b.dataset.v)));
    } else if (q.kind === "input") {
      box.innerHTML = `
        <form class="input-row" id="inputForm">
          <input type="number" id="numInput" inputmode="numeric" required autocomplete="off">
          <span class="unit">${q.unit}</span>
          <button type="submit">공격! ⚔️</button>
        </form>`;
      $("inputForm").addEventListener("submit", (e) => { e.preventDefault(); submit($("numInput").value.trim()); });
      setTimeout(() => $("numInput") && $("numInput").focus(), 50);
    } else {
      box.innerHTML = "";
      $("qVisual").querySelectorAll(".net-cell").forEach((r) => r.addEventListener("click", () => submit(r.dataset.key)));
    }
    setItemsEnabled(true);
    $("battle").scrollTop = 0;
  }

  function floatText(targetId, text, cls) {
    const el = document.createElement("div");
    el.className = `dmg ${cls}`;
    el.textContent = text;
    $(targetId).appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
  function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function submit(value) {
    if (!battle || battle.answered) return;
    const q = battle.q, m = battle.m;
    battle.answered = true;
    const ok = String(value) === String(q.answer);
    P.total++;

    const comboEl = $("bCombo");
    if (ok) {
      P.correct++;
      battle.combo++;
      const crit = battle.combo >= 3;
      const dmg = crit ? 2 : 1;
      battle.hp -= dmg;
      replay($("bMonEmoji"), "hit");
      floatText("bMonster", crit ? `크리티컬! -${dmg}` : `-${dmg}`, "good");
      comboEl.textContent = battle.combo >= 2 ? `🔥 ${battle.combo} 콤보!${crit ? " 공격력 2배!" : ""}` : "⚔️ 공격 성공!";
    } else {
      battle.combo = 0;
      P.hp = Math.max(0, P.hp - m.dmg);
      replay($("bPlayerCanvas"), "hit");
      replay($("battle"), "flash");
      floatText("bPlayer", `-${m.dmg}`, "bad");
      comboEl.textContent = `💥 ${m.name}의 반격!`;
    }
    replay(comboEl, "pop");
    updateBattleBars();

    $("qAnswer").querySelectorAll(".choice").forEach((b) => {
      b.disabled = true;
      if (b.dataset.v === String(q.answer)) b.classList.add("correct");
      else if (b.dataset.v === String(value)) b.classList.add("wrong");
    });
    $("qAnswer").querySelectorAll("input, button").forEach((el) => (el.disabled = true));
    if (q.reveal) { $("qVisual").innerHTML = q.reveal(value); $("qVisual").classList.add("locked"); }
    setItemsEnabled(false);
    $("potionBtn").disabled = P.potions <= 0 || P.hp >= P.maxHp || P.hp <= 0;

    const won = battle.hp <= 0, lost = P.hp <= 0;
    const answerText = q.kind === "input" ? `${q.answer}${q.unit}` : q.kind === "ox" ? (q.answer === "O" ? "⭕" : "❌") : q.kind === "click" ? "" : q.answer;
    const fb = $("feedback");
    fb.className = ok ? "good" : "bad";
    fb.innerHTML = `
      <div class="fb-title">${ok ? pickOne(["정답! 🎉", "훌륭해요! 👏", "완벽해요! ✨"]) : "아쉬워요 😢"}</div>
      ${!ok && answerText ? `<div>정답: <b>${answerText}</b></div>` : ""}
      <div>${q.explain}</div>
      <button id="nextBtn">${won ? "🏆 승리! ▶" : lost ? "😵 ..." : "다음 문제 ▶"}</button>`;
    $("nextBtn").addEventListener("click", () => (won ? winBattle() : lost ? loseBattle() : nextQuestion()));
    setTimeout(() => $("nextBtn") && $("nextBtn").scrollIntoView({ block: "nearest", behavior: "smooth" }), 50);
  }

  function endBattle() {
    battle = null;
    $("battle").classList.add("hidden");
    battleCooldownUntil = performance.now() + 1500;
    updateHud();
    save();
  }

  function gainXp(n) {
    P.xp += n;
    let up = false;
    while (P.xp >= xpNeed(P.lv)) {
      P.xp -= xpNeed(P.lv);
      P.lv++;
      P.maxHp += 10;
      P.hp = P.maxHp;
      up = true;
    }
    return up;
  }

  function winBattle() {
    const m = battle.m;
    m.alive = false;
    m.respawnAt = performance.now() + 40000;
    P.coins += m.coins;
    const up = gainXp(m.xp);
    endBattle();

    const pages = [`${m.name}을(를) 물리쳤어요! 🎉<br>✨ 경험치 +${m.xp} · 🪙 코인 +${m.coins}`];
    if (up) pages.push(`⬆️ <b>레벨 업!</b> Lv.${P.lv}이 되었어요. 최대 체력이 ${P.maxHp}로 늘고 모두 회복됐어요!`);
    if (m.type === "guardian") {
      P.pieces[m.zone] = true;
      pages.push(`🟧 <b>큐브 조각</b>을 되찾았어요! (${pieceCount()} / 4)`);
      if (pieceCount() === 4 && !gateOpen()) {
        openGate();
        pages.push("쿠구구궁… 🏰 북쪽 성문이 열리는 소리가 들려요! 마을 위쪽으로 가 보세요.");
      }
    }
    updateHud(); save();

    if (m.type === "boss") {
      P.bossDefeated = true;
      save();
      say("🎉 승리", pages, showEnding);
    } else say("🎉 승리", pages);
  }

  function loseBattle() {
    endBattle();
    const lost = Math.floor(P.coins * 0.2);
    P.coins -= lost;
    P.hp = P.maxHp;
    P.x = REVIVE.x; P.y = REVIVE.y;
    mover.moving = false;
    updateHud(); save();
    onStepDone();
    say("😵 기절", [`눈을 떠 보니 마을 분수 앞이에요…`, `코인 ${lost}개를 잃어버렸어요. 🦉 부엉이 박사에게 공부하고 다시 도전해 봐요!`]);
  }

  $("potionBtn").addEventListener("click", () => {
    if (!battle || P.potions <= 0) return;
    P.potions--;
    const before = P.hp;
    P.hp = Math.min(P.maxHp, P.hp + 50);
    floatText("bPlayer", `+${P.hp - before}`, "good");
    updateBattleBars();
    setItemsEnabled(!battle.answered);
    save();
  });

  $("hintBtn").addEventListener("click", () => {
    if (!battle || battle.answered || P.hints <= 0) return;
    const wrong = [...$("qAnswer").querySelectorAll(".choice")].filter((b) => b.dataset.v !== battle.q.answer);
    wrong.sort(() => Math.random() - 0.5).slice(0, 2).forEach((b) => { b.classList.add("removed"); b.disabled = true; });
    P.hints--;
    battle.hintUsed = true;
    updateBattleBars();
    setItemsEnabled(true);
    save();
  });

  $("fleeBtn").addEventListener("click", () => {
    if (!battle) return;
    const name = battle.m.name;
    endBattle();
    say("🏃 도망", `${name}에게서 무사히 도망쳤어요!`);
  });

  // =====================================================
  //  엔딩
  // =====================================================
  function showEnding() {
    const rate = P.total ? Math.round((P.correct / P.total) * 100) : 0;
    $("endingText").innerHTML = `${escapeHtml(P.name)} 용사님, 큐브 드래곤을 물리쳤어요!<br>Lv.${P.lv} · 맞힌 문제 ${P.correct} / ${P.total} (${rate}%)`;
    $("ending").classList.remove("hidden");
    playing = false;
  }
  $("keepBtn").addEventListener("click", () => { $("ending").classList.add("hidden"); playing = true; });
  $("restartBtn").addEventListener("click", () => {
    if (!confirm("처음부터 다시 시작할까요? 지금 기록은 지워져요.")) return;
    $("ending").classList.add("hidden");
    startNew(P.name, P.char);
  });

  // =====================================================
  //  시작
  // =====================================================
  function begin(player) {
    P = player;
    map = buildMap();
    spawnMonsters();
    PIECE_ZONES.forEach((z) => { if (P.pieces[z]) monsters.find((m) => m.zone === z && m.type === "guardian").alive = false; });
    if (P.bossDefeated) monsters.find((m) => m.type === "boss").alive = false;
    if (pieceCount() === 4) openGate();
    lastZone = null;
    mover.moving = false;
    $("title").classList.add("hidden");
    playing = true;
    updateHud();
    onStepDone();
    save();
  }
  function startNew(name, char) {
    begin(newPlayer(name, char));
    introTalk();
  }

  // ----- 캐릭터 고르기 -----
  let selectedChar = "m1";
  let gender = "male";
  function renderCharGrid() {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.g === gender));
    const grid = $("charGrid");
    grid.innerHTML = "";
    CHARACTERS[gender].forEach((c) => {
      const card = document.createElement("button");
      card.className = "char-card" + (c.id === selectedChar ? " selected" : "");
      const cv = document.createElement("canvas");
      cv.width = 72; cv.height = 84;
      drawCharacter(cv.getContext("2d"), 36, 80, 72, c);
      const label = document.createElement("span");
      label.textContent = c.name;
      card.appendChild(cv);
      card.appendChild(label);
      card.addEventListener("click", () => { selectedChar = c.id; renderCharGrid(); });
      grid.appendChild(card);
    });
  }
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    gender = t.dataset.g;
    if (!CHARACTERS[gender].some((c) => c.id === selectedChar)) selectedChar = CHARACTERS[gender][0].id;
    renderCharGrid();
  }));

  const saved = loadSave();
  if (saved && saved.char) {
    selectedChar = charById(saved.char).id;
    gender = selectedChar.startsWith("f") ? "female" : "male";
  }
  renderCharGrid();
  if (saved) {
    $("continueBtn").classList.remove("hidden");
    $("continueBtn").textContent = `▶ 이어하기 (${saved.name} Lv.${saved.lv})`;
    $("nameInput").value = saved.name;
  }
  $("newBtn").addEventListener("click", () => {
    const name = $("nameInput").value.trim() || "용사";
    if (saved && !confirm("새로 시작하면 이어하기 기록이 지워져요. 괜찮나요?")) return;
    startNew(name, selectedChar);
  });
  $("continueBtn").addEventListener("click", () => {
    const p = { ...newPlayer(saved.name), ...saved, char: selectedChar };
    if (!WALKABLE.has(buildMap()[p.y]?.[p.x] ?? "")) { p.x = START.x; p.y = START.y; }
    begin(p);
    say("촌장 할아버지", `다시 왔구나, ${escapeHtml(p.name)}! 큐브 조각 ${pieceCount()} / 4개를 모았단다.`);
  });
  $("nameInput").addEventListener("keydown", (e) => { if (e.key === "Enter") $("newBtn").click(); });

  // =====================================================
  //  게임 루프
  // =====================================================
  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;

    if (P) {
      if (mover.moving) {
        mover.t += dt / STEP_MS;
        if (mover.t >= 1) { mover.moving = false; onStepDone(); }
      }
      if (!mover.moving && !busy() && held.size) {
        const dir = [...held].pop();
        tryMove(...DIRV[dir]);
      }
      aiTimer += dt;
      if (aiTimer > 900) { aiTimer = 0; if (!busy()) monsterTick(now); }
      render(now);
    } else {
      ctx.fillStyle = "#1e1b2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
