const COOL = [47, 143, 138];
const WARM = [223, 160, 25];
const HOT = [194, 56, 47];

function mix(a: number[], b: number[], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** Urgency 0..1 mapped onto the board's cool -> warm -> hot ramp. */
export function urgencyColor(u: number): string {
  return u <= 0.5 ? mix(COOL, WARM, u / 0.5) : mix(WARM, HOT, (u - 0.5) / 0.5);
}
