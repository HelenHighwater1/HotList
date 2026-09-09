import type { Recurrence, RecurrenceUnit, Task } from "../types";
import { DAY_MS } from "./curve";

export function advance(from: Date, every: number, unit: RecurrenceUnit): Date {
  const d = new Date(from);
  if (unit === "day") d.setDate(d.getDate() + every);
  if (unit === "week") d.setDate(d.getDate() + every * 7);
  if (unit === "month") {
    const targetDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + every);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(targetDay, daysInMonth));
  }
  return d;
}

/**
 * Fixed-schedule tasks keep their original calendar anchor (a bill due the 1st
 * stays on the 1st, even if paid late). Floating tasks re-anchor to the moment
 * they were actually completed.
 */
export function nextDue(task: Task, completedAt: Date): Date | null {
  const r: Recurrence = task.recurrence;
  if (r.mode === "none") return null;
  if (r.mode === "floating") return advance(completedAt, r.every, r.unit);

  let next = advance(new Date(task.due), r.every, r.unit);
  let guard = 0;
  while (next.getTime() <= completedAt.getTime() && guard < 500) {
    next = advance(next, r.every, r.unit);
    guard++;
  }
  return next;
}

export function describeRecurrence(r: Recurrence): string {
  if (r.mode === "none") return "One-off";
  const unit = r.every === 1 ? r.unit : `${r.every} ${r.unit}s`;
  const period = r.every === 1 ? `every ${unit}` : `every ${unit}`;
  return r.mode === "fixed" ? `${period}, fixed schedule` : `${period} after I finish it`;
}

export function daysUntil(due: string, now: number): number {
  return Math.round((new Date(due).getTime() - now) / DAY_MS);
}

export function relativeDue(due: string, now: number): string {
  const days = daysUntil(due, now);
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days === -1) return "1 day late";
  if (days < 0) return `${Math.abs(days)} days late`;
  return `due in ${days} days`;
}

export function formatDate(due: string): string {
  return new Date(due).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
