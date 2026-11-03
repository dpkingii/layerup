import type { ItemTags } from "@/lib/schemas";

// Defaults a subtype implies; colors and pattern are always the user's call.
export type Preset = Omit<ItemTags, "colors" | "pattern">;

const fabric = { waterproof: false, windproof: false, breathable: true };
const shell = { waterproof: true, windproof: true, breathable: false };
const windy = { waterproof: false, windproof: true, breathable: true };

function p(category: string, slot: Preset["slot"], warmth: number, flags = fabric) {
  return (subtype: string): Preset => ({ category, subtype, slot, warmth, ...flags });
}

const top = (warmth: number) => p("top", "base", warmth);
const mid = (warmth: number, flags = fabric) => p("top", "mid", warmth, flags);
const outer = (warmth: number, flags = windy) => p("outerwear", "outer", warmth, flags);
const bottom = (warmth: number, flags = fabric) => p("bottom", "bottom", warmth, flags);
const dress = (warmth: number) => p("dress", "one_piece", warmth);
const shoes = (warmth: number, flags = fabric) => p("footwear", "shoes", warmth, flags);
const accessory = (warmth: number, flags = fabric) => p("accessory", "accessory", warmth, flags);

export const PRESETS: Preset[] = [
  top(1)("t-shirt"),
  top(1)("tank top"),
  top(1)("polo shirt"),
  top(1)("blouse"),
  top(2)("long-sleeve t-shirt"),
  top(2)("button-down shirt"),
  top(3)("flannel shirt"),
  top(3)("turtleneck"),
  top(3)("thermal top"),
  mid(2)("sweater vest"),
  mid(3)("crewneck sweater"),
  mid(3)("v-neck sweater"),
  mid(3)("cardigan"),
  mid(3)("hoodie"),
  mid(3)("sweatshirt"),
  mid(3)("quarter-zip"),
  mid(3, windy)("puffer vest"),
  mid(4)("fleece"),
  outer(1, { waterproof: false, windproof: true, breathable: false })("windbreaker"),
  outer(2, shell)("rain jacket"),
  outer(2, shell)("shell jacket"),
  outer(2)("denim jacket"),
  outer(2)("blazer"),
  outer(3)("bomber jacket"),
  outer(3)("leather jacket"),
  outer(3, shell)("trench coat"),
  outer(4, { waterproof: false, windproof: true, breathable: false })("overcoat"),
  outer(5, shell)("puffer jacket"),
  outer(5, shell)("parka"),
  bottom(1)("shorts"),
  bottom(1)("skirt"),
  bottom(1, shell)("rain pants"),
  bottom(2)("chinos"),
  bottom(2)("dress pants"),
  bottom(2)("leggings"),
  bottom(3, windy)("jeans"),
  bottom(3)("joggers"),
  bottom(3, windy)("wool trousers"),
  dress(1)("sundress"),
  dress(2)("dress"),
  dress(2)("jumpsuit"),
  dress(3)("sweater dress"),
  shoes(1)("sandals"),
  shoes(2)("sneakers"),
  shoes(2)("running shoes"),
  shoes(2)("loafers"),
  shoes(2)("dress shoes"),
  shoes(3, shell)("rain boots"),
  shoes(4, shell)("boots"),
  shoes(5, shell)("snow boots"),
  accessory(1)("cap"),
  accessory(1)("sunglasses"),
  accessory(1, shell)("umbrella"),
  accessory(4, windy)("beanie"),
  accessory(4, windy)("scarf"),
  accessory(4, windy)("gloves"),
];

export function findPreset(subtype: string) {
  const key = subtype.trim().toLowerCase();
  return PRESETS.find((preset) => preset.subtype === key);
}
