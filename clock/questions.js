// =====================================================
//  문제 만들기 - 2학년 2학기 4단원 시각과 시간
//  주제: read5(몇 시 몇 분, 5분) · read1(1분, 몇 분 전) · duration(걸린 시간) · calendar(하루·달력)
// =====================================================
const Q = (() => {
  let R = Math.random;
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = (min, max) => Math.floor(R() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(R() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // 정답 + 오답 후보에서 서로 다른 보기 4개 만들기
  function choicesOf(answer, wrongs, n = 4) {
    const set = [answer];
    for (const w of shuffle(wrongs)) if (!set.includes(w) && set.length < n) set.push(w);
    return shuffle(set);
  }
  // 숫자 뒤 조사: 받침 있는 숫자(0,1,3,6,7,8 / 10 '십')면 을·과, 없으면 를·와
  const hasB = (n) => [0, 1, 3, 6, 7, 8].includes(Number(n) % 10);
  const eul = (n) => (hasB(n) ? "을" : "를");
  const gwa = (n) => (hasB(n) ? "과" : "와");
  const hourFix = (h) => ((h - 1 + 12) % 12) + 1;          // 0 → 12, 13 → 1
  const timeText = (h, m) => (m === 0 ? `${h}시` : `${h}시 ${m}분`);

  // ---------- 시계 그림 ----------
  function clockSVG(h, m, size = 200) {
    const cx = 100, cy = 100;
    let ticks = "";
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180;
      const big = i % 5 === 0;
      const r1 = big ? 80 : 84, r2 = 90;
      ticks += `<line x1="${cx + Math.sin(a) * r1}" y1="${cy - Math.cos(a) * r1}" x2="${cx + Math.sin(a) * r2}" y2="${cy - Math.cos(a) * r2}" stroke="#1f2937" stroke-width="${big ? 2.6 : 1.2}"/>`;
    }
    let nums = "";
    for (let n = 1; n <= 12; n++) {
      const a = (n * 30 * Math.PI) / 180;
      nums += `<text x="${cx + Math.sin(a) * 66}" y="${cy - Math.cos(a) * 66 + 7}" text-anchor="middle" style="font:bold 19px sans-serif;fill:#1f2937">${n}</text>`;
    }
    const ha = (((h % 12) + m / 60) * 30 * Math.PI) / 180;
    const ma = (m * 6 * Math.PI) / 180;
    return `
    <svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="95" fill="#fff7ed" stroke="#f97316" stroke-width="6"/>
      ${ticks}${nums}
      <line x1="100" y1="100" x2="${cx + Math.sin(ha) * 46}" y2="${cy - Math.cos(ha) * 46}" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="100" x2="${cx + Math.sin(ma) * 74}" y2="${cy - Math.cos(ma) * 74}" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="6" fill="#f97316"/>
    </svg>`;
  }
  const legend = `<p class="legend">짧은바늘(검정) = 시 · 긴바늘(파랑) = 분</p>`;

  // ---------- 시계 맞추기 (직접 바늘 돌리기) ----------
  function clockSetQuestion(topic, tag, step1) {
    const h = rand(1, 12);
    const m = step1 ? rand(1, 59) : rand(0, 11) * 5;
    const target = `${h}:${m}`;
    return {
      tag, topic, kind: "custom",
      text: `시계를 <b>${timeText(h, m)}</b>${m ? "으로" : "로"} 맞춰 보세요!`,
      visual: "",
      answer: target,
      answerText: timeText(h, m),
      explain: m === 0
        ? `짧은바늘은 ${h}, 긴바늘은 12를 가리켜요.`
        : `짧은바늘은 ${h}${gwa(h)} ${hourFix(h + 1)} 사이, 긴바늘은 ${m % 5 === 0 ? `숫자 ${m / 5}` : `숫자 ${Math.floor(m / 5) || 12}에서 작은 눈금 ${m % 5}칸 더 간 곳`}을 가리켜요.`,
      mount(box, submit) {
        let t = 12 * 60;    // 12시 0분에서 시작
        const cur = () => { const hh = Math.floor(t / 60) % 12 || 12; return [hh, t % 60]; };
        const btns = step1
          ? [["⏪ 1시간", -60], ["◀ 5분", -5], ["◀ 1분", -1], ["1분 ▶", 1], ["5분 ▶", 5], ["1시간 ⏩", 60]]
          : [["⏪ 1시간", -60], ["◀ 5분", -5], ["5분 ▶", 5], ["1시간 ⏩", 60]];
        box.innerHTML = `
          <div class="clock-set">
            <div id="setFace"></div>
            <div class="set-btns" style="grid-template-columns:repeat(${btns.length / 2 > 2 ? 3 : 4},auto)">
              ${btns.map(([l, d]) => `<button type="button" data-d="${d}">${l}</button>`).join("")}
            </div>
            <button type="button" id="setOk">✅ 다 맞췄어요!</button>
          </div>`;
        const draw = () => { box.querySelector("#setFace").innerHTML = clockSVG(...cur()); };
        box.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => {
          t = (t + Number(b.dataset.d) + 720) % 720;
          draw();
        }));
        box.querySelector("#setOk").addEventListener("click", () => { const [hh, mm] = cur(); submit(`${hh}:${mm}`); });
        draw();
      },
      reveal: () => `<div class="clock-pair"><figure>${clockSVG(h, m, 150)}<figcaption>정답 시계</figcaption></figure></div>`,
    };
  }

  // ---------- 1. 몇 시 몇 분 (5분 단위) ----------
  function read5() {
    const tag = "🕐 몇 시 몇 분", topic = "read5";
    const type = rand(0, 5);
    if (type <= 1) {
      const h = rand(1, 12), m = rand(1, 11) * 5;
      const ans = timeText(h, m);
      const wrongs = [
        timeText(hourFix(h + 1), m),               // 다음 시로 읽기
        timeText(h, m / 5),                         // 긴바늘 숫자를 그대로 '분'으로 읽기
        timeText(m / 5 || 12, h * 5 === 60 ? 0 : h * 5), // 바늘 바꿔 읽기
        timeText(h, (m + 5) % 60),
        timeText(h, (m + 55) % 60),
      ].filter((w) => w !== ans);
      return { tag, topic, kind: "choice",
        text: "시계가 나타내는 시각은 몇 시 몇 분일까요?",
        visual: clockSVG(h, m) + legend,
        choices: choicesOf(ans, wrongs),
        answer: ans,
        explain: `짧은바늘이 ${h}${gwa(h)} ${hourFix(h + 1)} 사이 → <b>${h}시</b>, 긴바늘이 ${m / 5}${eul(m / 5)} 가리켜요 → ${m / 5} × 5 = <b>${m}분</b>` };
    }
    if (type === 2) {
      const n = rand(1, 11);
      return { tag, topic, kind: "input", unit: "분",
        text: `긴바늘이 숫자 <b>${n}</b>${eul(n)} 가리키면 몇 분일까요?`,
        visual: clockSVG(12, n * 5) + legend,
        answer: String(n * 5),
        explain: `긴바늘이 숫자 1을 가리키면 5분, 2는 10분… 숫자 × 5 = 분! ${n} × 5 = <b>${n * 5}분</b>` };
    }
    if (type === 3) {
      const h = rand(1, 12);
      return { tag, topic, kind: "choice",
        text: "시계가 나타내는 시각은?",
        visual: clockSVG(h, 0) + legend,
        choices: choicesOf(`${h}시`, [`${hourFix(h + 1)}시`, `${hourFix(h - 1)}시`, `${h}시 30분`, `12시`]),
        answer: `${h}시`,
        explain: `긴바늘이 12를 가리키면 '몇 시 정각'이에요. 짧은바늘이 ${h}${eul(h)} 가리키니까 <b>${h}시</b>!` };
    }
    if (type === 4) return clockSetQuestion(topic, tag, false);
    const ox = pick([
      { q: "짧은바늘은 '시'를, 긴바늘은 '분'을 나타내요.", a: "O", ex: "짧은바늘 = 시, 긴바늘 = 분이에요." },
      { q: "긴바늘이 숫자 6을 가리키면 6분이에요.", a: "X", ex: "숫자 × 5 = 분! 6 × 5 = 30분이에요." },
      { q: "긴바늘이 12를 가리키면 '몇 시 정각'이에요.", a: "O", ex: "긴바늘이 12에 있으면 0분, 즉 정각이에요." },
      { q: "긴바늘이 숫자 3을 가리키면 15분이에요.", a: "O", ex: "3 × 5 = 15분이에요." },
    ]);
    return { tag, topic, kind: "ox", text: ox.q, choices: ["O", "X"], answer: ox.a, explain: ox.ex };
  }

  // ---------- 2. 몇 시 몇 분 (1분 단위), 몇 분 전 ----------
  function read1() {
    const tag = "⏱️ 1분 단위", topic = "read1";
    const type = rand(0, 5);
    if (type <= 1) {
      const h = rand(1, 12);
      let m = rand(1, 58);
      if (m % 5 === 0) m += rand(1, 4);
      const ans = timeText(h, m);
      const wrongs = [timeText(h, (m + 1) % 60), timeText(h, m - 1), timeText(h, m + 5 > 59 ? m - 5 : m + 5), timeText(hourFix(h + 1), m), timeText(h, Math.floor(m / 5))].filter((w) => w !== ans);
      const base = Math.floor(m / 5);
      return { tag, topic, kind: "choice",
        text: "시계가 나타내는 시각은 몇 시 몇 분일까요?",
        visual: clockSVG(h, m) + legend,
        choices: choicesOf(ans, wrongs),
        answer: ans,
        explain: `긴바늘이 숫자 ${base || 12}(${base * 5}분)에서 작은 눈금 ${m - base * 5}칸 더 갔어요 → ${base * 5} + ${m - base * 5} = <b>${m}분</b>. 그래서 <b>${ans}</b>!` };
    }
    if (type === 2) {
      const h = rand(1, 12), before = pick([5, 10, 15]);
      const m = 60 - before;
      return { tag, topic, kind: "input", unit: "분 전",
        text: `<b>${h}시 ${m}분</b>은 ${hourFix(h + 1)}시 몇 분 전일까요?`,
        visual: clockSVG(h, m),
        answer: String(before),
        explain: `${h}시 ${m}분에서 ${before}분이 더 지나면 ${hourFix(h + 1)}시가 돼요. 그래서 <b>${hourFix(h + 1)}시 ${before}분 전</b>!` };
    }
    if (type === 3) {
      const h = rand(1, 12), before = pick([5, 10, 15]);
      const ans = timeText(hourFix(h - 1), 60 - before);
      return { tag, topic, kind: "choice",
        text: `<b>${h}시 ${before}분 전</b>은 몇 시 몇 분일까요?`,
        choices: choicesOf(ans, [timeText(h, before), timeText(h, 60 - before), timeText(hourFix(h - 1), before), timeText(hourFix(h + 1), 60 - before)]),
        answer: ans,
        explain: `${h}시가 되기 ${before}분 전이니까 ${h}시에서 ${before}분을 거꾸로 가요 → <b>${ans}</b>` };
    }
    if (type === 4) return clockSetQuestion(topic, tag, true);
    const it = pick([
      { kind: "choice", q: "시계에서 작은 눈금 한 칸은 몇 분일까요?", a: "1분", c: ["1분", "5분", "10분", "60분"], ex: "큰 눈금 사이에 작은 눈금이 5칸! 작은 눈금 한 칸은 1분이에요." },
      { kind: "choice", q: "긴바늘이 시계를 한 바퀴 도는 동안 작은 눈금을 몇 칸 지나갈까요?", a: "60칸", c: ["12칸", "30칸", "60칸", "100칸"], ex: "작은 눈금은 모두 60칸이에요. 그래서 한 바퀴 = 60분!" },
      { kind: "ox", q: "2시 55분은 3시 5분 전이에요.", a: "O", ex: "2시 55분에서 5분 더 지나면 3시! 그래서 3시 5분 전이에요." },
      { kind: "ox", q: "8시 50분은 8시 10분 전이에요.", a: "X", ex: "8시 50분은 9시가 되기 10분 전 → 9시 10분 전이에요." },
    ]);
    return { tag, topic, kind: it.kind, text: it.q, choices: it.kind === "ox" ? ["O", "X"] : shuffle(it.c), answer: it.a, explain: it.ex };
  }

  // ---------- 3. 시간 (1시간 = 60분, 걸린 시간) ----------
  function duration() {
    const tag = "⌛ 걸린 시간", topic = "duration";
    const type = rand(0, 5);
    if (type === 0) {
      const n = rand(1, 10) * 5;
      return { tag, topic, kind: "input", unit: "분",
        text: `<b>1시간 ${n}분</b>은 몇 분일까요?`,
        answer: String(60 + n),
        explain: `1시간 = 60분이에요. 60분 + ${n}분 = <b>${60 + n}분</b>` };
    }
    if (type === 1) {
      const n = rand(1, 10) * 5;
      const ans = `1시간 ${n}분`;
      return { tag, topic, kind: "choice",
        text: `<b>${60 + n}분</b>은 몇 시간 몇 분일까요?`,
        choices: choicesOf(ans, [`${60 + n}시간`, `6시간 ${n}분`, `1시간 ${n + 10}분`, `2시간 ${n}분`, `1시간 ${60 + n}분`]),
        answer: ans,
        explain: `${60 + n}분 = 60분 + ${n}분 = <b>1시간 ${n}분</b>` };
    }
    if (type <= 3) {
      const h = rand(1, 9), m = pick([0, 30]);
      const dur = pick([30, 60, 90, 120]);
      const end = h * 60 + m + dur;
      const eh = hourFix(Math.floor(end / 60)), em = end % 60;
      const label = (d) => (d < 60 ? `${d}분` : d % 60 ? `${Math.floor(d / 60)}시간 ${d % 60}분` : `${d / 60}시간`);
      const ans = label(dur);
      return { tag, topic, kind: "choice",
        text: `${timeText(h, m)}에 놀이를 시작해서 ${timeText(eh, em)}에 끝났어요. 걸린 시간은?`,
        visual: `<div class="clock-pair"><figure>${clockSVG(h, m, 140)}<figcaption>시작</figcaption></figure><figure>${clockSVG(eh, em, 140)}<figcaption>끝</figcaption></figure></div>`,
        choices: choicesOf(ans, [30, 60, 90, 120, 150].filter((d) => d !== dur).map(label)),
        answer: ans,
        explain: `${timeText(h, m)}부터 ${timeText(eh, em)}까지 긴바늘이 ${dur / 60}바퀴 돌았어요 (한 바퀴 = 60분) → <b>${ans}</b>` };
    }
    if (type === 4) {
      const h = rand(1, 10);
      const ans = timeText(hourFix(h + 1), 0);
      return { tag, topic, kind: "choice",
        text: `지금은 <b>${h}시</b>예요. 1시간 뒤는 몇 시일까요?`,
        visual: clockSVG(h, 0, 160),
        choices: choicesOf(ans, [`${h}시 1분`, `${h}시 10분`, `${hourFix(h + 2)}시`, `${hourFix(h - 1)}시`]),
        answer: ans,
        explain: `1시간 = 긴바늘이 한 바퀴! ${h}시에서 한 바퀴 돌면 <b>${ans}</b>이에요.` };
    }
    const it = pick([
      { kind: "choice", q: "1시간은 몇 분일까요?", a: "60분", c: ["10분", "12분", "60분", "100분"], ex: "긴바늘이 한 바퀴 도는 데 60분! 1시간 = 60분이에요." },
      { kind: "choice", q: "긴바늘이 시계를 한 바퀴 도는 데 걸리는 시간은?", a: "1시간", c: ["1분", "10분", "1시간", "하루"], ex: "긴바늘이 한 바퀴 = 60분 = 1시간이에요." },
      { kind: "ox", q: "1시간 30분은 90분이에요.", a: "O", ex: "60분 + 30분 = 90분이에요." },
      { kind: "ox", q: "100분은 1시간이에요.", a: "X", ex: "1시간은 60분! 100분은 1시간 40분이에요." },
    ]);
    return { tag, topic, kind: it.kind, text: it.q, choices: it.kind === "ox" ? ["O", "X"] : shuffle(it.c), answer: it.a, explain: it.ex };
  }

  // ---------- 4. 하루의 시간과 달력 ----------
  const DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  function calendar() {
    const tag = "📅 하루와 달력", topic = "calendar";
    const type = rand(0, 6);
    if (type === 0) {
      const ev = pick([
        { t: "아침에 일어나는 7시", a: "오전" }, { t: "학교에 가는 아침 8시 30분", a: "오전" },
        { t: "저녁을 먹는 6시", a: "오후" }, { t: "잠자리에 드는 밤 9시", a: "오후" },
        { t: "점심을 먹은 뒤 1시", a: "오후" }, { t: "새벽 5시", a: "오전" },
      ]);
      return { tag, topic, kind: "choice",
        text: `<b>${ev.t}</b>는 오전일까요, 오후일까요?`,
        choices: ["오전", "오후"],
        answer: ev.a,
        explain: "밤 12시부터 낮 12시까지는 <b>오전</b>, 낮 12시부터 밤 12시까지는 <b>오후</b>예요." };
    }
    if (type === 1) {
      const a = rand(8, 11), b = rand(1, 5);
      return { tag, topic, kind: "input", unit: "시간",
        text: `<b>오전 ${a}시</b>부터 <b>오후 ${b}시</b>까지는 몇 시간일까요?`,
        answer: String(12 - a + b),
        explain: `오전 ${a}시 → 낮 12시: ${12 - a}시간, 낮 12시 → 오후 ${b}시: ${b}시간. ${12 - a} + ${b} = <b>${12 - a + b}시간</b>` };
    }
    if (type === 2) {
      const n = rand(2, 4);
      return pick([
        { tag, topic, kind: "input", unit: "일", text: `<b>${n}주일</b>은 며칠일까요?`, answer: String(n * 7), explain: `1주일 = 7일! ${n} × 7 = <b>${n * 7}일</b>` },
        { tag, topic, kind: "input", unit: "주일", text: `<b>${n * 7}일</b>은 몇 주일일까요?`, answer: String(n), explain: `7일이 1주일! ${n * 7}일 = 7일이 ${n}번 → <b>${n}주일</b>` },
      ]);
    }
    if (type === 3) {
      const d = rand(0, 6), k = rand(1, 13);
      const ans = DAYS[(d + k) % 7];
      return { tag, topic, kind: "choice",
        text: `오늘은 <b>${DAYS[d]}</b>이에요. <b>${k}일 뒤</b>는 무슨 요일일까요?`,
        choices: choicesOf(ans, DAYS.filter((x) => x !== ans)),
        answer: ans,
        explain: k === 7 ? "7일 뒤는 1주일 뒤라서 <b>같은 요일</b>이에요!" : `${DAYS[d]}부터 ${k}일을 세어 보면 <b>${ans}</b>! (7일마다 같은 요일이 돌아와요)` };
    }
    if (type === 4) {
      const big = [1, 3, 5, 7, 8, 10, 12], small = [4, 6, 9, 11];
      const want31 = R() < 0.5;
      const ansM = pick(want31 ? big : small);
      const others = shuffle(want31 ? [...small, 2] : big).slice(0, 3);
      return { tag, topic, kind: "choice",
        text: want31 ? "날수가 <b>31일</b>인 달은 어느 것일까요?" : "날수가 <b>30일</b>인 달은 어느 것일까요?",
        choices: shuffle([`${ansM}월`, ...others.map((x) => `${x}월`)]),
        answer: `${ansM}월`,
        explain: "31일: 1, 3, 5, 7, 8, 10, 12월 · 30일: 4, 6, 9, 11월 · 2월: 28일(또는 29일)" };
    }
    const it = pick([
      { kind: "input", unit: "시간", q: "하루는 몇 시간일까요?", a: "24", ex: "오전 12시간 + 오후 12시간 = <b>24시간</b>!" },
      { kind: "input", unit: "일", q: "1주일은 며칠일까요?", a: "7", ex: "월, 화, 수, 목, 금, 토, 일 → <b>7일</b>!" },
      { kind: "input", unit: "개월", q: "1년은 몇 개월일까요?", a: "12", ex: "1월부터 12월까지 → <b>12개월</b>!" },
      { kind: "choice", q: "2월은 며칠까지 있을까요?", a: "28일 또는 29일", c: ["28일 또는 29일", "30일", "31일", "32일"], ex: "2월은 보통 28일, 몇 년에 한 번 29일까지 있어요." },
      { kind: "ox", q: "오전은 밤 12시부터 낮 12시까지예요.", a: "O", ex: "밤 12시 ~ 낮 12시 = 오전, 낮 12시 ~ 밤 12시 = 오후!" },
      { kind: "ox", q: "하루는 12시간이에요.", a: "X", ex: "오전 12시간 + 오후 12시간 = 하루는 24시간이에요." },
    ]);
    return { tag, topic, kind: it.kind, unit: it.unit, text: it.q, choices: it.kind === "ox" ? ["O", "X"] : it.c ? shuffle(it.c) : undefined, answer: it.a, explain: it.ex };
  }

  const gens = { read5, read1, duration, calendar };
  gens.all = () => gens[pick(["read5", "read1", "duration", "calendar"])]();
  const make = (topic) => (gens[topic] || gens.all)();
  function makeSeeded(topic, seed) {
    const old = R;
    R = mulberry32(seed);
    try { return make(topic); } finally { R = old; }
  }
  return { make, makeSeeded, clockSVG };
})();
