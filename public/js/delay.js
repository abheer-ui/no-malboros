/**
 * NO MALBOROS — Urge Delay
 *
 * A craving peaks and passes. This holds the user's hand for a few minutes
 * without asking anything of them: one ring, one number, one kind sentence.
 * Stopping early is never framed as failure.
 */

import { mmss, haptic } from './ui.js';

export const GROUNDING = [
  { icon: 'leaf',  title: 'Cold glass of water', body: 'Sip it slowly. The cold gives your mouth something else to do.' },
  { icon: 'wave',  title: 'Step outside',        body: 'A change of air and scenery interrupts the loop.' },
  { icon: 'spark', title: 'Wash your hands',     body: 'Warm water, thirty seconds. A small reset for your senses.' },
  { icon: 'clock', title: 'Name five things',    body: 'Five you can see, four you can touch, three you can hear.' },
  { icon: 'lungs', title: 'Long exhale',         body: 'Breathe out for longer than you breathe in. It settles the body.' },
];

const ENCOURAGEMENT = [
  'The wave is already cresting.',
  'You are doing the hard part right now.',
  'This feeling has a shape. It peaks, then it fades.',
  'Nothing to fix. Just wait it out.',
  'Every minute here makes the next one easier.',
  'You have gotten through this before.',
];

const R = 46;                       // ring radius in the 0 0 120 120 viewBox
const CIRC = 2 * Math.PI * R;

export function createDelay({ mount, onTick, onComplete }) {
  mount.innerHTML = `
    <div class="delay-stage">
      <div class="delay-dial">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle class="delay-track" cx="60" cy="60" r="${R}"/>
          <circle class="delay-arc" cx="60" cy="60" r="${R}"
            stroke-dasharray="${CIRC.toFixed(2)}" stroke-dashoffset="0"/>
        </svg>
        <div class="delay-readout">
          <p class="delay-time" id="delay-time" role="timer" aria-live="off">05:00</p>
          <p class="delay-sub" id="delay-sub">remaining</p>
        </div>
      </div>
      <p class="delay-encouragement" id="delay-encouragement">${ENCOURAGEMENT[0]}</p>
    </div>`;

  const arc = mount.querySelector('.delay-arc');
  const timeEl = mount.querySelector('#delay-time');
  const encEl = mount.querySelector('#delay-encouragement');

  let raf = null;
  let running = false;
  let total = 300;
  let remaining = 300;
  let startedAt = 0;
  let baseRemaining = 300;
  let lastWhole = -1;
  let encIndex = 0;
  let encTimer = null;

  function rotateEncouragement() {
    encIndex = (encIndex + 1) % ENCOURAGEMENT.length;
    encEl.classList.remove('is-in');
    setTimeout(() => {
      encEl.textContent = ENCOURAGEMENT[encIndex];
      encEl.classList.add('is-in');
    }, 220);
  }

  function paint(now) {
    remaining = Math.max(0, baseRemaining - (now - startedAt) / 1000);
    const progress = 1 - remaining / total;
    arc.style.strokeDashoffset = (CIRC * progress).toFixed(2);

    const whole = Math.ceil(remaining);
    if (whole !== lastWhole) {
      lastWhole = whole;
      timeEl.textContent = mmss(whole);
      onTick?.(whole, total);
    }

    if (remaining <= 0) {
      stop();
      haptic([18, 60, 18]);
      onComplete?.({ seconds: total });
      return;
    }
    raf = requestAnimationFrame(paint);
  }

  function start(seconds) {
    total = seconds;
    remaining = seconds;
    baseRemaining = seconds;
    lastWhole = -1;
    timeEl.textContent = mmss(seconds);
    arc.style.strokeDashoffset = '0';
    encIndex = 0;
    encEl.textContent = ENCOURAGEMENT[0];
    encEl.classList.add('is-in');
    clearInterval(encTimer);
    encTimer = setInterval(rotateEncouragement, 15000);
    running = true;
    mount.classList.add('is-running');
    startedAt = performance.now();
    raf = requestAnimationFrame(paint);
  }

  function pause() {
    if (!running) return;
    running = false;
    baseRemaining = remaining;
    cancelAnimationFrame(raf);
    clearInterval(encTimer);
    mount.classList.remove('is-running');
  }

  function resume() {
    if (running || remaining <= 0) return;
    running = true;
    mount.classList.add('is-running');
    startedAt = performance.now();
    encTimer = setInterval(rotateEncouragement, 15000);
    raf = requestAnimationFrame(paint);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(encTimer);
    mount.classList.remove('is-running');
  }

  /**
   * Force a recompute after the tab was hidden. requestAnimationFrame stops
   * firing in a backgrounded tab, so time passes without the ring or the
   * countdown moving — and a delay that finished while the phone was locked
   * has to be honoured the moment you look again, not restarted.
   */
  function sync() {
    if (!running) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(paint);
  }

  return {
    start, pause, resume, stop, sync,
    get running() { return running; },
    get remaining() { return remaining; },
    get total() { return total; },
    get elapsed() { return total - remaining; },
  };
}

export const randomGrounding = () => GROUNDING[Math.floor(Math.random() * GROUNDING.length)];
