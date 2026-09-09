import { useRef, useState } from "react";
import type { CurvePoint } from "../types";
import { clamp01, evalCurve, sortCurve } from "../lib/curve";
import { urgencyColor } from "../lib/color";

type Props = {
  curve: CurvePoint[];
  onChange: (points: CurvePoint[]) => void;
  dueAt: number;
  position: number;
  leadDays: number;
  lateDays: number;
};

const W = 520;
const H = 240;
const PAD_L = 34;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 30;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const toPx = (p: CurvePoint) => ({
  x: PAD_L + p.x * PLOT_W,
  y: PAD_T + (1 - p.y) * PLOT_H,
});

export function CurveEditor({ curve, onChange, dueAt, position, leadDays, lateDays }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const points = sortCurve(curve);

  function fromEvent(e: React.PointerEvent): CurvePoint {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;
    return {
      x: clamp01((sx - PAD_L) / PLOT_W),
      y: clamp01(1 - (sy - PAD_T) / PLOT_H),
    };
  }

  function movePoint(index: number, next: CurvePoint) {
    const isFirst = index === 0;
    const isLast = index === points.length - 1;
    const lo = isFirst ? 0 : points[index - 1].x + 0.01;
    const hi = isLast ? 1 : points[index + 1].x - 0.01;
    const x = isFirst ? 0 : isLast ? 1 : Math.min(Math.max(next.x, lo), hi);
    const updated = points.map((p, i) => (i === index ? { x, y: next.y } : p));
    onChange(updated);
  }

  function handleBackgroundClick(e: React.PointerEvent) {
    if (dragging !== null) return;
    const p = fromEvent(e);
    if (p.x <= 0.01 || p.x >= 0.99) return;
    const next = sortCurve([...points, { x: p.x, y: p.y }]);
    onChange(next);
    const index = next.findIndex((q) => q.x === p.x && q.y === p.y);
    setSelected(index);
    setDragging(index);
  }

  function removePoint(index: number) {
    if (index === 0 || index === points.length - 1) return;
    onChange(points.filter((_, i) => i !== index));
    setSelected(null);
  }

  function nudge(index: number, dx: number, dy: number) {
    const p = points[index];
    movePoint(index, { x: clamp01(p.x + dx), y: clamp01(p.y + dy) });
  }

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${toPx(p).x},${toPx(p).y}`).join(" ");
  const areaPath = `${linePath} L${PAD_L + PLOT_W},${PAD_T + PLOT_H} L${PAD_L},${PAD_T + PLOT_H} Z`;
  const dueX = PAD_L + dueAt * PLOT_W;
  const nowX = PAD_L + position * PLOT_W;
  const nowY = evalCurve(points, position);
  const nowPy = PAD_T + (1 - nowY) * PLOT_H;

  return (
    <div className="curve-editor">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="curve-svg"
        role="application"
        aria-label="Urgency curve editor. Drag control points to reshape how urgency ramps."
        onPointerDown={handleBackgroundClick}
        onPointerMove={(e) => {
          if (dragging === null) return;
          e.preventDefault();
          movePoint(dragging, fromEvent(e));
        }}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        <rect
          x={PAD_L}
          y={PAD_T}
          width={PLOT_W}
          height={PLOT_H}
          className="plot-bg"
          rx={2}
        />
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={PAD_L}
            x2={PAD_L + PLOT_W}
            y1={PAD_T + g * PLOT_H}
            y2={PAD_T + g * PLOT_H}
            className="plot-grid"
          />
        ))}
        <rect
          x={dueX}
          y={PAD_T}
          width={PAD_L + PLOT_W - dueX}
          height={PLOT_H}
          className="plot-late"
        />
        <path d={areaPath} className="plot-fill" />
        <path d={linePath} className="plot-line" />

        <line x1={dueX} y1={PAD_T - 6} x2={dueX} y2={PAD_T + PLOT_H} className="plot-due" />
        <text x={dueX + 5} y={PAD_T + 9} className="plot-tick">
          due
        </text>

        <line x1={nowX} y1={PAD_T} x2={nowX} y2={PAD_T + PLOT_H} className="plot-now" />
        <circle cx={nowX} cy={nowPy} r={5} fill={urgencyColor(nowY)} stroke="#fff" strokeWidth={2} />

        {points.map((p, i) => {
          const px = toPx(p);
          const locked = i === 0 || i === points.length - 1;
          return (
            <g key={i}>
              <circle
                cx={px.x}
                cy={px.y}
                r={9}
                className={`handle-hit${selected === i ? " is-selected" : ""}`}
                tabIndex={0}
                role="slider"
                aria-label={`Control point ${i + 1}: urgency ${Math.round(p.y * 100)} at ${Math.round(
                  p.x * 100,
                )} percent through the window`}
                aria-valuenow={Math.round(p.y * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragging(i);
                  setSelected(i);
                }}
                onFocus={() => setSelected(i)}
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 0.1 : 0.02;
                  if (e.key === "ArrowUp") nudge(i, 0, step);
                  else if (e.key === "ArrowDown") nudge(i, 0, -step);
                  else if (e.key === "ArrowLeft" && !locked) nudge(i, -step, 0);
                  else if (e.key === "ArrowRight" && !locked) nudge(i, step, 0);
                  else if ((e.key === "Backspace" || e.key === "Delete") && !locked) removePoint(i);
                  else return;
                  e.preventDefault();
                }}
              />
              <circle cx={px.x} cy={px.y} r={4.5} className="handle" />
            </g>
          );
        })}

        <text x={PAD_L - 8} y={PAD_T + 5} className="axis" textAnchor="end">
          100
        </text>
        <text x={PAD_L - 8} y={PAD_T + PLOT_H} className="axis" textAnchor="end">
          0
        </text>
        <text x={PAD_L} y={H - 10} className="axis">
          {leadDays}d before
        </text>
        <text x={PAD_L + PLOT_W} y={H - 10} className="axis" textAnchor="end">
          {lateDays}d late
        </text>
      </svg>

      <p className="curve-help">
        Drag a point to reshape the ramp. Click the plot to add one, select a point and press Delete
        to remove it. The marker shows where this task sits right now.
        {selected !== null && (
          <>
            {" "}
            <span className="mono">
              [{Math.round(points[selected].x * 100)}%, {Math.round(points[selected].y * 100)}]
            </span>
          </>
        )}
      </p>
    </div>
  );
}
