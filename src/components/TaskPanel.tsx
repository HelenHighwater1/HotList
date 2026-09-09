import type { Recurrence, RecurrenceUnit, Task } from "../types";
import { CURVE_PRESETS, dueFraction, timePosition, urgencyOf } from "../lib/curve";
import { describeRecurrence, nextDue, formatDate } from "../lib/recurrence";
import { urgencyColor } from "../lib/color";
import { CurveEditor } from "./CurveEditor";

type Props = {
  task: Task;
  now: number;
  isNew: boolean;
  onChange: (patch: Partial<Task>) => void;
  onCreate?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onClose: () => void;
};

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fromDateInput(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d, 9, 0, 0, 0);
  return date.toISOString();
}

export function TaskPanel({
  task,
  now,
  isNew,
  onChange,
  onCreate,
  onDelete,
  onComplete,
  onClose,
}: Props) {
  const urgency = urgencyOf(task, now);
  const rec = task.recurrence;
  const preview = rec.mode === "none" ? null : nextDue(task, new Date(now));

  function setRecurrence(next: Recurrence) {
    onChange({ recurrence: next });
  }

  return (
    <aside className="panel">
      <header className="panel-head">
        <div>
          <p className="panel-kicker mono">{isNew ? "New task" : "Editing"}</p>
          <h2 className="panel-title">{task.title || "Untitled task"}</h2>
        </div>
        <button className="ghost" onClick={onClose} aria-label="Close editor">
          ✕
        </button>
      </header>

      <div className="panel-body">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={task.title}
            placeholder="Give the dog her heartworm pill"
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="due">Due date</label>
            <input
              id="due"
              type="date"
              value={toDateInput(task.due)}
              onChange={(e) => e.target.value && onChange({ due: fromDateInput(e.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="urgency-now">Urgency now</label>
            <div
              id="urgency-now"
              className="urgency-readout mono"
              style={{ ["--accent" as string]: urgencyColor(urgency) }}
            >
              {Math.round(urgency * 100)}
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={task.notes}
            placeholder="Anything you'll want to remember when this surfaces."
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </div>

        <section className="section">
          <h3 className="section-title">Urgency curve</h3>
          <div className="presets">
            {CURVE_PRESETS.map((p) => (
              <button
                key={p.id}
                className="preset"
                title={p.blurb}
                onClick={() => onChange({ curve: p.points.map((pt) => ({ ...pt })) })}
              >
                {p.name}
              </button>
            ))}
          </div>
          <CurveEditor
            curve={task.curve}
            onChange={(curve) => onChange({ curve })}
            dueAt={dueFraction(task)}
            position={timePosition(task, now)}
            leadDays={task.leadDays}
            lateDays={task.lateDays}
          />
          <div className="field-row">
            <div className="field">
              <label htmlFor="lead">Starts caring (days before)</label>
              <input
                id="lead"
                type="number"
                min={1}
                max={365}
                value={task.leadDays}
                onChange={(e) => onChange({ leadDays: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <div className="field">
              <label htmlFor="late">Stays on the board (days after)</label>
              <input
                id="late"
                type="number"
                min={1}
                max={365}
                value={task.lateDays}
                onChange={(e) => onChange({ lateDays: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          </div>
        </section>

        <section className="section">
          <h3 className="section-title">Recurrence</h3>
          <div className="modes">
            {(
              [
                ["none", "One-off"],
                ["fixed", "Fixed schedule"],
                ["floating", "From completion"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                className={`mode${rec.mode === mode ? " is-on" : ""}`}
                onClick={() =>
                  setRecurrence(
                    mode === "none"
                      ? { mode: "none" }
                      : { mode, every: rec.mode === "none" ? 1 : rec.every, unit: rec.mode === "none" ? "month" : rec.unit },
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>

          {rec.mode !== "none" && (
            <>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="every">Every</label>
                  <input
                    id="every"
                    type="number"
                    min={1}
                    max={99}
                    value={rec.every}
                    onChange={(e) =>
                      setRecurrence({ ...rec, every: Math.max(1, Number(e.target.value) || 1) })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="unit">Unit</label>
                  <select
                    id="unit"
                    value={rec.unit}
                    onChange={(e) =>
                      setRecurrence({ ...rec, unit: e.target.value as RecurrenceUnit })
                    }
                  >
                    <option value="day">days</option>
                    <option value="week">weeks</option>
                    <option value="month">months</option>
                  </select>
                </div>
              </div>
              <p className="explain">
                {rec.mode === "fixed"
                  ? "Keeps its calendar anchor. Pay rent on the 4th and it's still due the 1st next month."
                  : "Re-anchors to when you finish it. Water the plants two days late and the clock restarts then."}
                {preview && (
                  <>
                    {" "}
                    Completing it today would set the next due date to{" "}
                    <span className="mono">{formatDate(preview.toISOString())}</span>.
                  </>
                )}
              </p>
            </>
          )}
          {task.lastCompleted && (
            <p className="explain mono">
              Last completed {formatDate(task.lastCompleted)} · {task.completions}×
            </p>
          )}
        </section>
      </div>

      <footer className="panel-foot">
        {isNew ? (
          <button className="primary" onClick={onCreate} disabled={!task.title.trim()}>
            Add task
          </button>
        ) : (
          <>
            <button className="primary" onClick={onComplete}>
              Complete
              {rec.mode !== "none" ? " & reschedule" : ""}
            </button>
            <button className="ghost danger" onClick={onDelete}>
              Delete
            </button>
          </>
        )}
        <span className="foot-note">{describeRecurrence(rec)}</span>
      </footer>
    </aside>
  );
}
