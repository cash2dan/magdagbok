import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Utensils, Activity, TrendingUp, ArrowLeft, Check, Copy, Droplet, Download, Upload, Pencil, GlassWater, ChevronDown, ChevronUp, Pill } from 'lucide-react';

// ============================================================================
// MAT-TAXONOMI
// ============================================================================
// Single-select: en måltid har en typisk kosthållning
const DIET_OPTIONS = ['Blandkost', 'Vegetariskt', 'Veganskt', 'Pescetariansk'];

// Single-select: oftast ett dominerande protein per måltid
const PROTEIN_OPTIONS = [
  'Rött kött', 'Fågel', 'Fisk', 'Skaldjur', 'Ägg',
  'Mejeri', 'Baljväxter', 'Tofu/soja', 'Nötter/frön', 'Inget protein'
];

// Frukost-specifik proteinlista
const BREAKFAST_PROTEINS = [
  'Flingor/müsli', 'Fil/yoghurt', 'Ägg',
  'Mejeri', 'Baljväxter', 'Tofu/soja', 'Nötter/frön', 'Inget protein'
];

// Per kosthållning: vilka protein- och kategori-items som inte är applicerbara
const DIET_EXCLUSIONS = {
  'Veganskt': {
    proteins: ['Rött kött', 'Fågel', 'Fisk', 'Skaldjur', 'Ägg', 'Mejeri'],
    items: [
      'Smör', 'Laktosfritt margarin/smör',
      'Grädde (vanlig)', 'Grädde (laktosfri)',
      'Crème fraiche (vanlig)', 'Crème fraiche (laktosfri)',
      'Mjölk (vanlig)', 'Laktosfri mjölk',
      'Yoghurt (vanlig)', 'Laktosfri yoghurt',
      'Ost (hård, t.ex. cheddar)', 'Ost (mjuk/färsk)',
      'Glass', 'Majonnäs', 'Pesto', 'Choklad (mjölk)'
    ]
  },
  'Vegetariskt': {
    proteins: ['Rött kött', 'Fågel', 'Fisk', 'Skaldjur'],
    items: []
  },
  'Pescetariansk': {
    proteins: ['Rött kött', 'Fågel'],
    items: []
  },
  'Blandkost': {
    proteins: [],
    items: []
  }
};

// Måltidstyper — styr om formuläret visar full accordion eller snabblogg
const MEAL_TYPES = [
  { key: 'frukost', label: 'Frukost', emoji: '🍳' },
  { key: 'lunch', label: 'Lunch', emoji: '🍽️' },
  { key: 'middag', label: 'Middag', emoji: '🍽️' },
  { key: 'mellanmål', label: 'Mellanmål', emoji: '🍎' },
  { key: 'kvällsmat', label: 'Kvällsmat', emoji: '🍽️' },
  { key: 'snacks', label: 'Snacks/godis', emoji: '🍬' }
];

// Snabbval för snabblogg-läget — sparas som snackItems, utan FODMAP-tagg
const MELLANMAL_QUICK = [
  'Frukt', 'Yoghurt/fil', 'Nötter/frön', 'Smörgås',
  'Proteinbar', 'Kex/knäcke', 'Smoothie', 'Annat'
];
const SNACKS_QUICK = [
  'Chips', 'Choklad', 'Godis', 'Kaka/bakelse',
  'Popcorn', 'Glass', 'Jordnötter', 'Kex', 'Annat'
];

function defaultMealType() {
  const h = new Date().getHours();
  if (h >= 6 && h <= 10) return 'frukost';
  if (h >= 11 && h <= 13) return 'lunch';
  if (h >= 14 && h <= 16) return 'mellanmål';
  if (h >= 17 && h <= 20) return 'middag';
  if (h >= 21 && h <= 23) return 'kvällsmat';
  return 'snacks';
}

function mealTypeMeta(key) {
  return MEAL_TYPES.find(m => m.key === key) || { label: 'Måltid', emoji: '🍽️' };
}

// Returnerar accordion-kategorier inklusive en proteinkategori som varierar per måltidstyp
function getFoodCategories(mealType) {
  const proteinList = mealType === 'frukost' ? BREAKFAST_PROTEINS : PROTEIN_OPTIONS;
  const proteinCat = {
    key: 'protein',
    label: 'Protein',
    options: proteinList.map(label => ({ label, fodmap: 'neutral' }))
  };
  return [proteinCat, ...FOOD_CATEGORIES];
}

// Multi-select med underval. fodmap: 'high' / 'low' / 'mixed' / 'neutral'
const FOOD_CATEGORIES = [
  {
    key: 'kolhydrat',
    label: 'Kolhydrat',
    options: [
      { label: 'Pasta (vete)', fodmap: 'high' },
      { label: 'Pasta (glutenfri)', fodmap: 'low' },
      { label: 'Bröd (vete)', fodmap: 'high' },
      { label: 'Bröd (surdeg)', fodmap: 'low' },
      { label: 'Bröd (glutenfritt)', fodmap: 'low' },
      { label: 'Ris', fodmap: 'low' },
      { label: 'Potatis', fodmap: 'low' },
      { label: 'Quinoa', fodmap: 'low' },
      { label: 'Havregryn', fodmap: 'low' },
      { label: 'Müsli', fodmap: 'mixed' },
      { label: 'Couscous/bulgur', fodmap: 'high' },
      { label: 'Bakverk/kaka', fodmap: 'high' }
    ]
  },
  {
    key: 'gronsaker',
    label: 'Grönsaker',
    options: [
      { label: 'Lök', fodmap: 'high' },
      { label: 'Vitlök', fodmap: 'high' },
      { label: 'Purjolök', fodmap: 'high' },
      { label: 'Broccoli', fodmap: 'high' },
      { label: 'Blomkål', fodmap: 'high' },
      { label: 'Kål', fodmap: 'high' },
      { label: 'Sparris', fodmap: 'high' },
      { label: 'Champinjoner', fodmap: 'high' },
      { label: 'Tomat', fodmap: 'low' },
      { label: 'Paprika', fodmap: 'low' },
      { label: 'Gurka', fodmap: 'low' },
      { label: 'Sallad', fodmap: 'low' },
      { label: 'Morot', fodmap: 'low' },
      { label: 'Spenat', fodmap: 'low' },
      { label: 'Zucchini', fodmap: 'low' }
    ]
  },
  {
    key: 'frukt',
    label: 'Frukt/bär',
    options: [
      { label: 'Äpple', fodmap: 'high' },
      { label: 'Päron', fodmap: 'high' },
      { label: 'Mango', fodmap: 'high' },
      { label: 'Vattenmelon', fodmap: 'high' },
      { label: 'Plommon/körsbär', fodmap: 'high' },
      { label: 'Avokado (mer än 1/8)', fodmap: 'high' },
      { label: 'Banan (mogen)', fodmap: 'high' },
      { label: 'Banan (omogen)', fodmap: 'low' },
      { label: 'Apelsin/citron', fodmap: 'low' },
      { label: 'Jordgubbe/blåbär', fodmap: 'low' },
      { label: 'Hallon', fodmap: 'low' },
      { label: 'Vindruvor', fodmap: 'low' },
      { label: 'Kiwi', fodmap: 'low' },
      { label: 'Ananas', fodmap: 'low' }
    ]
  },
  {
    key: 'mejeri_fett',
    label: 'Mejeri, fett & sås',
    options: [
      { label: 'Smör', fodmap: 'low' },
      { label: 'Laktosfritt margarin/smör', fodmap: 'low' },
      { label: 'Olivolja / matolja', fodmap: 'low' },
      { label: 'Grädde (vanlig)', fodmap: 'high' },
      { label: 'Grädde (laktosfri)', fodmap: 'low' },
      { label: 'Havregrädde (vegansk)', fodmap: 'low' },
      { label: 'Crème fraiche (vanlig)', fodmap: 'high' },
      { label: 'Crème fraiche (laktosfri)', fodmap: 'low' },
      { label: 'Crème fraiche (vegansk)', fodmap: 'low' },
      { label: 'Mjölk (vanlig)', fodmap: 'high' },
      { label: 'Laktosfri mjölk', fodmap: 'low' },
      { label: 'Havre-/mandelmjölk', fodmap: 'low' },
      { label: 'Yoghurt (vanlig)', fodmap: 'high' },
      { label: 'Laktosfri yoghurt', fodmap: 'low' },
      { label: 'Ost (hård, t.ex. cheddar)', fodmap: 'low' },
      { label: 'Ost (mjuk/färsk)', fodmap: 'high' },
      { label: 'Glass', fodmap: 'high' },
      { label: 'Majonnäs', fodmap: 'low' },
      { label: 'Majonnäs (vegansk)', fodmap: 'low' },
      { label: 'Pesto', fodmap: 'mixed' },
      { label: 'Tomatsås', fodmap: 'mixed' },
      { label: 'Soja-/teriyakisås', fodmap: 'low' }
    ]
  },
  {
    key: 'processat',
    label: 'Snabbmat/processat',
    options: [
      { label: 'Snabbmat (burger/pizza)', fodmap: 'mixed' },
      { label: 'Pommes/friterat', fodmap: 'low' },
      { label: 'Chips/snacks', fodmap: 'mixed' },
      { label: 'Godis', fodmap: 'mixed' },
      { label: 'Choklad (mjölk)', fodmap: 'high' },
      { label: 'Choklad (mörk)', fodmap: 'low' },
      { label: 'Färdigmat', fodmap: 'mixed' }
    ]
  },
  {
    key: 'tillagning',
    label: 'Tillagning',
    options: [
      { label: 'Rå', fodmap: 'neutral' },
      { label: 'Kokt/ångad', fodmap: 'neutral' },
      { label: 'Stekt', fodmap: 'neutral' },
      { label: 'Friterad', fodmap: 'neutral' },
      { label: 'Grillad', fodmap: 'neutral' },
      { label: 'Ugnsbakad', fodmap: 'neutral' }
    ]
  }
];

// ============================================================================
// MEDICIN-TAXONOMI
// ============================================================================
const MEDICINE_QUICK = [
  'Ipren/Ibuprofen', 'Alvedon/Paracetamol', 'Omeprazol', 'Antibiotika',
  'Dulcogas', 'Iberogast', 'Järntabletter', 'Probiotika', 'Magnesium',
  'Laxermedel', 'Antihistamin', 'Annat'
];

const MEDICINE_TYPES = [
  { key: 'regelbunden', label: 'Regelbunden (varje dag)' },
  { key: 'tillfällig', label: 'Tillfällig' },
  { key: 'vid_behov', label: 'Vid behov' }
];

function medicineTypeLabel(key) {
  return MEDICINE_TYPES.find(t => t.key === key)?.label || key;
}

const REGULAR_MEDICINE_QUICK = [
  'Omeprazol', 'Ipren/Ibuprofen', 'Alvedon', 'Dulcogas', 'Iberogast',
  'Järntabletter', 'Probiotika', 'Magnesium', 'Laxermedel', 'Antihistamin', 'Annat'
];

const WEEKDAYS = ['mån', 'tis', 'ons', 'tor', 'fre', 'lör', 'sön'];

function joinTimes(times) {
  if (!times || times.length === 0) return '';
  if (times.length === 1) return times[0];
  if (times.length === 2) return `${times[0]} och ${times[1]}`;
  return times.join(', ');
}

function formatRegularMedicine(m) {
  const namePart = m.dose ? `${m.name} ${m.dose}` : m.name;
  const timesStr = joinTimes(m.times);
  if (m.frequency === 'weekly') {
    const days = (m.weekdays && m.weekdays.length > 0)
      ? m.weekdays.join('/')
      : 'vissa dagar';
    return `${namePart} — ${days}${timesStr ? ' kl ' + timesStr : ''}`;
  }
  return `${namePart} — varje dag${timesStr ? ' kl ' + timesStr : ''}`;
}

// ============================================================================
// HUVUDKOMPONENT
// ============================================================================

export default function Magdagbok() {
  const [view, setView] = useState('home');
  const [editingEntry, setEditingEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const [copyStatus, setCopyStatus] = useState('');
  const [regularMedicines, setRegularMedicines] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('magdagbok_entries');
      if (saved) setEntries(JSON.parse(saved));
    } catch (e) {}
    try {
      const savedMeds = localStorage.getItem('regularMedicines');
      if (savedMeds) {
        const parsed = JSON.parse(savedMeds);
        if (Array.isArray(parsed)) setRegularMedicines(parsed);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('magdagbok_entries', JSON.stringify(entries));
    } catch (e) {}
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem('regularMedicines', JSON.stringify(regularMedicines));
    } catch (e) {}
  }, [regularMedicines]);

  const addRegularMedicine = (m) => setRegularMedicines(prev => [...prev, { ...m, id: Date.now() }]);
  const updateRegularMedicine = (id, updates) =>
    setRegularMedicines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  const deleteRegularMedicine = (id) =>
    setRegularMedicines(prev => prev.filter(m => m.id !== id));
  const clearRegularMedicines = () => setRegularMedicines([]);
  const replaceRegularMedicines = (arr) => setRegularMedicines(arr);
  const mergeRegularMedicines = (arr) => {
    setRegularMedicines(prev => {
      const ids = new Set(prev.map(m => m.id));
      const toAdd = arr.filter(m => !ids.has(m.id));
      return [...prev, ...toAdd];
    });
  };

  const addEntry = (entry) => setEntries(prev => [{ ...entry, id: Date.now() }, ...prev]);
  const updateEntry = (id, updates) => setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  const deleteEntry = (id) => setEntries(prev => prev.filter(e => e.id !== id));
  const replaceAll = (newEntries) => setEntries(newEntries);
  const mergeEntries = (newEntries) => {
    setEntries(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const toAdd = newEntries.filter(e => !existingIds.has(e.id));
      return [...toAdd, ...prev].sort((a, b) =>
        new Date(getEntryTime(b)) - new Date(getEntryTime(a)));
    });
  };

  const ongoingSymptom = entries.find(e => e.type === 'symptom' && !e.endedAt);

  const todayLiquidMl = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return entries
      .filter(e => e.type === 'liquid' && new Date(e.atTime).getTime() >= todayStart)
      .reduce((sum, e) => sum + (e.amountMl || 0), 0);
  }, [entries]);

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setView('edit');
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(180deg, #f5ede3 0%, #ebe0d0 100%)',
      fontFamily: "'Fraunces', Georgia, serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
        .sans { font-family: 'Inter', system-ui, sans-serif; }
        .scale-btn { transition: all 0.15s ease; }
        .scale-btn:active { transform: scale(0.95); }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: slideUp 0.3s ease-out; }
      `}</style>

      <div className="max-w-md mx-auto px-5 pt-8 pb-32">
        <header className="mb-6 fade-in">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logga.png"
                alt="Magdagboken"
                style={{ width: '40px', height: '40px', borderRadius: '10px' }}
              />
              <h1 style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', color: '#2d2416' }}>
                Magdagbok
              </h1>
            </div>
            <span className="sans text-xs" style={{ color: '#8b7355' }}>
              {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 gap-3">
            <p className="sans text-sm" style={{ color: '#8b7355' }}>
              {entries.length === 0 ? 'Börja logga för att hitta mönster' : `${entries.length} anteckningar`}
            </p>
            <button onClick={() => setView('minaMediciner')}
              className="sans text-xs px-3 py-1.5 rounded-full scale-btn flex-shrink-0"
              style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
              💊 Mina mediciner{regularMedicines.length > 0 ? ` (${regularMedicines.length})` : ''}
            </button>
          </div>
        </header>

        {view === 'home' && todayLiquidMl > 0 && (
          <div className="mb-5 fade-in flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
            <div className="flex items-center gap-2">
              <GlassWater size={14} style={{ color: '#5b8aa6' }} />
              <span className="sans text-xs" style={{ color: '#8b7355' }}>Vätska idag</span>
            </div>
            <span className="sans text-sm font-medium" style={{ color: '#2d2416' }}>
              {(todayLiquidMl / 1000).toFixed(1)} liter
            </span>
          </div>
        )}

        {ongoingSymptom && view === 'home' && (
          <div className="mb-5 p-4 rounded-2xl fade-in" style={{
            background: '#fff', border: '1px solid #d4a373',
            boxShadow: '0 1px 3px rgba(139, 115, 85, 0.08)'
          }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="sans text-xs uppercase tracking-wider" style={{ color: '#d4a373' }}>Pågående värk</p>
                <p className="sans text-sm mt-1" style={{ color: '#2d2416' }}>
                  Började {formatTime(ongoingSymptom.startedAt)} · {ongoingSymptom.intensity}/10
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(ongoingSymptom)}
                  className="sans text-xs p-2 rounded-full scale-btn"
                  style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => updateEntry(ongoingSymptom.id, { endedAt: new Date().toISOString() })}
                  className="sans text-xs px-3 py-2 rounded-full scale-btn"
                  style={{ background: '#2d2416', color: '#f5ede3' }}>
                  <Check size={14} className="inline mr-1" />
                  Släppt nu
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'home' && <HomeView entries={entries} onDelete={deleteEntry} onEdit={openEdit} />}
        {view === 'logFood' && <LogFood onSave={(e) => { addEntry(e); setView('home'); }} onBack={() => setView('home')} />}
        {view === 'logSymptom' && <LogSymptom onSave={(e) => { addEntry(e); setView('home'); }} onBack={() => setView('home')} />}
        {view === 'logToilet' && <LogToilet onSave={(e) => { addEntry(e); setView('home'); }} onBack={() => setView('home')} />}
        {view === 'logLiquid' && <LogLiquid onSave={(e) => { addEntry(e); setView('home'); }} onBack={() => setView('home')} />}
        {view === 'logMedicine' && <LogMedicine onSave={(e) => { addEntry(e); setView('home'); }} onBack={() => setView('home')} />}
        {view === 'edit' && editingEntry && (
          <EditEntry entry={editingEntry}
            onSave={(updates) => { updateEntry(editingEntry.id, updates); setView('home'); setEditingEntry(null); }}
            onDelete={() => { deleteEntry(editingEntry.id); setView('home'); setEditingEntry(null); }}
            onBack={() => { setView('home'); setEditingEntry(null); }} />
        )}
        {view === 'insights' && (
          <Insights entries={entries} regularMedicines={regularMedicines}
            onBack={() => setView('home')}
            copyStatus={copyStatus} setCopyStatus={setCopyStatus}
            onReplace={replaceAll} onMerge={mergeEntries}
            onClearRegularMedicines={clearRegularMedicines}
            onReplaceRegularMedicines={replaceRegularMedicines}
            onMergeRegularMedicines={mergeRegularMedicines} />
        )}
        {view === 'minaMediciner' && (
          <MinaMediciner medicines={regularMedicines}
            onAdd={addRegularMedicine}
            onUpdate={updateRegularMedicine}
            onDelete={deleteRegularMedicine}
            onBack={() => setView('home')} />
        )}
      </div>

      {view === 'home' && (
        <nav className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3" style={{
          background: 'linear-gradient(180deg, transparent, #ebe0d0 40%)'
        }}>
          <div className="max-w-md mx-auto flex gap-1.5">
            <button onClick={() => setView('logFood')}
              className="flex-1 py-3 rounded-2xl scale-btn flex flex-col items-center justify-center gap-1 sans text-xs font-medium"
              style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
              <Utensils size={15} />Mat
            </button>
            <button onClick={() => setView('logLiquid')}
              className="flex-1 py-3 rounded-2xl scale-btn flex flex-col items-center justify-center gap-1 sans text-xs font-medium"
              style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
              <GlassWater size={15} />Vätska
            </button>
            <button onClick={() => setView('logSymptom')}
              className="flex-1 py-3 rounded-2xl scale-btn flex flex-col items-center justify-center gap-1 sans text-xs font-medium"
              style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
              <Activity size={15} />Symptom
            </button>
            <button onClick={() => setView('logMedicine')}
              className="flex-1 py-3 rounded-2xl scale-btn flex flex-col items-center justify-center gap-1 sans text-xs font-medium"
              style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
              <Pill size={15} />Medicin
            </button>
            <button onClick={() => setView('logToilet')}
              className="flex-1 py-3 rounded-2xl scale-btn flex flex-col items-center justify-center gap-1 sans text-xs font-medium"
              style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
              <Droplet size={15} />Toa
            </button>
            <button onClick={() => setView('insights')}
              className="py-3 px-3 rounded-2xl scale-btn flex items-center justify-center sans"
              style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
              <TrendingUp size={15} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

function HomeView({ entries, onDelete, onEdit }) {
  const grouped = useMemo(() => {
    const groups = {};
    entries.forEach(e => {
      const date = new Date(getEntryTime(e));
      const key = date.toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="fade-in text-center py-16">
        <div className="inline-block p-6 rounded-full mb-5" style={{ background: '#fff', border: '1px solid #e0d4c0' }}>
          <Utensils size={28} style={{ color: '#8b7355' }} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 500, color: '#2d2416', marginBottom: '8px' }}>
          Inga anteckningar än
        </h2>
        <p className="sans text-sm max-w-xs mx-auto" style={{ color: '#8b7355', lineHeight: 1.6 }}>
          Logga det du äter, dricker, hur du mår och toalettbesök. Efter några dagar börjar mönster framträda.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <section key={date}>
          <h3 className="sans text-xs uppercase tracking-wider mb-3" style={{ color: '#8b7355' }}>
            {formatDateHeader(date)}
          </h3>
          <div className="space-y-2">
            {items.map(entry => (
              <EntryCard key={entry.id} entry={entry} onDelete={() => onDelete(entry.id)} onEdit={() => onEdit(entry)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EntryCard({ entry, onDelete, onEdit }) {
  const [showActions, setShowActions] = useState(false);

  const renderActions = () => showActions && (
    <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: '1px solid #f5ede3' }}>
      <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="sans text-xs scale-btn flex items-center gap-1" style={{ color: '#2d2416' }}>
        <Pencil size={12} /> Redigera
      </button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="sans text-xs scale-btn" style={{ color: '#c87654' }}>
        Ta bort
      </button>
    </div>
  );

  if (entry.type === 'food') {
    const meta = mealTypeMeta(entry.mealType);
    const allItems = [];
    if (entry.protein && entry.protein !== 'Inget protein') allItems.push(entry.protein);
    if (entry.categories) {
      Object.values(entry.categories).flat().forEach(item => {
        if (item?.label) allItems.push(item.label);
      });
    }
    if (Array.isArray(entry.snackItems)) {
      entry.snackItems.forEach(label => allItems.push(label));
    }
    const summary = allItems.length > 0
      ? allItems.slice(0, 4).join(', ') + (allItems.length > 4 ? ` +${allItems.length - 4}` : '')
      : entry.description || 'Måltid';

    return (
      <div onClick={() => setShowActions(!showActions)} className="p-4 rounded-2xl cursor-pointer"
        style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
        <div className="flex items-start gap-3">
          <div className="mt-1" style={{ fontSize: '18px' }}>{meta.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="sans text-sm font-medium truncate" style={{ color: '#2d2416' }}>{summary}</p>
              <span className="sans text-xs flex-shrink-0" style={{ color: '#8b7355' }}>{formatTime(entry.eatenAt)}</span>
            </div>
            <p className="sans text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: '#8b7355' }}>
              {entry.mealType && (
                <span className="inline-block px-2 py-0.5 rounded-full"
                  style={{ background: '#f5ede3', color: '#2d2416', fontWeight: 500 }}>
                  {meta.emoji} {meta.label}
                </span>
              )}
              <span>{entry.diet}{entry.portion ? ` · portion ${entry.portion}` : ''}</span>
            </p>
            {entry.description && (
              <p className="sans text-xs mt-1 italic" style={{ color: '#a08a6f' }}>"{entry.description}"</p>
            )}
          </div>
        </div>
        {renderActions()}
      </div>
    );
  }

  if (entry.type === 'liquid') {
    return (
      <div onClick={() => setShowActions(!showActions)} className="p-4 rounded-2xl cursor-pointer"
        style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
        <div className="flex items-start gap-3">
          <div className="mt-1" style={{ fontSize: '18px' }}>💧</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="sans text-sm font-medium" style={{ color: '#2d2416' }}>
                {entry.kind} · {entry.amountMl} ml
              </p>
              <span className="sans text-xs flex-shrink-0" style={{ color: '#8b7355' }}>{formatTime(entry.atTime)}</span>
            </div>
            {entry.notes && <p className="sans text-xs mt-1" style={{ color: '#8b7355' }}>{entry.notes}</p>}
          </div>
        </div>
        {renderActions()}
      </div>
    );
  }

  if (entry.type === 'toilet') {
    return (
      <div onClick={() => setShowActions(!showActions)} className="p-4 rounded-2xl cursor-pointer"
        style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
        <div className="flex items-start gap-3">
          <div className="mt-1" style={{ fontSize: '18px' }}>🚽</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="sans text-sm font-medium" style={{ color: '#2d2416' }}>
                Toalettbesök · Bristol {entry.bristol}
              </p>
              <span className="sans text-xs flex-shrink-0" style={{ color: '#8b7355' }}>{formatTime(entry.atTime)}</span>
            </div>
            <p className="sans text-xs mt-1" style={{ color: '#8b7355' }}>
              {bristolDescription(entry.bristol)}
              {entry.urgent && ' · brådskande'}
              {entry.painful && ' · smärtsamt'}
              {entry.blood && ' · blod'}
              {entry.mucus && ' · slem'}
            </p>
          </div>
        </div>
        {renderActions()}
      </div>
    );
  }

  if (entry.type === 'medicine') {
    const meds = Array.isArray(entry.medicines) ? entry.medicines : [];
    return (
      <div onClick={() => setShowActions(!showActions)} className="p-4 rounded-2xl cursor-pointer"
        style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
        <div className="flex items-start gap-3">
          <div className="mt-1" style={{ fontSize: '18px' }}>💊</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="sans text-sm font-medium" style={{ color: '#2d2416' }}>
                {meds.length > 0 ? `${meds.length} ${meds.length === 1 ? 'medicin' : 'mediciner'}` : 'Medicin'}
                {entry.dose ? ` · ${entry.dose}` : ''}
              </p>
              <span className="sans text-xs flex-shrink-0" style={{ color: '#8b7355' }}>{formatTime(entry.time)}</span>
            </div>
            {meds.length > 0 && (
              <ul className="sans text-xs mt-2 space-y-0.5" style={{ color: '#2d2416' }}>
                {meds.map((m, i) => (
                  <li key={i}>· {m}</li>
                ))}
              </ul>
            )}
            {entry.note && (
              <p className="sans text-xs mt-2 italic" style={{ color: '#a08a6f' }}>"{entry.note}"</p>
            )}
          </div>
        </div>
        {renderActions()}
      </div>
    );
  }

  // Symptom
  const duration = entry.endedAt
    ? Math.round((new Date(entry.endedAt) - new Date(entry.startedAt)) / 60000)
    : null;

  return (
    <div onClick={() => setShowActions(!showActions)} className="p-4 rounded-2xl cursor-pointer"
      style={{
        background: '#fff', border: '1px solid',
        borderColor: entry.endedAt ? '#e8dfd0' : '#d4a373'
      }}>
      <div className="flex items-start gap-3">
        <div className="mt-1" style={{ fontSize: '18px' }}>
          {entry.intensity >= 7 ? '🔴' : entry.intensity >= 4 ? '🟡' : '🟢'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="sans text-sm font-medium" style={{ color: '#2d2416' }}>
              Magvärk · {entry.intensity}/10
            </p>
            <span className="sans text-xs flex-shrink-0" style={{ color: '#8b7355' }}>{formatTime(entry.startedAt)}</span>
          </div>
          <div className="sans text-xs mt-1" style={{ color: '#8b7355' }}>
            {entry.location && <span>{entry.location}</span>}
            {entry.location && entry.quality && <span> · </span>}
            {entry.quality && <span>{entry.quality}</span>}
            {duration !== null && (
              <span> · släppte efter {duration < 60 ? `${duration} min` : `${Math.round(duration/60*10)/10} h`}</span>
            )}
            {!entry.endedAt && <span style={{ color: '#d4a373' }}> · pågår</span>}
          </div>
          {entry.symptoms?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.symptoms.map(s => (
                <span key={s} className="sans text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#f5ede3', color: '#8b7355' }}>{s}</span>
              ))}
            </div>
          )}
          {(entry.stress || entry.sleep || entry.menstruation) && (
            <p className="sans text-xs mt-2" style={{ color: '#a08a6f' }}>
              {entry.sleep && `Sömn ${entry.sleep}/5`}
              {entry.sleep && entry.stress && ' · '}
              {entry.stress && `Stress ${entry.stress}/5`}
              {(entry.sleep || entry.stress) && entry.menstruation && ' · '}
              {entry.menstruation && 'Mens'}
            </p>
          )}
        </div>
      </div>
      {renderActions()}
    </div>
  );
}

// ============================================================================
// LogFood — den nya strukturerade versionen
// ============================================================================

function LogFood({ onSave, onBack }) {
  const [mealType, setMealType] = useState(defaultMealType);
  const [diet, setDiet] = useState('Blandkost');
  const [categories, setCategories] = useState({});
  const [snackItems, setSnackItems] = useState([]);
  const [customSnack, setCustomSnack] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [portion, setPortion] = useState('normal');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(toLocalDateTime(new Date()));

  const isSnackMode = mealType === 'mellanmål' || mealType === 'snacks';
  const currentCategories = getFoodCategories(mealType);
  const quickItems = mealType === 'mellanmål' ? MELLANMAL_QUICK : SNACKS_QUICK;
  const quickPlaceholder = mealType === 'mellanmål'
    ? 'T.ex. en banan, rikskorpor...'
    : 'T.ex. chips, en bit choklad...';

  const dietExclSet = new Set([
    ...(DIET_EXCLUSIONS[diet]?.proteins || []),
    ...(DIET_EXCLUSIONS[diet]?.items || [])
  ]);

  // Rensa proteinval som inte är giltiga för aktuell måltidstyp (frukost vs övriga)
  useEffect(() => {
    const validLabels = new Set(
      (mealType === 'frukost' ? BREAKFAST_PROTEINS : PROTEIN_OPTIONS)
    );
    setCategories(prev => {
      if (!prev.protein) return prev;
      const filtered = prev.protein.filter(item => validLabels.has(item.label));
      if (filtered.length === prev.protein.length) return prev;
      const next = { ...prev };
      if (filtered.length > 0) next.protein = filtered;
      else delete next.protein;
      return next;
    });
  }, [mealType]);

  // Avmarkera inkompatibla val när kosthållning ändras
  useEffect(() => {
    const excl = DIET_EXCLUSIONS[diet] || { proteins: [], items: [] };
    const allExcluded = new Set([...excl.proteins, ...excl.items]);
    setCategories(prev => {
      const next = {};
      Object.entries(prev).forEach(([k, arr]) => {
        const filtered = arr.filter(item => !allExcluded.has(item.label));
        if (filtered.length > 0) next[k] = filtered;
      });
      return next;
    });
  }, [diet]);

  const toggleCategoryItem = (catKey, option) => {
    setCategories(prev => {
      const current = prev[catKey] || [];
      const exists = current.find(o => o.label === option.label);
      const updated = exists
        ? current.filter(o => o.label !== option.label)
        : [...current, option];
      const next = { ...prev };
      if (updated.length === 0) delete next[catKey];
      else next[catKey] = updated;
      return next;
    });
  };

  const toggleSnackItem = (label) => {
    setSnackItems(prev => prev.includes(label)
      ? prev.filter(x => x !== label)
      : [...prev, label]);
  };

  const totalSelections = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);

  const canSave = isSnackMode
    ? (snackItems.length > 0 || description.trim())
    : (totalSelections > 0 || description.trim());

  const save = () => {
    if (!canSave) return;
    const eatenAt = new Date(time).toISOString();
    if (isSnackMode) {
      const finalSnacks = customSnack.trim()
        ? snackItems.map(x => x === 'Annat' ? customSnack.trim() : x)
        : snackItems;
      onSave({
        type: 'food',
        mealType,
        diet,
        snackItems: finalSnacks,
        description: description.trim() || null,
        eatenAt
      });
    } else {
      onSave({
        type: 'food',
        mealType,
        diet,
        categories,
        portion,
        description: description.trim() || null,
        eatenAt
      });
    }
  };

  return (
    <div className="fade-in">
      <FormHeader title="Vad åt du?" onBack={onBack} />
      <div className="space-y-5">
        <Field label="Måltid">
          <div className="grid grid-cols-3 gap-2">
            {MEAL_TYPES.map(m => (
              <button key={m.key} onClick={() => setMealType(m.key)}
                className="sans text-xs py-2.5 rounded-xl scale-btn flex flex-col items-center justify-center gap-1"
                style={{
                  background: mealType === m.key ? '#2d2416' : '#fff',
                  color: mealType === m.key ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Kosthållning">
          <div className="grid grid-cols-2 gap-2">
            {DIET_OPTIONS.map(d => (
              <button key={d} onClick={() => setDiet(d)}
                className="sans text-xs py-3 rounded-xl scale-btn"
                style={{
                  background: diet === d ? '#2d2416' : '#fff',
                  color: diet === d ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>{d}</button>
            ))}
          </div>
          {diet !== 'Blandkost' && (
            <p className="sans text-xs mt-2 px-1" style={{ color: '#a08a6f' }}>
              Inkompatibla alternativ tonas ned automatiskt
            </p>
          )}
        </Field>

        {isSnackMode ? (
          <Field label="Snabbval">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {quickItems.map(q => {
                  const selected = snackItems.includes(q);
                  return (
                    <button key={q} onClick={() => toggleSnackItem(q)}
                      className="sans text-xs px-3 py-2 rounded-full scale-btn"
                      style={{
                        background: selected ? '#2d2416' : '#fff',
                        color: selected ? '#f5ede3' : '#2d2416',
                        border: '1px solid #e0d4c0'
                      }}>{q}</button>
                  );
                })}
              </div>
              {snackItems.includes('Annat') && (
                <input type="text" value={customSnack}
                  onChange={e => setCustomSnack(e.target.value)}
                  placeholder="Skriv vad..."
                  autoFocus
                  className="sans w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
              )}
            </div>
          </Field>
        ) : (
          <>
            <Field label={`Innehåll${totalSelections > 0 ? ` (${totalSelections} valda)` : ''}`}>
              <div className="space-y-2">
                {currentCategories.map(cat => {
                  const selected = categories[cat.key] || [];
                  const isOpen = expandedCategory === cat.key;
                  return (
                    <div key={cat.key} className="rounded-xl overflow-hidden"
                      style={{ background: '#fff', border: '1px solid #e0d4c0' }}>
                      <button onClick={() => setExpandedCategory(isOpen ? null : cat.key)}
                        className="w-full px-4 py-3 flex items-center justify-between scale-btn">
                        <div className="flex items-center gap-2">
                          <span className="sans text-sm font-medium" style={{ color: '#2d2416' }}>{cat.label}</span>
                          {selected.length > 0 && (
                            <span className="sans text-xs px-2 py-0.5 rounded-full"
                              style={{ background: '#2d2416', color: '#f5ede3' }}>
                              {selected.length}
                            </span>
                          )}
                        </div>
                        {isOpen ? <ChevronUp size={16} style={{ color: '#8b7355' }} /> : <ChevronDown size={16} style={{ color: '#8b7355' }} />}
                      </button>
                      {selected.length > 0 && !isOpen && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1">
                          {selected.map(item => (
                            <span key={item.label} className="sans text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: fodmapBg(item.fodmap),
                                color: fodmapColor(item.fodmap)
                              }}>
                              {item.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {isOpen && (
                        <div className="px-3 pb-3 flex flex-wrap gap-2">
                          {cat.options.map(opt => {
                            const isSelected = selected.some(s => s.label === opt.label);
                            const excluded = dietExclSet.has(opt.label);
                            return (
                              <button key={opt.label} onClick={() => toggleCategoryItem(cat.key, opt)}
                                className="sans text-xs px-3 py-2 rounded-full scale-btn"
                                style={{
                                  background: isSelected ? '#2d2416' : fodmapBg(opt.fodmap),
                                  color: isSelected ? '#f5ede3' : fodmapColor(opt.fodmap),
                                  border: '1px solid',
                                  borderColor: isSelected ? '#2d2416' : fodmapBorder(opt.fodmap),
                                  opacity: excluded ? 0.35 : 1,
                                  pointerEvents: excluded ? 'none' : 'auto'
                                }}>
                                {opt.label}
                                {opt.fodmap === 'high' && !isSelected && <span className="ml-1" style={{ opacity: 0.6 }}>•</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="sans text-xs mt-2 px-1" style={{ color: '#a08a6f' }}>
                Punkt (•) markerar livsmedel som ofta är magkänsliga (höga FODMAPs)
              </p>
            </Field>

            <Field label="Portion">
              <div className="grid grid-cols-3 gap-2">
                {['liten', 'normal', 'stor'].map(p => (
                  <button key={p} onClick={() => setPortion(p)}
                    className="sans py-3 rounded-xl text-sm capitalize scale-btn"
                    style={{
                      background: portion === p ? '#2d2416' : '#fff',
                      color: portion === p ? '#f5ede3' : '#2d2416',
                      border: '1px solid #e0d4c0'
                    }}>{p}</button>
                ))}
              </div>
            </Field>
          </>
        )}

        <Field label="När">
          <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)}
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <Field label="Beskrivning (valfritt)">
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder={isSnackMode ? quickPlaceholder : 'T.ex. carbonara, dagens lunch, mors köttbullar'}
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <SaveBar onSave={save} disabled={!canSave} />
      </div>
    </div>
  );
}

// FODMAP-färgkodning för subtila visuella ledtrådar
function fodmapBg(fodmap) {
  switch (fodmap) {
    case 'high': return '#fdf2e9';   // varm beige
    case 'low': return '#f0f4ed';    // svalt grönt
    case 'mixed': return '#fdf6e3';  // ljusare beige
    default: return '#f5ede3';        // neutral
  }
}
function fodmapColor(fodmap) {
  switch (fodmap) {
    case 'high': return '#a86b3d';
    case 'low': return '#5a7a4d';
    case 'mixed': return '#a08a3d';
    default: return '#8b7355';
  }
}
function fodmapBorder(fodmap) {
  switch (fodmap) {
    case 'high': return '#f0d4b0';
    case 'low': return '#d4dfc8';
    case 'mixed': return '#ecdfb5';
    default: return '#e0d4c0';
  }
}

function LogLiquid({ onSave, onBack }) {
  const [kind, setKind] = useState('Vatten');
  const [customKind, setCustomKind] = useState('');
  const [amountMl, setAmountMl] = useState(300);
  const [time, setTime] = useState(toLocalDateTime(new Date()));
  const [notes, setNotes] = useState('');

  const nonAlcoholic = [
    'Vatten', 'Vatten - Kolsyrat', 'Kaffe', 'Te', 'Mjölk', 'Juice',
    'Läsk', 'Läsk - Sockerfri', 'Energidryck', 'Movicol', 'Annat'
  ];
  const alcoholic = ['Drink', 'Öl', 'Rödvin', 'Vittvin', 'Vin - Mousserande'];
  const presets = [
    { label: 'Litet glas', ml: 200 },
    { label: 'Glas', ml: 300 },
    { label: 'Stor mugg', ml: 400 },
    { label: 'Flaska', ml: 500 },
    { label: 'Stor flaska', ml: 750 }
  ];

  const save = () => {
    const finalKind = kind === 'Annat' && customKind.trim()
      ? customKind.trim()
      : kind;
    onSave({
      type: 'liquid',
      kind: finalKind,
      amountMl: Number(amountMl),
      atTime: new Date(time).toISOString(),
      notes: notes.trim() || null
    });
  };

  const renderKindButton = (k) => (
    <button key={k} onClick={() => setKind(k)}
      className="sans text-xs px-3 py-2 rounded-full scale-btn"
      style={{
        background: kind === k ? '#2d2416' : '#fff',
        color: kind === k ? '#f5ede3' : '#2d2416',
        border: '1px solid #e0d4c0'
      }}>{k}</button>
  );

  return (
    <div className="fade-in">
      <FormHeader title="Vad drack du?" onBack={onBack} />
      <div className="space-y-5">
        <Field label="Vad">
          <div className="space-y-3">
            <div>
              <div className="sans text-[11px] uppercase tracking-wider mb-2" style={{ color: '#8b7355' }}>Alkoholfritt</div>
              <div className="flex flex-wrap gap-2">
                {nonAlcoholic.map(renderKindButton)}
              </div>
            </div>
            <div>
              <div className="sans text-[11px] uppercase tracking-wider mb-2" style={{ color: '#8b7355' }}>Alkohol</div>
              <div className="flex flex-wrap gap-2">
                {alcoholic.map(renderKindButton)}
              </div>
            </div>
            {kind === 'Annat' && (
              <input type="text" value={customKind}
                onChange={e => setCustomKind(e.target.value)}
                placeholder="Skriv vad..."
                autoFocus
                className="sans w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
            )}
          </div>
        </Field>

        <Field label={`Mängd: ${amountMl} ml`}>
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {presets.map(p => (
              <button key={p.label} onClick={() => setAmountMl(p.ml)}
                className="sans rounded-lg scale-btn py-2 px-1"
                style={{
                  background: amountMl === p.ml ? '#2d2416' : '#fff',
                  color: amountMl === p.ml ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0',
                  fontSize: '10px', lineHeight: 1.3
                }}>
                <div style={{ fontWeight: 500 }}>{p.ml}</div>
                <div style={{ opacity: 0.7 }}>{p.label}</div>
              </button>
            ))}
          </div>
          <input type="range" min="50" max="1500" step="50" value={amountMl}
            onChange={e => setAmountMl(Number(e.target.value))}
            className="w-full" style={{ accentColor: '#2d2416' }} />
          <div className="flex justify-between sans text-xs mt-1" style={{ color: '#8b7355' }}>
            <span>50 ml</span><span>1500 ml</span>
          </div>
        </Field>

        <Field label="När">
          <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)}
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <Field label="Anteckningar (valfritt)">
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="T.ex. iskaffe, light-läsk..."
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <SaveBar onSave={save} />
      </div>
    </div>
  );
}

function LogSymptom({ onSave, onBack }) {
  const [intensity, setIntensity] = useState(5);
  const [location, setLocation] = useState('');
  const [quality, setQuality] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [startTime, setStartTime] = useState(toLocalDateTime(new Date()));
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [stress, setStress] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [menstruation, setMenstruation] = useState(false);

  const locations = ['Övre mage', 'Nedre mage', 'Vänster sida', 'Höger sida', 'Runt naveln', 'Hela magen'];
  const qualities = ['Kramp', 'Brännande', 'Uppblåst', 'Stickande', 'Molande', 'Tryck'];
  const otherSymptoms = ['Gaser', 'Illamående', 'Diarré', 'Förstoppning', 'Halsbränna', 'Trötthet', 'Sura uppstötningar'];

  const toggleSymptom = (s) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const save = () => {
    onSave({
      type: 'symptom',
      intensity, location, quality, symptoms, notes,
      stress: stress || null, sleep: sleep || null, menstruation,
      startedAt: new Date(startTime).toISOString(),
      endedAt: endTime ? new Date(endTime).toISOString() : null
    });
  };

  return (
    <div className="fade-in">
      <FormHeader title="Hur känns det?" onBack={onBack} />
      <div className="space-y-5">
        <Field label={`Intensitet: ${intensity}/10`}>
          <input type="range" min="1" max="10" value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full" style={{ accentColor: '#2d2416' }} />
          <div className="flex justify-between sans text-xs mt-1" style={{ color: '#8b7355' }}>
            <span>Knappt</span><span>Outhärdligt</span>
          </div>
        </Field>
        <Field label="När började det">
          <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>
        <Field label="När slutade det (valfritt — fyll i om det redan släppt)">
          <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          <p className="sans text-xs mt-1" style={{ color: '#a08a6f' }}>
            Lämna tomt om värken pågår — du kan markera "Släppt" senare.
          </p>
        </Field>
        <Field label="Var sitter det?">
          <div className="grid grid-cols-2 gap-2">
            {locations.map(l => (
              <button key={l} onClick={() => setLocation(location === l ? '' : l)}
                className="sans text-xs py-3 rounded-xl scale-btn"
                style={{
                  background: location === l ? '#2d2416' : '#fff',
                  color: location === l ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="Typ av smärta">
          <div className="flex flex-wrap gap-2">
            {qualities.map(q => (
              <button key={q} onClick={() => setQuality(quality === q ? '' : q)}
                className="sans text-xs px-3 py-2 rounded-full scale-btn"
                style={{
                  background: quality === q ? '#2d2416' : '#fff',
                  color: quality === q ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>{q}</button>
            ))}
          </div>
        </Field>
        <Field label="Andra symptom samtidigt">
          <div className="flex flex-wrap gap-2">
            {otherSymptoms.map(s => (
              <button key={s} onClick={() => toggleSymptom(s)}
                className="sans text-xs px-3 py-2 rounded-full scale-btn"
                style={{
                  background: symptoms.includes(s) ? '#2d2416' : '#fff',
                  color: symptoms.includes(s) ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>{s}</button>
            ))}
          </div>
        </Field>

        <div className="p-4 rounded-2xl space-y-4" style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
          <p className="sans text-xs uppercase tracking-wider" style={{ color: '#8b7355' }}>
            Kontext (valfritt men värdefullt)
          </p>
          <RatingPicker label="Stressnivå idag" value={stress} onChange={setStress} lowLabel="Lugn" highLabel="Mycket stress" />
          <RatingPicker label="Sömn senaste natten" value={sleep} onChange={setSleep} lowLabel="Dålig" highLabel="Utmärkt" />
          <div>
            <button onClick={() => setMenstruation(!menstruation)}
              className="sans text-xs px-3 py-2 rounded-full scale-btn"
              style={{
                background: menstruation ? '#2d2416' : '#fff',
                color: menstruation ? '#f5ede3' : '#2d2416',
                border: '1px solid #e0d4c0'
              }}>
              {menstruation ? '✓ ' : ''}Mens just nu
            </button>
          </div>
        </div>

        <Field label="Anteckningar (valfritt)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Något särskilt som hänt idag?" rows={2}
            className="sans w-full px-4 py-3 rounded-xl text-sm resize-none"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>
        <SaveBar onSave={save} />
      </div>
    </div>
  );
}

function LogToilet({ onSave, onBack }) {
  const [bristol, setBristol] = useState(4);
  const [time, setTime] = useState(toLocalDateTime(new Date()));
  const [urgent, setUrgent] = useState(false);
  const [painful, setPainful] = useState(false);
  const [blood, setBlood] = useState(false);
  const [mucus, setMucus] = useState(false);
  const [notes, setNotes] = useState('');

  const save = () => {
    onSave({
      type: 'toilet', bristol,
      atTime: new Date(time).toISOString(),
      urgent, painful, blood, mucus, notes
    });
  };

  return (
    <div className="fade-in">
      <FormHeader title="Toalettbesök" onBack={onBack} />
      <div className="space-y-5">
        <Field label="När">
          <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)}
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>
        <Field label={`Bristol-skala: typ ${bristol}`}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {[1,2,3,4,5,6,7].map(n => (
              <button key={n} onClick={() => setBristol(n)}
                className="sans py-3 rounded-lg text-sm font-medium scale-btn"
                style={{
                  background: bristol === n ? '#2d2416' : '#fff',
                  color: bristol === n ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>{n}</button>
            ))}
          </div>
          <p className="sans text-xs px-1" style={{ color: '#8b7355', lineHeight: 1.5 }}>
            {bristolDescription(bristol)}
            {bristol <= 2 && ' — tecken på förstoppning'}
            {bristol >= 6 && ' — tecken på diarré'}
            {bristol >= 3 && bristol <= 5 && ' — normalt'}
          </p>
        </Field>
        <Field label="Övrigt (valfritt)">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Brådskande', value: urgent, set: setUrgent },
              { label: 'Smärtsamt', value: painful, set: setPainful },
              { label: 'Blod', value: blood, set: setBlood },
              { label: 'Slem', value: mucus, set: setMucus },
            ].map(({ label, value, set }) => (
              <button key={label} onClick={() => set(!value)}
                className="sans text-xs px-3 py-2 rounded-full scale-btn"
                style={{
                  background: value ? '#2d2416' : '#fff',
                  color: value ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>
                {value ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>
          {blood && (
            <p className="sans text-xs mt-3 p-3 rounded-lg" style={{ background: '#fdf2e9', color: '#8b4513' }}>
              Blod i avföringen bör alltid kollas av läkare, även om det är tillfälligt.
            </p>
          )}
        </Field>
        <Field label="Anteckningar (valfritt)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={2} className="sans w-full px-4 py-3 rounded-xl text-sm resize-none"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>
        <SaveBar onSave={save} />
      </div>
    </div>
  );
}

function LogMedicine({ onSave, onBack }) {
  const [medicines, setMedicines] = useState([]);
  const [customMedicine, setCustomMedicine] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState(toLocalDateTime(new Date()));
  const [note, setNote] = useState('');

  const toggleMedicine = (m) => setMedicines(prev =>
    prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const save = () => {
    const finalMeds = medicines.map(m =>
      m === 'Annat' && customMedicine.trim() ? customMedicine.trim() : m
    );
    onSave({
      type: 'medicine',
      medicines: finalMeds,
      dose: dose.trim(),
      time: new Date(time).toISOString(),
      note: note.trim()
    });
  };

  return (
    <div className="fade-in">
      <FormHeader title="Vilken medicin?" onBack={onBack} />
      <div className="space-y-5">
        <Field label="Medicin">
          <div className="flex flex-wrap gap-2">
            {MEDICINE_QUICK.map(m => (
              <button key={m} onClick={() => toggleMedicine(m)}
                className="sans text-xs px-3 py-2 rounded-full scale-btn"
                style={{
                  background: medicines.includes(m) ? '#2d2416' : '#fff',
                  color: medicines.includes(m) ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>{m}</button>
            ))}
          </div>
          {medicines.includes('Annat') && (
            <input type="text" value={customMedicine}
              onChange={e => setCustomMedicine(e.target.value)}
              placeholder="Skriv vilken medicin..."
              autoFocus
              className="sans w-full mt-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          )}
        </Field>

        <Field label="Dos (valfritt)">
          <input type="text" value={dose} onChange={e => setDose(e.target.value)}
            placeholder="T.ex. 400mg, 1 tablett"
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <Field label="När">
          <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)}
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <Field label="Övrig info (valfritt)">
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="T.ex. tog det mot huvudvärk..." rows={2}
            className="sans w-full px-4 py-3 rounded-xl text-sm resize-none"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <SaveBar onSave={save} />
      </div>
    </div>
  );
}

function MinaMediciner({ medicines, onAdd, onUpdate, onDelete, onBack }) {
  const [editing, setEditing] = useState(null); // null | 'new' | medicine object

  if (editing) {
    return (
      <RegularMedicineForm
        initial={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={(data) => {
          if (editing === 'new') onAdd(data);
          else onUpdate(editing.id, data);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="fade-in">
      <FormHeader title="Mina mediciner" onBack={onBack} />
      <p className="sans text-xs mb-4" style={{ color: '#a08a6f', lineHeight: 1.5 }}>
        Regelbundna mediciner du tar oavsett daglig loggning. Dessa skickas automatiskt med i AI-analysen.
      </p>

      {medicines.length === 0 ? (
        <div className="text-center py-10 px-6 rounded-2xl mb-4" style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
          <p className="sans text-sm" style={{ color: '#8b7355', lineHeight: 1.6 }}>
            Inga regelbundna mediciner än.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {medicines.map(m => (
            <div key={m.id} className="p-4 rounded-2xl"
              style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5" style={{ fontSize: '18px' }}>💊</div>
                <div className="flex-1 min-w-0">
                  <p className="sans text-sm font-medium" style={{ color: '#2d2416' }}>
                    {m.name}{m.dose ? ` · ${m.dose}` : ''}
                  </p>
                  <p className="sans text-xs mt-1" style={{ color: '#8b7355' }}>
                    {m.frequency === 'weekly'
                      ? `${(m.weekdays || []).join('/')} kl ${joinTimes(m.times)}`
                      : `Varje dag kl ${joinTimes(m.times)}`}
                  </p>
                  {m.note && (
                    <p className="sans text-xs mt-1 italic" style={{ color: '#a08a6f' }}>"{m.note}"</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: '1px solid #f5ede3' }}>
                <button onClick={() => setEditing(m)}
                  className="sans text-xs scale-btn flex items-center gap-1" style={{ color: '#2d2416' }}>
                  <Pencil size={12} /> Redigera
                </button>
                <button onClick={() => onDelete(m.id)}
                  className="sans text-xs scale-btn" style={{ color: '#c87654' }}>
                  Ta bort
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setEditing('new')}
        className="sans w-full py-4 rounded-2xl text-sm font-medium scale-btn"
        style={{ background: '#2d2416', color: '#f5ede3' }}>
        + Lägg till medicin
      </button>
    </div>
  );
}

function RegularMedicineForm({ initial, onCancel, onSave }) {
  const isEdit = !!initial;
  const [name, setName] = useState(() => {
    if (!initial) return '';
    return REGULAR_MEDICINE_QUICK.includes(initial.name) ? initial.name : 'Annat';
  });
  const [customName, setCustomName] = useState(() =>
    initial && !REGULAR_MEDICINE_QUICK.includes(initial.name) ? initial.name : '');
  const [dose, setDose] = useState(initial?.dose || '');
  const [frequency, setFrequency] = useState(initial?.frequency || 'daily');
  const [timesPerDay, setTimesPerDay] = useState(initial?.timesPerDay || 1);
  const [times, setTimes] = useState(initial?.times?.length > 0 ? initial.times : ['08:00']);
  const [weekdays, setWeekdays] = useState(initial?.weekdays || []);
  const [note, setNote] = useState(initial?.note || '');

  // Synka antal time-slots med frequency/timesPerDay
  useEffect(() => {
    const desired = frequency === 'multiple_daily' ? timesPerDay : 1;
    setTimes(prev => {
      if (prev.length === desired) return prev;
      if (prev.length < desired) {
        const filler = Array.from({ length: desired - prev.length }, () => '08:00');
        return [...prev, ...filler];
      }
      return prev.slice(0, desired);
    });
  }, [frequency, timesPerDay]);

  const toggleWeekday = (d) => setWeekdays(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const updateTime = (idx, val) => setTimes(prev => prev.map((t, i) => i === idx ? val : t));

  const finalName = name === 'Annat' ? customName.trim() : name;
  const canSave = finalName.length > 0 &&
    (frequency !== 'weekly' || weekdays.length > 0);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: finalName,
      dose: dose.trim(),
      frequency,
      timesPerDay: frequency === 'multiple_daily' ? timesPerDay : 1,
      times: [...times],
      weekdays: frequency === 'weekly'
        ? WEEKDAYS.filter(d => weekdays.includes(d)) // bevara veckodags-ordning
        : [],
      note: note.trim()
    });
  };

  return (
    <div className="fade-in">
      <FormHeader title={isEdit ? 'Redigera medicin' : 'Ny medicin'} onBack={onCancel} />
      <div className="space-y-5">
        <Field label="Namn">
          <div className="flex flex-wrap gap-2">
            {REGULAR_MEDICINE_QUICK.map(m => (
              <button key={m} onClick={() => setName(m)}
                className="sans text-xs px-3 py-2 rounded-full scale-btn"
                style={{
                  background: name === m ? '#2d2416' : '#fff',
                  color: name === m ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>{m}</button>
            ))}
          </div>
          {name === 'Annat' && (
            <input type="text" value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Skriv medicinens namn..."
              autoFocus
              className="sans w-full mt-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          )}
        </Field>

        <Field label="Dos (valfritt)">
          <input type="text" value={dose} onChange={e => setDose(e.target.value)}
            placeholder="T.ex. 20mg, 1 tablett"
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <Field label="Hur ofta?">
          <div className="flex flex-col gap-2">
            {[
              { key: 'daily', label: 'En gång per dag' },
              { key: 'multiple_daily', label: 'Flera gånger per dag' },
              { key: 'weekly', label: 'Vissa veckodagar' }
            ].map(f => (
              <button key={f.key} onClick={() => setFrequency(f.key)}
                className="sans text-sm py-3 px-4 rounded-xl scale-btn text-left"
                style={{
                  background: frequency === f.key ? '#2d2416' : '#fff',
                  color: frequency === f.key ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>
                <span style={{ marginRight: 8 }}>{frequency === f.key ? '●' : '○'}</span>
                {f.label}
              </button>
            ))}
          </div>
        </Field>

        {frequency === 'multiple_daily' && (
          <Field label={`Antal gånger per dag: ${timesPerDay}`}>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map(n => (
                <button key={n} onClick={() => setTimesPerDay(n)}
                  className="sans py-3 rounded-lg text-sm font-medium scale-btn"
                  style={{
                    background: timesPerDay === n ? '#2d2416' : '#fff',
                    color: timesPerDay === n ? '#f5ede3' : '#2d2416',
                    border: '1px solid #e0d4c0'
                  }}>{n}</button>
              ))}
            </div>
          </Field>
        )}

        {frequency === 'weekly' && (
          <Field label="Veckodagar">
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map(d => (
                <button key={d} onClick={() => toggleWeekday(d)}
                  className="sans py-3 rounded-lg text-xs font-medium scale-btn"
                  style={{
                    background: weekdays.includes(d) ? '#2d2416' : '#fff',
                    color: weekdays.includes(d) ? '#f5ede3' : '#2d2416',
                    border: '1px solid #e0d4c0',
                    textTransform: 'capitalize'
                  }}>{d}</button>
              ))}
            </div>
          </Field>
        )}

        <Field label={times.length > 1 ? 'Tider' : 'Tid'}>
          <div className="flex flex-col gap-2">
            {times.map((t, i) => (
              <input key={i} type="time" value={t}
                onChange={e => updateTime(i, e.target.value)}
                className="sans w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
            ))}
          </div>
          <p className="sans text-xs mt-2" style={{ color: '#a08a6f' }}>
            Används för att visa mönster i AI-analysen
          </p>
        </Field>

        <Field label="Notering (valfritt)">
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="T.ex. tas på morgonen före frukost..." rows={2}
            className="sans w-full px-4 py-3 rounded-xl text-sm resize-none"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={!canSave}
            className="sans flex-1 py-4 rounded-2xl text-sm font-medium scale-btn"
            style={{
              background: '#2d2416', color: '#f5ede3',
              opacity: canSave ? 1 : 0.5
            }}>Spara</button>
          <button onClick={onCancel}
            className="sans px-5 py-4 rounded-2xl text-sm font-medium scale-btn"
            style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}

function EditEntry({ entry, onSave, onDelete, onBack }) {
  const [data, setData] = useState({ ...entry });

  const update = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  const save = () => {
    const updates = { ...data };
    if (entry.type === 'symptom') {
      if (data.startedAtLocal !== undefined) updates.startedAt = new Date(data.startedAtLocal).toISOString();
      if (data.endedAtLocal !== undefined) {
        updates.endedAt = data.endedAtLocal ? new Date(data.endedAtLocal).toISOString() : null;
      }
      delete updates.startedAtLocal;
      delete updates.endedAtLocal;
    } else if (entry.type === 'food' && data.eatenAtLocal !== undefined) {
      updates.eatenAt = new Date(data.eatenAtLocal).toISOString();
      delete updates.eatenAtLocal;
    } else if ((entry.type === 'toilet' || entry.type === 'liquid') && data.atTimeLocal !== undefined) {
      updates.atTime = new Date(data.atTimeLocal).toISOString();
      delete updates.atTimeLocal;
    }
    onSave(updates);
  };

  if (entry.type === 'symptom') {
    return (
      <div className="fade-in">
        <FormHeader title="Redigera symptom" onBack={onBack} />
        <div className="space-y-5">
          <Field label={`Intensitet: ${data.intensity}/10`}>
            <input type="range" min="1" max="10" value={data.intensity}
              onChange={e => update('intensity', Number(e.target.value))}
              className="w-full" style={{ accentColor: '#2d2416' }} />
          </Field>
          <Field label="Startade">
            <input type="datetime-local"
              value={data.startedAtLocal !== undefined ? data.startedAtLocal : toLocalDateTime(new Date(data.startedAt))}
              onChange={e => update('startedAtLocal', e.target.value)}
              className="sans w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          </Field>
          <Field label="Slutade (lämna tomt om pågående)">
            <input type="datetime-local"
              value={data.endedAtLocal !== undefined ? data.endedAtLocal : (data.endedAt ? toLocalDateTime(new Date(data.endedAt)) : '')}
              onChange={e => update('endedAtLocal', e.target.value)}
              className="sans w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
            {((data.endedAtLocal !== undefined ? data.endedAtLocal : data.endedAt) && data.startedAt) && (
              <p className="sans text-xs mt-2" style={{ color: '#8b7355' }}>
                {(() => {
                  const start = new Date(data.startedAtLocal !== undefined ? data.startedAtLocal : data.startedAt);
                  const end = new Date(data.endedAtLocal !== undefined ? data.endedAtLocal : data.endedAt);
                  const mins = Math.round((end - start) / 60000);
                  if (mins < 0) return 'Sluttid är före starttid';
                  return `Duration: ${mins < 60 ? `${mins} min` : `${Math.round(mins/60*10)/10} h`}`;
                })()}
              </p>
            )}
          </Field>
          <Field label="Anteckningar">
            <textarea value={data.notes || ''} onChange={e => update('notes', e.target.value)}
              rows={2} className="sans w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          </Field>
          <EditButtons onSave={save} onDelete={onDelete} />
        </div>
      </div>
    );
  }

  if (entry.type === 'food') {
    return (
      <div className="fade-in">
        <FormHeader title="Redigera måltid" onBack={onBack} />
        <div className="space-y-5">
          <Field label="Beskrivning">
            <input type="text" value={data.description || ''} onChange={e => update('description', e.target.value)}
              className="sans w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          </Field>
          <Field label="När">
            <input type="datetime-local"
              value={data.eatenAtLocal !== undefined ? data.eatenAtLocal : toLocalDateTime(new Date(data.eatenAt))}
              onChange={e => update('eatenAtLocal', e.target.value)}
              className="sans w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          </Field>
          <p className="sans text-xs px-1" style={{ color: '#a08a6f' }}>
            Tips: Vill du ändra protein eller kategorier — ta bort denna och logga ny måltid.
          </p>
          <EditButtons onSave={save} onDelete={onDelete} />
        </div>
      </div>
    );
  }

  if (entry.type === 'liquid') {
    return (
      <div className="fade-in">
        <FormHeader title="Redigera vätska" onBack={onBack} />
        <div className="space-y-5">
          <Field label="Mängd (ml)">
            <input type="number" value={data.amountMl} onChange={e => update('amountMl', Number(e.target.value))}
              className="sans w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          </Field>
          <Field label="När">
            <input type="datetime-local"
              value={data.atTimeLocal !== undefined ? data.atTimeLocal : toLocalDateTime(new Date(data.atTime))}
              onChange={e => update('atTimeLocal', e.target.value)}
              className="sans w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
          </Field>
          <EditButtons onSave={save} onDelete={onDelete} />
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <FormHeader title="Redigera toalettbesök" onBack={onBack} />
      <div className="space-y-5">
        <Field label="När">
          <input type="datetime-local"
            value={data.atTimeLocal !== undefined ? data.atTimeLocal : toLocalDateTime(new Date(data.atTime))}
            onChange={e => update('atTimeLocal', e.target.value)}
            className="sans w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }} />
        </Field>
        <Field label={`Bristol-skala: typ ${data.bristol}`}>
          <div className="grid grid-cols-7 gap-1">
            {[1,2,3,4,5,6,7].map(n => (
              <button key={n} onClick={() => update('bristol', n)}
                className="sans py-3 rounded-lg text-sm font-medium scale-btn"
                style={{
                  background: data.bristol === n ? '#2d2416' : '#fff',
                  color: data.bristol === n ? '#f5ede3' : '#2d2416',
                  border: '1px solid #e0d4c0'
                }}>{n}</button>
            ))}
          </div>
        </Field>
        <EditButtons onSave={save} onDelete={onDelete} />
      </div>
    </div>
  );
}

function EditButtons({ onSave, onDelete }) {
  return (
    <div className="flex gap-2">
      <button onClick={onSave}
        className="sans flex-1 py-4 rounded-2xl text-sm font-medium scale-btn"
        style={{ background: '#2d2416', color: '#f5ede3' }}>Spara</button>
      <button onClick={onDelete}
        className="sans px-5 py-4 rounded-2xl text-sm font-medium scale-btn"
        style={{ background: '#fff', color: '#c87654', border: '1px solid #e0d4c0' }}>Ta bort</button>
    </div>
  );
}

function Insights({ entries, regularMedicines = [], onBack, copyStatus, setCopyStatus, onReplace, onMerge, onClearRegularMedicines, onReplaceRegularMedicines, onMergeRegularMedicines }) {
  const analysis = useMemo(() => analyzePatterns(entries), [entries]);
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState('');
  const [pendingImport, setPendingImport] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const copyToClipboard = async () => {
    const text = buildAIPrompt(entries, regularMedicines);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('Kopierat! Klistra in i Claude, ChatGPT eller Gemini.');
      setTimeout(() => setCopyStatus(''), 4000);
    } catch (e) {
      setCopyStatus('Kunde inte kopiera. Försök igen.');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  const exportJSON = () => {
    const payload = {
      app: 'magdagbok',
      version: 4,
      exportedAt: new Date().toISOString(),
      entries,
      regularMedicines
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `magdagbok-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const incoming = Array.isArray(parsed) ? parsed : parsed.entries;
        if (!Array.isArray(incoming)) throw new Error('Felaktigt filformat');

        const validEntries = incoming.filter(en =>
          en && en.type && (en.id !== undefined) &&
          ['food', 'symptom', 'toilet', 'liquid', 'medicine'].includes(en.type)
        );

        const incomingMeds = (parsed && Array.isArray(parsed.regularMedicines))
          ? parsed.regularMedicines : [];
        const validMeds = incomingMeds.filter(m =>
          m && typeof m === 'object' && m.id !== undefined && typeof m.name === 'string'
        );

        if (validEntries.length === 0 && validMeds.length === 0) {
          setImportStatus('Inga giltiga anteckningar i filen.');
          setTimeout(() => setImportStatus(''), 4000);
          return;
        }

        setPendingImport({ entries: validEntries, regularMedicines: validMeds });
      } catch (err) {
        setImportStatus('Kunde inte läsa filen. Är det rätt JSON-format?');
        setTimeout(() => setImportStatus(''), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const summarizeImport = (p) => {
    const parts = [];
    if (p.entries.length > 0) parts.push(`${p.entries.length} anteckningar`);
    if (p.regularMedicines.length > 0) parts.push(`${p.regularMedicines.length} regelbundna mediciner`);
    return parts.join(' och ');
  };

  const confirmMerge = () => {
    onMerge(pendingImport.entries);
    if (typeof onMergeRegularMedicines === 'function') {
      onMergeRegularMedicines(pendingImport.regularMedicines);
    }
    setImportStatus(`${summarizeImport(pendingImport)} tillagda.`);
    setPendingImport(null);
    setTimeout(() => setImportStatus(''), 4000);
  };

  const confirmReplace = () => {
    onReplace(pendingImport.entries);
    if (typeof onReplaceRegularMedicines === 'function') {
      onReplaceRegularMedicines(pendingImport.regularMedicines);
    }
    setImportStatus(`${summarizeImport(pendingImport)} importerade (befintlig data ersatt).`);
    setPendingImport(null);
    setTimeout(() => setImportStatus(''), 4000);
  };

  const cancelImport = () => {
    setPendingImport(null);
    setImportStatus('Import avbruten.');
    setTimeout(() => setImportStatus(''), 4000);
  };

  const confirmClearAll = () => {
    onReplace([]);
    if (typeof onClearRegularMedicines === 'function') onClearRegularMedicines();
    setConfirmClear(false);
    setImportStatus('All data raderad.');
    setTimeout(() => setImportStatus(''), 4000);
  };

  return (
    <div className="fade-in">
      <FormHeader title="Mönster" onBack={onBack} />

      {entries.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-2xl mb-4" style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
          <p className="sans text-sm" style={{ color: '#8b7355', lineHeight: 1.6 }}>
            Inga anteckningar än. Logga några dagar så börjar mönster framträda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl" style={{
            background: 'linear-gradient(135deg, #2d2416 0%, #4a3a24 100%)',
            color: '#f5ede3'
          }}>
            <h3 className="sans text-xs uppercase tracking-wider mb-2" style={{ color: '#d4a373' }}>
              Djupare analys
            </h3>
            <p className="sans text-sm mb-4" style={{ lineHeight: 1.5 }}>
              Få hela datasetet analyserat av en AI. Knappen kopierar all data plus en färdig prompt — klistra in i Claude, ChatGPT eller Gemini.
            </p>
            <button onClick={copyToClipboard}
              className="sans w-full py-3 rounded-xl text-sm font-medium scale-btn flex items-center justify-center gap-2"
              style={{ background: '#f5ede3', color: '#2d2416' }}>
              <Copy size={16} />
              Kopiera data + AI-prompt
            </button>
            {copyStatus && (
              <p className="sans text-xs mt-3 text-center" style={{ color: '#d4a373' }}>{copyStatus}</p>
            )}
          </div>

          {analysis.totalSymptoms > 0 && (
            <StatCard label="Antal smärtepisoder" value={analysis.totalSymptoms} sublabel="Senaste 30 dagarna" />
          )}
          {analysis.avgIntensity > 0 && (
            <StatCard label="Snittintensitet" value={`${analysis.avgIntensity}/10`} />
          )}
          {analysis.avgDuration && (
            <StatCard label="Genomsnittlig duration"
              value={analysis.avgDuration < 60 ? `${Math.round(analysis.avgDuration)} min`
                : `${Math.round(analysis.avgDuration / 60 * 10) / 10} h`} />
          )}
          {analysis.avgTimeToSymptom && (
            <StatCard label="Tid från mat till värk"
              value={`~${Math.round(analysis.avgTimeToSymptom / 60 * 10) / 10} h`}
              sublabel="Snitt mellan senaste måltid och symptom" />
          )}
          {analysis.liquidStats && (
            <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
              <h3 className="sans text-xs uppercase tracking-wider mb-2" style={{ color: '#8b7355' }}>
                Vätskeintag
              </h3>
              <p className="sans text-sm" style={{ color: '#2d2416' }}>
                Snitt {analysis.liquidStats.avgPerDayL} liter/dag
              </p>
              <p className="sans text-xs mt-1" style={{ color: '#8b7355' }}>
                {analysis.liquidStats.note}
              </p>
            </div>
          )}
          {analysis.fodmapInsight && (
            <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
              <h3 className="sans text-xs uppercase tracking-wider mb-3" style={{ color: '#8b7355' }}>
                FODMAP innan smärta
              </h3>
              <p className="sans text-sm" style={{ color: '#2d2416' }}>
                {analysis.fodmapInsight.highCount} höga FODMAP-livsmedel inom 6h innan smärta
              </p>
              <p className="sans text-xs mt-1" style={{ color: '#8b7355' }}>
                {analysis.fodmapInsight.topItems.join(', ')}
              </p>
            </div>
          )}
          {analysis.bristolStats && (
            <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
              <h3 className="sans text-xs uppercase tracking-wider mb-3" style={{ color: '#8b7355' }}>
                Toalettmönster
              </h3>
              <p className="sans text-sm" style={{ color: '#2d2416' }}>
                {analysis.bristolStats.count} besök · snitt typ {analysis.bristolStats.avg}
              </p>
              <p className="sans text-xs mt-1" style={{ color: '#8b7355' }}>
                {analysis.bristolStats.tendency}
              </p>
            </div>
          )}
          {analysis.timeOfDay && (
            <StatCard label="Vanligaste tid för värk" value={analysis.timeOfDay} />
          )}
        </div>
      )}

      <div className="mt-6 p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
        <h3 className="sans text-xs uppercase tracking-wider mb-1" style={{ color: '#8b7355' }}>
          Säkerhetskopia
        </h3>
        <p className="sans text-xs mb-4" style={{ color: '#a08a6f', lineHeight: 1.5 }}>
          Spara all data som .json-fil. Bra som backup eller för att flytta mellan enheter.
        </p>
        <div className="flex gap-2">
          <button onClick={exportJSON}
            disabled={entries.length === 0 && regularMedicines.length === 0}
            className="sans flex-1 py-3 rounded-xl text-sm font-medium scale-btn flex items-center justify-center gap-2"
            style={{
              background: '#2d2416', color: '#f5ede3',
              opacity: (entries.length === 0 && regularMedicines.length === 0) ? 0.5 : 1
            }}>
            <Download size={14} />Exportera
          </button>
          <button onClick={handleImportClick}
            className="sans flex-1 py-3 rounded-xl text-sm font-medium scale-btn flex items-center justify-center gap-2"
            style={{ background: '#fff', color: '#2d2416', border: '1px solid #e0d4c0' }}>
            <Upload size={14} />Importera
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json,.json"
          onChange={handleFile} style={{ display: 'none' }} />
        {importStatus && (
          <p className="sans text-xs mt-3 text-center" style={{ color: '#8b7355' }}>{importStatus}</p>
        )}
        <button onClick={() => setConfirmClear(true)}
          disabled={entries.length === 0 && regularMedicines.length === 0}
          className="sans w-full mt-3 py-3 rounded-xl text-sm font-medium scale-btn"
          style={{
            background: 'transparent', color: '#c87654',
            border: '1px solid #e8c5b4',
            opacity: (entries.length === 0 && regularMedicines.length === 0) ? 0.4 : 1
          }}>
          Radera all data
        </button>
      </div>

      {pendingImport !== null && (
        <div
          onClick={cancelImport}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(45, 36, 22, 0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-6"
            style={{
              background: '#f5ede3', border: '1px solid #e0d4c0',
              maxWidth: '380px', width: '100%',
              boxShadow: '0 20px 50px rgba(45, 36, 22, 0.25)'
            }}
          >
            <h3 className="sans text-xs uppercase tracking-wider mb-2" style={{ color: '#8b7355' }}>
              Importera data
            </h3>
            <p className="sans text-sm mb-1" style={{ color: '#2d2416', lineHeight: 1.5 }}>
              Filen innehåller{' '}
              <strong>{pendingImport.entries.length}</strong> anteckningar
              {pendingImport.regularMedicines.length > 0 && (
                <> och <strong>{pendingImport.regularMedicines.length}</strong> regelbundna mediciner</>
              )}.
            </p>
            <p className="sans text-xs mb-5" style={{ color: '#8b7355', lineHeight: 1.5 }}>
              Välj om du vill lägga till detta till befintlig data eller ersätta allt.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={confirmMerge}
                className="sans w-full py-3 rounded-xl text-sm font-medium scale-btn"
                style={{ background: '#2d2416', color: '#f5ede3' }}>
                Lägg till
              </button>
              <button onClick={confirmReplace}
                className="sans w-full py-3 rounded-xl text-sm font-medium scale-btn"
                style={{ background: '#fff', color: '#c87654', border: '1px solid #e0d4c0' }}>
                Ersätt
              </button>
              <button onClick={cancelImport}
                className="sans w-full py-3 rounded-xl text-sm font-medium scale-btn"
                style={{ background: 'transparent', color: '#8b7355' }}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClear && (
        <div
          onClick={() => setConfirmClear(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(45, 36, 22, 0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-6"
            style={{
              background: '#f5ede3', border: '1px solid #e0d4c0',
              maxWidth: '380px', width: '100%',
              boxShadow: '0 20px 50px rgba(45, 36, 22, 0.25)'
            }}
          >
            <h3 className="sans text-xs uppercase tracking-wider mb-2" style={{ color: '#c87654' }}>
              Radera all data
            </h3>
            <p className="sans text-sm mb-1" style={{ color: '#2d2416', lineHeight: 1.5 }}>
              Är du säker?
            </p>
            <p className="sans text-xs mb-5" style={{ color: '#8b7355', lineHeight: 1.5 }}>
              Alla <strong>{entries.length}</strong> anteckningar
              {regularMedicines.length > 0 && <> och <strong>{regularMedicines.length}</strong> regelbundna mediciner</>}
              {' '}raderas permanent. Den här åtgärden går inte att ångra.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={confirmClearAll}
                className="sans w-full py-3 rounded-xl text-sm font-medium scale-btn"
                style={{ background: '#c87654', color: '#fff' }}>
                Ja, radera allt
              </button>
              <button onClick={() => setConfirmClear(false)}
                className="sans w-full py-3 rounded-xl text-sm font-medium scale-btn"
                style={{ background: 'transparent', color: '#8b7355' }}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function RatingPicker({ label, value, onChange, lowLabel, highLabel }) {
  return (
    <div>
      <p className="sans text-xs mb-2" style={{ color: '#8b7355' }}>{label}</p>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(value === n ? 0 : n)}
            className="sans flex-1 py-2 rounded-lg text-sm scale-btn"
            style={{
              background: value === n ? '#2d2416' : '#f5ede3',
              color: value === n ? '#f5ede3' : '#8b7355',
              border: '1px solid #e0d4c0'
            }}>{n}</button>
        ))}
      </div>
      <div className="flex justify-between sans text-xs mt-1" style={{ color: '#a08a6f' }}>
        <span>{lowLabel}</span><span>{highLabel}</span>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="sans text-xs uppercase tracking-wider block mb-2" style={{ color: '#8b7355' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FormHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button onClick={onBack} className="p-2 rounded-full scale-btn"
        style={{ background: '#fff', border: '1px solid #e0d4c0', color: '#2d2416' }}>
        <ArrowLeft size={18} />
      </button>
      <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#2d2416', letterSpacing: '-0.01em' }}>{title}</h2>
    </div>
  );
}

function SaveBar({ onSave, disabled }) {
  return (
    <button onClick={onSave} disabled={disabled}
      className="sans w-full py-4 rounded-2xl text-sm font-medium scale-btn mt-2"
      style={{
        background: disabled ? '#d4c9b5' : '#2d2416',
        color: '#f5ede3', opacity: disabled ? 0.6 : 1
      }}>
      Spara
    </button>
  );
}

function StatCard({ label, value, sublabel }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8dfd0' }}>
      <p className="sans text-xs uppercase tracking-wider" style={{ color: '#8b7355' }}>{label}</p>
      <p className="mt-1" style={{ fontSize: '28px', fontWeight: 500, color: '#2d2416', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sublabel && <p className="sans text-xs mt-1" style={{ color: '#8b7355' }}>{sublabel}</p>}
    </div>
  );
}

function bristolDescription(n) {
  const map = {
    1: 'Hårda klumpar, svårpasserade', 2: 'Klumpig, korvformad',
    3: 'Korvformad med sprickor', 4: 'Slät, mjuk korv (ideal)',
    5: 'Mjuka klumpar med tydliga kanter', 6: 'Lös, fluffig, gröt-liknande',
    7: 'Helt flytande, ingen fast form'
  };
  return map[n] || '';
}

function getEntryTime(e) {
  if (e.type === 'symptom') return e.startedAt;
  if (e.type === 'food') return e.eatenAt;
  if (e.type === 'toilet' || e.type === 'liquid') return e.atTime;
  if (e.type === 'medicine') return e.time;
  return new Date().toISOString();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Idag';
  if (d.toDateString() === yest.toDateString()) return 'Igår';
  return d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function toLocalDateTime(d) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 16);
}

function flattenFoodItems(food) {
  // Returnerar alla strukturerade items från en food-entry som platta objekt
  const items = [];
  if (food.protein && food.protein !== 'Inget protein') {
    items.push({ label: food.protein, fodmap: 'neutral', category: 'protein' });
  }
  if (food.categories) {
    Object.entries(food.categories).forEach(([catKey, arr]) => {
      arr.forEach(item => items.push({ ...item, category: catKey }));
    });
  }
  if (Array.isArray(food.snackItems)) {
    food.snackItems.forEach(label => items.push({ label, fodmap: 'neutral', category: 'snack' }));
  }
  return items;
}

function analyzePatterns(entries) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = entries.filter(e => new Date(getEntryTime(e)).getTime() > thirtyDaysAgo);

  const symptoms = recent.filter(e => e.type === 'symptom');
  const foods = recent.filter(e => e.type === 'food');
  const toilets = recent.filter(e => e.type === 'toilet');
  const liquids = recent.filter(e => e.type === 'liquid');

  const avgIntensity = symptoms.length > 0
    ? Math.round(symptoms.reduce((sum, s) => sum + s.intensity, 0) / symptoms.length * 10) / 10
    : 0;

  const ended = symptoms.filter(s => s.endedAt);
  const avgDuration = ended.length > 0
    ? ended.reduce((sum, s) => sum + (new Date(s.endedAt) - new Date(s.startedAt)) / 60000, 0) / ended.length
    : null;

  const deltas = [];
  symptoms.forEach(s => {
    const symptomTime = new Date(s.startedAt).getTime();
    const priorMeals = foods.filter(f => new Date(f.eatenAt).getTime() < symptomTime);
    if (priorMeals.length > 0) {
      const lastMeal = priorMeals.reduce((latest, f) =>
        new Date(f.eatenAt) > new Date(latest.eatenAt) ? f : latest);
      const delta = (symptomTime - new Date(lastMeal.eatenAt).getTime()) / 60000;
      if (delta < 12 * 60) deltas.push(delta);
    }
  });
  const avgTimeToSymptom = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null;

  // FODMAP-insikt: vilka high-FODMAP items dyker oftast upp i 6h-fönstret innan symptom?
  let fodmapInsight = null;
  const itemCounts = {};
  let highCount = 0;
  symptoms.forEach(s => {
    const symptomTime = new Date(s.startedAt).getTime();
    const windowStart = symptomTime - 6 * 60 * 60 * 1000;
    const mealsInWindow = foods.filter(f => {
      const t = new Date(f.eatenAt).getTime();
      return t >= windowStart && t <= symptomTime;
    });
    mealsInWindow.forEach(m => {
      flattenFoodItems(m).forEach(item => {
        if (item.fodmap === 'high') {
          highCount++;
          itemCounts[item.label] = (itemCounts[item.label] || 0) + 1;
        }
      });
    });
  });
  if (highCount > 0) {
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, count]) => `${label} (${count}x)`);
    fodmapInsight = { highCount, topItems };
  }

  let timeOfDay = null;
  if (symptoms.length >= 3) {
    const buckets = { 'Morgon (6-11)': 0, 'Mitt på dagen (11-15)': 0, 'Eftermiddag (15-19)': 0, 'Kväll/natt (19-6)': 0 };
    symptoms.forEach(s => {
      const h = new Date(s.startedAt).getHours();
      if (h >= 6 && h < 11) buckets['Morgon (6-11)']++;
      else if (h >= 11 && h < 15) buckets['Mitt på dagen (11-15)']++;
      else if (h >= 15 && h < 19) buckets['Eftermiddag (15-19)']++;
      else buckets['Kväll/natt (19-6)']++;
    });
    timeOfDay = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0];
  }

  let bristolStats = null;
  if (toilets.length > 0) {
    const avg = Math.round(toilets.reduce((s, t) => s + t.bristol, 0) / toilets.length * 10) / 10;
    let tendency = 'Mestadels normalt';
    const lowCount = toilets.filter(t => t.bristol <= 2).length;
    const hCount = toilets.filter(t => t.bristol >= 6).length;
    if (lowCount / toilets.length > 0.4) tendency = 'Tendens till förstoppning';
    else if (hCount / toilets.length > 0.4) tendency = 'Tendens till diarré';
    else if ((lowCount + hCount) / toilets.length > 0.5) tendency = 'Växlande — kan tyda på IBS';
    bristolStats = { count: toilets.length, avg, tendency };
  }

  let liquidStats = null;
  if (liquids.length > 0) {
    const dayKeys = new Set(liquids.map(l => new Date(l.atTime).toDateString()));
    const totalMl = liquids.reduce((s, l) => s + (l.amountMl || 0), 0);
    const avgPerDayMl = totalMl / dayKeys.size;
    const avgPerDayL = (avgPerDayMl / 1000).toFixed(1);
    let note = '';
    if (avgPerDayMl < 1500) note = 'Under rekommenderat — kan bidra till uppblåsthet och förstoppning';
    else if (avgPerDayMl > 3000) note = 'Högt intag';
    else note = 'Inom rekommenderat intervall';
    liquidStats = { avgPerDayL, note, days: dayKeys.size };
  }

  return {
    totalSymptoms: symptoms.length,
    avgIntensity, avgDuration, avgTimeToSymptom,
    timeOfDay, bristolStats, liquidStats, fodmapInsight
  };
}

function buildAIPrompt(entries, regularMedicines = []) {
  const sorted = [...entries].sort((a, b) =>
    new Date(getEntryTime(a)) - new Date(getEntryTime(b)));

  const lines = sorted.map(e => {
    const t = new Date(getEntryTime(e)).toLocaleString('sv-SE');
    if (e.type === 'food') {
      const items = flattenFoodItems(e);
      const itemsStr = items.length > 0
        ? items.map(i => i.fodmap === 'high' ? `${i.label}[FODMAP-hög]` : i.label).join(', ')
        : '(inga strukturerade val)';
      const desc = e.description ? ` "${e.description}"` : '';
      const meta = mealTypeMeta(e.mealType);
      const portionStr = e.portion ? ` · portion ${e.portion}` : '';
      return `${t} | MAT (${meta.label}) | ${e.diet}${portionStr} | ${itemsStr}${desc}`;
    }
    if (e.type === 'liquid') {
      return `${t} | DRYCK | ${e.kind} ${e.amountMl} ml${e.notes ? ' (' + e.notes + ')' : ''}`;
    }
    if (e.type === 'toilet') {
      const flags = [
        e.urgent && 'brådskande', e.painful && 'smärtsamt',
        e.blood && 'BLOD', e.mucus && 'slem'
      ].filter(Boolean).join(', ');
      return `${t} | TOA | Bristol typ ${e.bristol} (${bristolDescription(e.bristol)})${flags ? ' [' + flags + ']' : ''}`;
    }
    if (e.type === 'symptom') {
      const dur = e.endedAt
        ? `${Math.round((new Date(e.endedAt) - new Date(e.startedAt)) / 60000)} min`
        : 'pågående';
      const ctx = [
        e.location, e.quality,
        e.symptoms?.length > 0 && e.symptoms.join('+'),
        e.stress && `stress ${e.stress}/5`,
        e.sleep && `sömn ${e.sleep}/5`,
        e.menstruation && 'mens',
        e.notes
      ].filter(Boolean).join(' · ');
      return `${t} | VÄRK ${e.intensity}/10 | ${ctx} | duration: ${dur}`;
    }
    if (e.type === 'medicine') {
      const meds = Array.isArray(e.medicines) && e.medicines.length > 0
        ? e.medicines.join(', ') : '(ingen specificerad)';
      const dose = e.dose ? ` · dos: ${e.dose}` : '';
      const typ = e.medicineType ? ` [${medicineTypeLabel(e.medicineType)}]` : '';
      const note = e.note ? ` (${e.note})` : '';
      return `${t} | MEDICIN${typ} | ${meds}${dose}${note}`;
    }
    return '';
  }).join('\n');

  const regularMedsBlock = (Array.isArray(regularMedicines) && regularMedicines.length > 0)
    ? `\nREGELBUNDNA MEDICINER (tas oavsett daglig loggning):
${regularMedicines.map(m => {
  const base = formatRegularMedicine(m);
  return m.note ? `${base} (${m.note})` : base;
}).join('\n')}
`
    : '';

  return `Jag har loggat mina måltider, drycker, magsymptom och toalettbesök för att försöka hitta vad som ger mig ont i magen. Måltider är strukturerade med kosthållning, huvudprotein och kategoriserade ingredienser. Livsmedel som ofta är magkänsliga är taggade [FODMAP-hög].

VIKTIGT — fråga användaren om följande om du inte redan känner till det och om det är relevant för analysen:
- Ålder
- Kön
- Ungefärlig vikt
- Känd diagnos (t.ex. IBS, Crohns, laktosintolerans, celiaki)
- Aktuella mediciner som kan påverka magen (t.ex. smärtstillande, antibiotika, laxermedel)

Ställ dessa frågor samlat i början av din analys, hoppa över de du redan känner till. Om användaren svarar, integrera informationen i din analys.
${regularMedsBlock}
Analysera grundligt:

1. **Tidsmönster**: Hur lång tid efter måltider kommer värken typiskt? Olika tidsfönster pekar mot olika orsaker (30 min = magsäck, 2-4 h = tunntarm/laktos/FODMAP, 6+ h = tjocktarm/IBS).

2. **FODMAP-analys**: Räkna hur ofta höga FODMAPs (taggade [FODMAP-hög]) förekommer i 4-8h innan smärta jämfört med övriga måltider. Vilka specifika items är vanligast? Är det fruktans (äpple, päron), laktos (mjölk, yoghurt), galaktaner (lök, vitlök), polyoler (avokado, sötningsmedel) eller fruktaner (vete)?

3. **Proteinkorrelation**: Finns mönster kring rött kött, fisk, baljväxter? T.ex. baljväxter ger gas, rött kött kan ge tungare matsmältning.

4. **Kosthållning**: Skiljer sig symptomen mellan vegetariska och köttbaserade måltider?

5. **Vätskeintag**: Snitt per dag (ml/L). Bedöm om otillräckligt (<1.5L). Korrelera med Bristol-skalan och förstoppning. Notera om Movicol används regelbundet — det indikerar funktionell förstoppning.

6. **Toalettmönster (Bristol)**: IBS-D, IBS-C, IBS-mixed, laktosintolerans, gallrelaterat?

7. **Mediciner**: Ta hänsyn till eventuella mediciner vid analysen — vissa kan direkt påverka mage/tarm (t.ex. NSAID som Ipren kan ge magbesvär, antibiotika rubbar tarmflora, järntabletter ger ofta förstoppning, laxermedel påverkar Bristol). Korrelera medicin-loggar tidsmässigt med symptom. Ta också hänsyn till regelbundna mediciner (listade ovan) — notera om något av dem kan påverka mage/tarm direkt (t.ex. NSAID → magirritation, järn → förstoppning, probiotika → tarmflora, omeprazol → syrahämning).

8. **Kontextfaktorer**: Hur korrelerar stress, sömn och mens med symptom? Funktionella magproblem (IBS) följer ofta stress mer än mat.

9. **Hypoteser**: 2-3 mest sannolika förklaringar, rangordnade. Var ärlig om datakvaliteten.

10. **Nästa steg**: Konkreta åtgärder — eliminationsdiet (vad först?), läkartest att be om (laktos-andningstest, gluten-antikroppar IgA-tTG, calprotectin för inflammation, gallsyrediarré-test), eller specifik ny loggning som skulle hjälpa.

Var konkret och specifik. Undvik generella råd. Om datan är otillräcklig — säg det rakt ut. Detta är underlag för läkarbesök, inte ersättning.

DATA (kronologisk ordning):
${lines}

Antal anteckningar: ${entries.length}
Period: ${sorted.length > 0 ? new Date(getEntryTime(sorted[0])).toLocaleDateString('sv-SE') : '-'} till ${sorted.length > 0 ? new Date(getEntryTime(sorted[sorted.length-1])).toLocaleDateString('sv-SE') : '-'}`;
}
