import type { CurvePoint } from "../types";
import { evalCurve } from "../lib/curve";
import { urgencyColor } from "../lib/color";

type Props = {
  curve: CurvePoint[];
  position: number;
  dueAt: number;
  width?: number;
  height?: number;
};

export function MiniCurve({ curve, position, dueAt, width = 84, height = 34 }: Props) {
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const samples = 40;
  const path = Array.from({ length: samples + 1 }, (_, i) => {
    const x = i / samples;
    const y = evalCurve(curve, x);
    return `${i === 0 ? "M" : "L"}${(pad + x * w).toFixed(2)},${(pad + (1 - y) * h).toFixed(2)}`;
  }).join(" ");

  const nowY = evalCurve(curve, position);
  const cx = pad + position * w;
  const cy = pad + (1 - nowY) * h;
  const dueX = pad + dueAt * w;

  return (
    <svg width={width} height={height} className="mini-curve" aria-hidden="true">
      <line x1={dueX} y1={0} x2={dueX} y2={height} className="mini-due" />
      <path d={`${path} L${pad + w},${pad + h} L${pad},${pad + h} Z`} className="mini-fill" />
      <path d={path} className="mini-line" />
      <circle cx={cx} cy={cy} r={3.4} fill={urgencyColor(nowY)} stroke="#fff" strokeWidth={1.4} />
    </svg>
  );
}
