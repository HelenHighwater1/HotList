import type { CurvePoint } from "../types";
import { evalCurve } from "../lib/curve";
import { urgencyColor } from "../lib/color";
import { roughPath } from "../lib/rough";
import { THEME } from "../lib/theme";

type Props = {
  curve: CurvePoint[];
  position: number;
  dueAt: number;
  seed: number;
  width?: number;
  height?: number;
};

export function MiniCurve({ curve, position, dueAt, seed, width = 88, height = 36 }: Props) {
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const samples = 14;
  const pts: [number, number][] = Array.from({ length: samples + 1 }, (_, i) => {
    const x = i / samples;
    return [pad + x * w, pad + (1 - evalCurve(curve, x)) * h];
  });

  const line = roughPath(pts, {
    seed: seed + 3,
    roughness: 0.9,
    bowing: 1,
    stroke: THEME.ink,
    strokeWidth: 1.1,
  });

  const nowY = evalCurve(curve, position);
  const cx = pad + position * w;
  const cy = pad + (1 - nowY) * h;
  const dueX = pad + dueAt * w;

  return (
    <svg width={width} height={height} className="mini-curve" aria-hidden="true">
      <line x1={dueX} y1={1} x2={dueX} y2={height - 1} className="mini-due" />
      {line.map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill="none" />
      ))}
      <circle className="mini-halo" cx={cx} cy={cy} r={3.6} fill={urgencyColor(nowY)} />
      <circle
        className="mini-now"
        cx={cx}
        cy={cy}
        r={3.6}
        fill={urgencyColor(nowY)}
        stroke={THEME.ink}
        strokeWidth={1}
      />
    </svg>
  );
}
