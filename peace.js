'use strict';
/*
 * Belső béke (Find inner peace): 8 hetes, MBSR-ihlette program.
 * Minden nap: hangulat-bejelentkezés, a hét témájához illő meditáció,
 * napló (mit meditáltál, mi jött fel, a nap kérdése, 3 jó dolog), és
 * stressz előtte/utána. A program a kitöltött napok szerint halad, így
 * egy kihagyott nap nem ugrik át leckét.
 */
const PEACE_WEEKS = [
  { name: 'Érkezés a jelenbe', theme: 'breath', min: 5,
    intro: 'Az első héten csak megtanulsz megérkezni. A légzés mindig veled van, ez lesz a horgonyod.',
    how: 'Ülj kényelmesen, csukd be a szemed. Figyeld a légzést ott, ahol a legjobban érzed: az orrodnál, a mellkasodnál vagy a hasadnál. Ha elkalandozol, az nem hiba: vedd észre, hová mentél, és kedvesen térj vissza.',
    practice: 'Ma egy hétköznapi dolgot (fogmosás, kávé, zuhany) csinálj teljes figyelemmel.',
    prompts: [
      'Milyen volt ma csak ülni és lélegezni? Mi volt könnyű, és mi volt nehéz?',
      'Hová kalandoztak ma a gondolataid meditáció közben? Van valami, ami újra és újra visszatér?',
      'Mikor voltál ma igazán jelen, akár csak egy percre? Mit csináltál akkor?',
      'Milyen testi érzetet vettél észre a légzés közben, amit eddig nem?',
      'Mi vitte el ma a figyelmed a jelenből (telefon, aggodalom, sietség)?',
      'Ha a mai napodat egy időjárással írnád le, milyen lenne, és miért?',
      'Heti visszatekintés: mi változott bennem ezen a héten? Mit viszek magammal a következő hétre?'] },
  { name: 'A test hangja', theme: 'body', min: 8,
    intro: 'A tested folyamatosan üzen: feszültséggel, fáradtsággal, könnyedséggel. Ezen a héten megtanulod meghallani.',
    how: 'Feküdj vagy ülj le. Haladj végig a figyelmeddel a lábujjaidtól a fejed búbjáig. Ne akarj semmin változtatni, csak vedd észre, mit érzel az adott testrészben.',
    practice: 'A következő futásodon egy kilométeren át csak a talpadra és a légzésedre figyelj.',
    prompts: [
      'Hol érezted ma a legtöbb feszültséget a testedben? Szerinted mi okozza?',
      'Melyik testrészedben volt ma a legkellemesebb érzés? Milyen volt rá figyelni?',
      'Hogyan érezted magad a testedben az utolsó futásod után? Mit üzent a tested?',
      'Volt ma olyan pillanat, amikor a tested előbb jelezte a stresszt, mint a fejed?',
      'Hogyan aludtál, és ez hogyan hatott a mai napodra?',
      'Mit köszönhetsz ma a testednek?',
      'Heti visszatekintés: mit tanultam a testemről ezen a héten?'] },
  { name: 'Örömteli pillanatok', theme: 'morning', min: 10,
    intro: 'Az agyunk a veszélyre van hangolva, a jót könnyen elengedi. Ezen a héten tudatosan észreveszed a kellemes pillanatokat.',
    how: 'Meditáció közben idézz fel egy kellemes pillanatot a napodból. Figyeld meg, milyen gondolatok, érzések és testi érzetek kísérik.',
    practice: 'Napközben, ha valami jó történik, állj meg, és élvezd ki tudatosan 10 másodpercig.',
    prompts: [
      'Milyen kellemes pillanatot vettél észre ma? Mit éreztél közben a testedben?',
      'Mi volt ma egy apró dolog, ami mosolyt csalt az arcodra?',
      'Kivel töltöttél ma jó időt? Mit adott neked ez a találkozás?',
      'Milyen illatot, ízt vagy hangot élveztél ma?',
      'Mire vagy ma büszke, akármilyen kicsi dolog is?',
      'Mi tölt fel igazán? Mennyi ilyen volt az elmúlt napokban?',
      'Heti visszatekintés: mennyire vettem észre a jót ezen a héten, és mit változtatott ez?'] },
  { name: 'Stressz és reakció', theme: 'stress', min: 10,
    intro: 'A stressz nem ellenség, de érdemes megismerni a mintáidat: mi indítja be, és hogyan reagálsz rá.',
    how: 'Lélegezz be négyig, ki hatig, néhány körön át. Aztán idézz fel egy enyhén kellemetlen helyzetet, és figyeld meg, hol jelenik meg a testedben. Lélegezz bele abba a részbe.',
    practice: 'Ha ma stresszt érzel, csak nevezd meg magadban: „Most stresszt érzek.”',
    prompts: [
      'Mi okozott ma stresszt? Hogyan reagált rá a tested és a gondolataid?',
      'Milyen helyzetekben nyúlnál a nikotin után? Mi van ilyenkor valójában mögötte?',
      'Mi az a három dolog, ami a leggyakrabban kibillent? Látsz bennük közös mintát?',
      'Hogyan kezelted ma a stresszt? Mi segített, és mi nem?',
      'Mi az, ami felett nincs hatalmad? El tudnád engedni?',
      'Mit mondanál egy barátodnak, aki most ugyanazt a stresszt éli át, mint te?',
      'Heti visszatekintés: milyen stresszmintákat fedeztem fel magamban?'] },
  { name: 'Válasz reakció helyett', theme: 'quit', min: 12,
    intro: 'Az inger és a válasz között van egy kis tér. Ebben a térben van a szabadságod.',
    how: 'Gyakorold a STOP-ot: állj meg, vegyél három mély lélegzetet, figyeld meg, mi zajlik benned, aztán válaszd tudatosan a következő lépést.',
    practice: 'Ma legalább egyszer használd a STOP-ot, mielőtt reagálnál valamire.',
    prompts: [
      'Mikor reagáltál ma automatikusan? Mit válaszoltál volna, ha megállsz egy pillanatra?',
      'Jött ma sóvárgás? Mi történt, amikor megfigyelted ahelyett, hogy engedtél volna neki?',
      'Melyik szokásodat szeretnéd tudatos választásra cserélni?',
      'Mikor sikerült ma nyugodtan válaszolnod egy nehéz helyzetre?',
      'Mit érzel, amikor a nikotinmentes napjaidra gondolsz?',
      'Milyen értékek szerint szeretnél dönteni a nehéz pillanatokban?',
      'Heti visszatekintés: hol vettem észre a teret inger és válasz között?'] },
  { name: 'A gondolatok nem tények', theme: 'stress', min: 15,
    intro: 'A gondolataid jönnek-mennek, mint a felhők. Nem kell mindegyiknek hinned.',
    how: 'Figyeld a gondolataidat, ahogy megjelennek. Címkézd őket: „tervezés”, „aggódás”, „emlékezés”. Aztán engedd tovább őket, és térj vissza a légzéshez.',
    practice: 'Ha ma egy negatív gondolat jön, mondd magadban: „Ez csak egy gondolat.”',
    prompts: [
      'Milyen gondolat tért vissza ma többször? Mennyire igaz valójában?',
      'Milyen címkét adtál a leggyakrabban a gondolataidnak meditáció közben?',
      'Írj le egy önkritikus gondolatot, majd fogalmazd át úgy, ahogy egy jó barát mondaná.',
      'Mitől félsz most? Mi a legvalószínűbb kimenetel valójában?',
      'Mikor hittél ma el egy gondolatot, és ez hogyan befolyásolta, amit tettél?',
      'Milyen történetet mesélsz magadról, ami már nem szolgál téged?',
      'Heti visszatekintés: hogyan változott a viszonyom a gondolataimmal?'] },
  { name: 'Önegyüttérzés', theme: 'confidence', min: 15,
    intro: 'Ugyanazzal a kedvességgel bánni magaddal, ahogy egy baráttal tennéd: ez a belső béke alapja.',
    how: 'Tedd a kezed a szívedre. Ismételd magadban: „Legyek kedves magamhoz. Fogadjam el magam úgy, ahogy most vagyok. Legyek erős és nyugodt.” Aztán küldd ezeket a kívánságokat valakinek, aki fontos neked.',
    practice: 'Ha ma hibázol, úgy szólj magadhoz, ahogy egy jó barát szólna.',
    prompts: [
      'Hogyan beszéltél ma magadhoz? Kedvesen vagy keményen?',
      'Mit tennél másképp, ha teljesen elfogadnád magad?',
      'Kinek küldtél ma jókívánságot meditáció közben? Mit éreztél?',
      'Miben vagy túl szigorú magaddal? Mit mondanál most magadnak?',
      'Melyik az a három tulajdonságod, amit szeretsz magadban?',
      'Kinek vagy hálás az életedben, és elmondtad-e már neki?',
      'Heti visszatekintés: hogyan változott a kapcsolatom önmagammal?'] },
  { name: 'A saját utad', theme: 'recovery', min: 20,
    intro: 'Az utolsó héten összerakod a saját gyakorlatodat, amit a program után is folytatni tudsz.',
    how: 'Válaszd azt a meditációt, amelyik a legjobban esett az elmúlt hetekben, és csináld egy kicsit hosszabban, mint eddig.',
    practice: 'Gondold át, mikor és hol fogsz meditálni a program után is.',
    prompts: [
      'Melyik gyakorlat segített a legtöbbet az elmúlt hetekben, és miért?',
      'Mi változott a legtöbbet benned a program kezdete óta?',
      'Hogyan hatott a meditáció a futásodra és a nikotinmentességedre?',
      'Milyen napi rutint szeretnél megtartani?',
      'Mi az, ami még nehéz? Hogyan tudnál vele kedvesen bánni?',
      'Írj levelet magadnak, amit három hónap múlva fogsz elolvasni.',
      'Záró visszatekintés: mit jelent most számodra a belső béke?'] }
];
const PEACE_DAYS = PEACE_WEEKS.length * 7;
const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
const EMOTIONS = ['nyugodt', 'hálás', 'boldog', 'energikus', 'motivált', 'reményteli', 'fáradt', 'szorongó', 'ingerült', 'szomorú', 'magányos', 'zaklatott'];

const peaceEntries = () => (S.peace = S.peace || { entries: {} }).entries;
const peaceDone = () => Object.values(peaceEntries()).filter(e => e.day).length;
// A program napja egy dátumra: a már kitöltött nap saját száma, különben a következő
function peaceDayFor(date) {
  const e = peaceEntries()[date];
  return e && e.day ? e.day : peaceDone() + 1;
}
function peaceLesson(day) {
  const i = (day - 1) % PEACE_DAYS;
  const w = PEACE_WEEKS[Math.floor(i / 7)];
  return { week: Math.floor(i / 7) + 1, dow: i % 7 + 1, round: Math.floor((day - 1) / PEACE_DAYS) + 1, w, prompt: w.prompts[i % 7] };
}
const medMinOn = date => S.med.sessions.filter(x => x.date === date).reduce((a, x) => a + x.min, 0);
function peaceStreak() {
  const E = peaceEntries();
  let d = new Date(), n = 0;
  if (!E[iso(d)]) d = addDays(d, -1);
  while (E[iso(d)]) { n++; d = addDays(d, -1); }
  return n;
}

// Kártya a Ma fülre
function peaceTodayCard() {
  const t = today(), L = peaceLesson(peaceDayFor(t)), e = peaceEntries()[t], med = medMinOn(t);
  return `<h2>🕊️ Belső béke</h2><div class="card">
    <div class="small muted">${L.week}. hét · ${esc(L.w.name)} · ${L.dow}. nap</div>
    <b>${e ? '✅ Mai napló kész' : esc(L.prompt)}</b>
    <div class="small muted" style="margin-top:4px">${med ? `🧘 Ma ${med} perc meditáció` : `Mai meditáció: ${L.w.min} perc`}</div>
    <div class="btns"><button class="btn primary" onclick="go('med')">${e ? 'Megnyitás' : 'Mai nap kezdése'}</button></div></div>`;
}

function peaceHtml() {
  const t = today(), day = peaceDayFor(t), L = peaceLesson(day), e = peaceEntries()[t];
  const med = medMinOn(t), done = peaceDone();
  const theme = G_THEMES.find(x => x.key === L.w.theme);
  const progress = Math.min(done, PEACE_DAYS);
  return `<div class="card hero" style="margin-top:12px">
    <div class="small" style="color:#d8cffc">Find inner peace · ${L.round > 1 ? L.round + '. kör · ' : ''}${L.week}. hét / 8 · ${L.dow}. nap</div>
    <h2 style="margin:4px 0">🕊️ ${esc(L.w.name)}</h2>
    <div class="small">${esc(L.w.intro)}</div>
    <div class="bar" style="margin-top:10px"><i style="width:${progress / PEACE_DAYS * 100}%"></i></div>
    <div class="small" style="margin-top:6px;color:#d8cffc">${progress} / ${PEACE_DAYS} nap teljesítve · ${peaceStreak()} napos sorozat</div></div>

    <div class="card"><div class="row" style="align-items:flex-start"><div class="pill" style="flex:none">1</div><div style="flex:1">
      <b>Mai meditáció · ${L.w.min} perc</b><div class="small muted" style="margin-top:4px">${esc(L.w.how)}</div>
      <div class="btns"><button class="btn ${med ? '' : 'primary'}" onclick="openGuided('${theme.key}')">🎧 Vezetett videó</button>
      <button class="btn" onclick="openMedTimer(null, ${L.w.min})">⏱ Csendben</button></div>
      ${med ? `<div class="small c-easy" style="margin-top:8px">✓ Ma már ${med} percet meditáltál</div>` : ''}</div></div></div>

    <div class="card"><div class="row" style="align-items:flex-start"><div class="pill" style="flex:none">2</div><div style="flex:1">
      <b>Napló</b><div class="small muted" style="margin-top:4px">A nap kérdése: <i>${esc(L.prompt)}</i></div>
      ${e ? `<div class="small" style="margin-top:8px">${MOODS[e.mood - 1] || ''} ${esc((e.answer || e.medNote || '').slice(0, 140))}${(e.answer || '').length > 140 ? '…' : ''}</div>` : ''}
      <div class="btns"><button class="btn ${e ? '' : 'primary'}" onclick="openPeaceJournal('${t}')">${e ? '✎ Napló szerkesztése' : '✍️ Napló írása'}</button></div></div></div></div>

    <div class="card"><div class="row" style="align-items:flex-start"><div class="pill" style="flex:none">3</div><div style="flex:1">
      <b>Gyakorlat a napra</b><div class="small muted" style="margin-top:4px">${esc(L.w.practice)}</div></div></div></div>

    ${peaceProgressHtml()}`;
}

function peaceProgressHtml() {
  const E = peaceEntries();
  const dates = Object.keys(E).sort();
  if (!dates.length) return `<h2>Fejlődésed</h2><div class="card small muted">Az első napló után itt látod majd a hangulatod alakulását, a stressz csökkenését és a leggyakoribb érzéseidet.</div>`;
  // Hangulat az utolsó 14 napban
  const days = Array.from({ length: 14 }, (_, i) => iso(addDays(new Date(), i - 13)));
  const pts = days.map((d, i) => E[d] && E[d].mood ? [i, E[d].mood] : null).filter(Boolean);
  const X = i => 8 + i * (284 / 13), Y = m => 100 - (m - 1) * 22;
  const line = pts.map(([i, m], k) => `${k ? 'L' : 'M'}${X(i).toFixed(1)},${Y(m)}`).join(' ');
  const chart = `<svg viewBox="0 0 300 120" width="100%" height="130">
    ${[1, 2, 3, 4, 5].map(m => `<text x="0" y="${Y(m) + 4}" font-size="10">${MOODS[m - 1]}</text>`).join('')}
    <path d="${line}" fill="none" stroke="#8b6cff" stroke-width="2.5" stroke-linejoin="round" transform="translate(12,0)"/>
    ${pts.map(([i, m]) => `<circle cx="${X(i) + 12}" cy="${Y(m)}" r="4" fill="#ff5ca8"/>`).join('')}
    ${days.map((d, i) => i % 2 ? '' : `<text x="${X(i) + 12}" y="118" font-size="9" fill="#9a9cab" text-anchor="middle">${parse(d).getDate()}</text>`).join('')}</svg>`;
  // Stressz előtte/utána
  const st = dates.map(d => E[d]).filter(e => e.sb && e.sa).slice(-14);
  const avgB = st.length ? st.reduce((a, e) => a + e.sb, 0) / st.length : 0;
  const avgA = st.length ? st.reduce((a, e) => a + e.sa, 0) / st.length : 0;
  const f1 = v => (Math.round(v * 10) / 10).toLocaleString('hu-HU');
  // Leggyakoribb érzések (30 nap)
  const from = iso(addDays(new Date(), -29)), cnt = {};
  dates.filter(d => d >= from).forEach(d => (E[d].emo || []).forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const goods = dates.reduce((a, d) => a + (E[d].good || []).filter(Boolean).length, 0);
  const words = dates.reduce((a, d) => a + [E[d].answer, E[d].medNote, E[d].why, E[d].intent].join(' ').split(/\s+/).filter(Boolean).length, 0);
  return `<h2>Fejlődésed</h2>
    <div class="card"><b>Hangulat az elmúlt 14 napban</b>${chart}</div>
    <div class="grid2">
      <div class="stat"><b>${st.length ? `${f1(avgB)} → ${f1(avgA)}` : '–'}</b><span>stressz meditáció előtt → után (1-10)</span></div>
      <div class="stat"><b>${st.length ? (avgA <= avgB ? '−' : '+') + f1(Math.abs(avgB - avgA)) : '–'}</b><span>átlagos változás egy meditációval</span></div>
      <div class="stat"><b>${goods}</b><span>leírt jó dolog</span></div>
      <div class="stat"><b>${words.toLocaleString('hu-HU')}</b><span>leírt szó a naplódban</span></div></div>
    ${top.length ? `<div class="card" style="margin-top:12px"><b>Leggyakoribb érzéseid (30 nap)</b><div class="chips" style="margin-top:8px">${top.map(([k, v]) => `<span class="chip">${k} · ${v}</span>`).join('')}</div></div>` : ''}
    <h2>A naplód</h2><div class="card list">${dates.slice().reverse().slice(0, 60).map(d => {
      const e = E[d], L = e.day ? peaceLesson(e.day) : null;
      return `<div class="item" onclick="openPeaceJournal('${d}')" style="cursor:pointer;display:block">
        <div class="row between"><b>${MOODS[e.mood - 1] || '📝'} ${fmtDateLong(d)}</b><span class="small muted">${L ? `${L.week}. hét ${L.dow}. nap` : ''}</span></div>
        <div class="small muted">${esc((e.answer || e.medNote || '').slice(0, 110))}</div></div>`;
    }).join('')}</div>`;
}

function openPeaceJournal(date) {
  const E = peaceEntries(), e = E[date] || {};
  const L = peaceLesson(e.day || peaceDayFor(date));
  const med = medMinOn(date);
  const good = e.good || ['', '', ''];
  let mood = e.mood || 0, emo = new Set(e.emo || []);
  openSheet(`<div class="small muted">${fmtDateLong(date)} · ${L.week}. hét ${L.dow}. nap</div>
    <h2 style="margin:4px 0 10px">✍️ Belső béke napló</h2>
    <label>Hogy vagy most?</label><div class="chips" id="pMood">${MOODS.map((m, i) => `<button class="chip ${mood === i + 1 ? 'on' : ''}" data-v="${i + 1}" style="font-size:22px">${m}</button>`).join('')}</div>
    <label>Milyen érzések vannak benned?</label><div class="chips" id="pEmo">${EMOTIONS.map(x => `<button class="chip ${emo.has(x) ? 'on' : ''}" data-v="${x}">${x}</button>`).join('')}</div>
    <div class="grid2"><div><label>Stressz meditáció előtt: <b id="pSbV">${e.sb || 5}</b>/10</label><input type="range" min="1" max="10" id="pSb" value="${e.sb || 5}" style="padding:0" oninput="$('#pSbV').textContent=this.value"></div>
    <div><label>Stressz utána: <b id="pSaV">${e.sa || 5}</b>/10</label><input type="range" min="1" max="10" id="pSa" value="${e.sa || 5}" style="padding:0" oninput="$('#pSaV').textContent=this.value"></div></div>
    <label>Mit meditáltál, és mi jött fel közben?</label>
    <div class="small muted" style="margin-bottom:4px">${med ? `Ma ${med} perc meditációt rögzítettél.` : 'Ma még nem rögzítettél meditációt.'}</div>
    <textarea id="pMed" placeholder="Pl. légzésfigyelés, sokat kalandoztam a munka felé, a végére megnyugodtam...">${esc(e.medNote || '')}</textarea>
    <label>A nap kérdése</label><div class="small" style="margin-bottom:4px"><i>${esc(L.prompt)}</i></div>
    <textarea id="pAns" style="min-height:120px" placeholder="Írj szabadon, nincs jó vagy rossz válasz.">${esc(e.answer || '')}</textarea>
    <label>3 jó dolog ma</label>
    ${[0, 1, 2].map(i => `<input id="pG${i}" value="${esc(good[i] || '')}" placeholder="${i + 1}." style="margin-bottom:6px">`).join('')}
    <label>Miért történtek meg? (bármelyikre)</label><input id="pWhy" value="${esc(e.why || '')}" placeholder="Pl. mert időt szántam magamra">
    <label>Szándék holnapra</label><input id="pInt" value="${esc(e.intent || '')}" placeholder="Pl. türelmes leszek magammal">
    <button class="btn primary" style="margin-top:14px" id="pSave">Mentés</button>
    ${E[date] ? `<button class="btn bad" style="margin-top:8px" id="pDel">Bejegyzés törlése</button>` : ''}`, sh => {
    sh.querySelectorAll('#pMood .chip').forEach(c => c.onclick = () => {
      mood = +c.dataset.v; sh.querySelectorAll('#pMood .chip').forEach(x => x.classList.toggle('on', x === c));
    });
    sh.querySelectorAll('#pEmo .chip').forEach(c => c.onclick = () => {
      emo.has(c.dataset.v) ? emo.delete(c.dataset.v) : emo.add(c.dataset.v); c.classList.toggle('on');
    });
    $('#pSave').onclick = () => {
      const x = {
        day: e.day || peaceDayFor(date), mood, emo: [...emo], sb: +$('#pSb').value, sa: +$('#pSa').value,
        medNote: $('#pMed').value.trim(), answer: $('#pAns').value.trim(),
        good: [0, 1, 2].map(i => $('#pG' + i).value.trim()), why: $('#pWhy').value.trim(), intent: $('#pInt').value.trim()
      };
      if (!mood || !(x.answer || x.medNote)) { toast('Válassz hangulatot, és írj legalább pár sort'); return; }
      const first = !E[date];
      E[date] = x; save(); closeSheet(); render();
      toast(first ? (x.day % 7 === 0 ? `🎉 Megvan a ${Math.ceil(x.day / 7)}. hét!` : '🕊️ Mai nap kész. Holnap jön a következő.') : 'Elmentve');
    };
    if ($('#pDel')) $('#pDel').onclick = () => {
      if (!confirm('Törlöd ezt a naplóbejegyzést?')) return;
      delete E[date]; save(); closeSheet(); render();
    };
  });
}
