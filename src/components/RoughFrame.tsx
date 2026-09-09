import { useLayoutEffect, useRef, useState } from "react";
import type { Options } from "roughjs/bin/core";
import { roughRect } from "../lib/rough";

type Props = {
  seed: number;
  stroke: string;
  fill?: string;
  strokeWidth?: number;
  roughness?: number;
  dashed?: boolean;
};

/**
 * Hand-drawn outline that tracks the size of its positioned parent, so any box
 * in the UI can be sketched instead of given a CSS border.
 */
export function RoughFrame({
  seed,
  stroke,
  fill,
  strokeWidth = 1.3,
  roughness = 1.1,
  dashed = false,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(() => {
      setSize({ w: parent.clientWidth, h: parent.clientHeight });
    });
    observer.observe(parent);
    setSize({ w: parent.clientWidth, h: parent.clientHeight });
    return () => observer.disconnect();
  }, []);

  const options: Options = {
    seed: seed + 1,
    roughness,
    bowing: 1.4,
    stroke,
    strokeWidth,
    fill,
    fillStyle: "solid",
    ...(dashed ? { strokeLineDash: [7, 5] } : {}),
  };

  const paths = size.w > 2 && size.h > 2 ? roughRect(2, 2, size.w - 4, size.h - 4, options) : [];

  return (
    <svg ref={ref} className="rough-frame" width={size.w} height={size.h} aria-hidden="true">
      {paths.map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill} />
      ))}
    </svg>
  );
}
