import type { Task } from "../types";
import { isOverdue, urgencyOf } from "./curve";

export type Column = {
  id: string;
  label: string;
  hint: string;
  tasks: { task: Task; urgency: number }[];
};

const BANDS = [
  { min: 0.75, label: "Do these now" },
  { min: 0.5, label: "Heating up" },
  { min: 0.25, label: "On the radar" },
  { min: 0.1, label: "Cold storage" },
  { min: -1, label: "Someday" },
];

const MAX_CLUSTERS = 4;
const MIN_GAP = 0.06;

/** Natural-breaks split of the urgency values: cut at the widest gaps. */
function splitByGaps(values: number[]): number[][] {
  const sorted = [...values].sort((a, b) => b - a);
  const gaps = sorted
    .slice(0, -1)
    .map((v, i) => ({ i, gap: v - sorted[i + 1] }))
    .filter((g) => g.gap >= MIN_GAP)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, MAX_CLUSTERS - 1)
    .map((g) => g.i)
    .sort((a, b) => a - b);

  const groups: number[][] = [];
  let start = 0;
  for (const cut of gaps) {
    groups.push(sorted.slice(start, cut + 1));
    start = cut + 1;
  }
  groups.push(sorted.slice(start));
  return groups.filter((g) => g.length > 0);
}

/**
 * Labels are relative: the hottest cluster takes the band its own urgency
 * earns, and the rest step down from there so every column reads distinctly.
 */
function labelsFor(means: number[]): string[] {
  const topBand = BANDS.findIndex((b) => means[0] >= b.min);
  const start = Math.min(topBand, BANDS.length - means.length);
  return means.map((_, i) => BANDS[start + i].label);
}

export function buildBoard(tasks: Task[], now: number): Column[] {
  const scored = tasks.map((task) => ({ task, urgency: urgencyOf(task, now) }));
  const overdue = scored.filter((s) => isOverdue(s.task, now));
  const upcoming = scored.filter((s) => !isOverdue(s.task, now));

  const columns: Column[] = [];
  if (overdue.length > 0) {
    columns.push({
      id: "overdue",
      label: "Overdue",
      hint: "past the date, urgency still set by each curve",
      tasks: overdue.sort((a, b) => b.urgency - a.urgency),
    });
  }

  if (upcoming.length === 0) return columns;

  const groups = splitByGaps(upcoming.map((s) => s.urgency));
  const labels = labelsFor(groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length));
  let cursor = 0;
  const byUrgency = [...upcoming].sort((a, b) => b.urgency - a.urgency);

  groups.forEach((group, index) => {
    const members = byUrgency.slice(cursor, cursor + group.length);
    cursor += group.length;
    const label = labels[index];
    const lo = Math.round(Math.min(...group) * 100);
    const hi = Math.round(Math.max(...group) * 100);
    columns.push({
      id: label,
      label,
      hint: lo === hi ? `urgency ${hi}` : `urgency ${lo}–${hi}`,
      tasks: members,
    });
  });

  return columns;
}
