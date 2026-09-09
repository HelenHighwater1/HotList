import { useState } from "react";
import type { Task } from "../types";
import { dueFraction, timePosition } from "../lib/curve";
import { formatDate, relativeDue, describeRecurrence } from "../lib/recurrence";
import { urgencyColor } from "../lib/color";
import { seedFrom, THEME } from "../lib/theme";
import { MiniCurve } from "./MiniCurve";
import { RoughFrame } from "./RoughFrame";

type Props = {
  task: Task;
  urgency: number;
  now: number;
  selected: boolean;
  onSelect: () => void;
  onComplete: () => void;
};

export function TaskCard({ task, urgency, now, selected, onSelect, onComplete }: Props) {
  const color = urgencyColor(urgency);
  const seed = seedFrom(task.id);
  /* Re-seeding on hover makes rough.js redraw the outline, so the card looks freshly sketched. */
  const [hovered, setHovered] = useState(false);
  const score = Math.round(urgency * 100);
  return (
    <article
      className={`card${selected ? " is-selected" : ""}`}
      style={{ ["--accent" as string]: color }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <RoughFrame
        seed={hovered ? seed + 517 : seed}
        stroke={selected ? THEME.brand : THEME.ink}
        strokeWidth={selected ? 2 : 1.2}
        fill={THEME.panel}
      />
      <span className="card-stripe" aria-hidden="true" />
      <button className="card-main" onClick={onSelect}>
        <div className="card-text">
          <h3 className="card-title">{task.title}</h3>
          <p className="card-meta">
            {formatDate(task.due)} · {relativeDue(task.due, now)}
          </p>
          <p className="card-rec">{describeRecurrence(task.recurrence)}</p>
        </div>
        <div className="card-curve">
          <MiniCurve
            curve={task.curve}
            position={timePosition(task, now)}
            dueAt={dueFraction(task)}
            seed={seed}
          />
          {/* Keyed by score so the pop animation replays whenever urgency changes. */}
          <span className="card-urgency" key={score}>
            {score}
          </span>
        </div>
      </button>
      <button className="card-done" onClick={onComplete} aria-label={`Mark ${task.title} complete`}>
        Done
      </button>
    </article>
  );
}
