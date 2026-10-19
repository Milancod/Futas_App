'use strict';

/* ---------- Segédfüggvények ---------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dow = d => (d.getDay() + 6) % 7; // hétfő = 0
const monday = d => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dow(d));
const today = () => iso(new Date());
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r05 = v => Math.round(v * 2) / 2;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = sel => document.querySelector(sel);

const DAY_SHORT = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
const DAY_LONG = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
const fmtDate = s => { const d = parse(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}.`; };
const fmtDateLong = s => { const d = parse(s); return `${DAY_LONG[dow(d)]}, ${MONTHS[d.getMonth()]} ${d.getDate()}.`; };

function fmtPace(sec) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
function fmtDur(sec) {
  const s = Math.round(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}
const kmh = sec => (3600 / sec).toFixed(1);
const fmtKm = km => (Math.round(km * 10) / 10).toLocaleString('hu-HU');

// "35" = 35 perc, "35:20" = perc:mp, "1:05:00" = óra:perc:mp
function parseTime(str) {
  const p = String(str).trim().split(':').map(Number);
  if (p.some(isNaN) || !p.length) return 0;
  if (p.length === 1) return p[0] * 60;
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0] * 3600 + p[1] * 60 + p[2];
}

/* ---------- Állapot ---------- */
const KEY = 'peaceofmind_v1';
function defaults() {
  return {
    settings: {
      name: 'Milan', age: 25, weight: 95,
      pace: 360,          // kényelmes tempó mp/km
      comfortKm: 7,       // jelenleg kényelmesen lefutott táv
      raceDate: '2027-10-01',
      planStart: iso(monday(new Date())),
      runDays: [1, 3, 5, 6], // K, Cs, Szo, V
      longDay: 6
    },
    ov: {},     // edzés-felülírások: { [id]: { date, treadmill, skipped } }
    runs: [],   // rögzített futások
    nic: { days: {}, cost: 0, cravings: {}, notes: {}, lastUse: null, kind: 'pouch', perDay: 10 },
    med: { target: 10, sessions: [] }
  };
}
let S = load();
function load() {
  const d = defaults();
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (x) return {
      settings: { ...d.settings, ...x.settings }, ov: x.ov || {}, runs: x.runs || [],
      nic: { ...d.nic, ...x.nic }, med: { ...d.med, ...x.med }
    };
  } catch (e) {}
  return d;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Nem sikerült menteni'); }
}

/* ---------- Edzésterv-generátor ---------- */
const TYPE = {
  easy: 'Könnyű futás', strides: 'Könnyű + rávezetők', fartlek: 'Fartlek', tempo: 'Tempófutás',
  interval: 'Intervall', mp: 'Maratoni tempó', long: 'Hosszú futás', race: 'MARATON 🏁', shake: 'Átmozgató futás'
};
const COLOR = { easy: 'easy', strides: 'easy', shake: 'easy', fartlek: 'fartlek', tempo: 'tempo', interval: 'interval', mp: 'mp', long: 'long', race: 'race' };

function paces(s) {
  const P = s.pace;
  return { easy: [P + 20, P + 45], long: [P + 30, P + 60], mp: P + 15, tempo: P - 35, interval: P - 55 };
}

let PLAN = null;
function buildPlan() {
  const s = S.settings, pc = paces(s);
  const start = parse(s.planStart), race = parse(s.raceDate);
  let N = Math.round((monday(race) - start) / (7 * 864e5)) + 1;
  N = clamp(N, 1, 80);
  const days = [...new Set(s.runDays)].sort((a, b) => a - b);
  const longDay = days.includes(s.longDay) ? s.longDay : days[days.length - 1];
  const others = days.filter(d => d !== longDay);
  const circ = d => Math.min(Math.abs(d - longDay), 7 - Math.abs(d - longDay));
  const qDay = others.length ? others.reduce((b, d) => (circ(d) > circ(b) ? d : b), others[0]) : null;

  const build = Math.max(1, N - 3);
  const startLong = clamp(r05(s.comfortKm + 1), 5, 12);
  const peakLong = Math.min(32, r05(startLong + 1.6 * (build - 1)));
  const baseEnd = Math.max(1, Math.round(N * 0.35));

  const step = (t, km, p, note) => ({ t, km, p, note });
  const est = steps => steps.reduce((a, x) => a + (x.km || 0) * (Array.isArray(x.p) ? (x.p[0] + x.p[1]) / 2 : x.p || s.pace + 30), 0);

  function make(type, km, extra = {}) {
    let steps = [], desc = '';
    const q = km;
    switch (type) {
      case 'easy':
        steps = [step('Könnyű futás', km, pc.easy, 'Beszélgetős tempó, végig kényelmes.')];
        desc = 'Az alap: lassan, lazán. Ha beszélni nem tudsz közben, lassíts.';
        break;
      case 'shake':
        steps = [step('Átmozgató futás', km, pc.easy, 'Nagyon laza, frissítő.')];
        desc = 'Rövid, laza futás, hogy friss legyen a lábad.';
        break;
      case 'strides':
        steps = [step('Könnyű futás', km - 1, pc.easy), step('6 × 20 mp rávezető', 1, null, 'Fokozatos gyorsítás kb. 90%-ig, közte 60 mp séta/kocogás.')];
        desc = 'Könnyű futás a végén pár rövid gyorsítással, a futótechnikáért.';
        break;
      case 'fartlek': {
        steps = [step('Bemelegítés', 1.5, pc.easy), step('8 × (1 perc gyorsabb / 2 perc könnyű)', q - 2.5, [pc.tempo, pc.easy[1]], `A gyors részek kb. ${fmtPace(pc.tempo)}/km tempóban, érzésre „erős, de kontrollált”.`), step('Levezetés', 1, pc.easy)];
        desc = 'Játékos tempóváltás, ismerkedés a gyorsabb futással.';
        break;
      }
      case 'tempo': {
        const x = clamp(r05(q - 3.5), 2, 8);
        steps = [step('Bemelegítés', 2, pc.easy), step(`${fmtKm(x)} km tempó`, x, pc.tempo, '„Kényelmesen kemény”: pár szót tudsz mondani, mondatot nem.'), step('Levezetés', 1.5, pc.easy)];
        km = 3.5 + x;
        desc = 'A laktátküszöböt fejleszti: tovább bírod majd a gyorsabb tempót.';
        break;
      }
      case 'interval': {
        const long = extra.reps1k;
        const len = long ? 1 : 0.8;
        const reps = clamp(Math.round((q - 3.5) / (len + 0.4)), 3, 8);
        steps = [step('Bemelegítés', 2, pc.easy), step(`${reps} × ${long ? '1 km' : '800 m'}`, reps * len, pc.interval, 'Közte 400 m nagyon laza kocogás vagy 2 perc séta.'), step('Pihenők', reps * 0.4, [pc.easy[1], pc.easy[1] + 60]), step('Levezetés', 1.5, pc.easy)];
        km = 3.5 + reps * (len + 0.4);
        desc = 'Gyorsasági munka: az aerob kapacitásodat (VO2max) emeli.';
        break;
      }
      case 'mp': {
        const x = clamp(r05(q - 3), 3, 14);
        steps = [step('Bemelegítés', 2, pc.easy), step(`${fmtKm(x)} km maratoni tempó`, x, pc.mp, 'Ezt a tempót kell majd a versenyen tartanod.'), step('Levezetés', 1, pc.easy)];
        km = 3 + x;
        desc = 'A versenytempó begyakorlása, hogy a lábad „megtanulja”.';
        break;
      }
      case 'long': {
        const f = extra.mpFinish || 0;
        steps = f
          ? [step('Hosszú, könnyű rész', km - f, pc.long), step(`Utolsó ${fmtKm(f)} km maratoni tempóban`, f, pc.mp, 'Fáradtan is tartsd a tempót.')]
          : [step('Hosszú futás', km, pc.long, 'Lassú, egyenletes tempó.')];
        desc = 'A maratoni felkészülés gerince: az állóképességed és a zsírégetésed fejleszti.'
          + (km >= 16 ? ' 60 perc felett vigyél vizet, és 40-45 percenként egy gélt vagy szénhidrátot.' : '');
        break;
      }
      case 'race':
        steps = [step('Első 5 km', 5, pc.mp + 10, 'Kicsit lassabban, mint a tervezett tempó. Ne rohanj el!'), step('5–32 km', 27, pc.mp, 'Egyenletes maratoni tempó, 30-40 percenként gél és víz.'), step('32 km – cél', 10.195, pc.mp, 'Itt kezdődik az igazi maraton. Fejben dől el!')];
        km = 42.195;
        desc = 'Verseny nap! Ne próbálj ki semmi újat: a megszokott reggeli, cipő, gélek.';
        break;
    }
    const title = type === 'interval' ? `Intervall – ${extra.reps1k ? '1 km-es' : '800 m-es'} ismétlések`
      : type === 'long' && extra.mpFinish ? 'Hosszú futás, MP befejezéssel' : TYPE[type];
    return { type, title, km: Math.round(km * 10) / 10, steps, desc, est: est(steps) };
  }

  const weeks = [];
  for (let w = 1; w <= N; w++) {
    const wStart = addDays(start, (w - 1) * 7);
    const cut = w % 4 === 0 && w <= N - 4;
    let phase;
    if (w === N) phase = 'Verseny hét';
    else if (w >= N - 2) phase = 'Frissítés (taper)';
    else if (w >= N - 5 && w > baseEnd) phase = 'Csúcs';
    else if (w <= baseEnd) phase = 'Alapozás';
    else phase = 'Építkezés';

    let L;
    if (w <= build) {
      const t = build > 1 ? (w - 1) / (build - 1) : 1;
      L = startLong + (peakLong - startLong) * t;
      if (cut) L *= 0.75;
    } else if (w === N - 2) L = peakLong * 0.7;
    else L = peakLong * 0.45;
    L = r05(L);

    const easyKm = clamp(r05(L * 0.45), 5, 10);
    const qKm = clamp(r05(L * 0.55), 6, 14);
    const list = [];

    if (w === N) {
      const raceDow = dow(race);
      others.filter(d => d < raceDow - 1).forEach(d => {
        list.push({ dow: d, ...(d === qDay ? make('mp', 6) : make('shake', 5)) });
      });
      if (raceDow >= 1) list.push({ dow: raceDow - 1, ...make('shake', 3) });
      list.push({ dow: raceDow, ...make('race', 42.195) });
    } else {
      let qType;
      if (cut) qType = 'strides';
      else if (phase === 'Alapozás') qType = w % 2 ? 'strides' : 'fartlek';
      else if (phase === 'Építkezés') qType = ['tempo', 'interval', 'mp'][w % 3];
      else if (phase === 'Csúcs') qType = ['mp', 'tempo', 'interval'][w % 3];
      else qType = w === N - 2 ? 'tempo' : 'mp';
      const qSize = phase === 'Frissítés (taper)' ? Math.min(qKm, 8) : qKm;
      others.forEach(d => {
        if (d === qDay) list.push({ dow: d, ...make(qType, qType === 'strides' ? easyKm : qSize, { reps1k: w > N / 2 }) });
        else list.push({ dow: d, ...make('easy', phase === 'Frissítés (taper)' ? Math.min(easyKm, 6) : easyKm) });
      });
      const mpFinish = (phase === 'Építkezés' || phase === 'Csúcs') && w % 2 === 0 && !cut ? clamp(Math.round(L * 0.25), 3, 10) : 0;
      list.push({ dow: longDay, ...make('long', L, { mpFinish }) });
    }
    list.sort((a, b) => a.dow - b.dow);
    list.forEach((x, i) => { x.id = `w${w}-${i}`; x.week = w; x.date = iso(addDays(wStart, x.dow)); });
    weeks.push({ n: w, start: iso(wStart), phase, cut, workouts: list, km: Math.round(list.reduce((a, x) => a + x.km, 0) * 10) / 10 });
  }
  PLAN = { N, weeks, paces: pc };
}

// Felülírásokkal (áthelyezés, futópad, kihagyás) együtt
function eff(wo) {
  const o = S.ov[wo.id] || {};
  const run = S.runs.find(r => r.wid === wo.id);
  return { ...wo, date: o.date || wo.date, treadmill: !!o.treadmill, skipped: !!o.skipped, run };
}
const allWorkouts = () => PLAN.weeks.flatMap(w => w.workouts.map(eff));
const workoutsOn = date => allWorkouts().filter(w => w.date === date);
function weekIndexFor(date) {
  const i = Math.floor(daysBetween(S.settings.planStart, date) / 7);
  return clamp(i, 0, PLAN.N - 1);
}
function weekDone(week) {
  const end = iso(addDays(parse(week.start), 6));
  return S.runs.filter(r => r.date >= week.start && r.date <= end).reduce((a, r) => a + r.km, 0);
}

/* ---------- UI alapok ---------- */
let TAB = 'today';
let planWeek = null;
const TITLES = { today: 'Ma', plan: 'Edzésterv', runs: 'Futások', nic: 'Nikotinmentesen', med: 'Meditáció' };

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function openSheet(html, onMount) {
  closeSheet(true);
  const bd = document.createElement('div'); bd.className = 'backdrop'; bd.id = 'bd';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'sheet';
  sh.innerHTML = '<div class="grab"></div>' + html;
  bd.onclick = () => closeSheet();
  document.body.append(bd, sh);
  requestAnimationFrame(() => { bd.classList.add('show'); sh.classList.add('show'); });
  onMount && onMount(sh);
  return sh;
}
function closeSheet(instant) {
  const bd = $('#bd'), sh = $('#sheet');
  if (!sh) return;
  stopTimers();
  if (instant) { bd.remove(); sh.remove(); return; }
  bd.classList.remove('show'); sh.classList.remove('show');
  setTimeout(() => { bd.remove(); sh.remove(); }, 250);
}

function render() {
  buildPlan();
  $('#title').textContent = TITLES[TAB];
  $('#subtitle').textContent = fmtDateLong(today());
  document.querySelectorAll('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB));
  const m = $('#main');
  m.innerHTML = { today: viewToday, plan: viewPlan, runs: viewRuns, nic: viewNic, med: viewMed }[TAB]();
  if (TAB === 'plan') enableDrag(m);
}
function go(tab) { TAB = tab; window.scrollTo(0, 0); render(); }

function woCard(w, opts = {}) {
  const pace = w.steps.find(x => Array.isArray(x.p) || x.p);
  const cls = ['wo', w.run ? 'done' : '', w.skipped ? 'skipped' : ''].join(' ');
  const meta = [`${fmtKm(w.km)} km`, `~${Math.round(w.est / 60)} perc`, w.treadmill ? '🏃‍♂️ futópad' : ''].filter(Boolean).join(' · ');
  return `<div class="${cls}" data-id="${w.id}" onclick="openWorkout('${w.id}')">
    <div class="stripe t-${COLOR[w.type]}"></div>
    <div class="body"><div class="title">${esc(w.title)}</div><div class="meta">${opts.date ? fmtDateLong(w.date) + ' · ' : ''}${meta}</div>
    ${w.run ? `<div class="meta c-easy">Rögzítve: ${fmtKm(w.run.km)} km, ${fmtDur(w.run.sec)} (${fmtPace(w.run.sec / w.run.km)}/km)</div>` : ''}</div></div>`;
}

/* ---------- MA ---------- */
function viewToday() {
  const t = today(), s = S.settings;
  const toRace = daysBetween(t, s.raceDate);
  const wi = weekIndexFor(t), week = PLAN.weeks[wi];
  const todays = workoutsOn(t);
  const next = allWorkouts().filter(w => w.date > t && !w.skipped && !w.run).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nicDay = S.nic.days[t];
  const medMin = S.med.sessions.filter(x => x.date === t).reduce((a, x) => a + x.min, 0);
  const done = weekDone(week);

  let html = `<div class="card hero">
    <div class="row between"><div><div class="small muted" style="color:#d8cffc">Szia ${esc(s.name)}! 👋</div>
    <h2 style="margin:4px 0 0">${toRace > 0 ? `${toRace} nap a maratonig` : toRace === 0 ? 'Ma van a maraton! 🏁' : 'Maraton teljesítve 🏅'}</h2></div>
    <div style="font-size:38px">🏃‍♂️</div></div>
    <div class="small" style="margin-top:8px;color:#d8cffc">${wi + 1}. hét / ${PLAN.N} · ${week.phase}</div>
    <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, done / week.km * 100)}%"></i></div>
    <div class="small" style="margin-top:6px;color:#d8cffc">E heti táv: ${fmtKm(done)} / ${fmtKm(week.km)} km</div></div>`;

  html += `<h2>Mai edzés</h2>`;
  if (todays.length) html += todays.map(w => woCard(w)).join('');
  else html += `<div class="card"><b>Pihenőnap 😌</b><div class="muted small">A fejlődés pihenés közben történik. Nyújts, sétálj, aludj sokat.</div>
    ${next ? `<div class="small muted" style="margin-top:10px">Következő:</div>${woCard(next, { date: true })}` : ''}</div>`;
  html += `<button class="btn ghost" onclick="openRunForm()">+ Egyéb futás rögzítése</button>`;

  // Nikotin
  const st = nicStreak();
  html += `<h2>Nikotinmentes nap?</h2><div class="card">`;
  if (nicDay === 'clean') html += `<div class="row"><div style="font-size:30px">✅</div><div><b>Ma nikotinmentes voltál!</b><div class="small muted">${st} napos sorozat. Ezzel ma is tettél az egészségedért és a futásodért.</div></div></div>`;
  else if (nicDay === 'used') html += `<div class="row"><div style="font-size:30px">🌱</div><div><b>Nem baj, holnap új nap.</b><div class="small muted">Egy botlás nem nullázza le a fejlődésed. Mi váltotta ki? Írd le a Nikotin fülön.</div></div></div>`;
  else html += `<div class="muted small">Jelöld be a nap végén, hogy ma nikotinmentes voltál-e.</div>`;
  const since = nicSince();
  if (since) { const x = fmtSince(Date.now() - since); html += `<div class="small" style="margin-top:10px">⏱ <b>${x.d} nap ${x.h} óra</b> nikotin nélkül · ${NIC_HEALTH.filter(h => (!h[2] || h[2].includes(S.nic.kind)) && (Date.now() - since) / 36e5 >= h[0]).length} egészségügyi előny elérve</div>`; }
  html += `<div class="btns"><button class="btn ${nicDay === 'clean' ? 'ok' : ''}" onclick="setNic('${t}','clean')">✅ Nikotinmentes</button>
    <button class="btn ${nicDay === 'used' ? 'bad' : ''}" onclick="setNic('${t}','used')">Nikotinoztam</button></div>
    <button class="btn ghost" style="margin-top:8px" onclick="openSOS()">🆘 Sóvárgás van – segíts!</button></div>`;

  // Meditáció
  const sug = medSuggestion(t);
  html += `<h2>Meditáció</h2><div class="card">
    <div class="row between"><div><b>${medMin >= S.med.target ? '🧘 Megvan a mai meditáció!' : `Mai cél: ${S.med.target} perc`}</b>
    <div class="small muted">Ma eddig: ${medMin} perc · Javaslat: ${sug.name}</div></div></div>
    <div class="bar" style="margin-top:10px"><i style="width:${Math.min(100, medMin / S.med.target * 100)}%"></i></div>
    <div class="btns"><button class="btn primary" onclick="openMedTimer()">▶ Indítás</button><button class="btn" onclick="openMedForm()">Rögzítés</button></div></div>`;

  // Heti áttekintés
  html += `<h2>A heted</h2><div class="card"><div class="grid7" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">`;
  for (let i = 0; i < 7; i++) {
    const d = iso(addDays(parse(week.start), i));
    const ws = workoutsOn(d);
    const ran = S.runs.some(r => r.date === d);
    const nd = S.nic.days[d];
    const md = S.med.sessions.some(x => x.date === d);
    html += `<div style="padding:6px 0;border-radius:12px;${d === t ? 'background:var(--card2)' : ''}">
      <div class="small ${d === t ? '' : 'muted'}"><b>${DAY_SHORT[i]}</b></div>
      <div style="font-size:15px;margin-top:4px">${ran ? '✅' : ws.length ? `<span class="c-${COLOR[ws[0].type]}">●</span>` : '·'}</div>
      <div style="font-size:11px">${nd === 'clean' ? '🚭' : nd === 'used' ? '•' : '&nbsp;'}</div>
      <div style="font-size:11px">${md ? '🧘' : '&nbsp;'}</div></div>`;
  }
  html += `</div><div class="small muted" style="margin-top:8px">● tervezett futás · ✅ lefutva · 🚭 nikotinmentes · 🧘 meditáltál</div></div>`;
  return html;
}

/* ---------- EDZÉSTERV ---------- */
function viewPlan() {
  const t = today();
  if (planWeek === null) planWeek = weekIndexFor(t);
  const week = PLAN.weeks[planWeek];
  const done = weekDone(week);
  const pc = PLAN.paces;
  let html = `<div class="weeknav">
    <button class="iconbtn" onclick="shiftWeek(-1)" ${planWeek === 0 ? 'disabled' : ''}>‹</button>
    <div style="text-align:center"><b>${week.n}. hét / ${PLAN.N}</b><div class="small muted">${fmtDate(week.start)} – ${fmtDate(iso(addDays(parse(week.start), 6)))}</div></div>
    <button class="iconbtn" onclick="shiftWeek(1)" ${planWeek === PLAN.N - 1 ? 'disabled' : ''}>›</button></div>
    <div class="card"><div class="row between"><span class="pill">${week.phase}${week.cut ? ' · könnyített hét' : ''}</span><span class="small muted">${fmtKm(done)} / ${fmtKm(week.km)} km</span></div>
    <div class="bar" style="margin-top:10px"><i style="width:${Math.min(100, done / week.km * 100)}%"></i></div></div>
    <div class="small muted" style="margin:0 0 10px">Tipp: nyomd hosszan és húzd át az edzést másik napra, vagy koppints rá a részletekért.</div>`;
  const effs = week.workouts.map(eff);
  for (let i = 0; i < 7; i++) {
    const d = iso(addDays(parse(week.start), i));
    const ws = effs.filter(w => w.date === d);
    html += `<div class="day ${d === t ? 'today' : ''}"><div class="dlabel"><b>${DAY_SHORT[i]}</b><span>${parse(d).getDate()}</span></div>
      <div class="slot ${ws.length ? '' : 'empty'}" data-date="${d}">${ws.length ? ws.map(w => woCard(w)).join('') : 'Pihenő'}</div></div>`;
  }
  html += `<h2>Tempóid</h2><div class="card small">
    <div class="row between"><span class="c-easy">● Könnyű</span><span>${fmtPace(pc.easy[0])}–${fmtPace(pc.easy[1])} /km</span></div>
    <div class="row between"><span class="c-long">● Hosszú</span><span>${fmtPace(pc.long[0])}–${fmtPace(pc.long[1])} /km</span></div>
    <div class="row between"><span class="c-mp">● Maratoni tempó</span><span>${fmtPace(pc.mp)} /km</span></div>
    <div class="row between"><span class="c-tempo">● Tempó</span><span>${fmtPace(pc.tempo)} /km</span></div>
    <div class="row between"><span class="c-interval">● Intervall</span><span>${fmtPace(pc.interval)} /km</span></div>
    <div class="muted" style="margin-top:8px">Ha gyorsulsz, a ⚙️ beállításokban frissítsd a kényelmes tempódat, és minden tempó újraszámolódik.</div></div>`;
  html += `<h2>A teljes terv</h2><div class="card list">` + PLAN.weeks.map((w, i) => {
    const long = w.workouts.find(x => x.type === 'long' || x.type === 'race');
    return `<div class="item" onclick="planWeek=${i};render();window.scrollTo(0,0)" style="cursor:pointer">
      <div><b>${w.n}. hét</b> <span class="small muted">${fmtDate(w.start)} · ${w.phase}${w.cut ? ' · könnyített' : ''}</span>
      <div class="small muted">${w.workouts.length} futás · leghosszabb: ${long ? fmtKm(long.km) : '–'} km</div></div>
      <div><b>${fmtKm(w.km)}</b> <span class="small muted">km</span></div></div>`;
  }).join('') + `</div>`;
  return html;
}
function shiftWeek(d) { planWeek = clamp(planWeek + d, 0, PLAN.N - 1); render(); }

function findWo(id) { return allWorkouts().find(w => w.id === id); }

function openWorkout(id) {
  if (dragJustEnded) return;
  const w = findWo(id);
  if (!w) return;
  const week = PLAN.weeks[w.week - 1];
  const stepHtml = w.steps.map(x => {
    let p = '';
    if (Array.isArray(x.p)) p = w.treadmill ? `${kmh(x.p[1])}–${kmh(x.p[0])} km/h` : `${fmtPace(x.p[0])}–${fmtPace(x.p[1])} /km`;
    else if (x.p) p = w.treadmill ? `${kmh(x.p)} km/h` : `${fmtPace(x.p)} /km`;
    return `<li><b>${esc(x.t)}</b><span class="small muted">${x.km && !/×/.test(x.t) ? fmtKm(x.km) + ' km · ' : ''}${p}</span>${x.note ? `<div class="small">${esc(x.note)}</div>` : ''}</li>`;
  }).join('');
  const chips = DAY_SHORT.map((n, i) => {
    const d = iso(addDays(parse(week.start), i));
    return `<button class="chip ${d === w.date ? 'on' : ''}" onclick="moveWo('${w.id}','${d}')">${n} ${parse(d).getDate()}</button>`;
  }).join('');
  openSheet(`
    <span class="pill c-${COLOR[w.type]}">${TYPE[w.type].replace(' 🏁', '')}</span>
    <h2 style="margin:8px 0 2px">${esc(w.title)}</h2>
    <div class="muted small">${fmtDateLong(w.date)} · ${fmtKm(w.km)} km · ~${Math.round(w.est / 60)} perc</div>
    <p class="small">${esc(w.desc)}</p>
    <ul class="steps">${stepHtml}</ul>
    <div class="toggle"><div><b>Futópadon futok</b><div class="small muted">Tempók km/h-ban; állíts be 1% emelkedőt.</div></div>
      <input type="checkbox" ${w.treadmill ? 'checked' : ''} onchange="setOv('${w.id}',{treadmill:this.checked});openWorkout('${w.id}')"></div>
    <label>Áthelyezés másik napra</label><div class="chips">${chips}</div>
    ${w.run
      ? `<div class="card" style="margin-top:14px;background:var(--card2)"><b>✅ Teljesítve</b><div class="small">${fmtKm(w.run.km)} km · ${fmtDur(w.run.sec)} · ${fmtPace(w.run.sec / w.run.km)}/km${w.run.rpe ? ` · nehézség ${w.run.rpe}/10` : ''}</div>${w.run.note ? `<div class="small muted">${esc(w.run.note)}</div>` : ''}</div>
         <div class="btns"><button class="btn" onclick="openRunForm('${w.run.id}')">Szerkesztés</button><button class="btn bad" onclick="delRun('${w.run.id}')">Törlés</button></div>`
      : `<div class="btns"><button class="btn primary" onclick="openRunForm(null,'${w.id}')">✓ Futás rögzítése</button>
         <button class="btn" onclick="setOv('${w.id}',{skipped:${!w.skipped}});closeSheet();render()">${w.skipped ? 'Visszaállítás' : 'Kihagyom'}</button></div>`}
  `);
}

function setOv(id, patch) {
  S.ov[id] = { ...(S.ov[id] || {}), ...patch };
  save();
}
function moveWo(id, date) {
  const w = findWo(id);
  setOv(id, { date });
  const sameDay = allWorkouts().filter(x => x.date === date && x.id !== id);
  const hard = t => ['tempo', 'interval', 'mp', 'long', 'fartlek'].includes(t);
  const nb = allWorkouts().filter(x => Math.abs(daysBetween(x.date, date)) === 1 && x.id !== id);
  if (sameDay.length) toast('Figyelem: ezen a napon már van edzés');
  else if (hard(w.type) && nb.some(x => hard(x.type))) toast('Tipp: két kemény edzés ne legyen egymás után');
  else toast(`Áthelyezve: ${DAY_LONG[dow(parse(date))]}`);
  closeSheet(); render();
}

/* Hosszú nyomás + áthúzás a heti nézetben */
let dragJustEnded = false;
function enableDrag(root) {
  let timer = null, drag = null, sx = 0, sy = 0;
  root.querySelectorAll('.wo[data-id]').forEach(el => {
    el.addEventListener('pointerdown', e => {
      sx = e.clientX; sy = e.clientY;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const r = el.getBoundingClientRect();
        const g = el.cloneNode(true);
        Object.assign(g.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', zIndex: 30, opacity: .9, pointerEvents: 'none', boxShadow: '0 10px 30px rgba(0,0,0,.5)', transform: 'scale(1.03)' });
        document.body.appendChild(g);
        el.style.opacity = .3;
        drag = { id: el.dataset.id, el, g, dy: sy - r.top, dx: sx - r.left, target: null };
        navigator.vibrate && navigator.vibrate(15);
      }, 380);
    });
  });
  const move = e => {
    if (!drag) {
      if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) { clearTimeout(timer); timer = null; }
      return;
    }
    drag.g.style.left = (e.clientX - drag.dx) + 'px';
    drag.g.style.top = (e.clientY - drag.dy) + 'px';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const slot = under && under.closest('.slot');
    root.querySelectorAll('.slot.drop').forEach(s => s.classList.remove('drop'));
    if (slot) slot.classList.add('drop');
    drag.target = slot;
  };
  const up = () => {
    clearTimeout(timer); timer = null;
    if (!drag) return;
    const { id, g, el, target } = drag;
    drag = null; g.remove(); el.style.opacity = '';
    dragJustEnded = true; setTimeout(() => { dragJustEnded = false; }, 350);
    if (target && target.dataset.date !== findWo(id).date) moveWo(id, target.dataset.date);
    else render();
  };
  window.onpointermove = move;
  window.onpointerup = up;
  window.onpointercancel = up;
  document.ontouchmove = null;
  root.addEventListener('touchmove', e => { if (drag) e.preventDefault(); }, { passive: false });
  root.addEventListener('contextmenu', e => { if (e.target.closest('.wo')) e.preventDefault(); });
}

/* ---------- FUTÁSOK ---------- */
function openRunForm(runId, wid) {
  const r = runId ? S.runs.find(x => x.id === runId) : null;
  const w = wid ? findWo(wid) : null;
  const v = r || { date: w ? (w.date <= today() ? w.date : today()) : today(), km: w ? w.km : '', sec: 0, rpe: 5, treadmill: w ? w.treadmill : false, note: '' };
  openSheet(`<h2 style="margin-top:0">${r ? 'Futás szerkesztése' : 'Futás rögzítése'}</h2>
    ${w ? `<div class="small muted">${esc(w.title)}</div>` : ''}
    <label>Dátum</label><input type="date" id="fDate" value="${v.date}">
    <div class="grid2"><div><label>Táv (km)</label><input id="fKm" inputmode="decimal" value="${v.km}" placeholder="pl. 7.5"></div>
    <div><label>Idő (perc:mp)</label><input id="fTime" inputmode="numeric" value="${v.sec ? fmtDur(v.sec) : ''}" placeholder="pl. 45:30"></div></div>
    <label>Nehézség érzésre: <b id="rpeV">${v.rpe}</b>/10</label><input type="range" min="1" max="10" id="fRpe" value="${v.rpe}" oninput="$('#rpeV').textContent=this.value" style="padding:0">
    <div class="toggle"><b>Futópadon</b><input type="checkbox" id="fTm" ${v.treadmill ? 'checked' : ''}></div>
    <label>Jegyzet</label><textarea id="fNote" placeholder="Hogy ment? Időjárás, érzés, cipő...">${esc(v.note)}</textarea>
    <button class="btn primary" style="margin-top:14px" onclick="saveRun('${r ? r.id : ''}','${r ? r.wid || '' : wid || ''}')">Mentés</button>`);
}
function saveRun(id, wid) {
  const km = parseFloat(String($('#fKm').value).replace(',', '.'));
  const sec = parseTime($('#fTime').value);
  if (!(km > 0) || !(sec > 0)) { toast('Add meg a távot és az időt'); return; }
  const w = wid ? findWo(wid) : null;
  const run = { id: id || uid(), date: $('#fDate').value || today(), km, sec, rpe: +$('#fRpe').value, treadmill: $('#fTm').checked, note: $('#fNote').value.trim(), wid: wid || null, title: w ? w.title : 'Szabad futás' };
  if (id) S.runs = S.runs.map(x => x.id === id ? run : x); else S.runs.push(run);
  if (wid) setOv(wid, { skipped: false });
  save(); closeSheet(); render();
  toast(`Szép munka! ${fmtKm(km)} km 💪`);
}
function delRun(id) {
  if (!confirm('Biztosan törlöd ezt a futást?')) return;
  S.runs = S.runs.filter(x => x.id !== id); save(); closeSheet(); render();
}

function viewRuns() {
  const runs = [...S.runs].sort((a, b) => b.date.localeCompare(a.date));
  const total = runs.reduce((a, r) => a + r.km, 0);
  const longest = runs.reduce((a, r) => Math.max(a, r.km), 0);
  const totSec = runs.reduce((a, r) => a + r.sec, 0);
  // Utolsó 10 hét: terv vs. teljesítés
  const cur = weekIndexFor(today());
  const from = Math.max(0, cur - 9);
  const ws = PLAN.weeks.slice(from, cur + 1);
  const max = Math.max(1, ...ws.map(w => Math.max(w.km, weekDone(w))));
  const bw = 10;
  const bars = ws.map((w, i) => {
    const d = weekDone(w), hp = w.km / max * 120, hd = d / max * 120;
    return `<rect x="${i * bw + bw * .15}%" y="${130 - hp}" width="${bw * .7}%" height="${hp}" rx="4" fill="#2a2c37"/>
      <rect x="${i * bw + bw * .15}%" y="${130 - hd}" width="${bw * .7}%" height="${hd}" rx="4" fill="url(#gr)"/>
      <text x="${i * bw + bw / 2}%" y="146" fill="#9a9cab" font-size="10" text-anchor="middle">${w.n}.</text>`;
  }).join('');
  let html = `<div class="grid2" style="margin-top:12px">
    <div class="stat"><b>${fmtKm(total)}</b><span>összes km</span></div>
    <div class="stat"><b>${runs.length}</b><span>futás</span></div>
    <div class="stat"><b>${fmtKm(longest)}</b><span>leghosszabb (km)</span></div>
    <div class="stat"><b>${total ? fmtPace(totSec / total) : '–'}</b><span>átlagtempó /km</span></div></div>
    <h2>Heti km: terv vs. lefutott</h2><div class="card"><svg width="100%" height="150"><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5ca8"/><stop offset="1" stop-color="#8b6cff"/></linearGradient></defs>${bars}</svg>
    <div class="small muted">Szürke: tervezett · színes: lefutott (hetek száma alul)</div></div>
    <button class="btn primary" onclick="openRunForm()">+ Futás rögzítése</button>
    <h2>Napló</h2><div class="card list">`;
  html += runs.length ? runs.map(r => `<div class="item" onclick="openRunForm('${r.id}')" style="cursor:pointer">
      <div><b>${fmtKm(r.km)} km</b> <span class="small muted">· ${fmtDur(r.sec)} · ${fmtPace(r.sec / r.km)}/km${r.treadmill ? ' · futópad' : ''}</span>
      <div class="small muted">${fmtDateLong(r.date)} · ${esc(r.title || '')}</div>${r.note ? `<div class="small">${esc(r.note)}</div>` : ''}</div>
      <div class="small muted">${r.rpe ? r.rpe + '/10' : ''}</div></div>`).join('')
    : `<div class="muted small">Még nincs rögzített futás. Az első mindig a legszebb! 🏃‍♂️</div>`;
  html += `</div>`;
  return html;
}

/* ---------- NIKOTIN ---------- */
const NIC_MILESTONES = [
  [1, 'Az első nap a legnehezebb. Megcsináltad!'],
  [3, 'Kb. 72 óra alatt a nikotin kiürül a szervezetedből. Az elvonási tünetek ilyenkor a legerősebbek, innen enyhülnek.'],
  [7, 'Egy hét! A sóvárgás rohamai rövidebbek és ritkábbak.'],
  [14, 'Két hét: az alvásod és a hangulatod kezd kiegyensúlyozódni.'],
  [30, 'Egy hónap: az agyad nikotinreceptorai nagyrészt visszaálltak, a sóvárgás érezhetően gyengébb.'],
  [90, 'Három hónap: a keringésed és (ha szívtál vagy vape-eltél) a tüdőfunkciód javul, a futásban is érezni fogod.'],
  [180, 'Fél év: már nem a nikotin irányít. A stresszt nélküle kezeled.'],
  [365, 'Egy teljes év nikotin nélkül. Hatalmas teljesítmény! 🏆']
];
function nicStreak() {
  let d = new Date();
  if (S.nic.days[iso(d)] !== 'clean') {
    if (S.nic.days[iso(d)] === 'used') return 0;
    d = addDays(d, -1);
  }
  let n = 0;
  while (S.nic.days[iso(d)] === 'clean') { n++; d = addDays(d, -1); }
  return n;
}
function nicBest() {
  const dates = Object.keys(S.nic.days).filter(k => S.nic.days[k] === 'clean').sort();
  let best = 0, run = 0, prev = null;
  dates.forEach(d => { run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  return best;
}
function setNic(date, val) {
  if (S.nic.days[date] === val) delete S.nic.days[date]; else S.nic.days[date] = val;
  if (S.nic.days[date] === 'used' && date === today()) S.nic.lastUse = Date.now();
  save(); render();
  if (S.nic.days[date] === 'clean') {
    const st = nicStreak();
    const m = NIC_MILESTONES.find(x => x[0] === st);
    toast(m ? `🎉 ${st} nap! ${m[1].split('.')[0]}.` : `✅ ${st}. nikotinmentes nap egymás után!`);
  }
}
function calendar(weeks, cellFn) {
  const start = addDays(monday(new Date()), -(weeks - 1) * 7);
  let h = `<div class="cal">${DAY_SHORT.map(d => `<div class="h">${d}</div>`).join('')}`;
  for (let i = 0; i < weeks * 7; i++) {
    const d = iso(addDays(start, i));
    h += cellFn(d, d === today(), d > today());
  }
  return h + '</div>';
}
/* Élő egészség-számláló: idő az utolsó nikotin óta és a regeneráció lépései */
const NIC_KINDS = { pouch: ['Nikotinpárna / snüssz', 'párna'], vape: ['Vape / e-cigi', 'slukk-alkalom'], cig: ['Cigaretta', 'szál cigi'], other: ['Egyéb', 'adag'] };
// [óra, szöveg, mely formákra igaz (üres = mindre)]
const NIC_HEALTH = [
  [1 / 3, 'A pulzusod és a vérnyomásod visszatér a nikotin előtti szintre.'],
  [2, 'A nikotin szintje a véredben a felére csökkent.'],
  [12, 'A vér szén-monoxid-szintje normalizálódik, több oxigén jut az izmaidhoz.', ['cig']],
  [24, 'A nikotin nagy része kiürült, megszűnnek a nikotin okozta adrenalin-löketek.'],
  [48, 'Az íz- és szaglóidegek regenerálódni kezdenek, jobban érzed az ízeket.', ['cig', 'vape']],
  [72, 'A szervezeted nikotinmentes. Az elvonási tünetek csúcsa után innen enyhülnek.'],
  [24 * 14, 'Az ínyed és a szájnyálkahártyád gyógyulni kezd, csökken az irritáció.', ['pouch']],
  [24 * 14, 'Javul a vérkeringésed, az ereid kevésbé szűkülnek: a futás könnyebbnek érződik.'],
  [24 * 30, 'A nikotinreceptorok száma normalizálódik, a sóvárgás ritka és gyenge.'],
  [24 * 90, 'A tüdőfunkciód javul, kevesebb a köhögés és a légszomj, nő az állóképességed.', ['cig', 'vape']],
  [24 * 90, 'Stabilabb a hangulatod és az alvásod, kevesebb a nap közbeni ingadozás.'],
  [24 * 365, 'A szív- és érrendszeri betegségek kockázata jelentősen csökkent.']
];
function nicSince() {
  if (S.nic.lastUse) return S.nic.lastUse;
  const st = nicStreak();
  if (!st) return null;
  let d = new Date();
  if (S.nic.days[iso(d)] !== 'clean') d = addDays(d, -1);
  return parse(iso(addDays(d, -(st - 1)))).getTime();
}
function fmtSince(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return { d, h, m, s: s % 60 };
}
function fmtHours(h) {
  if (h < 1) return Math.round(h * 60) + ' perc';
  if (h < 48) return Math.round(h) + ' óra';
  if (h < 24 * 30) return Math.round(h / 24) + ' nap';
  if (h < 24 * 365) return Math.round(h / 24 / 30) + ' hónap';
  return '1 év';
}
function nicHealthHtml() {
  const since = nicSince();
  if (!since) return `<div class="card hero" style="margin-top:12px;text-align:center"><b>Mikor nikotinoztál utoljára?</b>
    <div class="small" style="color:#d8cffc;margin:6px 0 12px">Innentől számolom, mennyit nyert az egészséged.</div>
    <input type="datetime-local" id="nicLast" style="margin-bottom:8px"><div class="btns">
    <button class="btn primary" onclick="setLastUse($('#nicLast').value)">Mentés</button><button class="btn" onclick="setLastUse('now')">Most kezdem</button></div></div>`;
  const hrs = (Date.now() - since) / 36e5;
  const t = fmtSince(Date.now() - since);
  const unit = NIC_KINDS[S.nic.kind] || NIC_KINDS.other;
  const avoided = Math.floor(hrs / 24 * (S.nic.perDay || 0));
  const money = Math.floor(hrs / 24 * (S.nic.cost || 0));
  const items = NIC_HEALTH.filter(x => !x[2] || x[2].includes(S.nic.kind));
  const done = items.filter(x => hrs >= x[0]).length;
  return `<div class="card hero" style="margin-top:12px;text-align:center">
    <div class="small" style="color:#d8cffc">Nikotin nélkül már</div>
    <div id="nicClock" style="display:flex;justify-content:center;gap:14px;margin:8px 0">${[['d', 'nap'], ['h', 'óra'], ['m', 'perc'], ['s', 'mp']].map(([k, l]) => `<div><div data-k="${k}" style="font-size:36px;font-weight:800;font-variant-numeric:tabular-nums">${t[k]}</div><div class="small" style="color:#d8cffc">${l}</div></div>`).join('')}</div>
    <div class="small" style="color:#d8cffc">${done} / ${items.length} egészségügyi előny elérve</div></div>
    <div class="grid2"><div class="stat"><b>${avoided.toLocaleString('hu-HU')}</b><span>elkerült ${unit[1]}</span></div>
    <div class="stat"><b>${money ? money.toLocaleString('hu-HU') + ' Ft' : '–'}</b><span>megspórolva${S.nic.cost ? '' : ' (add meg lent az árat)'}</span></div></div>
    <h2>Mit tettél az egészségedért</h2><div class="card">${items.map(([h, txt]) => {
      const pct = Math.min(100, hrs / h * 100), ok = pct >= 100;
      return `<div class="milestone ${ok ? 'reached' : ''}"><div class="dot">${ok ? '✓' : ''}</div><div style="flex:1">
        <div class="row between"><b>${fmtHours(h)}</b><span class="small ${ok ? 'c-easy' : 'muted'}">${ok ? 'Megvan!' : Math.floor(pct) + '%'}</span></div>
        <div class="small ${ok ? '' : 'muted'}">${txt}</div>${ok ? '' : `<div class="bar" style="margin-top:6px;height:6px"><i style="width:${pct}%"></i></div>`}</div></div>`;
    }).join('')}
    <div class="small muted" style="margin-top:10px">Tájékoztató jellegű, főleg a dohányzásról és nikotinról való leszokás kutatásai alapján.</div></div>
    <div class="btns"><button class="btn bad" onclick="if(confirm('Újraindítod a számlálót most?'))setLastUse('now',true)">Most nikotinoztam</button>
    <button class="btn" onclick="editLastUse()">Időpont módosítása</button></div>`;
}
function setLastUse(v, used) {
  const ms = v === 'now' ? Date.now() : new Date(v).getTime();
  if (!ms || ms > Date.now()) { toast('Adj meg egy múltbeli időpontot'); return; }
  S.nic.lastUse = ms;
  if (used) S.nic.days[today()] = 'used';
  save(); closeSheet(true); render();
}
function editLastUse() {
  const d = new Date(nicSince() || Date.now());
  const v = `${iso(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  openSheet(`<h2 style="margin-top:0">Utolsó nikotin időpontja</h2><input type="datetime-local" id="nicLast2" value="${v}">
    <button class="btn primary" style="margin-top:12px" onclick="setLastUse($('#nicLast2').value)">Mentés</button>`);
}
setInterval(() => {
  const el = document.getElementById('nicClock');
  if (!el) return;
  const since = nicSince();
  if (!since) return;
  const t = fmtSince(Date.now() - since);
  el.querySelectorAll('[data-k]').forEach(x => { x.textContent = t[x.dataset.k]; });
}, 1000);
function viewNic() {
  const st = nicStreak(), best = nicBest();
  const clean = Object.values(S.nic.days).filter(v => v === 'clean').length;
  const resisted = Object.values(S.nic.cravings).reduce((a, b) => a + b, 0);
  const t = today();
  const next = NIC_MILESTONES.find(m => m[0] > st);
  let html = nicHealthHtml() + `<h2>Napi sorozat</h2>
    <div class="grid3"><div class="stat"><b>${st}</b><span>jelenlegi sorozat (nap)</span></div><div class="stat"><b>${best}</b><span>leghosszabb sorozat</span></div>
    <div class="stat"><b>${resisted}</b><span>legyőzött sóvárgás</span></div></div>
    ${next ? `<div class="small muted" style="margin-top:8px">Még ${next[0] - st} nap a következő mérföldkőig. Összesen ${clean} tiszta napot jelöltél.</div>` : ''}
    <div class="btns"><button class="btn ${S.nic.days[t] === 'clean' ? 'ok' : ''}" onclick="setNic('${t}','clean')">✅ Ma nikotinmentes</button>
    <button class="btn ${S.nic.days[t] === 'used' ? 'bad' : ''}" onclick="setNic('${t}','used')">Ma nikotinoztam</button></div>
    <button class="btn primary" style="margin-top:8px" onclick="openSOS()">🆘 Sóvárgás van – segíts!</button>
    <h2>Mai jegyzet</h2><div class="card"><textarea id="nicNote" placeholder="Mi segített ma? Mikor jött a sóvárgás, és mi váltotta ki?" onchange="S.nic.notes['${t}']=this.value;save();toast('Elmentve')">${esc(S.nic.notes[t] || '')}</textarea></div>
    <h2>Naptár</h2><div class="card">${calendar(10, (d, isT, fut) => {
      const v = S.nic.days[d];
      return `<div class="${v || ''} ${isT ? 'today' : ''} ${fut ? 'future' : ''}" ${fut ? '' : `onclick="cycleNic('${d}')"`}>${parse(d).getDate()}</div>`;
    })}<div class="small muted" style="margin-top:8px">Koppints egy napra a visszamenőleges jelöléshez (zöld = tiszta, piros = nikotin, üres = nincs adat).</div></div>
    <h2>Beállítás</h2><div class="card"><label>Milyen formában használtál nikotint?</label>
    <select onchange="S.nic.kind=this.value;save();render()">${Object.entries(NIC_KINDS).map(([k, v]) => `<option value="${k}" ${S.nic.kind === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
    <div class="grid2"><div><label>Napi mennyiség (${(NIC_KINDS[S.nic.kind] || NIC_KINDS.other)[1]})</label>
    <input inputmode="numeric" value="${S.nic.perDay || ''}" placeholder="pl. 10" onchange="S.nic.perDay=+this.value||0;save();render()"></div>
    <div><label>Napi költség (Ft)</label><input inputmode="numeric" value="${S.nic.cost || ''}" placeholder="pl. 1500" onchange="S.nic.cost=+this.value||0;save();render()"></div></div></div>`;
  return html;
}
function cycleNic(d) {
  const v = S.nic.days[d];
  if (!v) S.nic.days[d] = 'clean'; else if (v === 'clean') S.nic.days[d] = 'used'; else delete S.nic.days[d];
  save(); render();
}

/* Sóvárgás SOS: vezetett légzés */
let breathTimer = null;
function openSOS() {
  openSheet(`<h2 style="margin-top:0">A sóvárgás egy hullám 🌊</h2>
    <p class="small muted">Általában 3-5 perc alatt csúcsra ér, aztán elmúlik. Nem kell semmit tenned, csak lovagold meg. Lélegezz velem:</p>
    <div class="breath" id="breath">Belégzés</div>
    <div style="text-align:center" class="muted small" id="breathCount"></div>
    <div class="card" style="background:var(--card2);margin-top:12px"><b>Közben:</b><div class="small">
    • Igyál meg egy nagy pohár vizet.<br>• Menj ki 5 percre, sétálj egyet.<br>• Csinálj 10 guggolást vagy fekvőtámaszt.<br>• Emlékezz: minden legyőzött sóvárgás gyengíti a következőt.</div></div>
    <button class="btn ok" style="margin-top:12px" onclick="resistCraving()">💪 Kibírtam!</button>`);
  let phase = 0, cycles = 0;
  const box = $('#breath');
  const seq = [['Belégzés', 4, 'scale(1)'], ['Tartsd', 4, 'scale(1)'], ['Kilégzés', 6, 'scale(.6)']];
  const stepB = () => {
    const [t, sec, tr] = seq[phase];
    if (!$('#breath')) return;
    box.textContent = t; box.style.transitionDuration = sec + 's'; box.style.transform = tr;
    phase = (phase + 1) % 3; if (phase === 0) cycles++;
    $('#breathCount').textContent = `${cycles} kör kész`;
    breathTimer = setTimeout(stepB, sec * 1000);
  };
  setTimeout(stepB, 300);
}
function resistCraving() {
  const t = today();
  S.nic.cravings[t] = (S.nic.cravings[t] || 0) + 1;
  save(); closeSheet(); render();
  toast('🏆 Legyőzted! Büszke lehetsz magadra.');
}

/* ---------- MEDITÁCIÓ ---------- */
const MED_TYPES = [
  ['Légzésfigyelés', 'Ülj kényelmesen, csukd be a szemed. Figyeld, ahogy a levegő be- és kiáramlik. Ha elkalandozol, kedvesen térj vissza a légzéshez.'],
  ['Testpásztázás', 'Lassan haladj végig a figyelmeddel a lábujjaidtól a fejed búbjáig. Csak vedd észre az érzeteket, ne akarj változtatni rajtuk. Futás után különösen jó.'],
  ['Box légzés (4-4-4-4)', '4 mp belégzés, 4 mp bent tartás, 4 mp kilégzés, 4 mp szünet. Megnyugtatja az idegrendszert, sóvárgás ellen is szuper.'],
  ['Szerető kedvesség', 'Ismételd magadban: „Legyek egészséges. Legyek nyugodt. Legyek erős.” Aztán küldd ugyanezt valakinek, aki fontos neked.'],
  ['Hála', 'Gondolj végig 3 dolgot, amiért ma hálás vagy. Időzz el mindegyiknél, és érezd is a hálát.'],
  ['Vizualizáció: a befutó', 'Képzeld el a maraton utolsó kilométerét: a tömeget, a lábad érzetét, ahogy átfutsz a célvonalon. Éld át minden részletét.'],
  ['Sóvárgás meglovaglása', 'Ha jön a nikotin utáni vágy, ne harcolj ellene. Figyeld meg, hol érzed a testedben, és nézd, ahogy hullámként felerősödik, majd elhalványul.'],
  ['Egyéb', 'Bármilyen gyakorlat, vezetett meditáció appból vagy YouTube-ról.']
];
function medSuggestion(date) {
  const d = parse(date), start = new Date(d.getFullYear(), 0, 0);
  const i = Math.floor((d - start) / 864e5) % 7;
  return { name: MED_TYPES[i][0], guide: MED_TYPES[i][1] };
}
function medStreak() {
  let d = new Date(), n = 0;
  const has = x => S.med.sessions.some(s => s.date === iso(x));
  if (!has(d)) d = addDays(d, -1);
  while (has(d)) { n++; d = addDays(d, -1); }
  return n;
}
function viewMed() {
  const t = today(), sug = medSuggestion(t);
  const total = S.med.sessions.reduce((a, x) => a + x.min, 0);
  const todayMin = S.med.sessions.filter(x => x.date === t).reduce((a, x) => a + x.min, 0);
  const list = [...S.med.sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return `<div class="card hero" style="margin-top:12px"><div class="small" style="color:#d8cffc">A mai javaslat</div>
    <h2 style="margin:4px 0">🧘 ${sug.name}</h2><div class="small">${sug.guide}</div>
    <div class="btns"><button class="btn primary" onclick="openMedTimer('${sug.name}')">▶ ${S.med.target} perc indítása</button></div></div>
    <div class="grid3"><div class="stat"><b>${todayMin}/${S.med.target}</b><span>mai perc</span></div>
    <div class="stat"><b>${medStreak()}</b><span>napos sorozat</span></div>
    <div class="stat"><b>${total}</b><span>összes perc</span></div></div>
    <div class="btns"><button class="btn" onclick="openMedTimer()">⏱ Időzítő</button><button class="btn" onclick="openMedForm()">✎ Kézi rögzítés</button></div>
    <h2>Naptár</h2><div class="card">${calendar(10, (d, isT, fut) => {
      const m = S.med.sessions.filter(x => x.date === d).reduce((a, x) => a + x.min, 0);
      return `<div class="${m >= S.med.target ? 'lvl2' : m ? 'lvl1' : ''} ${isT ? 'today' : ''} ${fut ? 'future' : ''}">${parse(d).getDate()}</div>`;
    })}<div class="small muted" style="margin-top:8px">Halvány: meditáltál · erős: elérted a napi célt</div></div>
    <h2>Meditációs napló</h2><div class="card list">${list.length ? list.map(x => `<div class="item" onclick="openMedForm('${x.id}')" style="cursor:pointer">
      <div><b>${esc(x.type)}</b> <span class="small muted">· ${x.min} perc</span><div class="small muted">${fmtDateLong(x.date)}</div>${x.note ? `<div class="small">${esc(x.note)}</div>` : ''}</div></div>`).join('')
      : '<div class="small muted">Még nincs bejegyzés. Kezdd ma 5-10 perccel!</div>'}</div>
    <h2>Napi cél</h2><div class="card"><label>Hány percet szeretnél naponta meditálni?</label>
    <div class="chips">${[5, 10, 15, 20, 30].map(m => `<button class="chip ${S.med.target === m ? 'on' : ''}" onclick="S.med.target=${m};save();render()">${m} perc</button>`).join('')}</div></div>`;
}
function openMedForm(id, preset = {}) {
  const x = id ? S.med.sessions.find(s => s.id === id) : { date: today(), min: S.med.target, type: medSuggestion(today()).name, note: '', ...preset };
  openSheet(`<h2 style="margin-top:0">${id ? 'Meditáció szerkesztése' : 'Meditáció rögzítése'}</h2>
    <label>Dátum</label><input type="date" id="mDate" value="${x.date}">
    <label>Időtartam (perc)</label><input id="mMin" inputmode="numeric" value="${x.min}">
    <label>Mit meditáltál?</label><select id="mType">${MED_TYPES.map(([n]) => `<option ${n === x.type ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <label>Jegyzet: mire figyeltél, mit éreztél?</label><textarea id="mNote" placeholder="pl. nehezen ment a lecsendesedés, de a végére megnyugodtam">${esc(x.note)}</textarea>
    <button class="btn primary" style="margin-top:14px" onclick="saveMed('${id || ''}')">Mentés</button>
    ${id ? `<button class="btn bad" style="margin-top:8px" onclick="delMed('${id}')">Törlés</button>` : ''}`);
}
function saveMed(id) {
  const min = parseInt($('#mMin').value, 10);
  if (!(min > 0)) { toast('Add meg a perceket'); return; }
  const x = { id: id || uid(), date: $('#mDate').value || today(), min, type: $('#mType').value, note: $('#mNote').value.trim() };
  if (id) S.med.sessions = S.med.sessions.map(s => s.id === id ? x : s); else S.med.sessions.push(x);
  save(); closeSheet(); render(); toast('🧘 Elmentve');
}
function delMed(id) {
  if (!confirm('Törlöd ezt a bejegyzést?')) return;
  S.med.sessions = S.med.sessions.filter(s => s.id !== id); save(); closeSheet(); render();
}

/* Meditációs időzítő */
let medTick = null, wakeLock = null, audio = null;
function stopTimers() {
  clearInterval(medTick); medTick = null;
  clearTimeout(breathTimer); breathTimer = null;
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
function bell() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, 1.2].forEach(off => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 528; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, audio.currentTime + off);
      g.gain.exponentialRampToValueAtTime(0.4, audio.currentTime + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + off + 3);
      o.connect(g).connect(audio.destination); o.start(audio.currentTime + off); o.stop(audio.currentTime + off + 3);
    });
  } catch (e) {}
  navigator.vibrate && navigator.vibrate([300, 200, 300]);
}
function openMedTimer(type) {
  type = type || medSuggestion(today()).name;
  const guide = (MED_TYPES.find(m => m[0] === type) || MED_TYPES[0])[1];
  let minutes = S.med.target, endAt = null, left = minutes * 60, running = false;
  openSheet(`<h2 style="margin-top:0">🧘 ${esc(type)}</h2><p class="small muted">${guide}</p>
    <div class="chips" id="tChips" style="justify-content:center">${[3, 5, 10, 15, 20, 30].map(m => `<button class="chip ${m === minutes ? 'on' : ''}" data-m="${m}">${m}'</button>`).join('')}</div>
    <div class="timer"><div class="ring"><svg width="220" height="220"><circle cx="110" cy="110" r="100" stroke="#2a2c37" stroke-width="10" fill="none"/>
    <circle id="tArc" cx="110" cy="110" r="100" stroke="url(#tg)" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="628.3" stroke-dashoffset="0"/>
    <defs><linearGradient id="tg"><stop offset="0" stop-color="#8b6cff"/><stop offset="1" stop-color="#ff5ca8"/></linearGradient></defs></svg>
    <div class="time" id="tTime">${fmtDur(left)}</div></div></div>
    <div class="btns"><button class="btn primary" id="tGo">▶ Indítás</button><button class="btn" id="tStop">Befejezés</button></div>`, sh => {
    const show = () => {
      $('#tTime').textContent = fmtDur(Math.max(0, left));
      $('#tArc').setAttribute('stroke-dashoffset', 628.3 * (1 - left / (minutes * 60)));
    };
    const finish = done => {
      stopTimers();
      const spent = done ? minutes : Math.round((minutes * 60 - left) / 60);
      if (done) bell();
      if (spent > 0) openMedForm(null, { min: spent, type });
      else closeSheet();
    };
    sh.querySelectorAll('#tChips .chip').forEach(c => c.onclick = () => {
      if (running || endAt) return;
      minutes = +c.dataset.m; left = minutes * 60;
      sh.querySelectorAll('#tChips .chip').forEach(x => x.classList.toggle('on', x === c));
      show();
    });
    $('#tGo').onclick = async () => {
      if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      if (running) {
        running = false; clearInterval(medTick); left = (endAt - Date.now()) / 1000; endAt = null;
        $('#tGo').textContent = '▶ Folytatás'; return;
      }
      running = true; endAt = Date.now() + left * 1000; $('#tGo').textContent = '❚❚ Szünet';
      try { wakeLock = await navigator.wakeLock?.request('screen'); } catch (e) {}
      medTick = setInterval(() => {
        left = (endAt - Date.now()) / 1000; show();
        if (left <= 0) { running = false; finish(true); }
      }, 250);
    };
    $('#tStop').onclick = () => { if (running) left = (endAt - Date.now()) / 1000; finish(false); };
  });
}

/* ---------- BEÁLLÍTÁSOK ---------- */
function openSettings() {
  const s = S.settings;
  openSheet(`<h2 style="margin-top:0">⚙️ Beállítások</h2>
    <h3>Profil</h3>
    <div class="grid3"><div><label>Név</label><input id="sName" value="${esc(s.name)}"></div>
    <div><label>Kor</label><input id="sAge" inputmode="numeric" value="${s.age}"></div>
    <div><label>Súly (kg)</label><input id="sW" inputmode="decimal" value="${s.weight}"></div></div>
    <div class="grid2"><div><label>Kényelmes tempó (p:mp /km)</label><input id="sPace" value="${fmtPace(s.pace)}"></div>
    <div><label>Kényelmes táv most (km)</label><input id="sKm" inputmode="decimal" value="${s.comfortKm}"></div></div>
    <h3 style="margin-top:18px">Maraton és terv</h3>
    <div class="grid2"><div><label>Maraton dátuma</label><input type="date" id="sRace" value="${s.raceDate}"></div>
    <div><label>Terv kezdete (hétfő)</label><input type="date" id="sStart" value="${s.planStart}"></div></div>
    <label>Futónapok</label><div class="chips" id="sDays">${DAY_SHORT.map((d, i) => `<button class="chip ${s.runDays.includes(i) ? 'on' : ''}" data-d="${i}">${d}</button>`).join('')}</div>
    <label>Hosszú futás napja</label><select id="sLong">${DAY_LONG.map((d, i) => `<option value="${i}" ${s.longDay === i ? 'selected' : ''}>${d}</option>`).join('')}</select>
    <p class="small muted">A heti 3-5 futás az ideális. 95 kg-nál a fokozatos terhelésnövelés (heti kb. 10%) és minden 4. héten egy könnyített hét védi az ízületeidet.</p>
    <button class="btn primary" id="sSave">Mentés és terv frissítése</button>
    <h3 style="margin-top:22px">Adatok</h3>
    <p class="small muted">Minden adat csak ezen a telefonon, a böngészőben tárolódik. Időnként készíts mentést!</p>
    <div class="btns"><button class="btn" onclick="exportData()">⬇ Mentés (JSON)</button><button class="btn" onclick="$('#imp').click()">⬆ Visszatöltés</button></div>
    <button class="btn" style="margin-top:8px" onclick="exportCSV()">Futások CSV-ben</button>
    <input type="file" id="imp" accept="application/json,.json" style="display:none" onchange="importData(this.files[0])">`, sh => {
    sh.querySelectorAll('#sDays .chip').forEach(c => c.onclick = () => c.classList.toggle('on'));
    $('#sSave').onclick = () => {
      const days = [...sh.querySelectorAll('#sDays .chip.on')].map(c => +c.dataset.d);
      const longDay = +$('#sLong').value;
      if (!days.includes(longDay)) days.push(longDay);
      if (days.length < 3 || days.length > 6) { toast('Válassz 3-6 futónapot'); return; }
      const pace = parseTime($('#sPace').value);
      if (pace < 180 || pace > 600) { toast('A tempó formátuma pl. 6:00'); return; }
      const start = iso(monday(parse($('#sStart').value || s.planStart)));
      const race = $('#sRace').value || s.raceDate;
      if (daysBetween(start, race) < 21) { toast('A maraton legyen legalább 3 héttel a kezdés után'); return; }
      const structural = start !== s.planStart || race !== s.raceDate || longDay !== s.longDay || days.sort().join() !== [...s.runDays].sort().join();
      Object.assign(s, {
        name: $('#sName').value.trim() || 'Futó', age: +$('#sAge').value || s.age, weight: parseFloat($('#sW').value) || s.weight,
        pace, comfortKm: parseFloat(String($('#sKm').value).replace(',', '.')) || s.comfortKm, raceDate: race, planStart: start, runDays: days.sort((a, b) => a - b), longDay
      });
      if (structural) S.ov = {};
      planWeek = null;
      save(); closeSheet(); render(); toast('Terv frissítve ✨');
    };
  });
}
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function exportData() { download(`peace-of-mind-${today()}.json`, JSON.stringify(S, null, 2), 'application/json'); }
function exportCSV() {
  const rows = [['datum', 'km', 'ido', 'tempo', 'edzes', 'futopad', 'nehezseg', 'jegyzet']].concat(
    [...S.runs].sort((a, b) => a.date.localeCompare(b.date)).map(r => [r.date, r.km, fmtDur(r.sec), fmtPace(r.sec / r.km), r.title || '', r.treadmill ? 'igen' : 'nem', r.rpe || '', (r.note || '').replace(/"/g, '""')]));
  download(`futasok-${today()}.csv`, rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n'), 'text/csv');
}
function importData(file) {
  if (!file) return;
  file.text().then(t => {
    const x = JSON.parse(t);
    if (!x.settings || !x.runs) throw new Error();
    if (!confirm('Felülírod a jelenlegi adatokat a mentéssel?')) return;
    localStorage.setItem(KEY, JSON.stringify(x)); S = load(); closeSheet(); render(); toast('Visszatöltve');
  }).catch(() => toast('Hibás mentésfájl'));
}

/* ---------- Indítás ---------- */
document.querySelectorAll('nav.tabs button').forEach(b => b.onclick = () => go(b.dataset.tab));
$('#gear').onclick = openSettings;
render();
// Éjfél után frissüljön a „ma”
document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#sheet')) render(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
