# Peace of Mind

Telefonra optimalizált webapp (PWA) a testi és lelki fejlődéshez:

- **Maratoni edzésterv** – heti bontású, a profilod alapján generált terv (alapozás → építkezés → csúcs → taper → verseny). Könnyű futás, rávezetők, fartlek, tempó, intervall, maratoni tempó és hosszú futás, személyre szabott tempókkal. Az edzéseket hosszú nyomással át lehet húzni másik napra, vagy a részleteknél kiválasztani az új napot. Minden edzésnél bekapcsolható a **futópad mód** (tempók km/h-ban).
- **Futásnapló** – táv, idő, nehézség, jegyzet; heti terv vs. lefutott grafikon; CSV-export.
- **Nikotinmentes napok** – napi jelölés, sorozat, mérföldkövek, megspórolt pénz, „Sóvárgás van” vezetett légzés.
- **Meditáció** – napi cél, időzítő csengővel, napi javasolt gyakorlat, napló arról, mit meditáltál.

Az adatok csak a telefonod böngészőjében tárolódnak (`localStorage`). A ⚙️ beállításokban tudsz JSON-mentést készíteni és visszatölteni.

## Telepítés iPhone-ra

1. GitHubon: **Settings → Pages → Build and deployment → Deploy from a branch**, Branch: `main`, Folder: `/(root)`, **Save**.
2. Pár perc múlva nyisd meg Safariban: https://milancod.github.io/Futas_App/
3. **Megosztás → Hozzáadás a Főképernyőhöz.**

## Felépítés

Sima HTML/CSS/JS, nincs build lépés: `index.html`, `styles.css`, `app.js` (minden logika, az edzésterv-generátor is), `sw.js` (offline működés).
