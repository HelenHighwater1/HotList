export type CurvePoint = { x: number; y: number };

export type RecurrenceUnit = "day" | "week" | "month";

export type Recurrence =
  | { mode: "none" }
  | { mode: "fixed"; every: number; unit: RecurrenceUnit }
  | { mode: "floating"; every: number; unit: RecurrenceUnit };

export type Task = {
  id: string;
  title: string;
  notes: string;
  due: string;
  leadDays: number;
  lateDays: number;
  curve: CurvePoint[];
  recurrence: Recurrence;
  lastCompleted: string | null;
  completions: number;
};
