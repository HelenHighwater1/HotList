import rough from "roughjs";
import type { Options } from "roughjs/bin/core";

const generator = rough.generator();

export type RoughPath = {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
};

function toPaths(drawable: ReturnType<typeof generator.rectangle>): RoughPath[] {
  return generator.toPaths(drawable).map((p) => ({
    d: p.d,
    stroke: p.stroke ?? "none",
    strokeWidth: p.strokeWidth ?? 1,
    fill: p.fill ?? "none",
  }));
}

export function roughRect(
  x: number,
  y: number,
  w: number,
  h: number,
  options: Options,
): RoughPath[] {
  return toPaths(generator.rectangle(x, y, Math.max(w, 1), Math.max(h, 1), options));
}

export function roughLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: Options,
): RoughPath[] {
  return toPaths(generator.line(x1, y1, x2, y2, options));
}

export function roughPath(points: [number, number][], options: Options): RoughPath[] {
  return toPaths(generator.linearPath(points, options));
}

export function roughPolygon(points: [number, number][], options: Options): RoughPath[] {
  return toPaths(generator.polygon(points, options));
}
