import type { Task } from "../types";
import { CURVE_PRESETS, DAY_MS } from "./curve";

const preset = (id: string) => CURVE_PRESETS.find((p) => p.id === id)!.points.map((p) => ({ ...p }));

function inDays(n: number): string {
  const d = new Date(Date.now() + n * DAY_MS);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function firstOfNextMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export function seedTasks(): Task[] {
  return [
    {
      id: "heartworm",
      title: "Heartworm pill for Biscuit",
      notes: "Chewable, with breakfast. Missing a dose is the whole point of this app.",
      due: inDays(2),
      leadDays: 14,
      lateDays: 7,
      curve: preset("cliff"),
      recurrence: { mode: "fixed", every: 1, unit: "month" },
      lastCompleted: null,
      completions: 0,
    },
    {
      id: "rent",
      title: "Pay rent",
      notes: "Autopay is off since the bank switch.",
      due: firstOfNextMonth(),
      leadDays: 10,
      lateDays: 5,
      curve: [
        { x: 0, y: 0.05 },
        { x: 0.45, y: 0.2 },
        { x: 0.67, y: 1 },
        { x: 1, y: 1 },
      ],
      recurrence: { mode: "fixed", every: 1, unit: "month" },
      lastCompleted: null,
      completions: 0,
    },
    {
      id: "plants",
      title: "Water the fiddle leaf fig",
      notes: "Resets from whenever I actually water it, not from the calendar.",
      due: inDays(-1),
      leadDays: 4,
      lateDays: 6,
      curve: preset("linear"),
      recurrence: { mode: "floating", every: 9, unit: "day" },
      lastCompleted: null,
      completions: 0,
    },
    {
      id: "garage",
      title: "Reorganize the garage",
      notes: "Will happen eventually. Being late costs nothing.",
      due: inDays(-6),
      leadDays: 21,
      lateDays: 30,
      curve: preset("flexible"),
      recurrence: { mode: "none" },
      lastCompleted: null,
      completions: 0,
    },
    {
      id: "passport",
      title: "Renew passport",
      notes: "Processing takes six weeks, so the panic has to start early.",
      due: inDays(24),
      leadDays: 60,
      lateDays: 14,
      curve: [
        { x: 0, y: 0.1 },
        { x: 0.35, y: 0.45 },
        { x: 0.67, y: 0.9 },
        { x: 1, y: 1 },
      ],
      recurrence: { mode: "none" },
      lastCompleted: null,
      completions: 0,
    },
    {
      id: "rsvp",
      title: "RSVP to Priya's wedding",
      notes: "Pointless the day after the deadline — they'll have sent the count.",
      due: inDays(5),
      leadDays: 14,
      lateDays: 7,
      curve: preset("decay"),
      recurrence: { mode: "none" },
      lastCompleted: null,
      completions: 0,
    },
    {
      id: "dentist",
      title: "Book a dentist cleaning",
      notes: "Six-month cadence, counted from the last visit.",
      due: inDays(11),
      leadDays: 30,
      lateDays: 45,
      curve: preset("linear"),
      recurrence: { mode: "floating", every: 6, unit: "month" },
      lastCompleted: null,
      completions: 0,
    },
  ];
}
