import { useMemo, useState } from "react";
import "./App.css";
import type { Task } from "./types";
import { seedTasks } from "./lib/seed";
import { buildBoard } from "./lib/cluster";
import { CURVE_PRESETS, DAY_MS } from "./lib/curve";
import { formatDate, nextDue } from "./lib/recurrence";
import { TaskCard } from "./components/TaskCard";
import { TaskPanel } from "./components/TaskPanel";
import { RoughFrame } from "./components/RoughFrame";
import { LoginScreen } from "./components/LoginScreen";
import { seedFrom, THEME } from "./lib/theme";
import { useAuth } from "./lib/auth";

const BASE_NOW = Date.now();

function blankTask(): Task {
  const due = new Date(BASE_NOW + 3 * DAY_MS);
  due.setHours(9, 0, 0, 0);
  return {
    id: `task-${Math.random().toString(36).slice(2, 9)}`,
    title: "",
    notes: "",
    due: due.toISOString(),
    leadDays: 14,
    lateDays: 7,
    curve: CURVE_PRESETS[0].points.map((p) => ({ ...p })),
    recurrence: { mode: "none" },
    lastCompleted: null,
    completions: 0,
  };
}

export default function App() {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks());
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Task | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const now = BASE_NOW + offset * DAY_MS;
  const columns = useMemo(() => buildBoard(tasks, now), [tasks, now]);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  function patchTask(id: string, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function completeTask(task: Task) {
    const completedAt = new Date(now);
    const next = nextDue(task, completedAt);
    if (!next) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (selectedId === task.id) setSelectedId(null);
      setFlash(`${task.title} — done and off the board.`);
      return;
    }
    patchTask(task.id, {
      due: next.toISOString(),
      lastCompleted: completedAt.toISOString(),
      completions: task.completions + 1,
    });
    const how = task.recurrence.mode === "fixed" ? "fixed schedule" : "counted from now";
    setFlash(`${task.title} — next due ${formatDate(next.toISOString())} (${how}).`);
  }

  const nowLabel = new Date(now).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (!user) return <LoginScreen />;

  return (
    <div className="app">
      <header className="topbar">
        <RoughFrame seed={7} stroke={THEME.ink} fill={THEME.panel} strokeWidth={1.4} />
        <div className="brand">
          <h1>Hot List</h1>
          <p className="tagline">Tasks sorted by how much they actually matter right now.</p>
        </div>

        <div className="timebox">
          <div className="timebox-head">
            <label htmlFor="timetravel">Pretend it's</label>
            <span className="mono time-label">{nowLabel}</span>
          </div>
          <input
            id="timetravel"
            type="range"
            min={-14}
            max={45}
            step={1}
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
          />
          <div className="timebox-foot mono">
            <span>{offset === 0 ? "today" : `${offset > 0 ? "+" : ""}${offset}d`}</span>
            <button className="ghost small" onClick={() => setOffset(0)} disabled={offset === 0}>
              reset
            </button>
          </div>
        </div>

        <button
          className="primary"
          onClick={() => {
            setDraft(blankTask());
            setSelectedId(null);
          }}
        >
          New task
        </button>

        <div className="account">
          <span className="mono account-name">{user}</span>
          <button className="ghost small" onClick={signOut}>
            sign out
          </button>
        </div>
      </header>

      {flash && (
        <div className="flash" role="status">
          <span>{flash}</span>
          <button className="ghost small" onClick={() => setFlash(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <div className="stage">
        <main className="board">
          {columns.length === 0 && (
            <div className="empty">
              <h2>Nothing on the board</h2>
              <p>Add a task and shape its curve to see where it lands.</p>
            </div>
          )}
          {columns.map((col) => (
            <section key={col.id} className={`column${col.id === "overdue" ? " is-overdue" : ""}`}>
              <RoughFrame
                seed={seedFrom(col.id)}
                stroke={col.id === "overdue" ? THEME.red : THEME.hairline}
                strokeWidth={col.id === "overdue" ? 1.8 : 1.4}
                roughness={1.5}
                dashed={col.id !== "overdue"}
              />
              <header className="column-head">
                <h2>{col.label}</h2>
                <span className="column-hint mono">
                  {col.tasks.length} · {col.hint}
                </span>
              </header>
              <div className="column-body">
                {col.tasks.map(({ task, urgency }) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    urgency={urgency}
                    now={now}
                    selected={task.id === selectedId}
                    onSelect={() => {
                      setDraft(null);
                      setSelectedId(task.id);
                    }}
                    onComplete={() => completeTask(task)}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>

        {draft && (
          <TaskPanel
            task={draft}
            now={now}
            isNew
            onChange={(patch) => setDraft({ ...draft, ...patch })}
            onCreate={() => {
              setTasks((prev) => [...prev, draft]);
              setSelectedId(draft.id);
              setDraft(null);
            }}
            onClose={() => setDraft(null)}
          />
        )}

        {!draft && selected && (
          <TaskPanel
            task={selected}
            now={now}
            isNew={false}
            onChange={(patch) => patchTask(selected.id, patch)}
            onComplete={() => completeTask(selected)}
            onDelete={() => {
              setTasks((prev) => prev.filter((t) => t.id !== selected.id));
              setSelectedId(null);
            }}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      <footer className="disclaimer">
        Prototype: everything lives in memory, so a refresh puts the seeded tasks back.
      </footer>
    </div>
  );
}
