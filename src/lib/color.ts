const COLD = [25, 113, 194];
const WARM = [240, 140, 0];
const HOT = [224, 49, 49];

function mix(a: number[], b: number[], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** Urgency 0..1 mapped onto the board's blue -> amber -> red ramp. */
export function urgencyColor(u: number): string {
  return u <= 0.5 ? mix(COLD, WARM, u / 0.5) : mix(WARM, HOT, (u - 0.5) / 0.5);
}
