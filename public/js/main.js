/**
 * NO MALBOROS — app controller
 * Routing, home, and the wiring between the two core experiences.
 */

import { hydrateIcons, icon } from './icons.js';
import * as store from './store.js';
import {
  toast, openSheet, closeSheet, wireScrimDismiss, tick,
  mmss, plural, rupees, relativeTime, haptic, setHaptics, reduceMotion,
} from './ui.js';
import { createBreather } from './breathe.js';
import { createDelay, randomGrounding } from './delay.js';
import { TOPICS, renderTopic, renderOrgan, ORGANS } from './learn.js';
import * as rw from './rewards.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

hydrateIcons();
setHaptics(store.get().haptics);

/* ══ Router ══════════════════════════════════════════════════════════════ */

let current = 'home';

function go(name) {
  if (name === current) return;
  // Leaving a session cleans it up so timers never run in the background.
  if (current === 'breathe') leaveBreathe();
  if (current === 'delay') leaveDelay();

  $$('.view').forEach((v) => v.classList.remove('is-active'));
  $(`#view-${name}`)?.classList.add('is-active');
  current = name;
  window.scrollTo(0, 0);

  if (name === 'home') renderHome();
  if (name === 'progress') renderProgress();
  if (name === 'settings') fillSettings();
  if (name === 'breathe') prepareBreathe();
  if (name === 'delay') prepareDelay();
  if (name === 'learn') renderLearn();
  if (name === 'rewards') renderRewards();
  if (name === 'ledger') renderLedger();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go]');
  if (el) { haptic(6); go(el.dataset.go); }
  const closer = e.target.closest('[data-close-sheet]');
  if (closer) closeSheet();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (current === 'breathe' || current === 'delay')) go('home');
});

/* ══ Home ════════════════════════════════════════════════════════════════ */

function greeting() {
  const h = new Date().getHours();
  const name = store.get().name?.trim().split(' ')[0];
  const part =
    h < 5 ? 'Still awake' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Winding down';
  return name ? `${part}, ${name}.` : 'Here when you need a moment.';
}

function homeNote() {
  const s = store.get();
  const smoked = store.todaySmokes().length;
  const rode = store.todayRode().length;
  const st = store.streak();

  if (rode > 0) return `You've ridden out ${plural(rode, 'urge')} today. That's the hard part.`;
  if (st > 1) return `${st} days in a row you've ridden one out.`;
  if (smoked === 0 && s.smokes.length > 0) return 'Nothing logged today. Take it one moment at a time.';
  if (smoked > s.dailyLimit) return "Past your limit today — tomorrow starts fresh. Try a delay next time.";
  if (smoked > 0) {
    const left = s.dailyLimit - smoked;
    return left > 0 ? `${plural(left, 'cigarette')} before your limit today.` : "You've reached today's limit.";
  }
  return '';
}

/** Quietly encouraging, never a countdown to failure. */
function renderSince() {
  const el = $('#since');
  if (!el) return;
  const last = store.get().smokes[0];
  if (!last) { el.textContent = ''; return; }
  const mins = Math.floor((Date.now() - new Date(last.at).getTime()) / 60000);
  const h = Math.floor(mins / 60), d = Math.floor(h / 24);
  const span = d >= 1 ? `${plural(d, 'day')}` : h >= 1 ? `${h}h ${mins % 60}m` : `${plural(mins, 'minute')}`;
  el.textContent = `${span} since your last cigarette`;
}

function renderHome() {
  const s = store.get();
  $('#hero-title').textContent = greeting();
  renderSince();
  $('#hero-sub').textContent = 'Two ways through. Pick either one.';
  $('#delay-default-label').textContent = `${Math.round(s.delaySeconds / 60)} minutes`;

  const nrg = store.energy();
  tick($('#stat-energy'), nrg);
  const bar = $('#energy-bar');
  if (bar) {
    // The score is uncapped by design, so the bar clamps while the number doesn't.
    $('#energy-fill').style.transform = `scaleX(${Math.min(100, nrg) / 100})`;
    bar.classList.toggle('is-low', nrg < 60);
    bar.classList.toggle('is-full', nrg >= 100);
    bar.setAttribute('aria-valuenow', String(Math.min(100, nrg)));
    bar.setAttribute('aria-valuetext', nrg > 100 ? `${nrg}% — overcharged` : `${nrg}%`);
  }
  tick($('#stat-smoked'), store.todaySmokes().length);
  $('#stat-smoked-label').textContent = `of ${s.dailyLimit} today`;
  tick($('#stat-saved'), Math.round(store.moneySaved()), { prefix: '₹' });

  const bal = rw.balance(s.ledger);
  tick($('#token-row-count'), bal);
  // Only quote a rupee value once it can actually be claimed. Showing money
  // nobody can collect would be a promise the app cannot keep.
  $('#token-row-rupees').textContent =
    rw.REWARD_PROVIDER.enabled ? `≈ ₹${rw.toRupees(bal)}` : '';

  $('#home-note').textContent = homeNote();
}

/**
 * The one notification this app sends: your delay finished while you were
 * looking elsewhere. Nothing scheduled, nothing promotional, nothing that
 * nags you back into the app.
 */
function notifyDelayDone(seconds) {
  if (!store.get().notify) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!document.hidden) return;              // you're here — the sheet is enough
  try {
    new Notification('You got through it.', {
      body: `${Math.round(seconds / 60)} minutes, and the urge passed.`,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'nm-delay-done',                  // never stacks up
    });
  } catch (_) { /* some browsers require a service-worker registration */ }
}

/* ══ Tokens ══════════════════════════════════════════════════════════════ */

/**
 * Try to award, and surface it only if it actually landed. `award` returns
 * null when the rule was already paid, capped, or limited — so a refused
 * award is silent rather than a lie.
 */
function grant({ sourceId, rule, amount, reason, type }) {
  const tx = rw.award(store.get().ledger, { sourceId, rule, amount, reason, type });
  if (!tx) return null;
  store.appendLedger(tx);
  return tx;
}

/** Pay out any milestones the user has just qualified for. */
function settleMilestones() {
  const due = rw.pendingMilestones(store.get());
  due.forEach((m) => {
    grant({
      sourceId: `milestone:${m.id}`, rule: 'milestone',
      amount: m.tokens, reason: m.title, type: rw.TX.MILESTONE,
    });
  });
  return due;
}

/** Called after any session completes: award, then celebrate milestones. */
function afterSession(kind, entry, extra = {}) {
  const gains = [];

  if (kind === 'delay') {
    const t = grant({
      sourceId: `delay:${entry.id}`, rule: 'delayComplete',
      amount: rw.EARN.delayComplete, reason: 'Urge delay completed',
    });
    if (t) gains.push(t);
    if ((extra.seconds || 0) >= 600) {
      const b = grant({
        sourceId: `delay-long:${entry.id}`, rule: 'delayLongBonus',
        amount: rw.EARN.delayLongBonus, reason: '10-minute delay bonus',
      });
      if (b) gains.push(b);
    }
  }

  if (kind === 'breathe' && (extra.seconds || 0) >= 120) {
    const t = grant({
      sourceId: `breathe:${entry.id}`, rule: 'breatheComplete',
      amount: rw.EARN.breatheComplete, reason: 'Box breathing completed',
    });
    if (t) gains.push(t);
  }

  const milestones = settleMilestones();
  return { gains, milestones };
}

/** A single, quiet line about what a session earned — never a slot machine. */
function tokenToast({ gains, milestones }) {
  const earned = gains.reduce((a, t) => a + t.amount, 0);
  if (milestones.length) {
    const m = milestones[0];
    toast(`${m.title} — +${m.tokens + earned} Tokens`, 'success', 4200);
    haptic([14, 50, 14]);
  } else if (earned) {
    toast(`+${earned} Tokens`, 'success');
  }
}

function renderRewards() {
  const s = store.get();
  const led = s.ledger;
  const bal = rw.balance(led);

  tick($('#bal-count'), bal);

  // Until a voucher provider is live, Tokens are a progress score and the app
  // says exactly that — no rupee figure, no redeem button, nothing implied.
  const live = rw.REWARD_PROVIDER.enabled;
  $('#bal-rupees').textContent = live ? `≈ ₹${rw.toRupees(bal)}` : '';
  $('#bal-rupees').hidden = !live;
  $('#bal-rate').textContent = live
    ? `${rw.TOKEN_RUPEE_RATE} Tokens = ₹1 · minimum redemption ${rw.MIN_REDEEM_TOKENS} Tokens (₹${rw.toRupees(rw.MIN_REDEEM_TOKENS)})`
    : 'Tokens track the work you put in. Rewards aren\'t available yet — your balance keeps counting until they are.';
  $('#btn-redeem').hidden = !live;

  tick($('#bal-lifetime'), rw.lifetimeEarned(led));
  tick($('#bal-redeemed'), rw.redeemedTokens(led));
  const today = rw.earnedToday(led);
  tick($('#bal-today'), today);
  $('#bal-today').closest('.lstat').querySelector('.lstat__l').textContent =
    today >= rw.DAILY_CAP ? `Daily max reached` : `Earned today · max ${rw.DAILY_CAP}`;

  const held = rw.heldTokens(led);
  const holdEl = $('#bal-hold');
  holdEl.hidden = !held;
  if (held) holdEl.textContent = `${held} Tokens are held against a pending request.`;

  $('#btn-redeem').disabled = bal < rw.MIN_REDEEM_TOKENS;

  // Earn list
  $('#earn-list').innerHTML = rw.EARN_ACTIONS.map((a) => `
    <${a.go ? 'button' : 'div'} class="earn" ${a.go ? `data-go="${a.go}"` : ''} ${a.rule === 'reflection' ? 'data-reflect="1"' : ''}>
      <span class="earn__icon">${icon(a.icon, 20)}</span>
      <span class="earn__body">
        <span class="earn__title">${a.title}</span>
        <span class="earn__sub">${a.sub}</span>
      </span>
      <span class="earn__tokens">+${a.tokens}</span>
    </${a.go ? 'button' : 'div'}>`).join('');

  // Milestones — earned ones first, then what is still ahead
  $('#milestones').innerHTML = rw.MILESTONES.map((m) => {
    const done = rw.isMilestoneEarned(led, m.id);
    return `
      <div class="ms ${done ? 'is-done' : ''}">
        <span class="ms__icon">${icon(done ? 'check' : 'lock', 18)}</span>
        <span class="ms__body">
          <span class="ms__title">${m.title}</span>
          <span class="ms__hint">${m.hint}</span>
        </span>
        <span class="ms__tokens">+${m.tokens}</span>
      </div>`;
  }).join('');

  // Redemptions
  const box = $('#redemptions');
  if (!s.redemptions.length) {
    box.innerHTML = `<p class="muted-note">No redemption requests yet.</p>`;
  } else {
    box.innerHTML = s.redemptions.map((r) => `
      <div class="redemption">
        <span class="redemption__body">
          <span class="redemption__amt">₹${r.rupees} · ${r.tokens} Tokens</span>
          <span class="redemption__meta">${relativeTime(r.at)}</span>
        </span>
        <span class="tag tag--${r.status}">${r.status}</span>
        ${r.status === 'requested'
          ? `<button class="btn btn--ghost btn--tiny" data-cancel-redeem="${r.id}">Cancel</button>` : ''}
      </div>`).join('');
  }
}

function renderLedger() {
  const led = store.get().ledger;
  const list = $('#ledger-list');
  if (!led.length) {
    list.innerHTML = `<div class="empty">
      <div class="empty__icon">${icon('token', 30)}</div>
      <p class="empty__title">Nothing yet</p>
      <p class="empty__body">Complete a delay or a breathing session and it'll be recorded here.</p>
    </div>`;
    return;
  }
  list.innerHTML = led.map((t) => `
    <div class="entry">
      <span class="entry__icon">${icon(t.amount > 0 ? 'token' : 'external', 18)}</span>
      <div class="entry__body">
        <p class="entry__title">${t.reason}</p>
        <p class="entry__meta">${t.type} · ${t.status} · ${relativeTime(t.at)}</p>
      </div>
      <span class="tx-amount ${t.amount > 0 ? 'is-plus' : 'is-minus'}">${t.amount > 0 ? '+' : ''}${t.amount}</span>
    </div>`).join('');
}

/* ---- Redemption UI (request only — this build never settles a payout) --- */

let redeemChoice = rw.MIN_REDEEM_TOKENS;

$('#btn-redeem').addEventListener('click', () => {
  const bal = rw.balance(store.get().ledger);
  const steps = [];
  for (let t = rw.MIN_REDEEM_TOKENS; t <= bal; t += rw.MIN_REDEEM_TOKENS) steps.push(t);
  redeemChoice = steps[0] || rw.MIN_REDEEM_TOKENS;

  $('#redeem-sub').textContent =
    `You have ${bal} Tokens (≈ ₹${rw.toRupees(bal)}). ${rw.TOKEN_RUPEE_RATE} Tokens = ₹1, paid as a ${rw.REWARD_PROVIDER.label}.`;
  $('#redeem-amounts').innerHTML = steps.map((t, i) => `
    <button class="chip ${i === 0 ? 'is-active' : ''}" data-redeem="${t}">
      ₹${rw.toRupees(t)} <span class="chip__sub">${t}</span>
    </button>`).join('');
  openSheet($('#sheet-redeem'));
});

$('#redeem-amounts').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-redeem]');
  if (!chip) return;
  $$('#redeem-amounts .chip').forEach((c) => c.classList.remove('is-active'));
  chip.classList.add('is-active');
  redeemChoice = Number(chip.dataset.redeem);
  haptic(6);
});

$('#redeem-confirm').addEventListener('click', () => {
  const res = rw.requestRedemption(store.get(), redeemChoice);
  if (res.error) { toast(res.error, 'error'); return; }
  store.appendLedger(res.hold);
  store.addRedemption(res.request);
  closeSheet($('#sheet-redeem'));
  renderRewards();
  toast('Request recorded. Nothing has been paid out yet.', 'info', 4200);
});

document.addEventListener('click', (e) => {
  const cancel = e.target.closest('[data-cancel-redeem]');
  if (!cancel) return;
  const res = rw.cancelRedemption(store.get(), cancel.dataset.cancelRedeem);
  if (!res) return;
  store.appendLedger(res.refund);
  store.setRedemptionStatus(res.requestId, 'cancelled');
  renderRewards();
  toast('Request cancelled, Tokens returned.', 'info');
});

/* ---- Reflection --------------------------------------------------------- */

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-reflect]')) { haptic(6); openSheet($('#sheet-reflect')); }
});

$('#reflect-save').addEventListener('click', () => {
  const note = $('#reflect-note').value.trim();
  store.addReflection(note);
  const today = new Date().toDateString();
  const t = grant({
    sourceId: `reflection:${today}`, rule: 'reflection',
    amount: rw.EARN.reflection, reason: 'Daily reflection',
  });
  $('#reflect-note').value = '';
  closeSheet($('#sheet-reflect'));
  renderRewards();
  toast(t ? `+${t.amount} Tokens` : 'Saved.', t ? 'success' : 'info');
});

/* ══ Learn ═══════════════════════════════════════════════════════════════ */

function renderLearn() {
  $('#topics').innerHTML = TOPICS.map((t) => `
    <button class="topic" data-topic="${t.id}">
      <span class="topic__icon">${icon(t.icon, 22)}</span>
      <span class="topic__body">
        <span class="topic__title">${t.title}</span>
        <span class="topic__sub">${t.sub}</span>
      </span>
      <span class="topic__chev">${icon('chevron', 18)}</span>
    </button>`).join('');
}

/** Average cigarettes a day over the days the user has actually logged. */
function dailyAverage() {
  const s = store.get();
  if (s.smokes.length < 3) return null;          // too little data to be meaningful
  const days = new Set(s.smokes.map((k) => new Date(k.at).toDateString())).size;
  return Math.max(1, Math.round(s.smokes.length / days));
}

function openTopic(id) {
  const t = TOPICS.find((x) => x.id === id);
  if (!t) return;
  $('#topic-title').textContent = t.title;
  $('#topic-body').innerHTML = renderTopic(id, { icon, dailyAverage: dailyAverage() });
  go('topic');
  if (id === 'body') selectOrgan(ORGANS[3].id);   // open on the lungs

  // Reading a topic pays once, ever — there is nothing to farm here.
  if (store.markTopicRead(id)) {
    const tx = grant({
      sourceId: `learn:${id}`, rule: 'learnTopic',
      amount: rw.EARN.learnTopic, reason: `Read: ${t.title}`,
    });
    if (tx) toast(`+${tx.amount} Tokens`, 'success');
  }
}

function selectOrgan(id) {
  // The dots and the chips are two routes to the same selection — the dots
  // show *where*, the chips guarantee a precise, labelled target.
  $$('.hotspot').forEach((h) => h.classList.toggle('is-active', h.dataset.organ === id));
  $$('.organ-chips .chip').forEach((c) => {
    const on = c.dataset.organ === id;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-pressed', String(on));
  });
  const panel = $('#organ-panel');
  if (panel) panel.innerHTML = renderOrgan(id, { icon });
}

document.addEventListener('click', (e) => {
  const topic = e.target.closest('[data-topic]');
  if (topic) { haptic(6); openTopic(topic.dataset.topic); return; }
  const pick = e.target.closest('[data-organ]');
  if (pick) { haptic(6); selectOrgan(pick.dataset.organ); }
});

/* ══ Box breathing ═══════════════════════════════════════════════════════ */

let breather = null;
let breatheLimit = 0;

function prepareBreathe() {
  const s = store.get();
  if (!breather) {
    breather = createBreather({
      mount: $('#breathe-mount'),
      onPhase: (ph) => { $('#breathe-live').textContent = ph.label; },
      onTick: ({ elapsed, cycles, remaining }) => {
        $('#breathe-meta').textContent = remaining !== null
          ? `${mmss(remaining)} left`
          : `${plural(cycles, 'round')} · ${mmss(elapsed)}`;
      },
      onComplete: ({ seconds, cycles }) => {
        const entry = store.logBreath(seconds, cycles);
        setBreatheRunning(false);
        tokenToast(afterSession('breathe', entry, { seconds }));
        showDone({
          title: 'Nicely done.',
          sub: `${plural(cycles, 'round')} of box breathing. Notice how your body feels now.`,
          again: () => { go('breathe'); setTimeout(startBreathe, 260); },
        });
      },
    });
  }
  breather.reset();
  $('#breathe-hint').textContent = `${s.breathSeconds} seconds each side`;
  $('#breathe-meta').textContent = 'Box breathing';
  // Only the delay hands us a different back target; default is home.
  if (!keepDelayAlive) $('#breathe-back').dataset.go = 'home';
  setBreatheRunning(false);
}

function setBreatheRunning(on) {
  const toggle = $('#breathe-toggle');
  toggle.innerHTML = on
    ? `${icon('pause', 20)}<span>Pause</span>`
    : `${icon('play', 20)}<span>${breather?.elapsed > 0 ? 'Resume' : 'Start'}</span>`;
  const active = on || breather?.elapsed > 0;
  $('#breathe-stop').hidden = !active;
  // Keep the slot (visibility, not display) so the footer never shifts.
  $('#breathe-chips').style.visibility = active ? 'hidden' : 'visible';
}

function startBreathe() {
  const s = store.get();
  if (breather.elapsed > 0) breather.resume();
  else breather.start({ seconds: s.breathSeconds, limit: breatheLimit });
  setBreatheRunning(true);
}

function leaveBreathe() {
  if (!breather) return;
  const secs = Math.round(breather.elapsed);
  if (secs >= 30) store.logBreath(secs, breather.cycles);
  breather.stop();
  breather.reset();
}

$('#breathe-toggle').addEventListener('click', () => {
  haptic(10);
  if (breather.running) { breather.pause(); setBreatheRunning(false); }
  else startBreathe();
});

$('#breathe-stop').addEventListener('click', () => {
  const secs = Math.round(breather.elapsed);
  const cycles = breather.cycles;
  breather.stop();
  if (secs >= 30) {
    const entry = store.logBreath(secs, cycles);
    tokenToast(afterSession('breathe', entry, { seconds: secs }));
    showDone({
      title: 'That counts.',
      sub: `${plural(cycles, 'round')} of breathing. Any amount helps.`,
      again: () => { go('breathe'); setTimeout(startBreathe, 260); },
    });
  }
  breather.reset();
  setBreatheRunning(false);
});

$('#breathe-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  $$('.chip', $('#breathe-chips')).forEach((c) => c.classList.remove('is-active'));
  chip.classList.add('is-active');
  breatheLimit = Number(chip.dataset.limit);
  haptic(6);
});

/* ══ Urge delay ══════════════════════════════════════════════════════════ */

let delay = null;
let delaySeconds = 300;

function prepareDelay() {
  // Returning to a delay that is still counting (e.g. from "Breathe") must
  // not reset it — just show it as it stands.
  if (delay && (delay.running || (delay.elapsed > 0 && delay.remaining > 0))) {
    setDelayRunning(delay.running);
    return;
  }
  delaySeconds = store.get().delaySeconds;
  syncDelayChips();
  if (!delay) {
    delay = createDelay({
      mount: $('#delay-mount'),
      onTick: (remaining) => {
        // Announce sparingly — every 60s and the last 10 — so it is useful,
        // not a screen-reader firehose.
        if (remaining % 60 === 0 || remaining <= 10) {
          $('#delay-live').textContent = `${mmss(remaining)} remaining`;
        }
      },
      onComplete: ({ seconds }) => {
        const entry = store.logUrge(seconds, 'rode');
        setDelayRunning(false);
        tokenToast(afterSession('delay', entry, { seconds }));
        notifyDelayDone(seconds);
        const mins = Math.round(seconds / 60);
        showDone({
          title: 'You got through it.',
          sub: `${mins >= 1 ? plural(mins, 'minute') : `${seconds} seconds`}, and the urge passed. That's a real thing you just did.`,
          again: () => { go('delay'); setTimeout(startDelay, 260); },
        });
      },
    });
  }
  delay.stop();
  $('#delay-time') && ($('#delay-time').textContent = mmss(delaySeconds));
  $('#delay-meta').textContent = 'Urge delay';
  $('#grounding').hidden = true;
  setDelayRunning(false);
}

function syncDelayChips() {
  $$('.chip', $('#delay-chips')).forEach((c) =>
    c.classList.toggle('is-active', Number(c.dataset.seconds) === delaySeconds));
}

function setDelayRunning(on) {
  const toggle = $('#delay-toggle');
  const started = delay && delay.elapsed > 0 && delay.remaining > 0;
  toggle.innerHTML = on
    ? `${icon('pause', 20)}<span>Pause</span>`
    : `${icon('play', 20)}<span>${started ? 'Resume' : 'Start'}</span>`;
  $('#delay-breathe').hidden = !on;
  $('#delay-give').hidden = !(on || started);
  $('#delay-chips').style.visibility = (on || started) ? 'hidden' : 'visible';
}

function startDelay() {
  if (delay.elapsed > 0 && delay.remaining > 0) delay.resume();
  else delay.start(delaySeconds);
  setDelayRunning(true);
  showGrounding();
}

// `keepDelayAlive` lets the countdown continue while the user steps into
// breathing — the two experiences are meant to layer, not interrupt.
let keepDelayAlive = false;

function leaveDelay() {
  if (keepDelayAlive) { keepDelayAlive = false; return; }
  delay?.stop();
  $('#grounding').hidden = true;
}

function showGrounding() {
  const g = randomGrounding();
  $('#grounding').hidden = false;
  $('#grounding-title').textContent = g.title;
  $('#grounding-body').textContent = g.body;
  $('#grounding .grounding__icon').innerHTML = icon(g.icon, 20);
}

$('#delay-toggle').addEventListener('click', () => {
  haptic(10);
  if (delay.running) { delay.pause(); setDelayRunning(false); }
  else startDelay();
});

$('#grounding-next').addEventListener('click', () => { haptic(6); showGrounding(); });

$('#delay-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  delaySeconds = Number(chip.dataset.seconds);
  store.update({ delaySeconds });
  syncDelayChips();
  $('#delay-time').textContent = mmss(delaySeconds);
  haptic(6);
});

// "Breathe with me" — drops box breathing inside the delay, keeping the
// countdown running underneath. Same technique, no context switch.
$('#delay-breathe').addEventListener('click', () => {
  haptic(8);
  keepDelayAlive = true;          // the countdown carries on underneath
  go('breathe');
  setTimeout(() => {
    breatheLimit = 0;
    startBreathe();
    $('#breathe-back').dataset.go = 'delay';   // back returns to the delay
  }, 260);
  toast('Your delay keeps running.', 'info');
});

// Stopping is never framed as failure.
$('#delay-give').addEventListener('click', () => {
  const elapsed = Math.round(delay.elapsed);
  delay.stop();
  store.logUrge(elapsed, 'smoked');
  setDelayRunning(false);
  go('home');
  toast(
    elapsed >= 60
      ? `You still held off ${plural(Math.round(elapsed / 60), 'minute')}. That counts.`
      : 'No judgement. Come back whenever you need to.',
    'info', 4200
  );
});

/* ══ Log a cigarette ═════════════════════════════════════════════════════ */

let pendingTrigger = 'Stress';

$('#btn-log-smoke').addEventListener('click', () => { haptic(8); openSheet($('#sheet-log')); });

$('#trigger-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  $$('.chip', $('#trigger-chips')).forEach((c) => c.classList.remove('is-active'));
  chip.classList.add('is-active');
  pendingTrigger = chip.dataset.trigger;
  haptic(6);
});

$('#log-confirm').addEventListener('click', () => {
  store.logSmoke(pendingTrigger);
  closeSheet($('#sheet-log'));
  // Honesty is rewarded once a day, never per cigarette — rewarding each one
  // would pay people to smoke more, which would be an appalling incentive.
  const today = new Date().toDateString();
  grant({
    sourceId: `dailylog:${today}`, rule: 'dailyLog',
    amount: rw.EARN.dailyLog, reason: 'Logged honestly today',
  });
  renderHome();
  toast('Logged. Tomorrow is a fresh start.', 'info');
});

/* ══ Completion sheet ════════════════════════════════════════════════════ */

let againAction = null;

function showDone({ title, sub, again }) {
  $('#done-title').textContent = title;
  $('#done-sub').textContent = sub;
  againAction = again;
  openSheet($('#sheet-done'));
  haptic([12, 40, 12]);
}

$('#done-close').addEventListener('click', () => { closeSheet($('#sheet-done')); go('home'); });
$('#done-again').addEventListener('click', () => {
  closeSheet($('#sheet-done'));
  const fn = againAction; againAction = null;
  setTimeout(() => fn?.(), 240);
});

/* ══ Progress ════════════════════════════════════════════════════════════ */

function renderProgress() {
  const s = store.get();
  $('#progress-summary').innerHTML = `
    <div class="stat"><p class="stat__value">${store.totalRode()}</p><p class="stat__label">Urges ridden out</p></div>
    <div class="stat"><p class="stat__value">${store.streak()}</p><p class="stat__label">Day streak</p></div>
    <div class="stat"><p class="stat__value">${store.totalBreathMinutes()}</p><p class="stat__label">Minutes breathing</p></div>
    <div class="stat"><p class="stat__value">${rupees(store.moneySaved())}</p><p class="stat__label">Not spent</p></div>`;

  // Triggers — shown only once there is enough data to mean anything.
  const triggerBox = $('#progress-triggers');
  const counts = {};
  s.smokes.forEach((k) => { counts[k.trigger] = (counts[k.trigger] || 0) + 1; });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (ranked.length && s.smokes.length >= 3) {
    const top = ranked[0][1];
    triggerBox.hidden = false;
    triggerBox.innerHTML = `
      <h2 class="section-title">What tends to set it off</h2>
      <div class="bars">
        ${ranked.slice(0, 6).map(([name, n]) => `
          <div class="bar">
            <span class="bar__name">${name}</span>
            <span class="bar__track"><span class="bar__fill" style="--w:${(n / top) * 100}%"></span></span>
            <span class="bar__n">${n}</span>
          </div>`).join('')}
      </div>`;
  } else {
    triggerBox.hidden = true;
  }

  const dur = (secs) => (secs < 60 ? `${Math.round(secs)}s` : `${Math.round(secs / 60)} min`);

  const items = [
    ...s.urges.map((u) => ({
      at: u.at, kind: u.outcome === 'rode' ? 'rode' : 'smoked',
      title: u.outcome === 'rode' ? 'Rode out an urge' : 'Urge delay, stopped early',
      meta: dur(u.seconds), icon: 'wave',
    })),
    ...s.breaths.map((b) => ({
      at: b.at, kind: 'breath', title: 'Box breathing',
      meta: `${plural(b.cycles || 0, 'round')}`, icon: 'lungs',
    })),
    ...s.smokes.map((k) => ({
      at: k.at, kind: 'smoke', title: 'Smoked one', meta: k.trigger, icon: 'cigarette',
      // Only cigarette entries are removable — a mis-tap shouldn't be permanent,
      // and making it easy to correct is what keeps the logging honest.
      removeId: k.id,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 40);

  const list = $('#progress-list');
  if (!items.length) {
    list.innerHTML = `
      <div class="empty">
        <div class="empty__icon">${icon('wave', 30)}</div>
        <p class="empty__title">Nothing here yet</p>
        <p class="empty__body">Once you use a breathing or delay session, it'll show up here — quietly, just for you.</p>
      </div>`;
    return;
  }
  list.innerHTML = items.map((it) => `
    <div class="entry entry--${it.kind}">
      <span class="entry__icon">${icon(it.icon, 18)}</span>
      <div class="entry__body">
        <p class="entry__title">${it.title}</p>
        <p class="entry__meta">${it.meta} · ${relativeTime(it.at)}</p>
      </div>
      ${it.removeId
        ? `<button class="entry__remove" data-remove-smoke="${it.removeId}"
             aria-label="Remove this cigarette entry">${icon('trash', 16)}</button>`
        : ''}
    </div>`).join('');
}

// Undo a mis-logged cigarette. Confirmed, because it changes your history.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove-smoke]');
  if (!btn) return;
  if (!confirm('Remove this cigarette from your history?')) return;
  store.removeSmoke(btn.dataset.removeSmoke);
  haptic(10);
  renderProgress();
  toast('Entry removed.', 'info');
});

/* ══ Settings ════════════════════════════════════════════════════════════ */

function fillSettings() {
  const s = store.get();
  $('#set-name').value = s.name || '';
  $('#set-price').value = s.packPrice;
  $('#set-count').value = s.packCount;
  $('#set-limit').value = s.dailyLimit;
  $('#set-haptics').checked = !!s.haptics;
  $('#set-notify').checked = !!s.notify && (window.Notification?.permission === 'granted');
  $$('.chip', $('#breath-chips')).forEach((c) =>
    c.classList.toggle('is-active', Number(c.dataset.breath) === s.breathSeconds));
}

const bindField = (sel, key, cast = (v) => v) =>
  $(sel).addEventListener('change', (e) => {
    store.update({ [key]: cast(e.target.value) });
    if (key === 'haptics') setHaptics(e.target.checked);
  });

bindField('#set-name', 'name', (v) => String(v).slice(0, 40));
bindField('#set-price', 'packPrice', (v) => Math.max(1, Number(v) || 1));
bindField('#set-count', 'packCount', (v) => Math.min(100, Math.max(1, Number(v) || 1)));
bindField('#set-limit', 'dailyLimit', (v) => Math.min(60, Math.max(0, Number(v) || 0)));

$('#set-haptics').addEventListener('change', (e) => {
  store.update({ haptics: e.target.checked });
  setHaptics(e.target.checked);
  if (e.target.checked) haptic(14);
});

$('#breath-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  $$('.chip', $('#breath-chips')).forEach((c) => c.classList.remove('is-active'));
  chip.classList.add('is-active');
  store.update({ breathSeconds: Number(chip.dataset.breath) });
  haptic(6);
});

/* ---- Backup & restore --------------------------------------------------- */

$('#btn-export').addEventListener('click', () => {
  const blob = new Blob([store.exportData()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `no-malboros-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  haptic(10);
  toast('Backup saved. Keep it somewhere safe.', 'success');
});

$('#btn-import').addEventListener('click', () => $('#import-file').click());

$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = '';                       // so re-picking the same file works

  const text = await file.text();
  // Restoring replaces everything, so it has to be a deliberate choice.
  if (!confirm('Restoring replaces everything currently in this browser. Continue?')) return;

  const res = store.importData(text);
  if (res.error) { toast(res.error, 'error', 5000); return; }

  const { smokes, urges, breaths } = res.counts;
  fillSettings();
  renderHome();
  toast(`Restored ${smokes} logs, ${urges} urges, ${breaths} breathing sessions.`, 'success', 4500);
});

/* ---- Notifications ------------------------------------------------------ */

$('#set-notify').addEventListener('change', async (e) => {
  if (!e.target.checked) { store.update({ notify: false }); return; }

  if (!('Notification' in window)) {
    e.target.checked = false;
    toast("This browser can't show notifications.", 'error');
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    e.target.checked = false;
    toast('Notifications are blocked for this site in your browser settings.', 'info', 4500);
    return;
  }
  store.update({ notify: true });
  haptic(12);
  toast('You\'ll get one message when a delay finishes.', 'success');
});

$('#btn-reset').addEventListener('click', () => {
  if (!confirm('Erase everything stored in this browser? This cannot be undone.')) return;
  store.resetAll();
  fillSettings();
  toast('All data erased.', 'info');
});

/* ══ Tutorial ════════════════════════════════════════════════════════════ */

const TOUR = [
  {
    icon: 'lungs', tone: '',
    title: 'Two ways through.',
    body: "When a craving hits, open this and pick one. That's the whole app — there's nothing else to learn.",
  },
  {
    icon: 'lungs', tone: '',
    title: 'Breathe',
    body: 'Follow the glowing orb: in for four, hold, out for four, hold. The square around it shows which part you\'re on, so you can close your eyes and still keep time.',
  },
  {
    icon: 'wave', tone: 'delay',
    title: 'Delay an urge',
    body: 'Start a timer and wait it out. Cravings rise and pass, usually within minutes. Stop whenever you like — the time you did wait still counts.',
  },
  {
    // Without these two numbers "Not spent" reads ₹0 and looks broken, and
    // nobody goes hunting in Settings for them. Optional, and skippable.
    icon: 'cigarette', tone: '',
    title: 'Your pack',
    body: 'Optional — only used to show what you haven\'t spent. You can change it later in Settings.',
    fields: true,
  },
];

let tourStep = 0;

function renderTour() {
  const s = TOUR[tourStep];
  $('#tour-art').className = `tour__art ${s.tone ? `tour__art--${s.tone}` : ''}`;
  $('#tour-art').innerHTML = icon(s.icon, 34);
  $('#tour-title').textContent = s.title;
  $('#tour-body').textContent = s.body;
  $('#tour-dots').innerHTML = TOUR
    .map((_, i) => `<span class="tour__dot ${i === tourStep ? 'is-on' : ''}"></span>`).join('');
  $('#tour-next').textContent = tourStep === TOUR.length - 1 ? "Let's go" : 'Next';
  $('#tour-skip').textContent = tourStep === 0 ? 'Skip' : 'Back';

  const st = store.get();
  $('#tour-fields').hidden = !s.fields;
  if (s.fields) {
    $('#tour-price').value = st.packPrice;
    $('#tour-count').value = st.packCount;
  }
}

/** Save the pack card's values, if the user filled it in. */
function saveTourFields() {
  if (!TOUR[tourStep]?.fields) return;
  const price = Math.max(1, Number($('#tour-price').value) || 0);
  const count = Math.min(100, Math.max(1, Number($('#tour-count').value) || 0));
  if (price && count) store.update({ packPrice: price, packCount: count });
}

function openTour() {
  tourStep = 0;
  renderTour();
  openSheet($('#sheet-tour'));
}

function finishTour() {
  store.update({ onboarded: true });
  closeSheet($('#sheet-tour'));
}

$('#tour-next').addEventListener('click', () => {
  haptic(6);
  saveTourFields();
  if (tourStep < TOUR.length - 1) { tourStep++; renderTour(); }
  else { finishTour(); renderHome(); }
});

// Doubles as Back once you're past the first card, so nothing is a dead end.
$('#tour-skip').addEventListener('click', () => {
  haptic(6);
  if (tourStep === 0) finishTour();
  else { tourStep--; renderTour(); }
});

$('#btn-show-tour').addEventListener('click', () => { haptic(6); openTour(); });

/* ══ Boot ════════════════════════════════════════════════════════════════ */

[$('#sheet-log'), $('#sheet-done'), $('#sheet-redeem')].forEach(wireScrimDismiss);
renderHome();

// Splash: hold one breath, then reveal. Any tap skips it, and anyone who has
// asked for reduced motion never sees it at all.
(function bootSplash() {
  const splash = $('#splash');
  if (!splash) return;

  let done = false;
  const dismiss = () => {
    if (done) return;
    done = true;
    splash.classList.add('is-out');
    setTimeout(() => {
      splash.remove();
      // The tutorial waits for the splash so the two never overlap.
      if (!store.get().onboarded) openTour();
    }, reduceMotion() ? 0 : 400);
  };

  splash.addEventListener('pointerdown', dismiss);
  setTimeout(dismiss, reduceMotion() ? 0 : 1250);
})();

// Home-screen shortcuts land here: ?go=delay / ?go=breathe. Long-pressing the
// app icon should drop you straight into a session, not the home screen.
(function handleShortcut() {
  const target = new URLSearchParams(location.search).get('go');
  if (target !== 'delay' && target !== 'breathe') return;
  history.replaceState(null, '', location.pathname);   // don't re-fire on reload
  setTimeout(() => {
    go(target);
    setTimeout(() => (target === 'delay' ? startDelay() : startBreathe()), 300);
  }, reduceMotion() ? 0 : 1400);
})();

// Offline support. Registered late so it never competes with first paint.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* fine without it */ });
  });
}

// Keep "time since" honest without burning a timer on every frame.
setInterval(() => { if (current === 'home') renderSince(); }, 30000);

// Never leave a timer running in a hidden tab.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Breathing needs you watching — pause it, there is nothing to follow.
    if (breather?.running) { breather.pause(); setBreatheRunning(false); }
    // An urge delay is the opposite: the instruction is literally "put the
    // phone down and wait." Pausing it when the screen locks would defeat the
    // feature. It runs off a wall clock, so it keeps counting while hidden and
    // reconciles on return.
  } else if (delay?.running) {
    delay.sync();
  }
});
