/**
 * NO MALBOROS — Tokens
 *
 * ⚠️  SECURITY REALITY, READ BEFORE CONNECTING THIS TO MONEY
 *
 * This build has no server. Everything below runs in the browser and persists
 * to localStorage, which the user can edit freely with devtools. That means
 * balances here are NOT trustworthy and MUST NOT back real payouts as-is.
 *
 * What this file does instead is make the migration to a server a drop-in:
 *   · The ledger is append-only. Balance is always DERIVED by summing it,
 *     never stored as a mutable number — so there is no "balance" field to
 *     tamper with, and a server can replay the same ledger for the same result.
 *   · Every award carries a `sourceId` derived from the thing that earned it
 *     (a specific session id). Awarding the same sourceId twice is a no-op,
 *     so retries and double-submits are idempotent by construction.
 *   · Earning is capped per day and per rule, so a compromised client still
 *     has a bounded blast radius.
 *   · Redemptions are requests with a status, never an instant success.
 *
 * When a backend exists, `award()` and `requestRedemption()` become API calls
 * and the server re-derives the balance from its own copy of the ledger.
 * Nothing else in the app has to change.
 */

import { uid } from './store.js';

/* ---- Configuration — the single source of truth ------------------------- */

/** 10 Tokens = ₹1, so 500 Tokens = ₹50. Change here, nowhere else. */
export const TOKEN_RUPEE_RATE = 10;

/** Minimum balance before a redemption can be requested. */
export const MIN_REDEEM_TOKENS = 500;

/**
 * Decided payout rail: gift-card vouchers, not cash to a bank account.
 * Vouchers avoid collecting bank/UPI details and most of the KYC/AML burden
 * that comes with paying cash to individuals.
 *
 * NOT WIRED UP YET — no provider is integrated, and no code path in this app
 * completes a payout. When one is added, it settles `redemptions` server-side
 * and appends a TX.PAYOUT row; nothing in the UI needs to change.
 */
export const REWARD_PROVIDER = {
  kind: 'giftcard',
  label: 'gift card',
  enabled: false,
};

/**
 * Award values. Deliberately modest — see the sustainability note in the
 * README. At the daily cap a user earns ₹12/day, which is already ~₹360/month.
 */
export const EARN = {
  delayComplete:   50,   // finished a full urge delay
  delayLongBonus:  30,   // …and it was 10 minutes or longer
  breatheComplete: 20,   // finished a breathing session of 2 minutes or more
  dailyLog:        10,   // logged honestly today (once a day, not per cigarette)
  learnTopic:       5,   // read a Learn topic (once per topic, ever)
  reflection:      10,   // completed today's reflection
};

/**
 * Ceiling on everything except milestones, per calendar day.
 *
 * THIS IS THE COST LEVER. At 150 Tokens a user can earn at most ₹15/day,
 * so roughly ₹450/month each. Multiply by your expected active users before
 * changing it. Milestones sit outside the cap but are one-time by design:
 * every milestone in the list combined is worth 750 Tokens (₹75) for the
 * lifetime of an account.
 *
 * Hitting the cap never blocks a session — it only stops further earning,
 * because the health tool must never be gated on a reward budget.
 */
export const DAILY_CAP = 150;

/** Per-rule daily ceilings, so no single action can be farmed. */
export const DAILY_LIMITS = {
  delayComplete:   4,
  breatheComplete: 4,
  dailyLog:        1,
  reflection:      1,
};

/** Total value of every milestone, for budgeting. */
export const LIFETIME_MILESTONE_TOKENS = 750;

export const TX = { EARN: 'earn', MILESTONE: 'milestone', HOLD: 'hold', REFUND: 'refund', PAYOUT: 'payout' };

/* ---- Milestones — progress, never shame --------------------------------- */

export const MILESTONES = [
  { id: 'first-delay',   tokens: 50,  title: 'First urge delayed',      hint: 'You rode one out.',
    test: (s) => rode(s).length >= 1 },
  { id: 'five-delays',   tokens: 100, title: '5 urges delayed',         hint: 'A pattern, not a fluke.',
    test: (s) => rode(s).length >= 5 },
  { id: 'thirty-min',    tokens: 100, title: '30 minutes delayed',      hint: 'Half an hour you waited out.',
    test: (s) => totalDelayed(s) >= 1800 },
  { id: 'first-breath',  tokens: 50,  title: 'First breathing session', hint: 'You gave it a go.',
    test: (s) => (s.breaths || []).length >= 1 },
  { id: 'ten-breaths',   tokens: 100, title: '10 breathing sessions',   hint: 'This is a habit now.',
    test: (s) => (s.breaths || []).length >= 10 },
  { id: 'long-delay',    tokens: 100, title: 'A 15-minute delay',       hint: 'Your longest yet.',
    test: (s) => Math.max(0, ...rode(s).map((u) => u.seconds || 0)) >= 900 },
  { id: 'seven-day',     tokens: 250, title: '7 days of progress',      hint: 'A full week.',
    test: (s) => streakDays(s) >= 7 },
];

const rode = (s) => (s.urges || []).filter((u) => u.outcome === 'rode');
const totalDelayed = (s) => rode(s).reduce((a, u) => a + (u.seconds || 0), 0);

function streakDays(s) {
  const days = new Set(rode(s).map((u) => new Date(u.at).toDateString()));
  if (!days.size) return 0;
  let n = 0;
  const c = new Date();
  if (!days.has(c.toDateString())) c.setDate(c.getDate() - 1);
  while (days.has(c.toDateString())) { n++; c.setDate(c.getDate() - 1); }
  return n;
}

/* ---- Derived values — never stored, always recomputed ------------------- */

export const toRupees = (tokens) => Math.floor(tokens / TOKEN_RUPEE_RATE);

const sameDay = (iso) => new Date(iso).toDateString() === new Date().toDateString();

/** Balance is the sum of the ledger. There is no editable balance field. */
export const balance = (ledger = []) => ledger.reduce((a, t) => a + t.amount, 0);

/** Everything ever earned (awards only, holds and payouts excluded). */
export const lifetimeEarned = (ledger = []) =>
  ledger.filter((t) => t.amount > 0 && t.type !== TX.REFUND).reduce((a, t) => a + t.amount, 0);

/** Tokens committed to a redemption that has not been settled or cancelled. */
export const heldTokens = (ledger = []) =>
  Math.abs(ledger.filter((t) => t.type === TX.HOLD).reduce((a, t) => a + t.amount, 0));

export const redeemedTokens = (ledger = []) =>
  Math.abs(ledger.filter((t) => t.type === TX.PAYOUT).reduce((a, t) => a + t.amount, 0));

export const earnedToday = (ledger = []) =>
  ledger.filter((t) => t.amount > 0 && t.type === TX.EARN && sameDay(t.at))
        .reduce((a, t) => a + t.amount, 0);

const countToday = (ledger, rule) =>
  ledger.filter((t) => t.rule === rule && sameDay(t.at)).length;

/* ---- Awarding ----------------------------------------------------------- */

/**
 * Append an award if and only if it is allowed. Returns the transaction that
 * was written, or null if it was refused — callers can treat null as "already
 * counted" and carry on.
 *
 * Refusal reasons: duplicate sourceId, per-rule daily limit, daily cap.
 */
export function award(ledger, { sourceId, rule, amount, reason, type = TX.EARN }) {
  if (!sourceId || !amount) return null;

  // Idempotency: the same source can only ever pay out once.
  if (ledger.some((t) => t.sourceId === sourceId)) return null;

  if (type === TX.EARN) {
    const limit = DAILY_LIMITS[rule];
    if (limit && countToday(ledger, rule) >= limit) return null;
    if (earnedToday(ledger) + amount > DAILY_CAP) return null;
  }

  return {
    id: uid(),
    at: new Date().toISOString(),
    sourceId,
    rule: rule || null,
    amount,
    reason,
    type,
    status: 'settled',
  };
}

/** Milestones a user now qualifies for and has not already been paid for. */
export function pendingMilestones(state) {
  const ledger = state.ledger || [];
  return MILESTONES.filter(
    (m) => m.test(state) && !ledger.some((t) => t.sourceId === `milestone:${m.id}`)
  );
}

export const isMilestoneEarned = (ledger, id) =>
  (ledger || []).some((t) => t.sourceId === `milestone:${id}`);

/* ---- Redemption --------------------------------------------------------- */

/**
 * Create a redemption REQUEST. This never pays anyone — it places a hold on
 * the tokens and records an auditable request for a backend to settle later.
 * There is deliberately no code path in this app that marks a payout complete.
 */
export function requestRedemption(state, tokens) {
  const ledger = state.ledger || [];
  const available = balance(ledger);

  if (tokens < MIN_REDEEM_TOKENS) return { error: `Minimum redemption is ${MIN_REDEEM_TOKENS} Tokens.` };
  if (tokens > available) return { error: 'You don\'t have that many Tokens available.' };

  const requestId = uid();
  const hold = {
    id: uid(),
    at: new Date().toISOString(),
    sourceId: `redemption:${requestId}`,
    rule: null,
    amount: -tokens,
    reason: `Redemption requested — ₹${toRupees(tokens)}`,
    type: TX.HOLD,
    status: 'pending',
  };
  const request = {
    id: requestId,
    at: new Date().toISOString(),
    tokens,
    rupees: toRupees(tokens),
    // 'requested' is the only status this build can produce. A server owns
    // every transition after this point.
    status: 'requested',
    provider: REWARD_PROVIDER.kind,
    settledAt: null,
  };
  return { hold, request };
}

/** Cancel an unsettled request and return the held tokens to the balance. */
export function cancelRedemption(state, requestId) {
  const req = (state.redemptions || []).find((r) => r.id === requestId);
  if (!req || req.status !== 'requested') return null;
  return {
    refund: {
      id: uid(),
      at: new Date().toISOString(),
      sourceId: `refund:${requestId}`,
      rule: null,
      amount: req.tokens,
      reason: 'Redemption cancelled',
      type: TX.REFUND,
      status: 'settled',
    },
    requestId,
  };
}

/* ---- Earn-screen copy --------------------------------------------------- */

export const EARN_ACTIONS = [
  { rule: 'delayComplete',   tokens: EARN.delayComplete,   title: 'Complete an urge delay',   sub: `Up to ${DAILY_LIMITS.delayComplete}× a day`,   go: 'delay',   icon: 'wave' },
  { rule: 'delayLongBonus',  tokens: EARN.delayLongBonus,  title: 'Delay for 10 minutes',     sub: 'Bonus on top of the above',                    go: 'delay',   icon: 'clock' },
  { rule: 'breatheComplete', tokens: EARN.breatheComplete, title: 'Complete box breathing',   sub: `2 minutes or more, up to ${DAILY_LIMITS.breatheComplete}× a day`, go: 'breathe', icon: 'lungs' },
  { rule: 'reflection',      tokens: EARN.reflection,      title: "Today's reflection",       sub: 'Once a day',                                    go: null,      icon: 'spark' },
  { rule: 'learnTopic',      tokens: EARN.learnTopic,      title: 'Read a Learn topic',       sub: 'Once per topic',                                go: 'learn',   icon: 'learn' },
  { rule: 'dailyLog',        tokens: EARN.dailyLog,        title: 'Log honestly',             sub: 'Once a day, however many you logged',           go: null,      icon: 'cigarette' },
];
