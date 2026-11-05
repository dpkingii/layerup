export const VIBES = [
  { id: "minimal", label: "Minimal", description: "Clean lines, neutral tones, nothing extra.", palette: ["#f5f5f4", "#a8a29e", "#1c1917"] },
  { id: "classic", label: "Classic", description: "Timeless staples that never date.", palette: ["#1e3a5f", "#c8b8a0", "#7f1d1d"] },
  { id: "streetwear", label: "Streetwear", description: "Hoodies, sneakers, bold graphics.", palette: ["#111827", "#f97316", "#e5e7eb"] },
  { id: "sporty", label: "Sporty", description: "Performance fabrics, ready to move.", palette: ["#2563eb", "#22c55e", "#f8fafc"] },
  { id: "preppy", label: "Preppy", description: "Polos, chinos, crisp and tidy.", palette: ["#14532d", "#fef3c7", "#1d4ed8"] },
  { id: "bohemian", label: "Bohemian", description: "Flowy shapes, earthy colors, texture.", palette: ["#b45309", "#a3a35c", "#e7c8a0"] },
  { id: "edgy", label: "Edgy", description: "Black, leather, hardware, attitude.", palette: ["#0a0a0a", "#52525b", "#b91c1c"] },
  { id: "smart-casual", label: "Smart casual", description: "Polished enough for work, relaxed enough for after.", palette: ["#334155", "#d6d3d1", "#0f766e"] },
] as const;

export type VibeId = (typeof VIBES)[number]["id"];

export const VIBE_IDS = VIBES.map((v) => v.id) as [VibeId, ...VibeId[]];
