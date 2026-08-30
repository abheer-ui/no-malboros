/**
 * NO MALBOROS — Box Breathing
 *
 * The signature experience. A luminous orb breathes in the centre while a
 * node walks one side of a square per phase: up = inhale, across = hold,
 * down = exhale, across = hold. The box is visible, so the technique is
 * legible at a glance rather than being decoration.
 *
 * Driven by requestAnimationFrame off a wall-clock so the rhythm never
 * drifts, and so pausing/resuming is exact.
 */

import { haptic, reduceMotion } from './ui.js';

export const PHASES = [
  { key: 'in',    label: 'Breathe in',  hint: 'through your nose' },
  { key: 'hold1', label: 'Hold',        hint: 'stay soft' },
  { key: 'out',   label: 'Breathe out', hint: 'slowly, through your mouth' },
  { key: 'hold2', label: 'Hold',        hint: 'empty and still' },
];

// The breath itself is functional, not decoration — so reduced motion gets a
// gentler, non-vestibular version rather than a static orb. Opacity and the
// phase word carry more of the signal instead.
const FULL_MIN = 0.52;
const CALM_MIN = 0.86;
const MAX_SCALE = 1;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function createBreather({ mount, onPhase, onTick, onComplete }) {
  mount.innerHTML = `
    <div class="breathe-stage">
      <svg class="breathe-box" viewBox="0 0 100 100" aria-hidden="true">
        <path class="breathe-track"
          d="M10,74 L10,26 A16,16 0 0 1 26,10 L74,10 A16,16 0 0 1 90,26 L90,74 A16,16 0 0 1 74,90 L26,90 A16,16 0 0 1 10,74 Z"/>
        <path class="breathe-path" id="breathe-path"
          d="M10,74 L10,26 A16,16 0 0 1 26,10 L74,10 A16,16 0 0 1 90,26 L90,74 A16,16 0 0 1 74,90 L26,90 A16,16 0 0 1 10,74 Z"/>
        <circle class="breathe-node" r="3.2" cx="10" cy="74"/>
      </svg>
      <div class="breathe-orb" aria-hidden="true"><span></span></div>
      <div class="breathe-copy">
        <p class="breathe-phase" id="breathe-phase">Ready</p>
        <p class="breathe-hint" id="breathe-hint">Four seconds each side</p>
      </div>
    </div>`;

  const pathEl = mount.querySelector('.breathe-path');
  const nodeEl = mount.querySelector('.breathe-node');
  const orbEl  = mount.querySelector('.breathe-orb');
  const phaseEl = mount.querySelector('#breathe-phase');
  const hintEl  = mount.querySelector('#breathe-hint');
  const total = pathEl.getTotalLength();

  let raf = null;
  let running = false;
  let phaseSeconds = 4;
  let limitSeconds = 0;      // 0 = untimed
  let elapsed = 0;           // seconds of session actually run
  let startedAt = 0;         // wall clock of current run leg
  let baseElapsed = 0;       // elapsed accumulated before this leg
  let lastPhase = -1;

  function paint(now) {
    elapsed = baseElapsed + (now - startedAt) / 1000;

    const cycle = phaseSeconds * 4;
    const within = elapsed % cycle;
    const phase = Math.floor(within / phaseSeconds);
    const t = (within % phaseSeconds) / phaseSeconds;
    const cycles = Math.floor(elapsed / cycle);

    // Orb: grow on inhale, hold, shrink on exhale, hold.
    const min = reduceMotion() ? CALM_MIN : FULL_MIN;
    let scale = min;
    if (phase === 0) scale = min + (MAX_SCALE - min) * easeInOut(t);
    else if (phase === 1) scale = MAX_SCALE;
    else if (phase === 2) scale = MAX_SCALE - (MAX_SCALE - min) * easeInOut(t);
    orbEl.style.setProperty('--scale', scale.toFixed(4));
    orbEl.style.setProperty('--glow', (0.35 + 0.65 * ((scale - min) / (MAX_SCALE - min))).toFixed(3));

    // Node walks exactly one quarter of the perimeter per phase.
    const p = pathEl.getPointAtLength(((phase + t) / 4) * total);
    nodeEl.setAttribute('cx', p.x.toFixed(2));
    nodeEl.setAttribute('cy', p.y.toFixed(2));

    if (phase !== lastPhase) {
      lastPhase = phase;
      const ph = PHASES[phase];
      phaseEl.textContent = ph.label;
      hintEl.textContent = ph.hint;
      phaseEl.classList.remove('is-swap');
      void phaseEl.offsetWidth;      // restart the cross-fade
      phaseEl.classList.add('is-swap');
      haptic(phase % 2 === 0 ? 12 : 6);
      onPhase?.(ph, phase);
    }

    onTick?.({ elapsed, cycles, remaining: limitSeconds ? Math.max(0, limitSeconds - elapsed) : null });

    if (limitSeconds && elapsed >= limitSeconds) {
      stop();
      onComplete?.({ seconds: Math.round(limitSeconds), cycles });
      return;
    }
    raf = requestAnimationFrame(paint);
  }

  function start({ seconds = 4, limit = 0 } = {}) {
    phaseSeconds = seconds;
    limitSeconds = limit;
    if (running) return;
    running = true;
    mount.classList.add('is-running');
    startedAt = performance.now();
    raf = requestAnimationFrame(paint);
  }

  function pause() {
    if (!running) return;
    running = false;
    baseElapsed = elapsed;
    cancelAnimationFrame(raf);
    mount.classList.remove('is-running');
    phaseEl.textContent = 'Paused';
    hintEl.textContent = 'Take your time';
  }

  function resume() {
    if (running) return;
    running = true;
    mount.classList.add('is-running');
    startedAt = performance.now();
    lastPhase = -1;
    raf = requestAnimationFrame(paint);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    mount.classList.remove('is-running');
  }

  function reset() {
    stop();
    elapsed = 0; baseElapsed = 0; lastPhase = -1;
    orbEl.style.setProperty('--scale', reduceMotion() ? CALM_MIN : FULL_MIN);
    orbEl.style.setProperty('--glow', '0.35');
    nodeEl.setAttribute('cx', '10'); nodeEl.setAttribute('cy', '74');
    phaseEl.textContent = 'Ready';
    hintEl.textContent = `${phaseSeconds} seconds each side`;
  }

  return {
    start, pause, resume, stop, reset,
    get running() { return running; },
    get elapsed() { return elapsed; },
    get cycles() { return Math.floor(elapsed / (phaseSeconds * 4)); },
  };
}
