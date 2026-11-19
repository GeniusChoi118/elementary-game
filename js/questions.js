// =====================================================
//  문제 만들기 - 5학년 2학기 5단원 직육면체
//  Q.make("concept" | "sketch" | "net" | "edge" | "all")
// =====================================================
const Q = (() => {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- 1. 개념 ----------
  const CONCEPT_POOL = [
    { kind: "choice", q: "직육면체의 면은 모두 몇 개일까요?", a: "6개", c: ["4개", "6개", "8개", "12개"],
      ex: "직육면체는 직사각형 6개로 둘러싸인 도형이에요." },
    { kind: "choice", q: "직육면체의 모서리는 모두 몇 개일까요?", a: "12개", c: ["6개", "8개", "10개", "12개"],
      ex: "면과 면이 만나는 선분이 모서리예요. 위 4개 + 아래 4개 + 옆 4개 = 12개!" },
    { kind: "choice", q: "정육면체의 꼭짓점은 모두 몇 개일까요?", a: "8개", c: ["4개", "6개", "8개", "12개"],
      ex: "모서리와 모서리가 만나는 점이 꼭짓점이에요. 위 4개 + 아래 4개 = 8개!" },
    { kind: "choice", q: "정육면체는 어떤 도형 6개로 둘러싸여 있을까요?", a: "정사각형", c: ["정사각형", "삼각형", "원", "오각형"],
      ex: "정사각형 6개로 둘러싸인 도형을 정육면체라고 해요." },
    { kind: "choice", q: "직육면체는 어떤 도형 6개로 둘러싸여 있을까요?", a: "직사각형", c: ["직사각형", "삼각형", "원", "오각형"],
      ex: "직사각형 6개로 둘러싸인 도형을 직육면체라고 해요." },
    { kind: "choice", q: "직육면체에서 서로 평행한 면은 모두 몇 쌍일까요?", a: "3쌍", c: ["2쌍", "3쌍", "4쌍", "6쌍"],
      ex: "앞-뒤, 왼쪽-오른쪽, 위-아래. 모두 3쌍이에요." },
    { kind: "choice", q: "직육면체에서 한 면과 수직인 면은 몇 개일까요?", a: "4개", c: ["2개", "3개", "4개", "5개"],
      ex: "6개의 면 중 자기 자신과 평행한 면 1개를 빼면 4개가 수직이에요." },
    { kind: "choice", q: "직육면체의 한 꼭짓점에서 만나는 모서리는 몇 개일까요?", a: "3개", c: ["2개", "3개", "4개", "6개"],
      ex: "한 꼭짓점에서 모서리 3개, 면 3개가 만나요." },
    { kind: "choice", q: "직육면체에서 서로 평행한 두 면을 무엇이라고 할까요?", a: "밑면", c: ["밑면", "옆면", "꼭짓점", "모서리"],
      ex: "서로 평행한 두 면을 밑면, 밑면과 수직인 면을 옆면이라고 해요." },
    { kind: "choice", q: "직육면체에서 밑면과 수직인 면을 무엇이라고 할까요?", a: "옆면", c: ["밑면", "옆면", "윗면", "전개도"],
      ex: "밑면과 수직인 면을 옆면이라고 해요. 옆면은 4개예요." },
    { kind: "ox", q: "정육면체는 직육면체라고 할 수 있어요.", a: "O",
      ex: "정사각형도 직사각형이니까, 정육면체는 직육면체예요." },
    { kind: "ox", q: "직육면체는 정육면체라고 할 수 있어요.", a: "X",
      ex: "직육면체의 면이 정사각형이 아닐 수도 있어서, 항상 정육면체라고 할 수는 없어요." },
    { kind: "ox", q: "정육면체는 모든 모서리의 길이가 같아요.", a: "O",
      ex: "정육면체는 모든 면이 똑같은 정사각형이라서 12개 모서리의 길이가 모두 같아요." },
    { kind: "ox", q: "직육면체의 한 꼭짓점에서 만나는 면은 3개예요.", a: "O",
      ex: "한 꼭짓점에서 면 3개가 만나요." },
    { kind: "ox", q: "직육면체에서 밑면은 1개예요.", a: "X",
      ex: "서로 평행한 두 면이 밑면이라서 밑면은 2개예요." },
    { kind: "ox", q: "직육면체에서 마주 보는 면은 서로 평행해요.", a: "O",
      ex: "마주 보는 면은 아무리 늘려도 만나지 않으니 서로 평행해요." },
  ];

  // ---------- 2. 겨냥도 ----------
  function sketchSVG(labels) {
    const L = labels
      ? `<text x="90" y="182" text-anchor="middle" class="lbl">${labels[0]}cm</text>
         <text x="198" y="158" text-anchor="middle" class="lbl">${labels[1]}cm</text>
         <text x="10" y="114" text-anchor="end" class="lbl">${labels[2]}cm</text>`
      : "";
    return `
    <svg viewBox="-30 0 270 190" width="270" xmlns="http://www.w3.org/2000/svg">
      <style>.lbl{font:bold 15px sans-serif;fill:#ea580c}</style>
      <polygon points="20,60 160,60 210,20 70,20" fill="#fde68a"/>
      <polygon points="160,60 210,20 210,120 160,160" fill="#fdba74"/>
      <rect x="20" y="60" width="140" height="100" fill="#fef3c7"/>
      <g stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linejoin="round">
        <rect x="20" y="60" width="140" height="100"/>
        <polyline points="20,60 70,20 210,20 160,60"/>
        <polyline points="210,20 210,120 160,160"/>
      </g>
      <g stroke="#6b7280" stroke-width="2" stroke-dasharray="6 5" fill="none">
        <line x1="70" y1="20" x2="70" y2="120"/>
        <line x1="70" y1="120" x2="210" y2="120"/>
        <line x1="70" y1="120" x2="20" y2="160"/>
      </g>
      ${L}
    </svg>`;
  }

  const SKETCH_POOL = [
    { kind: "choice", q: "겨냥도에서 보이지 않는 모서리(점선)는 몇 개일까요?", a: "3개", c: ["1개", "2개", "3개", "4개"],
      ex: "겨냥도에서는 보이지 않는 모서리 3개를 점선으로 그려요." },
    { kind: "choice", q: "겨냥도에서 보이는 모서리(실선)는 몇 개일까요?", a: "9개", c: ["6개", "8개", "9개", "12개"],
      ex: "모서리 12개 중 점선 3개를 빼면 보이는 모서리는 9개예요." },
    { kind: "choice", q: "겨냥도에서 보이지 않는 꼭짓점은 몇 개일까요?", a: "1개", c: ["1개", "2개", "3개", "4개"],
      ex: "점선 3개가 만나는 뒤쪽 아래 꼭짓점 1개가 보이지 않아요." },
    { kind: "choice", q: "겨냥도에서 보이는 꼭짓점은 몇 개일까요?", a: "7개", c: ["6개", "7개", "8개", "9개"],
      ex: "꼭짓점 8개 중 보이지 않는 1개를 빼면 7개예요." },
    { kind: "choice", q: "겨냥도에서 보이는 면은 몇 개일까요?", a: "3개", c: ["2개", "3개", "4개", "6개"],
      ex: "앞, 위, 오른쪽 면 3개가 보이고 나머지 3개는 보이지 않아요." },
    { kind: "choice", q: "겨냥도에서 보이지 않는 면은 몇 개일까요?", a: "3개", c: ["1개", "2개", "3개", "4개"],
      ex: "면 6개 중 보이는 3개를 빼면 보이지 않는 면은 3개예요." },
    { kind: "choice", q: "겨냥도에서 보이는 모서리는 어떤 선으로 그릴까요?", a: "실선", c: ["실선", "점선", "곡선", "그리지 않아요"],
      ex: "보이는 모서리는 실선, 보이지 않는 모서리는 점선으로 그려요." },
    { kind: "ox", q: "겨냥도에서 보이지 않는 모서리는 점선으로 그려요.", a: "O",
      ex: "보이는 모서리는 실선, 보이지 않는 모서리는 점선으로 그려요." },
    { kind: "ox", q: "겨냥도에서 보이지 않는 모서리는 그리지 않아요.", a: "X",
      ex: "보이지 않는 모서리도 점선으로 꼭 그려야 모양을 알 수 있어요." },
  ];

  function fromPool(item, tag, visual = "") {
    return {
      tag, visual,
      kind: item.kind,
      text: item.q,
      choices: item.kind === "choice" ? shuffle(item.c) : ["O", "X"],
      answer: item.a,
      explain: item.ex,
    };
  }

  // ---------- 3. 전개도 (정육면체를 굴려서 접기 검사) ----------
  // 면 번호: 0아래 1위 2북 3남 4동 5서 → (0,1)(2,3)(4,5)가 마주 보는 면
  function roll(s, dir) {
    const { b, t, n, so, e, w } = s;
    if (dir === "E") return { b: e, e: t, t: w, w: b, n, so };
    if (dir === "W") return { b: w, w: t, t: e, e: b, n, so };
    if (dir === "N") return { b: n, n: t, t: so, so: b, e, w };
    return { b: so, so: t, t: n, n: b, e, w };
  }
  const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
  const key = (x, y) => `${x},${y}`;

  function foldFaces(cells) {
    const set = new Set(cells.map(([x, y]) => key(x, y)));
    const faces = { [key(...cells[0])]: 0 };
    const stack = [[cells[0][0], cells[0][1], { b: 0, t: 1, n: 2, so: 3, e: 4, w: 5 }]];
    while (stack.length) {
      const [x, y, s] = stack.pop();
      for (const [d, [dx, dy]] of Object.entries(DIRS)) {
        const k = key(x + dx, y + dy);
        if (set.has(k) && !(k in faces)) {
          const ns = roll(s, d);
          faces[k] = ns.b;
          stack.push([x + dx, y + dy, ns]);
        }
      }
    }
    return faces;
  }
  const isValidNet = (cells) => new Set(Object.values(foldFaces(cells))).size === 6;
  const opposite = (f) => f ^ 1;

  function has2x2(cells) {
    const set = new Set(cells.map(([x, y]) => key(x, y)));
    return cells.some(([x, y]) =>
      set.has(key(x + 1, y)) && set.has(key(x, y + 1)) && set.has(key(x + 1, y + 1)));
  }

  function randomHexomino() {
    const cells = [[0, 0]];
    const set = new Set(["0,0"]);
    while (cells.length < 6) {
      const [x, y] = pick(cells);
      const [dx, dy] = pick(Object.values(DIRS));
      const k = key(x + dx, y + dy);
      if (!set.has(k)) { set.add(k); cells.push([x + dx, y + dy]); }
    }
    const minX = Math.min(...cells.map((c) => c[0]));
    const minY = Math.min(...cells.map((c) => c[1]));
    return cells.map(([x, y]) => [x - minX, y - minY]);
  }

  function makeNet(wantValid) {
    for (let i = 0; i < 2000; i++) {
      const h = randomHexomino();
      if (isValidNet(h) !== wantValid) continue;
      if (!wantValid && has2x2(h) && i < 1500) continue; // 너무 쉬운 2×2 덩어리는 피하기
      return h;
    }
    return [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]];
  }

  const PAIR_COLORS = ["#fca5a5", "#93c5fd", "#86efac"];

  function netSVG(cells, opts = {}) {
    const S = 52;
    const W = (Math.max(...cells.map((c) => c[0])) + 1) * S;
    const H = (Math.max(...cells.map((c) => c[1])) + 1) * S;
    const faces = foldFaces(cells);
    const counts = {};
    Object.values(faces).forEach((f) => (counts[f] = (counts[f] || 0) + 1));

    const rects = cells.map(([x, y]) => {
      const k = key(x, y);
      let fill = "#fef3c7", mark = "";
      if (opts.reveal) {
        if (counts[faces[k]] > 1) { fill = "#f87171"; mark = "겹침"; }
        else fill = PAIR_COLORS[faces[k] >> 1];
      }
      if (k === opts.star) mark = "★";
      let stroke = "#1f2937", sw = 2.5;
      if (opts.picked === k) { stroke = opts.picked === opts.answerKey ? "#16a34a" : "#dc2626"; sw = 5; }
      else if (opts.reveal && k === opts.answerKey) { stroke = "#16a34a"; sw = 5; }
      return `
        <rect class="net-cell" data-key="${k}" x="${x * S + 3}" y="${y * S + 3}" width="${S}" height="${S}"
          fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <text x="${x * S + 3 + S / 2}" y="${y * S + 3 + S / 2 + 7}" text-anchor="middle"
          style="font:bold ${mark === "★" ? 24 : 14}px sans-serif;fill:${mark === "★" ? "#ea580c" : "#7f1d1d"};pointer-events:none">${mark}</text>`;
    }).join("");
    return `<svg viewBox="0 0 ${W + 6} ${H + 6}" width="${W + 6}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
  }

  function netOX() {
    const valid = Math.random() < 0.5;
    const cells = makeNet(valid);
    return {
      tag: "🧩 전개도", kind: "ox",
      text: "이 그림은 정육면체의 전개도일까요?",
      visual: netSVG(cells),
      choices: ["O", "X"],
      answer: valid ? "O" : "X",
      explain: valid
        ? "맞아요! 접으면 정육면체가 돼요. 같은 색끼리 접었을 때 마주 보는 면이에요."
        : "접으면 빨간 면끼리 겹쳐서 정육면체가 될 수 없어요.",
      reveal: () => netSVG(cells, { reveal: true }) +
        (valid ? `<p class="legend">같은 색 = 접었을 때 마주 보는 면</p>` : ""),
    };
  }

  function netOpposite() {
    const cells = makeNet(true);
    const faces = foldFaces(cells);
    const star = key(...pick(cells));
    const answerKey = Object.keys(faces).find((k) => faces[k] === opposite(faces[star]));
    return {
      tag: "🧩 전개도", kind: "click",
      text: "전개도를 접었을 때 <b>★ 면과 마주 보는 면</b>을 눌러 보세요.",
      visual: netSVG(cells, { star }),
      answer: answerKey,
      explain: "같은 색끼리 접었을 때 마주 보는(평행한) 면이에요. 마주 보는 면은 바로 옆에 붙어 있지 않아요!",
      reveal: (picked) => netSVG(cells, { star, reveal: true, picked, answerKey }) +
        `<p class="legend">같은 색 = 접었을 때 마주 보는 면</p>`,
    };
  }

  // ---------- 4. 모서리 길이 ----------
  function edgeQuestion() {
    const type = rand(0, 3);
    const tag = "📏 모서리 길이";
    if (type === 0) {
      const a = rand(2, 12);
      return { tag, kind: "input", unit: "cm",
        text: `한 모서리의 길이가 <b>${a}cm</b>인 정육면체가 있어요.<br>모든 모서리 길이의 합은 몇 cm일까요?`,
        answer: String(a * 12),
        explain: `정육면체는 길이가 같은 모서리가 12개예요. ${a} × 12 = ${a * 12}(cm)` };
    }
    if (type === 1) {
      const a = rand(2, 10);
      return { tag, kind: "input", unit: "cm",
        text: `정육면체의 모든 모서리 길이의 합이 <b>${a * 12}cm</b>예요.<br>한 모서리의 길이는 몇 cm일까요?`,
        answer: String(a),
        explain: `모서리가 12개이니까 ${a * 12} ÷ 12 = ${a}(cm)` };
    }
    if (type === 2) {
      const [w, h, d] = [rand(2, 12), rand(2, 12), rand(2, 12)];
      const sum = 4 * (w + h + d);
      return { tag, kind: "input", unit: "cm",
        text: "이 직육면체의 모든 모서리 길이의 합은 몇 cm일까요?",
        visual: sketchSVG([w, d, h]),
        answer: String(sum),
        explain: `길이가 같은 모서리가 4개씩 3쌍 있어요. (${w} + ${d} + ${h}) × 4 = ${sum}(cm)` };
    }
    const isCube = Math.random() < 0.5;
    const a = rand(3, 9);
    const dims = isCube ? [a, a, a] : shuffle([a, a, a + rand(1, 4)]);
    return { tag, kind: "choice",
      text: `가로 <b>${dims[0]}cm</b>, 세로 <b>${dims[1]}cm</b>, 높이 <b>${dims[2]}cm</b>인 상자는 무엇일까요?`,
      choices: ["정육면체", "정육면체가 아닌 직육면체"],
      answer: isCube ? "정육면체" : "정육면체가 아닌 직육면체",
      explain: isCube
        ? "가로, 세로, 높이가 모두 같으면 모든 면이 정사각형이니까 정육면체예요."
        : "길이가 다른 모서리가 있으면 정사각형이 아닌 면이 생겨서 정육면체가 아니에요." };
  }

  // ---------- 같은 문제가 연달아 나오지 않게 카드 뭉치처럼 뽑기 ----------
  function makeDeck(pool) {
    let deck = [];
    return () => { if (!deck.length) deck = shuffle(pool); return deck.pop(); };
  }
  const conceptDeck = makeDeck(CONCEPT_POOL);
  const sketchDeck = makeDeck(SKETCH_POOL);

  const gens = {
    concept: () => fromPool(conceptDeck(), "📐 개념"),
    sketch: () => fromPool(sketchDeck(), "📐 겨냥도", sketchSVG()),
    net: () => (Math.random() < 0.5 ? netOX() : netOpposite()),
    edge: edgeQuestion,
  };
  gens.all = () => gens[pick(["concept", "sketch", "net", "edge"])]();

  return { make: (topic) => (gens[topic] || gens.all)() };
})();
