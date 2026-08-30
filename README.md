# No Malboros

A calm, private place to get through the moment a craving hits.

Two experiences carry the whole product:

- **Box breathing** — inhale 4 · hold 4 · exhale 4 · hold 4, with a luminous orb
  that breathes with you and a node that walks one side of a square per phase.
- **Urge delay** — a countdown that holds your hand for a few minutes, with
  grounding suggestions and encouragement. Stopping early is never framed as failure.

Everything else (the health energy, money not spent, daily limit, triggers,
history) exists to support those two.

**Learn** adds plain, sourced information about smoking — a body map, a stopping
timeline, withdrawal, nicotine, what's in the smoke, and population statistics.
It sits behind one icon so it never gets between someone and the tools.

## Running it

```bash
npx serve -l 3100
```

Then open http://localhost:3100. No build step, no dependencies, no account.

## Architecture

```
index.html          single page, five views + two sheets
styles/tokens.css   the whole design system: color, type, spacing, shape, depth, motion
styles/app.css      components
js/icons.js         hand-built inline SVG icon set (one line language)
js/store.js         state, persistence, derived values — the only place that touches localStorage
js/ui.js            sheets, toasts, haptics, formatting, number ticker
js/breathe.js       box breathing engine
js/delay.js         urge delay engine
js/learn.js         educational content + its sources, in one auditable place
legacy/             the previous version, kept for reference only
```

**State** lives in `js/store.js` and persists to `localStorage` under
`nomalboros.v2`. Data from the previous version (`nomalboros_app_state_v1`) is
migrated automatically on first load, so existing logs and urge history carry over.
Nothing is ever uploaded — there is no account and no network call.

**Timers** are driven by `requestAnimationFrame` off a wall clock, so the rhythm
never drifts and pause/resume is exact. Both engines pause automatically when the
tab is hidden.

## Design system

Dark-first. The screen is quiet; the breath is the one luminous thing. Teal is the
single accent — it marks action, progress, and the breath itself. Red is reserved
strictly for danger.

- **Shape** is role-based: `12px` controls, `18px` cards, `26px` sheets. Pills only
  for chips.
- **Motion** has three speeds: `120ms` for press, `240ms` for navigation, `320ms`
  for sheets, all on one easing curve.
- **Glass** is used sparingly. Sheets are deliberately solid — a dimming scrim
  separates them instead, because the text on a sheet always has to win.

## Accessibility

- Every interactive target is at least 44px.
- All body and caption text clears WCAG AA (verified, not eyeballed — the quiet
  caption colour sits at 5.0:1).
- Full keyboard navigation with visible focus rings; sheets trap focus, close on
  Escape, and restore focus to their trigger.
- `prefers-reduced-motion` narrows the breathing scale to a gentle, non-vestibular
  range and drops the travelling node — the breath still reads, because it is the
  function rather than decoration.
- `prefers-reduced-transparency` and `prefers-contrast: more` are both honoured.
- Timers announce politely via `aria-live` (every minute and the final ten seconds)
  rather than on every tick.

## How health information is handled

All educational content and its citations live in `js/learn.js`, so every claim
can be audited in one file. The rules it follows:

- Population-level risk language — "increases the risk of", never "will cause".
- Every statistic names the organisation that published it and links out, so it
  can be checked. Figures are described as *as published* rather than stamped
  with a date that can't be verified from inside the app.
- No invented numbers and no invented dates, ever.
- Nothing diagnoses anyone or estimates an individual's risk. The one piece of
  personalisation ("you're logging around N a day") is drawn from the user's own
  logs and explicitly says it is not a prediction.
- Sources used: WHO, CDC, NHS and NIDA.

There is deliberately **no news feed**. A live feed would need a backend, and
inventing headlines or dates to fill one would be worse than not having it.

## Tokens

A motivation layer, not the product. Users earn Tokens for doing the things the
app exists for — completing a delay, completing box breathing, reading a Learn
topic, logging honestly, hitting milestones.

**Conversion lives in one place:** `TOKEN_RUPEE_RATE = 10` in `js/rewards.js`
(10 Tokens = ₹1, so 500 Tokens = ₹50). Nothing else in the app hardcodes it.

### 🔴 This must not back real money as it stands

There is no server. The ledger lives in `localStorage`, which any user can edit
in devtools. **Balances here are not trustworthy.** The architecture is built so
that swapping in a backend is a drop-in change, not a rewrite:

| Property | How it's done | Verified |
|---|---|---|
| No editable balance | Balance is always *derived* by summing an append-only ledger; no `balance` field exists | ✅ |
| Idempotent awards | Every award carries a `sourceId` from the session that earned it; a repeat is a no-op | ✅ refused 3/3 replays |
| Bounded exposure | Per-rule daily limits **and** a global `DAILY_CAP` | ✅ refused past cap |
| Auditable | Every movement is a row with id, time, amount, reason, type, status; nothing is edited or deleted | ✅ |
| No fake payouts | Redemption creates a **request** and a *hold*; there is no code path that marks a payout complete | ✅ |

### Payout rail: gift cards (decided, not yet built)

Redemptions will settle as **gift-card vouchers**, not cash to a bank account.
Vouchers avoid collecting bank/UPI details and sidestep most of the KYC/AML
burden that comes with paying cash to individuals.

Set in one place — `REWARD_PROVIDER` in `js/rewards.js`, currently
`{ kind: 'giftcard', enabled: false }`. **No provider is integrated and no code
path completes a payout.** Requests sit at `requested` until that changes.

Still required before it can go live: a backend that owns the ledger (see the
warning above), a voucher provider, and webhook-driven settlement that appends a
`TX.PAYOUT` row server-side. None of the UI needs to change when it lands.

### Cost model

`DAILY_CAP = 150` is the cost lever: at most ₹15/day per user (~₹450/month).
Every milestone combined is worth 750 Tokens (₹75) once per account, ever.
Hitting the cap never blocks a session — the health tool is never gated on a
reward budget.

### Incentive safety

Logging a cigarette pays **once a day, not per cigarette**. Paying per cigarette
would literally pay people to smoke more. Reading a Learn topic pays once per
topic, ever. There is no gambling, no randomised rewards, no loot boxes, no
leaderboards, and nothing is ever taken away for smoking.

## A note on the health energy

It is a motivational score for the day, not a medical measurement, and the copy
says so. Nothing in this app diagnoses anything or promises a health outcome.
