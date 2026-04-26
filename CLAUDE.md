# Magdagbok

En svensk PWA för att logga mat, vätska, magsymptom och toalettbesök i syfte att hitta orsaker till återkommande magbesvär. Strukturerad data med FODMAP-medvetenhet och inbyggd AI-analys via copy-prompt-funktion.

## Status

**MVP byggd som React-artifact** med localStorage. Funktionellt komplett för enkelvändar-flödet. Nästa fas: paketera som installerbar PWA och deploya till GitHub Pages.

Källfilen från artifact-iterationen finns som `magdagbok.jsx` (single-file React component).

## Arkitektur — local-first, ingen backend

**Det här är en helt klient-sidig PWA. Ingen backend behövs.**

- All data lagras i webbläsarens `localStorage` på användarens egen enhet
- Varje besökare av URL:en får sin egen privata instans (localStorage är per-domän, per-enhet)
- Hostas som statiska filer på GitHub Pages
- JSON export/import inbyggd för backup och flytt mellan enheter
- Hennes hälsodata lämnar aldrig hennes telefon — inget moln, ingen server, ingen GDPR-fråga

**Begränsningar att vara medveten om:**
- Ingen automatisk sync mellan telefon och dator (men export/import löser det manuellt)
- Rensning av webbläsardata raderar allt — JSON-export är därför backup-mekanismen
- Vid byte av telefon: exportera först, importera på nya enheten

Detta är ett medvetet designval, inte en begränsning att åtgärda. För personlig hälsologgning är local-first **bättre** ur integritetssynpunkt än en backend-lösning.

## Syfte och kontext

Min flickvän har återkommande magsmärtor utan känd orsak. Det här är ett verktyg för att samla strukturerad data över tid som kan:
1. Hjälpa henne själv se mönster (mat → tid → smärta)
2. Användas som underlag vid läkarbesök
3. Matas in i en LLM (Claude/ChatGPT/Gemini) för djupare mönsteranalys

Appen är **inte** ett medicintekniskt verktyg. Den ger inga diagnoser. Den hjälper bara att samla och strukturera observationer.

## Designprinciper

**Lugn varm minimalism, inte sjukhusvit.**
- Palett: varm beige (#f5ede3 → #ebe0d0), mörkbrun text (#2d2416), brun-grå sekundärfärg (#8b7355), accent i terrakotta (#d4a373)
- Typografi: Fraunces (display, serif) + Inter (UI/sans)
- Inspiration: "journal meets apothecary" — ska kännas trevlig att öppna även när hon mår dåligt

**Snabb loggning är högsta prioritet.**
Hon kommer logga när hon har ont och är trött, inte när hon är sugen på att fylla i formulär. Designprincip: minimera tap count för vanligaste flödena. Quick-tags och presets framför fritext.

**Strukturerad data > fritext.**
Allt som kan struktureras (FODMAP-status, protein, kosthållning) ska struktureras. Fritextfält finns men är alltid valfria och längst ner i formulär.

**Mobilförst.**
Max-bredd 448px (`max-w-md`). Bottom nav alltid synlig. Knappar minst 44px höga. Inga hover-effekter — bara `:active` med scale-feedback.

## Datamodell

Allt sparas i `localStorage` under nyckeln `magdagbok_entries` som en JSON-array. Varje entry har ett unikt `id` (Date.now()) och ett `type`-fält som styr resten av strukturen.

### Food entry
```js
{
  id: 1234567890,
  type: 'food',
  diet: 'Blandkost' | 'Vegetariskt' | 'Veganskt' | 'Pescetariansk',
  protein: 'Rött kött' | 'Fågel' | 'Fisk' | ... | null,
  categories: {
    kolhydrat: [{ label: 'Pasta (vete)', fodmap: 'high' }, ...],
    gronsaker: [...],
    frukt: [...],
    fett: [...],
    mejeri: [...],
    processat: [...],
    tillagning: [...]
  },
  portion: 'liten' | 'normal' | 'stor',
  description: 'fritext eller null',
  eatenAt: ISO-string
}
```

### Liquid entry
```js
{
  id, type: 'liquid',
  kind: 'Vatten' | 'Kaffe' | 'Te' | 'Mjölk' | 'Juice' | 'Läsk'
      | 'Alkohol' | 'Energidryck' | 'Movicol' | 'Annat',
  amountMl: 300,
  atTime: ISO-string,
  notes: string | null
}
```

### Symptom entry
```js
{
  id, type: 'symptom',
  intensity: 1-10,
  location: 'Övre mage' | 'Nedre mage' | ... | '',
  quality: 'Kramp' | 'Brännande' | 'Uppblåst' | ... | '',
  symptoms: ['Gaser', 'Illamående', ...],     // multi-select
  startedAt: ISO-string,
  endedAt: ISO-string | null,                  // null = pågående
  stress: 1-5 | null,
  sleep: 1-5 | null,
  menstruation: boolean,
  notes: string
}
```

### Toilet entry
```js
{
  id, type: 'toilet',
  bristol: 1-7,                                // Bristol Stool Scale
  atTime: ISO-string,
  urgent: boolean, painful: boolean,
  blood: boolean, mucus: boolean,
  notes: string
}
```

## FODMAP-taxonomi

Varje livsmedel under `FOOD_CATEGORIES` har en `fodmap`-tagg: `'high'`, `'low'`, `'mixed'` eller `'neutral'`. Tilldelningen baseras på Monash Universitys FODMAP-databas (de etablerade standarden för FODMAP-forskning).

**Viktigt vid utökning av taxonomin:**
- `high` = livsmedel som typiskt triggar IBS (lök, vitlök, vete, äpple, mjölk, etc.)
- `low` = säkra alternativ (ris, potatis, banan-omogen, jordgubbar, etc.)
- `mixed` = beror på portion/preparation (müsli, tomatsås, choklad)
- `neutral` = används för tillagningsmetoder

Subtila visuella ledtrådar i UI: höga FODMAPs har varm beige bakgrund + en `•`-markör. Låga är svalt gröna. Detta hjälper användaren se mönster utan att behöva förklaras.

Hela taxonomin finns i konstanten `FOOD_CATEGORIES` överst i komponenten.

## Vyer / arkitektur

State-machine via `view`-state: `home | logFood | logSymptom | logToilet | logLiquid | edit | insights`.

Allt är just nu en single-file React-komponent med flera underkomponenter. **Vid migration till Claude Code: dela upp i separata filer** — `LogFood.jsx`, `LogSymptom.jsx`, `Insights.jsx`, etc. för att underlätta vidare utveckling.

### Hemvy
- Översta raden: vätskeintag idag (om >0)
- Pågående symptom-banner (om någon)
- Kronologisk lista grupperad per dag (Idag/Igår/datum)
- Klick på entry → expanderar med Redigera/Ta bort

### Insights/Mönster
- AI-prompt copy-knapp (mörk gradient-kort högst upp)
- Statistikkort som visas villkorligt baserat på data:
  - Antal smärtepisoder (30 dagar)
  - Snittintensitet, genomsnittlig duration
  - Tid från mat till värk
  - Vätskeintag snitt/dag med tolkning
  - FODMAP-räkning innan smärta
  - Bristol-mönster med tendens-tolkning (förstoppning/diarré/växlande)
  - Vanligaste tid på dygnet för värk
- Längst ner: Säkerhetskopia (Export/Import JSON)

## AI-prompten (`buildAIPrompt`)

Den copy-prompt som skickas till AI är genomtänkt och täcker:
1. Tidsmönster (mat → smärta)
2. FODMAP-analys med subgrupper (fruktans, laktos, galaktaner, polyoler, fruktaner)
3. Proteinkorrelation
4. Kosthållning
5. Vätskeintag (inkl. Movicol-flagging)
6. Bristol-mönster (IBS-D/C/M)
7. Kontextfaktorer (stress/sömn/mens)
8. Hypoteser rangordnade
9. Konkreta nästa steg (eliminationsdiet, läkartest)

**Vid uppdatering av promten: håll den specifik och konkret.** Generella råd från AI är värdelösa. Den ska peka på specifika livsmedel, specifika test att be om, specifik loggning som behövs.

## Roadmap

### Fas 1 — PWA-paketering och GitHub Pages-deploy

Det här är allt som behövs för att appen ska vara live och installerbar på telefonen.

- [ ] Sätt upp Vite + React + Tailwind-projekt
- [ ] Importera `magdagbok.jsx` som huvudkomponent (gärna uppdelad i flera filer)
- [ ] Lägg till `vite-plugin-pwa` för PWA-konfiguration
- [ ] PWA-manifest med:
  - `name: "Magdagbok"`
  - `short_name: "Magdagbok"`
  - `display: "standalone"`
  - `theme_color: "#2d2416"`
  - `background_color: "#f5ede3"`
  - Ikoner i flera storlekar (192px, 512px, maskable)
- [ ] Service worker — cache app shell, offline-first (Workbox via vite-plugin-pwa)
- [ ] Apple touch icon + splash screens för iOS
- [ ] GitHub Actions workflow för automatisk deploy till GitHub Pages vid push till main
- [ ] Konfigurera `base` i `vite.config.js` korrekt för GitHub Pages-pathing
- [ ] Testa "Lägg till på hemskärmen" på iPhone — ska fungera som standalone app

**Resultat: Hon (eller vem som helst med länken) öppnar URL:en, klickar "Add to Home Screen", och har en app som fungerar offline.**

### Fas 2 — Polering och kvalitet

- [ ] Felhantering för localStorage (incognito mode, full disk)
- [ ] Confirmation dialogs för destruktiva actions (ta bort, ersätt vid import)
- [ ] Tomma states som hjälper guida nya användare
- [ ] Mikrointeraktioner och animationer där det lönar sig
- [ ] Tillgänglighet (a11y) — semantisk HTML, aria-labels, fokus-ringar
- [ ] Ljus/mörkt läge (om hon vill)
- [ ] Versionering — visa app-version i en discreet footer

### Fas 3 — Möjliga utbyggnader (om hon önskar)

- [ ] PDF-export för läkarbesök (formaterad rapport, inte rådata) — använd jsPDF
- [ ] Påminnelser via PWA notifications (logga vätska, ta Movicol)
- [ ] Foto av måltid (kompletterar strukturerad data, sparas som base64 i localStorage eller IndexedDB)
- [ ] Mensloggning som egen modul (cykel-tracking) snarare än bara flagga
- [ ] AI-analys direkt i appen — kräver att hon (eller du) lägger in egen API-nyckel i settings (hålls i localStorage). Inget skäl till Firebase för detta i en personapp

### När (om någonsin) backend skulle behövas

Hoppa över detta om det inte är aktuellt. Bara för referens:

- Sync mellan flera enheter för samma användare automatiskt
- Inloggning så data följer med vid byte av telefon utan manuell export
- Delning mellan flera användare (t.ex. partner ser hennes data)
- AI-analys där API-nyckeln döljs server-side från användaren

För hennes användningsfall är inget av detta nödvändigt. Local-first med JSON-backup räcker långt.

## Tekniska detaljer / val

**Varför localStorage räcker?**
Datavolymen är liten — några hundra entries över månader. localStorage rymmer 5-10 MB beroende på webbläsare. Vi använder bråkdelar av det. JSON export/import täcker backup-behovet.

**Varför inte IndexedDB?**
Mer komplext API utan stora fördelar för denna datamängd. localStorage är synkront, enkelt att tänka kring, och tillräckligt för use-case.

**Varför Fraunces?**
Distinkt serif med modern feel. Undvik Inter/Roboto/system-fonts som ger generic AI-look. Fraunces är gratis från Google Fonts.

**Beroenden i artifact-versionen:**
- React (state, hooks)
- `lucide-react` för ikoner
- Tailwind för styling (utility-first)
- Inga andra bibliotek — håll det lätt

**Vid PWA-paketering kan du behöva:**
- `vite-plugin-pwa`
- Eventuellt `jspdf` om PDF-export blir aktuell

## Saker att tänka på

**Datakänslighet**
Det här är hälsodata. Local-first innebär att data aldrig lämnar enheten. Inga analytics, ingen tracking, inga tredjepartsskript utöver Google Fonts (som kan bytas mot self-hosted vid behov).

**Movicol-loggningen**
Hon dricker Movicol (laxermedicin) — loggas som "vätska" eftersom det blandas i vatten. AI-promten är medveten om detta och ska flagga om hon behöver det regelbundet (= tecken på funktionell förstoppning).

**Mens-flaggan**
Många kvinnor har cykelberoende magbesvär. Bara en boolean nu, men kan utvecklas till full cykel-tracking i Fas 3.

**Stress och sömn**
1-5 skala, valfritt vid symptom-loggning. Ofta visar AI-analysen att stress är huvudbov snarare än mat — utan dessa fält missar man det helt.

**GitHub Pages-pathing**
Om repo heter `magdagbok` och deployen ligger på `https://username.github.io/magdagbok/`, måste `base: '/magdagbok/'` sättas i `vite.config.js` annars hittar inte assets. Vid custom domain (`magdagbok.username.com`) behövs detta inte.

## Filer

- `magdagbok.jsx` — komplett React-komponent från artifact-iterationen
- `CLAUDE.md` — denna fil

## Sammanhang för min utvecklingsstil

Jag är vibe-coder med Claude Code. Jag föredrar:
- Beskriv funktionen i ord, låt Claude implementera
- PWA framför app store-distribution
- GitHub Pages för enkla statiska deploys (Cloudflare Pages eller Netlify som alternativ)
- Local-first där det är möjligt — undvik onödig backend-komplexitet
- Commits till Git innan stora Claude Code-sessioner

För det här projektet vill jag:
1. Komma igång snabbt (Vite + Tailwind + PWA-plugin)
2. Hålla det enkelt — single-user, offline-first, ingen backend
3. Deploya till GitHub Pages så hon (och andra) kan använda via länk
