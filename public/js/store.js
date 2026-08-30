/**
 * NO MALBOROS — state & persistence
 * Local-first and private: everything lives in this browser, no account.
 * Presentation never touches localStorage directly — it goes through here.
 */

const KEY = 'nomalboros.v2';
const LEGACY_KEY = 'nomalboros_app_state_v1';

const DEFAULTS = {
  name: '',
  dailyLimit: 10,
  packPrice: 170,      // rupees
  packCount: 10,
  nicotineMg: 1.0,
  breathSeconds: 4,    // one side of the box
  delaySeconds: 300,   // 5 minutes
  sound: false,
  haptics: true,
  onboarded: false,
  smokes: [],   // { id, at, trigger, note }
  urges: [],    // { id, at, seconds, outcome: 'rode'|'smoked'|'stopped' }
  breaths: [],  // { id, at, seconds, cycles }
  boosts: [],   // { id, at, kind }
  // Append-only token ledger. Balance is always derived by summing this —
  // there is deliberately no mutable balance field anywhere in the app.
  ledger: [],       // { id, at, sourceId, rule, amount, reason, type, status }
  redemptions: [],  // { id, at, tokens, rupees, status, provider, settledAt }
  readTopics: [],   // topic ids, so a Learn award can only happen once each
  reflections: [],  // { id, at, note }
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (_) { /* fall through to migration */ }
  return migrate();
}

/** Carry over anything meaningful from the previous version of the app. */
function migrate() {
  const next = { ...DEFAULTS };
  try {
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (old) {
      if (Array.isArray(old.smokeLogs)) {
        next.smokes = old.smokeLogs.map((l) => ({
          id: l.id || uid(),
          at: l.smoked_at || l.at || new Date().toISOString(),
          trigger: l.trigger_reason || l.trigger || 'Other',
          note: l.notes || '',
        }));
      }
      if (Array.isArray(old.urgeEvents)) {
        next.urges = old.urgeEvents.map((u) => ({
          id: u.id || uid(),
          at: u.created_at || u.at || new Date().toISOString(),
          seconds: u.duration_seconds || 300,
          outcome: u.outcome === 'resisted' ? 'rode' : 'smoked',
        }));
      }
      if (Array.isArray(old.foodBoosts)) {
        next.boosts = old.foodBoosts.map((b) => ({
          id: b.id || uid(), at: b.created_at || b.at || new Date().toISOString(),
          kind: b.food_category || b.category || 'food',
        }));
      }
      if (old.taperConfig?.currentLimit) next.dailyLimit = old.taperConfig.currentLimit;
      next.onboarded = true;
    }
  } catch (_) { /* a broken legacy blob must never block startup */ }
  return next;
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (_) { /* private mode / quota — the app still works in memory */ }
}

function emit() { listeners.forEach((fn) => fn(state)); }

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function get() { return state; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  persist();
  emit();
  return state;
}

function push(key, entry) {
  state = { ...state, [key]: [entry, ...state[key]].slice(0, 500) };
  persist();
  emit();
  return entry;
}

/* ---- Actions ------------------------------------------------------------ */

export const logSmoke = (trigger = 'Other', note = '') =>
  push('smokes', { id: uid(), at: new Date().toISOString(), trigger, note });

export const logUrge = (seconds, outcome) =>
  push('urges', { id: uid(), at: new Date().toISOString(), seconds, outcome });

export const logBreath = (seconds, cycles) =>
  push('breaths', { id: uid(), at: new Date().toISOString(), seconds, cycles });

export const logBoost = (kind = 'food') =>
  push('boosts', { id: uid(), at: new Date().toISOString(), kind });

/* ---- Token ledger -------------------------------------------------------
   Only ever appended to. Nothing in the app rewrites or deletes a row, which
   is what makes the history auditable and the balance reproducible.          */

export function appendLedger(tx) {
  if (!tx) return null;
  state = { ...state, ledger: [tx, ...state.ledger] };
  persist(); emit();
  return tx;
}

export function addRedemption(request) {
  state = { ...state, redemptions: [request, ...state.redemptions] };
  persist(); emit();
  return request;
}

export function setRedemptionStatus(id, status) {
  state = {
    ...state,
    redemptions: state.redemptions.map((r) => (r.id === id ? { ...r, status } : r)),
  };
  persist(); emit();
}

export function markTopicRead(id) {
  if (state.readTopics.includes(id)) return false;
  state = { ...state, readTopics: [...state.readTopics, id] };
  persist(); emit();
  return true;
}

export const addReflection = (note) =>
  push('reflections', { id: uid(), at: new Date().toISOString(), note });

export function removeSmoke(id) {
  state = { ...state, smokes: state.smokes.filter((s) => s.id !== id) };
  persist(); emit();
}

export function resetAll() {
  state = { ...DEFAULTS, onboarded: true };
  persist(); emit();
}

/* ---- Derived ------------------------------------------------------------ */

const sameDay = (iso, d = new Date()) => {
  const t = new Date(iso);
  return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth() && t.getDate() === d.getDate();
};

export const todaySmokes = () => state.smokes.filter((s) => sameDay(s.at));
export const todayBoosts = () => state.boosts.filter((b) => sameDay(b.at));
export const todayRode = () => state.urges.filter((u) => sameDay(u.at) && u.outcome === 'rode');

export const costPerCigarette = () =>
  (Number(state.packPrice) || 0) / Math.max(1, Number(state.packCount) || 1);

/** Money not spent, from urges ridden out. */
export const moneySaved = () =>
  state.urges.filter((u) => u.outcome === 'rode').length * costPerCigarette();

/**
 * Health Energy — the original motivational score, preserved.
 * A game score for today, never a medical measurement.
 */
export function energy() {
  const raw = 100 - todaySmokes().length * 10 + todayBoosts().length * 5 + todayRode().length * 5;
  return Math.max(0, raw);
}

/** Consecutive days (ending today or yesterday) with at least one urge ridden out. */
export function streak() {
  const days = new Set(
    state.urges.filter((u) => u.outcome === 'rode').map((u) => new Date(u.at).toDateString())
  );
  if (!days.size) return 0;
  let n = 0;
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) { n++; cursor.setDate(cursor.getDate() - 1); }
  return n;
}

export const totalRode = () => state.urges.filter((u) => u.outcome === 'rode').length;
export const totalBreathMinutes = () =>
  Math.round(state.breaths.reduce((a, b) => a + (b.seconds || 0), 0) / 60);
