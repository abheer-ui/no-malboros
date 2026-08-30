/**
 * NO MALBOROS — Learn
 *
 * Factual, calm, sourced. Rules this file follows without exception:
 *  · Population-level risk language ("increases the risk of"), never "will cause".
 *  · Every statistic names its organisation and links out so it can be checked.
 *  · No invented numbers, no invented dates, no fear framing.
 *  · Nothing here diagnoses anyone or predicts an individual outcome.
 */

/* ---- Sources ------------------------------------------------------------ */

export const SOURCES = {
  who: {
    org: 'World Health Organization',
    title: 'Tobacco — fact sheet',
    url: 'https://www.who.int/news-room/fact-sheets/detail/tobacco',
  },
  cdc: {
    org: 'Centers for Disease Control and Prevention',
    title: 'Smoking and Tobacco Use',
    url: 'https://www.cdc.gov/tobacco/',
  },
  nhs: {
    org: 'NHS',
    title: 'Quit smoking',
    url: 'https://www.nhs.uk/live-well/quit-smoking/',
  },
  nida: {
    org: 'National Institute on Drug Abuse',
    title: 'Tobacco, Nicotine, and E-Cigarettes',
    url: 'https://nida.nih.gov/research-topics/tobacco-nicotine-e-cigarettes',
  },
};

/* ---- Body map ----------------------------------------------------------- */

export const ORGANS = [
  {
    id: 'brain', name: 'Brain', icon: 'brain', x: 50, y: 13,
    lead: 'Nicotine reaches the brain within seconds.',
    body: [
      'Inhaled nicotine reaches the brain in about ten seconds and triggers the release of dopamine in the brain\'s reward pathways. Repeating that many times a day is what builds dependence.',
      'Smoking also increases the risk of stroke, which happens when blood flow to part of the brain is interrupted.',
    ],
    source: 'nida',
  },
  {
    id: 'eyes', name: 'Eyes', icon: 'eye', x: 57, y: 16,
    lead: 'Linked to two common causes of sight loss.',
    body: [
      'Smoking increases the risk of age-related macular degeneration and of cataracts — two of the more common causes of vision loss later in life.',
      'It can also worsen dry, irritated eyes.',
    ],
    source: 'cdc',
  },
  {
    id: 'mouth', name: 'Mouth & throat', icon: 'mouth', x: 43, y: 19,
    lead: 'The first tissue the smoke touches.',
    body: [
      'Smoking increases the risk of cancers of the mouth, throat, voice box and oesophagus.',
      'More immediately, it contributes to gum disease and tooth loss, and it dulls taste and smell — both of which often start to recover after stopping.',
    ],
    source: 'cdc',
  },
  {
    id: 'lungs', name: 'Lungs', icon: 'lungs', x: 50, y: 40,
    lead: 'Where most of the damage accumulates.',
    body: [
      'Smoke inflames the airways and gradually destroys the tiny air sacs that move oxygen into the blood. Over time this becomes COPD — chronic bronchitis and emphysema — which is long-term and not fully reversible.',
      'The CDC reports that cigarette smoking causes about 80–90% of lung cancer deaths in the United States.',
    ],
    source: 'cdc',
  },
  {
    id: 'heart', name: 'Heart', icon: 'heart', x: 41, y: 45,
    lead: 'Risk rises well before any symptoms.',
    body: [
      'Smoking raises heart rate and blood pressure and speeds up the build-up of fatty deposits in the arteries that feed the heart.',
      'The CDC reports that smoking increases the risk of coronary heart disease by roughly two to four times.',
    ],
    source: 'cdc',
  },
  {
    id: 'vessels', name: 'Blood & circulation', icon: 'vessels', x: 43, y: 78,
    lead: 'Less oxygen, stickier blood.',
    body: [
      'Carbon monoxide in smoke binds to red blood cells in place of oxygen, so less oxygen reaches the body. Blood vessels narrow and stiffen, and blood clots more easily.',
      'This contributes to peripheral arterial disease, which most often shows up as pain in the legs when walking.',
    ],
    source: 'cdc',
  },
  {
    id: 'immune', name: 'Immune system', icon: 'shield', x: 58, y: 42,
    lead: 'Higher inflammation, weaker defences.',
    body: [
      'Smoking raises inflammation throughout the body while weakening immune defences, which is associated with more frequent and more severe respiratory infections.',
      'It is also linked to slower wound healing and to poorer outcomes after surgery.',
    ],
    source: 'cdc',
  },
];

/* ---- What's in the smoke ------------------------------------------------ */

export const CONTENTS = [
  {
    name: 'Nicotine',
    what: 'The substance responsible for dependence.',
    detail: 'It is what makes stopping hard. It is not, however, what causes most of the disease risk — that comes from the other products of burning tobacco.',
  },
  {
    name: 'Tar',
    what: 'The sticky residue left by burning tobacco.',
    detail: 'It coats the airways and carries many of the cancer-causing compounds in smoke.',
  },
  {
    name: 'Carbon monoxide',
    what: 'The same gas that comes out of an exhaust pipe.',
    detail: 'It takes the place of oxygen on red blood cells, so the heart has to work harder to move less oxygen around the body.',
  },
  {
    name: 'Particulate matter',
    what: 'Microscopic solid particles.',
    detail: 'Small enough to settle deep in the lungs, where they drive long-term inflammation.',
  },
  {
    name: 'Toxic chemicals',
    what: 'Formaldehyde, ammonia, hydrogen cyanide and others.',
    detail: 'Industrial substances formed or released when tobacco burns.',
  },
  {
    name: 'Carcinogens',
    what: 'Chemicals known to cause cancer.',
    detail: 'The CDC reports tobacco smoke contains more than 7,000 chemicals, of which about 70 are known to cause cancer.',
  },
];

/* ---- Withdrawal --------------------------------------------------------- */

export const WITHDRAWAL = [
  ['Cravings', 'Usually strongest in the first week. An individual craving often passes within a few minutes, whether or not you smoke.'],
  ['Irritability', 'Feeling short-tempered or frustrated is one of the most commonly reported effects.'],
  ['Trouble concentrating', 'Focus can feel harder for a while as the brain adjusts.'],
  ['Restlessness', 'A sense of agitation, or difficulty sitting still.'],
  ['Low or anxious mood', 'Mood changes are common and usually ease over the following weeks.'],
  ['Increased appetite', 'Appetite often rises, and some weight gain is common.'],
  ['Sleep changes', 'Falling asleep or staying asleep can be disrupted early on.'],
];

/* ---- Stopping timeline -------------------------------------------------- */

export const TIMELINE = [
  ['20 minutes', 'Heart rate and blood pressure begin to come down.'],
  ['12 hours', 'Carbon monoxide in the blood falls back toward a normal level.'],
  ['2–12 weeks', 'Circulation and lung function tend to improve.'],
  ['1–9 months', 'Coughing and shortness of breath tend to decrease.'],
  ['1 year', 'Excess risk of coronary heart disease is around half that of someone who keeps smoking.'],
  ['5–15 years', 'Stroke risk can fall toward that of a non-smoker.'],
  ['10 years', 'Lung cancer death rate is around half that of someone who keeps smoking.'],
  ['15 years', 'Risk of coronary heart disease approaches that of a non-smoker.'],
];

/* ---- Topics ------------------------------------------------------------- */

export const TOPICS = [
  { id: 'body',        icon: 'lungs',   title: 'Your body on smoking', sub: 'What it affects, organ by organ' },
  { id: 'stop',        icon: 'clock',   title: 'What happens when you stop', sub: 'A timeline of changes' },
  { id: 'withdrawal',  icon: 'wave',    title: 'Cravings & withdrawal', sub: 'What to expect, and what helps' },
  { id: 'nicotine',    icon: 'brain',   title: 'Nicotine & dependence', sub: 'Why it is hard to stop' },
  { id: 'contents',    icon: 'spark',   title: "What's in the smoke", sub: 'Six things worth knowing' },
  { id: 'numbers',     icon: 'progress',title: 'The numbers', sub: 'Population-level statistics' },
];

/* ---- Rendering ---------------------------------------------------------- */

export function sourceBlock(key, icon) {
  const s = SOURCES[key];
  return `
    <a class="source" href="${s.url}" target="_blank" rel="noopener noreferrer">
      <span class="source__label">Source</span>
      <span class="source__org">${s.org} — ${s.title}</span>
      <span class="source__link">Open ${icon('external', 14)}</span>
    </a>`;
}

const note = (text) => `<p class="learn-note">${text}</p>`;

export function renderTopic(id, { icon, dailyAverage }) {
  switch (id) {
    case 'body': return `
      <p class="learn-lead">Smoking affects tissue all over the body, not only the lungs. Pick a point on the body — or a name below it — to see what the evidence associates with it.</p>
      <div class="bodymap">
        <svg class="bodymap__fig" viewBox="0 0 100 101" aria-hidden="true">
          <path d="M50 6c-4.2 0-7 3-7 7s2.4 8 7 8 7-4.2 7-8-2.8-7-7-7Z"/>
          <path d="M50 22c-8 0-13 3-15.5 5.5C31 31 29 39 28 48c-.7 6-1 12-1 16 0 2 1.4 3 3 3s3-1.2 3.2-3c.3-3 .6-7 1-10 .2 5 .2 12-.2 18-.4 6-1 14-1 19 0 2.5 1.6 4 4 4s3.8-1.5 4-4c.4-6 1.2-14 1.6-19 .3-3.6 1-5.6 2.4-5.6s2.1 2 2.4 5.6c.4 5 1.2 13 1.6 19 .2 2.5 1.6 4 4 4s4-1.5 4-4c0-5-.6-13-1-19-.4-6-.4-13-.2-18 .4 3 .7 7 1 10 .2 1.8 1.6 3 3.2 3s3-1 3-3c0-4-.3-10-1-16-1-9-3-17-6.5-20.5C63 25 58 22 50 22Z"/>
        </svg>
        ${ORGANS.map((o) => `
          <button class="hotspot" data-organ="${o.id}"
            style="--x:${o.x}%;--y:${o.y}%" aria-label="${o.name}">
            <span class="hotspot__dot"></span>
          </button>`).join('')}
      </div>
      <div class="chips chips--wrap organ-chips" role="group" aria-label="Choose a part of the body">
        ${ORGANS.map((o) => `<button class="chip" data-organ="${o.id}">${o.name}</button>`).join('')}
      </div>
      <div class="organ-panel" id="organ-panel"></div>
      ${note('Everything here describes risk across large populations. It cannot tell you what will happen to any one person.')}`;

    case 'stop': return `
      <p class="learn-lead">Health benefits begin after stopping smoking, and some risks decrease over time. These are patterns observed across large groups — individual experiences vary.</p>
      <ol class="timeline-list">
        ${TIMELINE.map(([when, what]) => `
          <li class="tl">
            <span class="tl__when">${when}</span>
            <span class="tl__what">${what}</span>
          </li>`).join('')}
      </ol>
      ${sourceBlock('who', icon)}
      ${sourceBlock('cdc', icon)}`;

    case 'withdrawal': return `
      <p class="learn-lead">When nicotine intake drops or stops, the body adjusts. These effects are common, they are temporary, and they are not a sign that something is wrong.</p>
      <dl class="deflist">
        ${WITHDRAWAL.map(([t, d]) => `<div class="def"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}
      </dl>

      <div class="learn-cta">
        <p class="learn-cta__title">Having a craving right now?</p>
        <p class="learn-cta__sub">A craving usually passes in a few minutes. You don't have to do anything with it.</p>
        <div class="learn-cta__actions">
          <button class="btn btn--primary btn--wide" data-go="delay">${icon('wave', 20)}<span>Delay an urge</span></button>
          <button class="btn btn--ghost btn--wide" data-go="breathe">${icon('lungs', 20)}<span>Breathe</span></button>
        </div>
      </div>
      ${sourceBlock('nhs', icon)}`;

    case 'nicotine': return `
      <p class="learn-lead">Nicotine is why stopping is hard. It is not the main reason smoking is dangerous — and both halves of that sentence matter.</p>
      <dl class="deflist">
        <div class="def"><dt>What it does</dt><dd>Inhaled nicotine reaches the brain in about ten seconds and releases dopamine in the reward pathways. The brain quickly links that feeling to the act of smoking.</dd></div>
        <div class="def"><dt>How dependence builds</dt><dd>With repetition the brain adapts and expects nicotine. Going without it produces withdrawal, and smoking relieves it — a loop that reinforces itself many times a day.</dd></div>
        <div class="def"><dt>The important distinction</dt><dd>Nicotine is primarily responsible for dependence. Most of the disease risk from smoking comes from the many other substances produced by <em>burning</em> tobacco.</dd></div>
        <div class="def"><dt>Not harmless</dt><dd>That distinction does not make nicotine safe. It affects the cardiovascular system, is harmful during pregnancy, and can affect the developing adolescent brain.</dd></div>
      </dl>
      ${sourceBlock('nida', icon)}`;

    case 'contents': return `
      <p class="learn-lead">Burning tobacco produces thousands of substances. These six categories cover most of what matters.</p>
      <div class="stack">
        ${CONTENTS.map((c) => `
          <details class="disclose">
            <summary>
              <span class="disclose__name">${c.name}</span>
              <span class="disclose__what">${c.what}</span>
              <span class="disclose__chev">${icon('chevron', 16)}</span>
            </summary>
            <p class="disclose__body">${c.detail}</p>
          </details>`).join('')}
      </div>
      ${sourceBlock('cdc', icon)}`;

    case 'numbers': return `
      <p class="learn-lead">These are population-level figures, reported by public-health bodies. They describe scale — not any individual's outcome.</p>
      <div class="figures">
        <div class="figure">
          <p class="figure__value">8 million+</p>
          <p class="figure__label">deaths a year worldwide are attributed to tobacco, according to the WHO. Around 1.3 million of those are non-smokers exposed to second-hand smoke.</p>
        </div>
        <div class="figure">
          <p class="figure__value">480,000+</p>
          <p class="figure__label">deaths a year in the United States are caused by cigarette smoking, according to the CDC — including roughly 41,000 from second-hand smoke exposure.</p>
        </div>
        <div class="figure">
          <p class="figure__value">Leading causes</p>
          <p class="figure__label">Most tobacco-related deaths come from cardiovascular disease, cancer (lung cancer above all) and chronic respiratory disease.</p>
        </div>
      </div>
      ${dailyAverage ? `
        <div class="personal">
          <p class="personal__title">Your own logs</p>
          <p class="personal__body">You're currently logging around ${dailyAverage} ${dailyAverage === 1 ? 'cigarette' : 'cigarettes'} a day. That's context for reading the above — it isn't a prediction about your health, and no app can make one.</p>
        </div>` : ''}
      ${sourceBlock('who', icon)}
      ${sourceBlock('cdc', icon)}
      ${note('Figures are as published by each organisation. Open a source to check the current numbers.')}`;

    default: return '';
  }
}

export function renderOrgan(id, { icon }) {
  const o = ORGANS.find((x) => x.id === id);
  if (!o) return '';
  return `
    <div class="organ">
      <div class="organ__head">
        <span class="organ__icon">${icon(o.icon, 20)}</span>
        <div>
          <p class="organ__name">${o.name}</p>
          <p class="organ__lead">${o.lead}</p>
        </div>
      </div>
      ${o.body.map((p) => `<p class="organ__p">${p}</p>`).join('')}
      ${sourceBlock(o.source, icon)}
    </div>`;
}
