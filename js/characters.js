// =====================================================
//  캐릭터 - 남자 4명, 여자 4명 (캔버스에 직접 그려요)
// =====================================================
const CHARACTERS = {
  male: [
    { id: "m1", name: "용사", hair: "spiky", hairColor: "#6b3e1e", shirt: "#2563eb", pants: "#1e3a8a", acc: "headband", accColor: "#dc2626", item: "sword" },
    { id: "m2", name: "마법사", hair: "short", hairColor: "#cbd5e1", shirt: "#7c3aed", pants: "#4c1d95", dress: true, acc: "wizardHat", accColor: "#5b21b6", item: "wand" },
    { id: "m3", name: "탐험가", hair: "short", hairColor: "#1f2937", shirt: "#16a34a", pants: "#92400e", acc: "cap", accColor: "#ef4444" },
    { id: "m4", name: "닌자", hair: "none", shirt: "#334155", pants: "#1e293b", acc: "hood", accColor: "#1f2937", item: "sword" },
  ],
  female: [
    { id: "f1", name: "기사", hair: "long", hairColor: "#facc15", shirt: "#dc2626", pants: "#7f1d1d", acc: "headband", accColor: "#f8fafc", item: "sword" },
    { id: "f2", name: "마법사", hair: "long", hairColor: "#ec4899", shirt: "#a855f7", pants: "#6b21a8", dress: true, acc: "wizardHat", accColor: "#db2777", item: "wand" },
    { id: "f3", name: "탐험가", hair: "ponytail", hairColor: "#92400e", shirt: "#f97316", pants: "#1e3a8a", acc: "bow", accColor: "#ef4444" },
    { id: "f4", name: "공주", hair: "pigtails", hairColor: "#111827", shirt: "#38bdf8", pants: "#0369a1", dress: true, acc: "crown", accColor: "#facc15" },
  ],
};
const CHAR_LIST = [...CHARACTERS.male, ...CHARACTERS.female];
const charById = (id) => CHAR_LIST.find((c) => c.id === id) || CHAR_LIST[0];

// (x, y) = 발 가운데, size = 키(px). opts: { flip: 왼쪽 보기, walk: 0~1 걷는 동작 }
function drawCharacter(ctx, x, y, size, c, opts = {}) {
  const u = size / 50;
  const skin = c.skin || "#ffd7b5";
  const step = opts.walk ? Math.sin(opts.walk * Math.PI * 2) * 2.5 : 0;

  ctx.save();
  ctx.translate(x, y);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.scale(u, u);

  const circle = (cx, cy, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
  const rr = (rx, ry, w, h, r, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rx, ry, w, h, r); else ctx.rect(rx, ry, w, h);
    ctx.fill();
  };
  const poly = (pts, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  };
  const line = (x1, y1, x2, y2, w, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  const hairCap = () => { ctx.fillStyle = c.hairColor; ctx.beginPath(); ctx.arc(0, -32, 10.6, Math.PI, 0); ctx.fill(); };

  // ----- 뒷머리 -----
  if (c.hair === "long") rr(-11, -34, 22, 22, 6, c.hairColor);
  if (c.hair === "ponytail") { circle(-11, -30, 5, c.hairColor); rr(-15, -30, 6, 14, 3, c.hairColor); }

  // ----- 다리 -----
  const liftL = Math.max(0, step), liftR = Math.max(0, -step);
  rr(-6, -11, 5, 10 - liftL, 2, c.pants);
  rr(1, -11, 5, 10 - liftR, 2, c.pants);
  rr(-7, -3 - liftL, 7, 3, 1.5, "#3f2a1d");
  rr(0, -3 - liftR, 7, 3, 1.5, "#3f2a1d");

  // ----- 몸 -----
  if (c.dress) {
    poly([[-7, -22], [7, -22], [11, -6], [-11, -6]], c.shirt);
    rr(-11, -8, 22, 2, 1, "rgba(255,255,255,0.35)");
  } else {
    rr(-8, -22, 16, 13, 4, c.shirt);
    rr(-8, -13, 16, 2, 0, "rgba(0,0,0,0.25)");
  }

  // ----- 팔 -----
  rr(-11, -21, 4, 10, 2, c.shirt);
  rr(7, -21, 4, 10, 2, c.shirt);
  circle(-9, -10.5, 2.3, skin);

  // ----- 들고 있는 것 -----
  if (c.item === "sword") {
    line(10.5, -13, 16, -28, 2.4, "#e5e7eb");
    line(7.5, -14, 12.5, -11.5, 2, "#facc15");
    line(9, -9.5, 10.3, -12.5, 3, "#92400e");
  } else if (c.item === "wand") {
    line(9, -10, 14, -25, 2, "#92400e");
    const sx = 14.5, sy = -27.5;
    const star = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 1.6 : 4;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      star.push([sx + Math.cos(a) * r, sy + Math.sin(a) * r]);
    }
    poly(star, "#facc15");
  }
  circle(9, -10.5, 2.3, skin);

  // ----- 머리 -----
  circle(0, -31, 10, skin);

  if (c.acc === "hood") {
    circle(0, -31, 10.6, c.accColor);
    rr(-8, -34, 16, 6, 3, skin);
    rr(-13, -36, 4, 2.5, 1, c.accColor);
  } else {
    if (c.hair === "short" || c.hair === "ponytail") hairCap();
    if (c.hair === "spiky") {
      hairCap();
      for (let i = -2; i <= 2; i++) poly([[i * 4 - 3, -39], [i * 4 + 3, -39], [i * 4 + 1, -46]], c.hairColor);
    }
    if (c.hair === "long") { hairCap(); rr(-11, -33, 4, 15, 2, c.hairColor); rr(7, -33, 4, 15, 2, c.hairColor); }
    if (c.hair === "pigtails") { hairCap(); circle(-12.5, -28, 5, c.hairColor); circle(12.5, -28, 5, c.hairColor); }
  }

  // ----- 얼굴 -----
  circle(-3.5, -30, 1.6, "#1f2937");
  circle(3.5, -30, 1.6, "#1f2937");
  circle(-3, -30.6, 0.5, "#ffffff");
  circle(4, -30.6, 0.5, "#ffffff");
  if (c.acc !== "hood") {
    circle(-6.3, -26.8, 1.7, "rgba(244,114,182,0.5)");
    circle(6.3, -26.8, 1.7, "rgba(244,114,182,0.5)");
    ctx.strokeStyle = "#9a3412"; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(0, -27.5, 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }

  // ----- 장식 -----
  switch (c.acc) {
    case "headband":
      rr(-10.6, -37, 21.2, 3, 1.5, c.accColor);
      rr(-15, -37, 5, 2, 1, c.accColor);
      rr(-14, -35, 4, 2, 1, c.accColor);
      break;
    case "wizardHat":
      ctx.fillStyle = c.accColor;
      ctx.beginPath(); ctx.ellipse(0, -38, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
      poly([[-9, -38], [9, -38], [4, -56]], c.accColor);
      circle(1.5, -45, 1.6, "#facc15");
      break;
    case "cap":
      ctx.fillStyle = c.accColor;
      ctx.beginPath(); ctx.arc(0, -35, 10.6, Math.PI, 0); ctx.fill();
      rr(4, -36.5, 11, 3, 1.5, c.accColor);
      circle(0, -45.4, 1.5, "#ffffff");
      break;
    case "crown":
      poly([[-7, -40], [-7, -47], [-3.5, -43.5], [0, -49], [3.5, -43.5], [7, -47], [7, -40]], c.accColor);
      circle(0, -42.5, 1.3, "#ef4444");
      break;
    case "bow":
      poly([[-6, -42], [-13, -46], [-13, -38]], c.accColor);
      poly([[-6, -42], [1, -46], [1, -38]], c.accColor);
      circle(-6, -42, 2, "#b91c1c");
      break;
  }

  ctx.restore();
}
