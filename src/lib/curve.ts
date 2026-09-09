import type { CurvePoint, Task } from "../types";

export const DAY_MS = 86_400_000;

export function sortCurve(points: CurvePoint[]): CurvePoint[] {
  return [...points].sort((a, b) => a.x - b.x);
}

export function evalCurve(points: CurvePoint[], x: number): number {
  const pts = sortCurve(points);
  if (pts.length === 0) return 0;
  if (x <= pts[0].x) return pts[0].y;
  if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (x >= a.x && x <= b.x) {
      const span = b.x - a.x;
      if (span === 0) return b.y;
      const t = (x - a.x) / span;
      return a.y + t * (b.y - a.y);
    }
  }
  return pts[pts.length - 1].y;
}

/** Fraction of the curve's time window (lead -> late) that `now` sits at. */
export function timePosition(task: Task, now: number): number {
  const due = new Date(task.due).getTime();
  const start = due - task.leadDays * DAY_MS;
  const end = due + task.lateDays * DAY_MS;
  return clamp01((now - start) / (end - start));
}

export function dueFraction(task: Task): number {
  return task.leadDays / (task.leadDays + task.lateDays);
}

export function urgencyOf(task: Task, now: number): number {
  return clamp01(evalCurve(task.curve, timePosition(task, now)));
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Overdue once the due day itself has passed, not the hour on it. */
export function isOverdue(task: Task, now: number): boolean {
  const endOfDueDay = new Date(task.due);
  endOfDueDay.setHours(23, 59, 59, 999);
  return endOfDueDay.getTime() < now;
}

export const CURVE_PRESETS: { id: string; name: string; blurb: string; points: CurvePoint[] }[] = [
  {
    id: "linear",
    name: "Linear",
    blurb: "Ramps evenly as the due date approaches.",
    points: [
      { x: 0, y: 0 },
      { x: 0.67, y: 0.7 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: "cliff",
    name: "Cliff",
    blurb: "Nothing, then everything. Medication, flights, deadlines that bite.",
    points: [
      { x: 0, y: 0.02 },
      { x: 0.6, y: 0.04 },
      { x: 0.64, y: 0.97 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: "flexible",
    name: "Flexible",
    blurb: "Barely cares, even when late. Garage-reorganizing energy.",
    points: [
      { x: 0, y: 0.05 },
      { x: 0.67, y: 0.28 },
      { x: 1, y: 0.38 },
    ],
  },
  {
    id: "decay",
    name: "Fades after",
    blurb: "Peaks at the deadline, then stops mattering once the moment passes.",
    points: [
      { x: 0, y: 0.05 },
      { x: 0.6, y: 0.75 },
      { x: 0.67, y: 1 },
      { x: 0.8, y: 0.35 },
      { x: 1, y: 0.05 },
    ],
  },
];
