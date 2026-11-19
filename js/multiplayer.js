// =====================================================
//  멀티플레이 - Firebase 실시간 데이터베이스
//  같은 반 코드로 들어온 친구들이 서로 보이고, 1:1 퀴즈 대결을 할 수 있어요.
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getDatabase, ref, set, update, remove, get, push,
  onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, runTransaction,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKW-VTmT9SOuwsVP7O6cPbAs0sTDKp0Mk",
  authDomain: "elementary-game-23723.firebaseapp.com",
  databaseURL: "https://elementary-game-23723-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "elementary-game-23723",
  storageBucket: "elementary-game-23723.firebasestorage.app",
  messagingSenderId: "1015919370038",
  appId: "1:1015919370038:web:2a3c7fbb6dfb6b77829d97",
};

const WIN_SCORE = 3;        // 먼저 3점 내면 승리
const ROUND_MS = 40000;     // 한 문제 제한 시간
const RESULT_MS = 4500;     // 정답 보여주는 시간
const INVITE_MS = 20000;    // 대결 신청 기다리는 시간

const db = getDatabase(initializeApp(firebaseConfig));

function createMP() {
  const listeners = {};
  const emit = (e, d) => (listeners[e] || []).forEach((f) => f(d));
  let roomUnsubs = [];
  let duel = null;   // 지금 진행 중인(또는 신청 중인) 대결
  let me = null;     // 내 정보 { name, char, x, y, face, lv, busy }

  const MP = {
    room: null,
    pid: null,
    players: {},       // 나를 뺀 다른 친구들
    connected: false,
    isBusy: () => false,
    on(e, f) { (listeners[e] = listeners[e] || []).push(f); },
  };
  const path = (p) => ref(db, `rooms/${MP.room}/${p}`);

  // ---------------- 입장 / 퇴장 ----------------
  MP.join = async (room, info) => {
    MP.leave();
    MP.room = room;
    MP.pid = "p" + Math.random().toString(36).slice(2, 10);
    me = { ...info, busy: false };

    const meRef = path(`players/${MP.pid}`);
    await set(meRef, me);
    await onDisconnect(meRef).remove();
    await onDisconnect(path(`invites/${MP.pid}`)).remove();

    const pRef = path("players");
    const upsert = (s) => {
      if (s.key === MP.pid) return;
      const v = s.val();
      const p = MP.players[s.key] || (MP.players[s.key] = { id: s.key, rx: v.x, ry: v.y });
      Object.assign(p, v);
      emit("players");
    };
    roomUnsubs.push(onChildAdded(pRef, upsert));
    roomUnsubs.push(onChildChanged(pRef, upsert));
    roomUnsubs.push(onChildRemoved(pRef, (s) => {
      delete MP.players[s.key];
      emit("players");
      if (duel && duel.opp === s.key) opponentLeft();
    }));
    roomUnsubs.push(onValue(path(`invites/${MP.pid}`), (s) => { if (s.val()) receiveInvite(s.val()); }));

    // 인터넷이 끊겼다가 다시 연결되면 내 정보를 다시 올려요
    let first = true;
    roomUnsubs.push(onValue(ref(db, ".info/connected"), (s) => {
      MP.connected = !!s.val();
      emit("status");
      if (MP.connected && !first && MP.room) {
        set(meRef, me);
        onDisconnect(meRef).remove();
      }
      if (MP.connected) first = false;
    }));
  };

  MP.leave = () => {
    roomUnsubs.forEach((u) => u());
    roomUnsubs = [];
    if (duel) cleanupDuel();
    if (MP.room && MP.pid) remove(path(`players/${MP.pid}`));
    MP.players = {};
    MP.room = null;
  };

  MP.move = (x, y, face) => {
    if (!MP.room) return;
    Object.assign(me, { x, y, face });
    update(path(`players/${MP.pid}`), { x, y, face });
  };
  MP.updateMe = (fields) => {
    if (!MP.room) return;
    Object.assign(me, fields);
    update(path(`players/${MP.pid}`), fields);
  };
  MP.setBusy = (b) => MP.updateMe({ busy: !!b });

  // ---------------- 대결 신청 ----------------
  MP.invite = async (targetId) => {
    const t = MP.players[targetId];
    if (!MP.room || duel || !t) return;
    const dRef = push(path("duels"));
    const did = dRef.key;
    await set(dRef, {
      a: MP.pid, b: targetId, aName: me.name, bName: t.name, aChar: me.char, bChar: t.char,
      seed: Math.floor(Math.random() * 1e9), status: "invite", round: 0,
    });
    onDisconnect(dRef).remove();
    watchDuel(did, "a");
    await set(path(`invites/${targetId}`), did);
    duel.inviteTimer = setTimeout(() => {
      if (duel && duel.id === did && duel.status === "invite") update(dRef, { status: "expired" });
    }, INVITE_MS);
    MP.setBusy(true);
  };

  async function receiveInvite(did) {
    remove(path(`invites/${MP.pid}`));
    const snap = await get(path(`duels/${did}`));
    const d = snap.val();
    if (!d || d.status !== "invite") return;
    if (duel || MP.isBusy()) { update(path(`duels/${did}`), { status: "declined" }); return; }
    watchDuel(did, "b");
  }

  MP.accept = () => { if (duel && duel.role === "b") update(path(`duels/${duel.id}`), { status: "active" }); };
  MP.decline = () => { if (duel && duel.role === "b") update(path(`duels/${duel.id}`), { status: "declined" }); };

  // ---------------- 대결 진행 ----------------
  function watchDuel(did, role) {
    duel = { id: did, role, status: null, round: -1, resolvedRound: -1, started: false, ended: false };
    duel.unsub = onValue(path(`duels/${did}`), (s) => onDuel(s.val()));
  }

  function scoresOf(d) {
    let mine = 0, opp = 0;
    Object.values(d.rounds || {}).forEach((r) => {
      if (r.winner === MP.pid) mine++;
      else if (r.winner) opp++;
    });
    return { me: mine, opp };
  }

  function onDuel(d) {
    if (!duel) return;
    if (!d) { // 대결 기록이 사라짐 (상대가 나감)
      if (duel.started && !duel.ended) finish({ winner: MP.pid, reason: "left" });
      else if (!duel.started) { const role = duel.role; cleanupDuel(); emit(role === "a" ? "inviteDeclined" : "inviteCancelled", {}); }
      return;
    }
    const role = duel.role;
    duel.status = d.status;
    duel.opp = role === "a" ? d.b : d.a;
    const oppName = role === "a" ? d.bName : d.aName;
    const oppChar = role === "a" ? d.bChar : d.aChar;
    const dRef = path(`duels/${duel.id}`);

    if (d.status === "invite") {
      if (role === "b" && !duel.asked) { duel.asked = true; emit("invite", { did: duel.id, from: d.aName }); }
      return;
    }
    if (d.status === "declined" || d.status === "expired") {
      const did = duel.id;
      cleanupDuel();
      if (role === "a") { remove(dRef); emit("inviteDeclined", { name: d.bName, reason: d.status }); }
      else emit("inviteCancelled", { did });
      return;
    }

    if (d.status === "active" || d.status === "done") {
      if (!duel.started) {
        duel.started = true;
        clearTimeout(duel.inviteTimer);
        MP.setBusy(true);
        emit("duelStart", { oppName, oppChar });
      }
    }

    if (d.status === "active") {
      if (d.round !== duel.round) {
        duel.round = d.round;
        emit("roundStart", { round: d.round, seed: d.seed + d.round * 7919, endsAt: Date.now() + ROUND_MS });
        if (role === "a") {
          clearTimeout(duel.roundTimer);
          const r = d.round;
          duel.roundTimer = setTimeout(() => update(path(`duels/${duel.id}/rounds/${r}`), { timeout: true }), ROUND_MS);
        }
      }
      const rd = (d.rounds || {})[d.round] || {};
      const bothWrong = rd.wrong && rd.wrong[d.a] && rd.wrong[d.b];
      if ((rd.winner || rd.timeout || bothWrong) && duel.resolvedRound !== d.round) {
        duel.resolvedRound = d.round;
        clearTimeout(duel.roundTimer);
        const sc = scoresOf(d);
        duel.lastScores = sc;
        emit("roundResult", { round: d.round, winner: rd.winner || null, iWon: rd.winner === MP.pid, me: sc.me, opp: sc.opp, timeout: !rd.winner && !!rd.timeout && !bothWrong });
        if (role === "a") {
          duel.nextTimer = setTimeout(() => {
            if (sc.me >= WIN_SCORE || sc.opp >= WIN_SCORE) update(dRef, { status: "done", winner: sc.me >= WIN_SCORE ? MP.pid : duel.opp });
            else update(dRef, { round: d.round + 1 });
          }, RESULT_MS);
        }
      }
    }

    if (d.status === "done") {
      finish({ winner: d.winner, reason: d.forfeit ? "forfeit" : "score", forfeiter: d.forfeit || null });
      if (role === "a") setTimeout(() => remove(dRef), 3000);
    }
  }

  function finish(info) {
    if (!duel || duel.ended) return;
    duel.ended = true;
    const sc = duel.lastScores;
    cleanupDuel();
    emit("duelEnd", { ...info, iWon: info.winner === MP.pid, iForfeited: info.forfeiter === MP.pid, scores: sc });
  }

  function opponentLeft() {
    if (!duel) return;
    if (duel.started) {
      if (duel.role === "a") update(path(`duels/${duel.id}`), { status: "done", winner: MP.pid, forfeit: duel.opp });
      finish({ winner: MP.pid, reason: "left" });
    } else {
      const role = duel.role, did = duel.id;
      if (role === "a") remove(path(`duels/${did}`));
      cleanupDuel();
      emit(role === "a" ? "inviteDeclined" : "inviteCancelled", { did, reason: "left" });
    }
  }

  function cleanupDuel() {
    if (!duel) return;
    duel.unsub && duel.unsub();
    clearTimeout(duel.inviteTimer);
    clearTimeout(duel.roundTimer);
    clearTimeout(duel.nextTimer);
    if (duel.role === "a") onDisconnect(path(`duels/${duel.id}`)).cancel();
    duel = null;
    MP.setBusy(false);
  }

  MP.answer = (ok) => {
    if (!duel || !duel.started || duel.resolvedRound === duel.round) return;
    const base = `duels/${duel.id}/rounds/${duel.round}`;
    if (ok) runTransaction(path(`${base}/winner`), (cur) => (cur ? undefined : MP.pid));
    else set(path(`${base}/wrong/${MP.pid}`), true);
  };

  MP.forfeit = () => {
    if (!duel) return;
    if (duel.started) update(path(`duels/${duel.id}`), { status: "done", winner: duel.opp, forfeit: MP.pid });
    else if (duel.role === "a") update(path(`duels/${duel.id}`), { status: "expired" });
  };

  MP.inDuel = () => !!duel;
  return MP;
}

window.createMP = createMP;
window.MP = createMP();
window.dispatchEvent(new Event("mp-ready"));
