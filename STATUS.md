# Magdagbok — Status

Komplement till `CLAUDE.md`. CLAUDE.md beskriver projektets syfte, designprinciper och roadmap. Den här filen är en lägesrapport över **vad som faktiskt är byggt** och **var datan lagras nu** — så att en ny session snabbt kan ta vid.

---

## Tech stack (faktiskt installerat)

- **Vite 6** + **React 18** (single-page, no router)
- **Tailwind v4** via `@tailwindcss/vite` (ingen config-fil — bara `@import "tailwindcss"` i `src/index.css`)
- **lucide-react** för ikoner
- **localStorage** som enda datalager — ingen backend, ingen sync
- Dev server: `npm run dev` på `http://localhost:5174` (port är `strictPort` i `vite.config.js`)

## Filstruktur

```
magdagbok/
├── CLAUDE.md              ← projektets stora bild, roadmap
├── STATUS.md              ← den här filen
├── index.html             ← favicon + apple-touch-icon, lang=sv
├── vite.config.js         ← port 5174, strictPort, host: true
├── package.json
├── public/
│   └── logga.png          ← app-logo (40px i header, även favicon)
└── src/
    ├── main.jsx           ← mountar <Magdagbok />
    ├── index.css          ← @import "tailwindcss" + .scale-btn
    └── Magdagbok.jsx      ← hela appen i en fil (~2700 rader)
```

`Magdagbok.jsx` är fortfarande monolitiskt. Splittning rekommenderad i CLAUDE.md men inte gjord ännu — vänta tills appen är feature-stabil.

---

## localStorage-nycklar

| Nyckel | Form | Notering |
|---|---|---|
| `magdagbok_entries` | `Entry[]` | Alla loggar (mat/dryck/symptom/toa/medicin/träning) |
| `regularMedicines` | `RegularMedicine[]` | Separat register — inte daglig loggning |

Båda nycklarna initieras tom array om de saknas.

---

## Vyer (state-machine via `view`)

`home | logFood | logLiquid | logSymptom | logToilet | logMedicine | logTraining | edit | insights | minaMediciner`

### Bottom nav (synlig på home)

6 huvudknappar `flex-1`: Mat · Vätska · Symptom · Medicin · Toa · Träna
+ 1 ikon-knapp: Insights (TrendingUp)

### Header

Logo + titel + datum, plus en diskret pill-knapp `💊 Mina mediciner (n)` → öppnar `minaMediciner`-vyn.

---

## Datamodell (entries)

### Food
```js
{
  id, type: 'food',
  mealType: 'frukost'|'lunch'|'middag'|'mellanmål'|'kvällsmat'|'snacks',
  diet: 'Blandkost'|'Vegetariskt'|'Veganskt'|'Pescetariansk',
  categories: {           // accordion-multi-select per kategori
    protein: [{label, fodmap}, ...],   // protein är nu en kategori (inte separat fält)
    kolhydrat: [...],
    gronsaker: [...],
    frukt: [...],
    mejeri_fett: [...],   // tidigare 'fett' + 'mejeri' — mergat
    processat: [...],
    tillagning: [...]
  },
  snackItems: [...] | undefined,   // vid mellanmål/snacks "snabblogg"
  portion: 'liten'|'normal'|'stor',
  description: string|null,
  eatenAt: ISO
}
```
Bakåtkompat: gamla entries har `entry.protein` som sträng — `flattenFoodItems` och `EntryCard` läser fortfarande detta.

Varje kategori-accordion har en **+ Annat**-knapp som öppnar en textinput för egna livsmedel. Dessa sparas som `{ label: text, fodmap: 'neutral' }`.

### Liquid
```js
{
  id, type: 'liquid',
  kind: string,           // grupperat i Alkoholfritt / Alkohol i UI; "Annat" → fritext
  amountMl, atTime, notes
}
```
**OBS:** Movicol loggades tidigare som vätska. Från och med nu loggas det som medicin. Gamla liquid-poster med `kind: 'Movicol'` visas fortfarande korrekt.

### Symptom
```js
{
  id, type: 'symptom',
  intensity: 1-10, location, quality, symptoms: [],
  startedAt, endedAt: ISO|null,   // null = pågående
  stress: 1-5|null, sleep: 1-5|null, menstruation: bool, notes
}
```

### Toilet
```js
{
  id, type: 'toilet',
  bristol: 1-7|null,   // null vid noResult eller onlyGas
  noResult: bool,      // försökt men inget kom
  onlyGas: bool,       // bara gaser
  atTime,
  urgent, painful, blood, mucus, notes
}
```
Bakåtkompat: gamla entries utan `noResult`/`onlyGas` tolkas som falsy — visas som vanlig Bristol-post.

### Medicine (daglig loggning)
```js
{
  id, type: 'medicine',
  medicines: [...],       // multi-select snabbval, "Annat" → fritext
  dose: '',               // valfritt
  time: ISO,
  note: ''
}
```
Movicol finns nu som snabbval i medicinlistan (högst upp).

### Training
```js
{
  id, type: 'training',
  workoutType: 'styrke'|'hiit'|'promenad'|'powerwalk',
  durationMinutes: number|null,
  startedAt: ISO,
  notes: string|null
}
```

### RegularMedicine (eget register, inte ett "entry")
```js
{
  id, name, dose,
  frequency: 'daily'|'multiple_daily'|'weekly',
  timesPerDay: 1-4,       // bara relevant vid multiple_daily
  times: ['08:00', ...],  // matchar antal gånger
  weekdays: ['mån','ons','fre'],   // bara vid weekly
  note: ''
}
```

---

## FODMAP & kosthållning

- `FOOD_CATEGORIES` har FODMAP-tagg per item (`high|low|mixed|neutral`) — visuella ledtrådar i UI.
- `DIET_EXCLUSIONS` gråar ut inkompatibla items per kosthållning (Veganskt, Vegetariskt, Pescetariansk).
- Oliver finns som eget val under Grönsaker (low FODMAP).
- Varje kategoris accordion har "+ Annat" för fritext-livsmedel (sparas som neutral FODMAP).

---

## AI-prompt (`buildAIPrompt(entries, regularMedicines)`)

Genererad text innehåller:

1. **Inledning** + lista av frågor till AI:n (ålder/kön/vikt/diagnos/mediciner).
2. **REGELBUNDNA MEDICINER**-block (utelämns om listan tom).
3. **Analysera grundligt** — punkt 1-11, inkl:
   - Punkt 7 om mediciner (NSAID, antibiotika, järn, laxermedel)
   - Punkt 8 om träning (HIIT/styrke kan trigga, promenad lindrar)
   - Punkt 9 om kontextfaktorer (stress/sömn/mens)
4. **DATA** — kronologisk lista, en rad per entry. Format per typ:
   - `MAT (Lunch) | Blandkost · portion normal | pasta[FODMAP-hög], ...`
   - `DRYCK | Vatten 300 ml`
   - `VÄRK 7/10 | Nedre mage · Kramp | duration: 45 min`
   - `TOA | Bristol typ 4 (Slät, mjuk korv)` / `TOA | Inget kom` / `TOA | Bara gaser`
   - `MEDICIN | Movicol · dos: 1 påse`
   - `TRÄNING | Styrketräning · 45 min`

---

## Hemvy — gruppering och sortering

Entries grupperas progressivt beroende på ålder:

| Ålder | Gruppering | Exempel |
|---|---|---|
| Senaste 14 dagarna | Individuella dagar | "Idag", "Igår", "måndag 28 april" |
| 14–90 dagar | Veckogrupper | "Vecka 17 · 21 apr–27 apr" |
| Äldre än 90 dagar | Månadsgrupper | "april 2025" |

- Varje sektion är **fällbar** (klick på rubrik). Idag och igår öppna som standard, resten hopfällda.
- Entries sorteras på **faktisk tid** (inte tilläggstid) — bakdaterade poster hamnar automatiskt rätt.
- Grupper visas nyast överst.

---

## Funktioner som är klara

### Loggning
- ✅ Mat (med måltidstyper, kosthållning + exclusions, accordion-kategorier, snabblogg för mellanmål/snacks)
- ✅ Mat → "+ Annat"-knapp i varje kategoris accordion (fritext-livsmedel)
- ✅ Oliver som eget val under Grönsaker
- ✅ Vätska (alkoholfritt/alkohol-grupper, presets, "Annat"-fritext)
- ✅ Symptom (intensitet, plats, kvalitet, samtidiga symptom, stress/sömn/mens, pågående-läge)
- ✅ Toalett (Bristol-skala 1-7, flaggor, blod-varning; + "Inget kom" och "Bara gaser" som egna besökstyper)
- ✅ Medicin (multi-select snabbval inkl. Movicol, dos, tid, notering)
- ✅ Träning (Styrketräning, HIIT, Promenad, Powerwalk; längd som presets eller fritext)

### Hantering
- ✅ Hemvy med entries grupperade per dag/vecka/månad (fällbara sektioner)
- ✅ Entries sorterade på faktisk tid, inte tilläggstid
- ✅ Pågående symptom-banner (med "Släppt nu"-knapp)
- ✅ Vätskeintag-summa idag (om >0)
- ✅ Klick på entry → expandera → Redigera/Ta bort
- ✅ EditEntry-vy (per typ, inkl. träning)

### Mina mediciner (separat register)
- ✅ Lista + Lägg till/Redigera/Ta bort
- ✅ Tre frekvenstyper (daily/multiple_daily/weekly) med dynamiskt antal tids-inputs
- ✅ Veckodagstoggles vid weekly

### Insights / Mönster
- ✅ AI-prompt copy-knapp (genererar prompt med alla data + regelbundna mediciner + träning)
- ✅ Statistikkort (smärtepisoder, intensitet, duration, tid mat→värk, vätska, FODMAP-räkning, Bristol, tid på dygnet)
- ✅ Export JSON (version 4 — innehåller `entries` + `regularMedicines`)
- ✅ Import JSON med 3-knapps modal: Lägg till / Ersätt / Avbryt
- ✅ Import hanterar både entries och regularMedicines (dedupe på id vid merge)
- ✅ Import accepterar `training`-entries
- ✅ Bakåtkompatibel mot v3-exports (regularMedicines saknas → tolkas som tom)
- ✅ "Radera all data"-knapp med bekräftelse-modal

---

## Designspråk (referens)

- Palett: `#2d2416` mörkbrun text, `#f5ede3 → #ebe0d0` beige bakgrund, `#8b7355` brun-grå, `#d4a373` terrakotta accent, `#c87654` varning, `#fff` kort
- Typografi: Fraunces (display) + Inter (UI, klassen `.sans`)
- Knappar: `rounded-full` chips, `rounded-xl` kort, `rounded-2xl` hero-knappar; alla har `.scale-btn` för aktiv-feedback
- Modaler: full-screen overlay `rgba(45,36,22,0.55)`, klick utanför = stäng

---

## Saker som INTE är gjorda än

Från CLAUDE.md roadmap:

### Fas 1 — PWA-paketering & GitHub Pages
- [ ] `vite-plugin-pwa` — service worker, manifest
- [ ] PWA-ikoner (192/512/maskable)
- [ ] Apple touch icon + splash screens
- [ ] GitHub Actions workflow för auto-deploy
- [ ] `base` i vite.config.js för GitHub Pages-pathing
- [ ] Test "Add to Home Screen" på iPhone

### Fas 2 — Polering
- [ ] Felhantering vid full localStorage / incognito
- [ ] Tomma states som guidar nya användare
- [ ] A11y (aria-labels, fokusringar)
- [ ] Mörkt läge (om önskas)
- [ ] Versionering i footer

### Fas 3 — Möjliga utbyggnader
- [ ] PDF-export för läkarbesök
- [ ] PWA notifications (påminnelser)
- [ ] Foto av måltid
- [ ] Mensloggning som modul
- [ ] Inbyggd AI-analys (egen API-nyckel)

---

## Snabb start vid nästa session

```bash
cd C:/Users/danie/Documents/Privat/Test/magdagbok
npm run dev   # öppnar på http://localhost:5174/magdagbok/
```

HMR fungerar — ändringar i `src/Magdagbok.jsx` reflekteras omedelbart.
