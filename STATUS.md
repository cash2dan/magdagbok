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
    └── Magdagbok.jsx      ← hela appen i en fil (~2500 rader)
```

`Magdagbok.jsx` är fortfarande monolitiskt. Splittning rekommenderad i CLAUDE.md men inte gjord ännu — vänta tills appen är feature-stabil.

---

## localStorage-nycklar

| Nyckel | Form | Notering |
|---|---|---|
| `magdagbok_entries` | `Entry[]` | Alla loggar (mat/dryck/symptom/toa/medicin) |
| `regularMedicines` | `RegularMedicine[]` | Separat register — inte daglig loggning |

Båda nycklarna initieras tom array om de saknas.

---

## Vyer (state-machine via `view`)

`home | logFood | logLiquid | logSymptom | logToilet | logMedicine | edit | insights | minaMediciner`

### Bottom nav (synlig på home)

5 huvudknappar `flex-1`: Mat · Vätska · Symptom · Medicin · Toa
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

### Liquid
```js
{
  id, type: 'liquid',
  kind: string,           // grupperat i Alkoholfritt / Alkohol i UI; "Annat" → fritext
  amountMl, atTime, notes
}
```

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
  bristol: 1-7, atTime,
  urgent, painful, blood, mucus, notes
}
```

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
**Inget `medicineType`-fält längre** (togs bort i förenkling). Gamla entries med `medicineType` skadar inget — buildAIPrompt har graceful guard.

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
- `DIET_EXCLUSIONS` gråar ut inkompatibla items per kosthållning (Veganskt, Vegetariskt, Pescetariansk). Veganskt utesluter både vanliga och laktosfria mejerivariater.
- Vid byte av kosthållning rensas redan valda items som blir ogiltiga (cleanup-effekt i LogFood).
- Protein är multi-select kategori (samma mönster som kolhydrat).

---

## AI-prompt (`buildAIPrompt(entries, regularMedicines)`)

Genererad text innehåller:

1. **Inledning** + lista av frågor till AI:n (ålder/kön/vikt/diagnos/mediciner).
2. **REGELBUNDNA MEDICINER**-block (utelämns om listan tom). Format:
   - `Omeprazol 20mg — varje dag kl 08:00`
   - `Dulcogas — mån/ons/fre kl 12:00 och 18:00`
   - `Iberogast — varje dag kl 08:00, 12:00, 18:00`
3. **Analysera grundligt** — punkt 1-10, inkl:
   - Punkt 7 om mediciner (NSAID, antibiotika, järn, laxermedel) — täcker både dagliga medicin-loggar OCH regelbundna mediciner.
4. **DATA** — kronologisk lista, en rad per entry. `[FODMAP-hög]`-tag på höga FODMAPs.

---

## Funktioner som är klara

### Loggning
- ✅ Mat (med måltidstyper, kosthållning + exclusions, accordion-kategorier, snabblogg för mellanmål/snacks)
- ✅ Vätska (alkoholfritt/alkohol-grupper, presets, "Annat"-fritext)
- ✅ Symptom (intensitet, plats, kvalitet, samtidiga symptom, stress/sömn/mens, pågående-läge)
- ✅ Toalett (Bristol-skala 1-7, flaggor, blod-varning)
- ✅ Medicin (multi-select snabbval, dos, tid, notering)

### Hantering
- ✅ Hemvy med entries grupperade per dag (Idag/Igår/datum)
- ✅ Pågående symptom-banner (med "Släppt nu"-knapp)
- ✅ Vätskeintag-summa idag (om >0)
- ✅ Klick på entry → expandera → Redigera/Ta bort
- ✅ EditEntry-vy (per typ)

### Mina mediciner (separat register)
- ✅ Lista + Lägg till/Redigera/Ta bort
- ✅ Tre frekvenstyper (daily/multiple_daily/weekly) med dynamiskt antal tids-inputs
- ✅ Veckodagstoggles vid weekly

### Insights / Mönster
- ✅ AI-prompt copy-knapp (genererar prompt med alla data + regelbundna mediciner)
- ✅ Statistikkort (smärtepisoder, intensitet, duration, tid mat→värk, vätska, FODMAP-räkning, Bristol, tid på dygnet)
- ✅ Export JSON (version 4 — innehåller `entries` + `regularMedicines`)
- ✅ Import JSON med 3-knapps modal: Lägg till / Ersätt / Avbryt
- ✅ Import hanterar både entries och regularMedicines (dedupe på id vid merge)
- ✅ Bakåtkompatibel mot v3-exports (regularMedicines saknas → tolkas som tom)
- ✅ "Radera all data"-knapp med bekräftelse-modal — rensar både entries och regularMedicines

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
npm run dev   # öppnar på http://localhost:5174
```

HMR fungerar — ändringar i `src/Magdagbok.jsx` reflekteras omedelbart.

Repot är ett git-repo med en `Initial commit`. Aktuella ändringar (medicin-loggning, regelbundna mediciner, import/export-utbyggnad, Radera allt, STATUS.md) är otraackade/ostagade tills nästa commit.
