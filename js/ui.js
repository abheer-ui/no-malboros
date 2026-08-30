/**
 * NO MALBOROS — shared UI primitives
 * Sheets, toasts, haptics and formatting. Every overlay here is keyboard
 * accessible, focus-trapped, and animates out the same way it came in.
 */

export const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/* ---- Formatting --------------------------------------------------------- */

export const mmss = (total) => {
  const s = Math.max(0, Math.round(total));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;

export const rupees = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function relativeTime(iso) {
  const then = new Date(iso);
  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const isToday = then.toDateString() === new Date().toDateString();
  if (isToday) return `${Math.floor(mins / 60)}h ago`;
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (then.toDateString() === y.toDateString())
    return `Yesterday, ${then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  return then.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ---- Haptics (mobile, opt-out in settings) ------------------------------ */

let hapticsOn = true;
export const setHaptics = (on) => { hapticsOn = !!on; };

// Browsers refuse (and warn about) vibration before the first real user
// gesture, so wait for one rather than calling into a guaranteed rejection.
let userHasInteracted = false;
['pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
  window.addEventListener(evt, () => { userHasInteracted = true; }, { once: true, passive: true })
);

export function haptic(pattern = 8) {
  if (!hapticsOn || !userHasInteracted) return;
  try { navigator.vibrate?.(pattern); } catch (_) { /* unsupported */ }
}

/* ---- Toast -------------------------------------------------------------- */

function toastHost() {
  let el = document.getElementById('toasts');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toasts';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  return el;
}

export function toast(message, tone = 'info', ms = 3200) {
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.textContent = message;
  toastHost().appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  const close = () => {
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 240);
  };
  const t = setTimeout(close, ms);
  el.addEventListener('click', () => { clearTimeout(t); close(); });
}

/* ---- Sheet (bottom on mobile, centered dialog on desktop) --------------- */

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openSheetEl = null;
let lastFocused = null;

export function openSheet(el) {
  if (!el || openSheetEl === el) return;
  lastFocused = document.activeElement;
  openSheetEl = el;
  el.hidden = false;
  el.setAttribute('aria-modal', 'true');
  requestAnimationFrame(() => el.classList.add('is-open'));
  document.body.classList.add('has-overlay');
  const first = [...el.querySelectorAll(FOCUSABLE)].find((n) => !n.dataset.skipFocus);
  setTimeout(() => (first || el).focus?.(), 60);
  el.addEventListener('keydown', trap);
}

export function closeSheet(el = openSheetEl) {
  if (!el) return;
  el.classList.remove('is-open');
  el.removeEventListener('keydown', trap);
  el.removeAttribute('aria-modal');
  document.body.classList.remove('has-overlay');
  const restore = lastFocused;
  openSheetEl = null; lastFocused = null;
  setTimeout(() => {
    el.hidden = true;
    restore?.focus?.();
  }, reduceMotion() ? 0 : 300);
}

function trap(e) {
  if (e.key === 'Escape') { e.stopPropagation(); closeSheet(e.currentTarget); return; }
  if (e.key !== 'Tab') return;
  const nodes = [...e.currentTarget.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
  if (!nodes.length) return;
  const first = nodes[0], last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/** Dismiss a sheet by clicking its scrim. */
export function wireScrimDismiss(el) {
  el?.addEventListener('mousedown', (e) => {
    if (e.target === el) closeSheet(el);
  });
}

/* ---- Number ticker ------------------------------------------------------ */

export function tick(el, to, { decimals = 0, prefix = '', duration = 480 } = {}) {
  if (!el) return;
  const fmt = (n) => prefix + (decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString('en-IN'));
  const from = Number(el.dataset.v ?? 0);
  if (from === to || reduceMotion()) {
    el.textContent = fmt(to); el.dataset.v = to; return;
  }
  cancelAnimationFrame(el._raf);
  const t0 = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    el.textContent = fmt(from + (to - from) * ease(t));
    if (t < 1) el._raf = requestAnimationFrame(step);
    else { el.textContent = fmt(to); el.dataset.v = to; }
  };
  el._raf = requestAnimationFrame(step);
}
