'use strict';
/*
 * Vezetett meditációk az appon belül: magyar felolvasás (a telefon beépített
 * hangjával), felirattal, halk háttérzajjal. Minden témában naponta más
 * gyakorlat jön, és a bevezetés és a zárás is változik.
 *
 * Egy szakasz: [szöveg, szünet mp-ben, rugalmas?]. A rugalmas szüneteket a
 * lejátszó úgy nyújtja, hogy a gyakorlat kitöltse a választott időt.
 */
const F = true;

const G_OPEN = [
  [['Helyezkedj el kényelmesen, ülve vagy fekve. Ha jólesik, csukd be a szemed.', 5],
   ['Vegyél egy mély levegőt az orrodon keresztül... és lassan fújd ki a szádon.', 6],
   ['Még egyszer: mély belégzés... és hosszú, lassú kilégzés.', 6],
   ['Most engedd, hogy a légzésed visszatérjen a saját, természetes ritmusához.', 8]],
  [['Szánj most egy kis időt csak magadra. Semmit nem kell elérned, semmit nem kell megoldanod.', 5],
   ['Érezd, ahogy a tested súlya a talajra vagy az ülésre nehezedik.', 6],
   ['Engedd el a vállaidat, lazítsd el az állkapcsodat és a homlokodat.', 8]],
  [['Üdvözöllek. Keress egy nyugodt helyet, ahol most néhány percig senki nem zavar.', 4],
   ['Figyeld meg, milyen hangokat hallasz magad körül. Nem kell velük semmit kezdened, csak vedd észre őket.', 8],
   ['Most fordítsd a figyelmed befelé, a légzésedre.', 6]],
  [['Ülj egyenes, de laza háttal, mintha egy fonal húzná a fejed búbját felfelé.', 4],
   ['Három mély lélegzettel érkezz meg ebbe a pillanatba.', 2],
   ['Egy...', 5], ['Kettő...', 5], ['Három...', 6],
   ['Itt vagy. Ez a néhány perc csak a tiéd.', 6]]
];

const G_CLOSE = [
  [['Lassan kezdj visszatérni. Mozgasd meg az ujjaidat és a lábujjaidat.', 5],
   ['Vegyél egy mély levegőt, és amikor készen állsz, nyisd ki a szemed.', 4],
   ['Köszönöm, hogy ma is időt szántál magadra.', 2]],
  [['Mielőtt befejeznénk, köszönd meg magadnak, hogy ma is itt voltál.', 5],
   ['Vidd magaddal ezt a nyugalmat a nap hátralévő részébe.', 4],
   ['Amikor készen állsz, nyisd ki a szemed.', 2]],
  [['Engedd el a gyakorlatot, és csak pihenj még egy kicsit a csendben.', 8],
   ['Érezd a tested egészét, ahogy itt van, nyugodtan és biztonságban.', 5],
   ['Lassan nyújtózz egyet, és nyisd ki a szemed.', 2]]
];
const G_CLOSE_SLEEP = [
  [['Most már nincs semmi dolgod. Engedd, hogy az álom magával vigyen.', 6], ['Jó éjszakát.', 2]],
  [['Maradj ebben a nyugalomban, és merülj egyre mélyebbre a pihenésbe.', 6], ['Szép álmokat.', 2]]
];

const G_THEMES = [
  { key: 'morning', icon: '🌅', name: 'Reggeli ébredés', len: 5, yt: 'reggeli vezetett meditáció magyarul', v: [
    ['Napindító légzés', [
      ['Képzeld el, hogy minden belégzéssel friss energia árad beléd, mint a reggeli napfény.', 8, F],
      ['Kilégzéskor engedd el az álmosságot és a nehézséget.', 8, F],
      ['Gondolj arra, mi az az egy dolog, amire ma igazán figyelni szeretnél.', 10, F],
      ['Mondd ki magadban: Ma jelen leszek. Ma törődöm magammal.', 8, F]]],
    ['Szándék a napra', [
      ['Kérdezd meg magadtól: hogyan szeretném érezni magam ma este, amikor lefekszem?', 10, F],
      ['Milyen lépés visz közelebb ehhez ma?', 10, F],
      ['Képzeld el, ahogy ezt a lépést megteszed, könnyedén és magabiztosan.', 10, F]]],
    ['Reggeli hála', [
      ['Gondolj három dologra, amiért ma reggel hálás vagy. Lehet egészen apró is: egy kávé illata, a meleg ágy, egy barát.', 12, F],
      ['Időzz el mindegyiknél, és engedd, hogy a hála érzése szétáradjon a mellkasodban.', 12, F],
      ['Ezzel a meleg érzéssel indulj neki a napnak.', 6, F]]],
    ['Ébredő test', [
      ['Vidd a figyelmed a lábadba. Érezd, ahogy ébredeznek.', 8, F],
      ['Most a hasad és a mellkasod: figyeld, ahogy a légzéssel emelkednek és süllyednek.', 8, F],
      ['A karjaid és a kezeid. Mozgasd meg finoman az ujjaidat.', 6, F],
      ['Végül a fejed és az arcod. Engedj meg egy halvány mosolyt.', 6, F]]]
  ] },
  { key: 'stress', icon: '😮‍💨', name: 'Stressz és szorongás oldása', len: 10, yt: 'vezetett meditáció stressz szorongás oldására magyarul', v: [
    ['Hosszú kilégzés', [
      ['A stressz ellen az egyik leghatékonyabb eszköz a hosszú kilégzés. Lélegezz be négyig, és fújd ki hatig.', 3],
      ['Be... kettő, három, négy.', 1], ['Ki... kettő, három, négy, öt, hat.', 2],
      ['Be... kettő, három, négy.', 1], ['Ki... kettő, három, négy, öt, hat.', 2],
      ['Folytasd ezt a ritmust a saját tempódban.', 30, F],
      ['Figyeld meg, ahogy minden kilégzéssel egy kicsit lassabb lesz a szívverésed.', 20, F]]],
    ['Gondolatok, mint a felhők', [
      ['Képzeld el, hogy egy réten fekszel, és az eget nézed.', 10, F],
      ['Minden gondolatod egy felhő. Megjelenik, átúszik az égen, majd eltűnik.', 15, F],
      ['Nem kell egyikbe sem belekapaszkodnod. Csak figyeld, ahogy jönnek és mennek.', 20, F],
      ['Te vagy az ég, nem a felhők. Az ég mindig ott van, nyugodtan és tágasan.', 15, F]]],
    ['Öt érzék', [
      ['Ha szorongsz, hozd vissza magad a jelenbe az érzékeiddel.', 3],
      ['Vegyél észre öt dolgot, amit látsz. Ha csukva a szemed, képzeld el a szobát magad körül.', 12, F],
      ['Négy dolgot, amit érzel: a ruhát a bőrödön, a talajt a talpad alatt.', 12, F],
      ['Három hangot, amit hallasz.', 10, F],
      ['Két illatot.', 8, F],
      ['És egy ízt a szádban.', 6, F],
      ['Itt vagy, most, biztonságban.', 10, F]]],
    ['Feszítés és lazítás', [
      ['Szorítsd ökölbe a kezed, és tartsd öt másodpercig.', 5],
      ['Most engedd el, és figyeld, ahogy szétárad a lazaság.', 10, F],
      ['Húzd fel a vállaidat a füledig, és tartsd.', 5],
      ['Engedd le. Érezd a különbséget.', 10, F],
      ['Szorítsd össze az arcod minden izmát.', 5],
      ['És lazíts. Engedd, hogy a feszültség kifolyjon belőled.', 15, F]]]
  ] },
  { key: 'breath', icon: '🌬️', name: 'Légzőgyakorlat', len: 5, yt: 'vezetett légzőgyakorlat meditáció magyarul', v: [
    ['Négyszög légzés', [
      ['Most négyszög légzést gyakorolunk: négy ütem be, négy bent, négy ki, négy szünet.', 3],
      ['Be...', 4], ['Tartsd...', 4], ['Ki...', 4], ['Szünet...', 4],
      ['Be...', 4], ['Tartsd...', 4], ['Ki...', 4], ['Szünet...', 4],
      ['Be...', 4], ['Tartsd...', 4], ['Ki...', 4], ['Szünet...', 4],
      ['Folytasd egyedül ezt a ritmust.', 30, F]]],
    ['4-7-8 légzés', [
      ['Lélegezz be az orrodon négyig, tartsd bent hétig, és fújd ki a szádon nyolcig.', 3],
      ['Be...', 4], ['Tartsd...', 7], ['Ki...', 8],
      ['Be...', 4], ['Tartsd...', 7], ['Ki...', 8],
      ['Be...', 4], ['Tartsd...', 7], ['Ki...', 8],
      ['Folytasd még néhány körön át a saját tempódban.', 30, F]]],
    ['Légzésszámlálás', [
      ['Számold a kilégzéseidet egytől tízig. Minden kilégzés egy szám.', 20, F],
      ['Ha elveszíted a fonalat, semmi baj. Egyszerűen kezdd újra egytől.', 30, F],
      ['Nem a tíz a cél, hanem az, hogy újra és újra visszatérj.', 30, F]]],
    ['Hasi légzés', [
      ['Tedd az egyik kezed a mellkasodra, a másikat a hasadra.', 4],
      ['Lélegezz úgy, hogy csak a hasadon lévő kéz mozduljon.', 25, F],
      ['Ez a rekeszizom-légzés. Futás közben is ez segít, hogy több levegőhöz juss.', 25, F],
      ['Figyeld, ahogy a hasad lágyan emelkedik és süllyed.', 20, F]]]
  ] },
  { key: 'body', icon: '🧍', name: 'Testpásztázás', len: 10, yt: 'testpásztázás vezetett meditáció magyarul', v: [
    ['Lábtól a fejig', [
      ['Most végighaladunk a testeden. Nem kell semmin változtatnod, csak figyeld meg az érzeteket.', 4],
      ['Vidd a figyelmed a lábfejedbe és a talpadba.', 10, F],
      ['A vádlidba és a térdedbe.', 10, F],
      ['A combodba és a csípődbe.', 10, F],
      ['A hasadba és a hátad alsó részébe.', 10, F],
      ['A mellkasodba, a hátad felső részébe és a válladba.', 10, F],
      ['A karodba és a kezedbe, egészen az ujjbegyekig.', 10, F],
      ['A nyakadba, az arcodba és a fejed búbjáig.', 10, F]]],
    ['A futó test', [
      ['Ma a futásban dolgozó testrészeidnek szánsz figyelmet.', 4],
      ['Vidd a figyelmed a talpadba. Köszönd meg neki a sok lépést.', 12, F],
      ['A vádlid és az Achilles-inad. Engedd el bennük a feszültséget.', 12, F],
      ['A combod és a csípőd, ahonnan az erőd jön.', 12, F],
      ['A tüdőd, ami minden futásnál levegővel tölt meg.', 12, F],
      ['És a szíved, ami minden edzéssel erősebb lesz.', 12, F]]],
    ['Meleg fény', [
      ['Képzeld el, hogy egy meleg, aranyszínű fény érinti a lábfejed.', 10, F],
      ['A fény lassan felkúszik a lábadon, és ahol jár, ott minden ellazul.', 12, F],
      ['Most a törzsedet tölti meg: a hasadat, a mellkasodat, a hátadat.', 12, F],
      ['Átárad a karjaidba és a kezeidbe.', 10, F],
      ['Végül a nyakadat és a fejedet is betölti.', 10, F],
      ['Az egész tested lazán, melegen pihen.', 12, F]]]
  ] },
  { key: 'quit', icon: '🚭', name: 'Leszokás, sóvárgás kezelése', len: 5, yt: 'vezetett meditáció leszokás sóvárgás függőség magyarul', v: [
    ['A hullám meglovaglása', [
      ['Ha most sóvárgást érzel, ne harcolj ellene. Csak figyeld meg.', 8, F],
      ['Hol érzed a testedben? A torkodban, a mellkasodban, a kezedben?', 10, F],
      ['Képzeld el, hogy ez egy hullám. Most emelkedik...', 10, F],
      ['Eléri a csúcsát...', 10, F],
      ['És lassan elhalványul. Minden sóvárgás elmúlik, ha nem táplálod.', 10, F],
      ['Te vagy a szörfös, aki meglovagolja a hullámot.', 8, F]]],
    ['Miért csinálod?', [
      ['Gondolj arra, miért döntöttél úgy, hogy elhagyod a nikotint.', 12, F],
      ['Képzeld el magad egy év múlva: tisztán lélegzel, könnyebben futsz, szabad vagy.', 12, F],
      ['Érezd, milyen jó lesz átfutni a maraton célvonalán, nikotin nélkül.', 12, F],
      ['Mondd ki magadban: Én irányítok. Nem a nikotin.', 8, F]]],
    ['Tiszta levegő', [
      ['Minden belégzés tiszta, friss levegő, ami gyógyítja a tested.', 12, F],
      ['Minden kilégzéssel elengedsz egy kicsit a régi szokásból.', 12, F],
      ['A tested már most is regenerálódik. Minden nikotinmentes óra számít.', 12, F]]],
    ['STOP módszer', [
      ['Ha jön a vágy, használd a STOP módszert.', 3],
      ['S, mint stop. Állj meg egy pillanatra.', 8, F],
      ['T, mint térj vissza a légzésedhez. Vegyél három mély lélegzetet.', 15, F],
      ['O, mint okok: ismerd fel, mi történik benned. Unalom, stressz vagy csak megszokás?', 12, F],
      ['P, mint pozitív döntés: válassz valami jobbat. Igyál egy pohár vizet, vagy menj ki sétálni.', 10, F]]]
  ] },
  { key: 'confidence', icon: '💪', name: 'Önbizalom és motiváció', len: 10, yt: 'vezetett meditáció önbizalom motiváció magyarul', v: [
    ['Az erőd forrása', [
      ['Idézz fel egy pillanatot, amikor büszke voltál magadra.', 12, F],
      ['Hol voltál? Mit éreztél? Éld át újra.', 15, F],
      ['Ez az erő most is benned van.', 10, F],
      ['Mondd magadban: Képes vagyok rá. Lépésről lépésre haladok.', 10, F]]],
    ['A célvonal', [
      ['Képzeld el a verseny reggelét. Nyugodt vagy és felkészült.', 12, F],
      ['Elindulsz, és könnyedén, egyenletesen futsz a tömegben.', 12, F],
      ['A harmincadik kilométernél nehéz, de eszedbe jut minden edzés, amit megcsináltál.', 12, F],
      ['Látod a célkaput. Hallod a tömeget. Átfutsz.', 12, F],
      ['Érezd ezt az örömöt. Ez vár rád.', 12, F]]],
    ['Megerősítések', [
      ['Ismételd magadban, lassan, minden mondat után egy mély lélegzettel.', 2],
      ['Elég vagyok.', 10, F],
      ['Minden nappal erősebb vagyok.', 10, F],
      ['Kedves vagyok magamhoz, akkor is, ha hibázok.', 10, F],
      ['Megérdemlem, hogy egészséges és boldog legyek.', 10, F]]]
  ] },
  { key: 'recovery', icon: '🏃', name: 'Futás utáni relaxáció', len: 10, yt: 'jóga nidra relaxáció magyarul', v: [
    ['Levezető pihenés', [
      ['Feküdj le, ha teheted, és tedd fel a lábad, ha jólesik.', 8, F],
      ['Érezd, ahogy a lábaidból kiárad a fáradtság a talajba.', 15, F],
      ['A szíved lassul, a légzésed elmélyül.', 15, F],
      ['A tested most épül és erősödik. A pihenés is az edzés része.', 15, F]]],
    ['Köszönet a testnek', [
      ['Köszönd meg a testednek a mai mozgást.', 6, F],
      ['A lábaidnak, amik vittek.', 10, F],
      ['A tüdődnek, ami levegőt adott.', 10, F],
      ['A szívednek, ami kitartott.', 10, F],
      ['Engedd, hogy a tested most mélyen pihenjen.', 15, F]]],
    ['Jóga nidra', [
      ['Most mélyen ellazulsz, de ébren maradsz.', 6, F],
      ['Mondj magadban egy rövid szándékot, például: Nyugodt és erős vagyok.', 10, F],
      ['Vidd a figyelmed a jobb kezedbe: a hüvelykujjadba, a mutatóujjadba, a középső ujjadba, a gyűrűsujjadba, a kisujjadba.', 10, F],
      ['Most a bal kezedbe, ugyanígy, ujjról ujjra.', 10, F],
      ['A jobb lábadba, majd a bal lábadba.', 10, F],
      ['Az egész tested. Az egész tested együtt, nyugalomban.', 15, F],
      ['Ismételd el magadban a szándékodat.', 8, F]]]
  ] },
  { key: 'sleep', icon: '🌙', name: 'Elalvás előtt', len: 15, sleep: true, yt: 'elalvást segítő vezetett meditáció magyarul', v: [
    ['Elengedés', [
      ['Feküdj kényelmesen, és engedd, hogy az ágy megtartson.', 10, F],
      ['A nap véget ért. Bármi történt, most elengedheted.', 15, F],
      ['Minden kilégzéssel egyre nehezebb és melegebb a tested.', 20, F],
      ['Nincs más dolgod, csak pihenni.', 20, F]]],
    ['Visszaszámlálás', [
      ['Számolj lassan visszafelé százból, minden kilégzésre egy számot.', 30, F],
      ['Ha elkalandozol, kezdd újra onnan, ahol emlékszel.', 30, F],
      ['Engedd, hogy a számok egyre halkabbak és távolabbiak legyenek.', 30, F]]],
    ['Biztonságos hely', [
      ['Képzelj el egy helyet, ahol teljesen biztonságban és nyugalomban érzed magad.', 10, F],
      ['Lehet egy tengerpart, egy erdő, vagy egy meleg szoba.', 12, F],
      ['Mit látsz ott? Milyen hangokat hallasz? Milyen az illat?', 15, F],
      ['Maradj itt, ameddig csak jólesik.', 20, F]]]
  ] }
];

function dayIndex(date) {
  const d = parse(date);
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) + d.getFullYear() * 366;
}
// A mai gyakorlat egy témában (témánként eltolva, hogy ne egyszerre váltsanak)
function guidedToday(theme, date) {
  const di = dayIndex(date || today());
  const ti = G_THEMES.indexOf(theme);
  const [title, core] = theme.v[(di + ti) % theme.v.length];
  const open = G_OPEN[(di + ti * 3) % G_OPEN.length];
  const closes = theme.sleep ? G_CLOSE_SLEEP : G_CLOSE;
  const close = closes[(di + ti) % closes.length];
  return { title, segs: [...open, ...core, ...close] };
}

/* ---------- Lejátszó ---------- */
let gp = null; // aktuális lejátszás állapota

function huVoice() {
  const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  return vs.find(v => /^hu/i.test(v.lang) && /mariska|tünde|noemi/i.test(v.name)) || vs.find(v => /^hu/i.test(v.lang)) || null;
}
if (window.speechSynthesis) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; }

function noiseStart() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const len = audio.sampleRate * 4, buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } // barna zaj
    const src = audio.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = audio.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
    const g = audio.createGain(); g.gain.value = 0.0001;
    src.connect(lp).connect(g).connect(audio.destination); src.start();
    g.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 3);
    return { src, g };
  } catch (e) { return null; }
}
function noiseStop(n) {
  if (!n) return;
  try { n.g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.5); setTimeout(() => n.src.stop(), 1600); } catch (e) {}
}

function gpStop() {
  if (!gp) return;
  clearTimeout(gp.timer); clearInterval(gp.tick);
  if (window.speechSynthesis) speechSynthesis.cancel();
  noiseStop(gp.noise);
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  gp = null;
}

function openGuided(key) {
  const theme = G_THEMES.find(t => t.key === key);
  const g = guidedToday(theme);
  let minutes = theme.len;
  const voice = huVoice();
  openSheet(`<span class="pill">${theme.icon} ${esc(theme.name)}</span>
    <h2 style="margin:8px 0 2px">${esc(g.title)}</h2>
    <div class="small muted">A mai gyakorlat ebben a témában. Holnap másik jön.</div>
    <div class="chips" id="gChips" style="margin-top:12px">${[5, 10, 15, 20].map(m => `<button class="chip ${m === minutes ? 'on' : ''}" data-m="${m}">${m} perc</button>`).join('')}</div>
    <div class="toggle"><b>Halk háttérhang</b><input type="checkbox" id="gNoise" checked></div>
    <div class="card" style="background:var(--card2);margin-top:12px;min-height:120px;display:flex;align-items:center;justify-content:center;text-align:center">
      <div id="gText" style="font-size:19px;line-height:1.45">${voice ? 'Tedd fel a fülhallgatót, vagy hangosítsd fel a telefont, aztán nyomd meg az Indítást.' : 'A telefonodon nem találtam magyar felolvasó hangot, ezért a szöveget itt olvashatod. (iPhone-on: Beállítások → Kisegítő lehetőségek → Felolvasott tartalom → Hangok → Magyar.)'}</div></div>
    <div class="bar" style="margin-top:12px"><i id="gBar" style="width:0%"></i></div>
    <div class="row between small muted" style="margin-top:6px"><span id="gEl">0:00</span><span id="gTot">${minutes}:00</span></div>
    <div class="btns"><button class="btn primary" id="gGo">▶ Indítás</button><button class="btn" id="gEnd">Befejezés</button></div>`, sh => {
    sh.querySelectorAll('#gChips .chip').forEach(c => c.onclick = () => {
      if (gp) return;
      minutes = +c.dataset.m; $('#gTot').textContent = minutes + ':00';
      sh.querySelectorAll('#gChips .chip').forEach(x => x.classList.toggle('on', x === c));
    });
    $('#gGo').onclick = () => {
      if (!gp) return gpStart(g, minutes, voice, theme);
      if (gp.paused) gpResume(); else gpPause();
    };
    $('#gEnd').onclick = () => gpFinish(false);
  });
}

function gpElapsed() { return gp ? (gp.acc + (gp.paused ? 0 : Date.now() - gp.startAt)) / 1000 : 0; }

function gpStart(g, minutes, voice, theme) {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  gp = { g, theme, total: minutes * 60, voice, i: -1, acc: 0, startAt: Date.now(), paused: false, timer: null };
  if ($('#gNoise').checked) gp.noise = noiseStart();
  try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => { wakeLock = w; }).catch(() => {}); } catch (e) {}
  bell();
  $('#gGo').textContent = '❚❚ Szünet';
  gp.tick = setInterval(() => {
    if (!gp || !$('#gBar')) return;
    const e = gpElapsed();
    $('#gBar').style.width = Math.min(100, e / gp.total * 100) + '%';
    $('#gEl').textContent = fmtDur(e);
  }, 500);
  // iOS: az első felolvasásnak közvetlenül a koppintásból kell indulnia
  gpNext();
}

function gpSpeak(text, done) {
  $('#gText').textContent = text;
  if (!gp.voice || !window.speechSynthesis) {
    // hang nélkül: annyi ideig marad kint a szöveg, amennyi idő alatt elolvasható
    gp.timer = setTimeout(done, 1500 + text.length * 70);
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = gp.voice; u.lang = gp.voice.lang; u.rate = 0.82; u.pitch = 0.95;
  let fired = false;
  const fin = () => { if (!fired) { fired = true; done(); } };
  u.onend = fin; u.onerror = fin;
  gp.utter = u;
  speechSynthesis.speak(u);
  // biztonsági háló, ha az onend nem érkezik meg
  gp.timer = setTimeout(fin, 4000 + text.length * 120);
}

// A hátralévő rugalmas szünetek kitöltik a választott időtartamot
function gpPauseFor(idx) {
  const segs = gp.g.segs, [, base, flex] = segs[idx];
  if (!flex) return base;
  let speech = 0, fixed = 0, flexBase = 0;
  for (let j = idx + 1; j < segs.length; j++) {
    speech += 1 + segs[j][0].length * 0.085;
    if (segs[j][2]) flexBase += segs[j][1]; else fixed += segs[j][1];
  }
  const left = gp.total - gpElapsed() - speech - fixed;
  const share = left * base / (base + flexBase);
  return clamp(share, base * 0.6, 180);
}

function gpNext() {
  if (!gp || gp.paused) return;
  gp.i++;
  if (gp.i >= gp.g.segs.length) return gpFinish(true);
  const idx = gp.i;
  gpSpeak(gp.g.segs[idx][0], () => {
    if (!gp || gp.paused || gp.i !== idx) return;
    clearTimeout(gp.timer);
    gp.timer = setTimeout(gpNext, gpPauseFor(idx) * 1000);
  });
}

function gpPause() {
  gp.paused = true; gp.acc += Date.now() - gp.startAt;
  clearTimeout(gp.timer);
  if (window.speechSynthesis) speechSynthesis.cancel();
  $('#gGo').textContent = '▶ Folytatás';
}
function gpResume() {
  gp.paused = false; gp.startAt = Date.now();
  gp.i--; // az aktuális mondatot újra elmondjuk
  $('#gGo').textContent = '❚❚ Szünet';
  gpNext();
}

function gpFinish(done) {
  if (!gp) { closeSheet(); return; }
  const min = Math.max(done ? Math.round(gp.total / 60) : Math.round(gpElapsed() / 60), 0);
  const { theme, g } = gp;
  if (done) bell();
  gpStop();
  if (min > 0) openMedForm(null, { min, type: 'Vezetett meditáció', note: `${theme.name}: ${g.title}` });
  else closeSheet();
}
