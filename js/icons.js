/**
 * NO MALBOROS — icon system
 * One coherent line language: 24px optical grid, 1.75 stroke, round caps
 * and joins, no fills. Inline SVG so icons inherit currentColor and stay
 * crisp in both themes with zero font dependency.
 */

const P = {
  /* Lungs — trachea, two bronchi, two full lobes. Unmistakably lungs. */
  lungs: `<path d="M12 3.5v6.4"/>
          <path d="M12 9.9 10.3 12.4"/><path d="M12 9.9l1.7 2.5"/>
          <path d="M10.3 12.4c0 4.2-.1 6.9-.3 8.1-.2 1-1 1.6-2 1.6H5.6c-1.5 0-2.6-1.3-2.5-2.7.35-3.5 2.6-6.5 5-7.8.9-.3 2.2-.2 2.2.8Z"/>
          <path d="M13.7 12.4c0 4.2.1 6.9.3 8.1.2 1 1 1.6 2 1.6h2.4c1.5 0 2.6-1.3 2.5-2.7-.35-3.5-2.6-6.5-5-7.8-.9-.3-2.2-.2-2.2.8Z"/>`,
  /* Wave — riding the urge out */
  wave: `<path d="M2 12c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/>
         <path d="M2 18c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/>`,
  home: `<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9.7V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.7"/>`,
  progress: `<path d="M4 20V10"/><path d="M10 20V5"/><path d="M16 20v-7"/><path d="M22 20H2"/>`,
  settings: `<path d="M4 8h10"/><path d="M18 8h2"/><circle cx="16" cy="8" r="2"/>
             <path d="M4 16h4"/><path d="M12 16h8"/><circle cx="10" cy="16" r="2"/>`,
  play: `<path d="M8 5.5v13l11-6.5z"/>`,
  pause: `<path d="M9.5 5v14"/><path d="M14.5 5v14"/>`,
  stop: `<rect x="6" y="6" width="12" height="12" rx="2.5"/>`,
  close: `<path d="M6.5 6.5l11 11"/><path d="M17.5 6.5l-11 11"/>`,
  back: `<path d="M15 5l-7 7 7 7"/>`,
  info: `<circle cx="12" cy="12" r="8.5"/><path d="M12 11.5v5"/><path d="M12 8.2v.1"/>`,
  check: `<path d="M5 12.5l4.5 4.5L19 7.5"/>`,
  plus: `<path d="M12 5.5v13"/><path d="M5.5 12h13"/>`,
  cigarette: `<rect x="2.5" y="14" width="15" height="5" rx="1.5"/><path d="M13 14v5"/>
              <path d="M20 8.5c1 .8 1 2.2 0 3"/><path d="M17 7.5c1.4 1.2 1.4 3.3 0 4.5"/>`,
  leaf: `<path d="M20 4C10 4 4.5 8.5 4.5 15.5c0 2.2 1.8 4 4 4C15.5 19.5 20 14 20 4z"/>
         <path d="M4.5 20C7 15.5 11 11.5 16 9"/>`,
  spark: `<path d="M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6z"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>`,
  trash: `<path d="M4.5 7h15"/><path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7"/>
          <path d="M6.5 7l.8 11.6A1.5 1.5 0 0 0 8.8 20h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/>`,

  /* — Learn — */
  learn: `<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2.5 2.5 0 0 1 2 1v13a2.5 2.5 0 0 0-2-1H5.5A1.5 1.5 0 0 1 4 15.5Z"/>
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2.5 2.5 0 0 0-2 1v13a2.5 2.5 0 0 1 2-1h4.5a1.5 1.5 0 0 0 1.5-1.5Z"/>`,
  brain: `<path d="M12 5.5a2.5 2.5 0 0 0-4.9-.7A2.6 2.6 0 0 0 4.6 8a2.7 2.7 0 0 0-.3 4.6A2.6 2.6 0 0 0 6 17.3a2.5 2.5 0 0 0 6-.6Z"/>
          <path d="M12 5.5a2.5 2.5 0 0 1 4.9-.7A2.6 2.6 0 0 1 19.4 8a2.7 2.7 0 0 1 .3 4.6A2.6 2.6 0 0 1 18 17.3a2.5 2.5 0 0 1-6-.6Z"/>`,
  eye: `<path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12Z"/><circle cx="12" cy="12" r="3"/>`,
  heart: `<path d="M12 20.3S3.9 15.6 3.9 9.9A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 8.1 2.4c0 5.7-8.1 10.4-8.1 10.4Z"/>`,
  mouth: `<path d="M3.5 10.5c2.5-1.2 5.3-1.8 8.5-1.8s6 .6 8.5 1.8c-.8 4.4-4.3 6.8-8.5 6.8s-7.7-2.4-8.5-6.8Z"/>
          <path d="M7 9.4c1.3 2 2.9 3 5 3s3.7-1 5-3"/>`,
  vessels: `<path d="M2.5 12h4l2-5 3.5 10 2.5-6 1.5 3h5.5"/>`,
  shield: `<path d="M12 3.5 5 6.2v5.1c0 4.3 2.9 8.1 7 9.2 4.1-1.1 7-4.9 7-9.2V6.2Z"/><path d="M9.3 12.2l1.9 1.9 3.5-3.6"/>`,
  external: `<path d="M14 4.5h5.5V10"/><path d="M19.5 4.5 11 13"/>
             <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4"/>`,
  chevron: `<path d="M9.5 5.5 16 12l-6.5 6.5"/>`,
  /* Token — a faceted coin, deliberately not a coin-with-currency-symbol */
  token: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2 15.4 12 12 16.8 8.6 12Z"/>`,
  lock: `<rect x="4.8" y="10.5" width="14.4" height="9.5" rx="2.2"/>
         <path d="M8.4 10.5V7.9a3.6 3.6 0 0 1 7.2 0v2.6"/>`,
};

/**
 * Build an inline SVG icon string.
 * @param {keyof P} name
 * @param {number} size px (optical grid is 24)
 */
export function icon(name, size = 24) {
  const d = P[name];
  if (!d) return '';
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}"
    fill="none" stroke="currentColor" stroke-width="1.75"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}

/** Replace every <i data-icon="name"> placeholder in a root element. */
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const size = Number(el.dataset.iconSize) || 24;
    el.innerHTML = icon(el.dataset.icon, size);
  });
}

export const ICON_NAMES = Object.keys(P);
