/** Excalidraw's element palette, shared by the CSS tokens and the rough.js drawing code. */
export const THEME = {
  ink: "#1e1e1e",
  muted: "#868e96",
  hairline: "#d6d9de",
  panel: "#ffffff",
  brand: "#6965db",
  brandSoft: "#e0dfff",
  blue: "#1971c2",
  blueSoft: "#a5d8ff",
  yellow: "#f08c00",
  yellowSoft: "#ffec99",
  red: "#e03131",
  redSoft: "#ffc9c9",
  green: "#2f9e44",
} as const;

/** Stable per-element seed so a card's sketch lines don't reshuffle on every render. */
export function seedFrom(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 100000;
  return h;
}
