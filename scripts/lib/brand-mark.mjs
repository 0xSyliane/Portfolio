// @ts-check
// Shared geometry of the "S" stamp (favicon + OG). Pure paths: no font needed.
export const PAPER = "#f7f6f1";
export const STAMP = "#a22b1a";

/** Geometric S, drawn as one stroked path in a 32x32 box. */
export const S_PATH =
  "M21.2 11.2C21.2 8.9 19 7.6 16 7.6s-5.2 1.3-5.2 3.7c0 5.2 10.4 3.1 10.4 8.5 0 2.6-2.4 4.6-5.2 4.6s-5.4-1.6-5.4-4.5";

/** Square stamp with a double border and the S. `size` is the output px size. */
export function stampSvg({ size = 32, background = PAPER, inset = 0 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
<rect width="32" height="32" fill="${background}"/>
<g transform="translate(${inset} ${inset}) scale(${(32 - inset * 2) / 32})">
<rect x="2.5" y="2.5" width="27" height="27" fill="none" stroke="${STAMP}" stroke-width="2"/>
<rect x="5.6" y="5.6" width="20.8" height="20.8" fill="none" stroke="${STAMP}" stroke-width="0.9"/>
<path d="${S_PATH}" fill="none" stroke="${STAMP}" stroke-width="3.2" stroke-linecap="square" stroke-linejoin="round"/>
</g></svg>`;
}
