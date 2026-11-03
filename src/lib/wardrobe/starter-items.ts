import type { ItemTags } from "@/lib/schemas";

export type StarterItem = { key: string; name: string; tags: ItemTags };

const flags = { waterproof: false, windproof: false, breathable: true };

export const STARTER_ITEMS: StarterItem[] = [
  { key: "white-tee", name: "White tee", tags: { category: "top", subtype: "t-shirt", slot: "base", colors: ["white"], pattern: "solid", warmth: 1, ...flags } },
  { key: "black-tee", name: "Black tee", tags: { category: "top", subtype: "t-shirt", slot: "base", colors: ["black"], pattern: "solid", warmth: 1, ...flags } },
  { key: "oxford-shirt", name: "Oxford shirt", tags: { category: "top", subtype: "button-down shirt", slot: "base", colors: ["light blue"], pattern: "solid", warmth: 2, ...flags } },
  { key: "long-sleeve-tee", name: "Long-sleeve tee", tags: { category: "top", subtype: "long-sleeve t-shirt", slot: "base", colors: ["gray"], pattern: "solid", warmth: 2, ...flags } },
  { key: "crewneck-sweater", name: "Crewneck sweater", tags: { category: "top", subtype: "crewneck sweater", slot: "mid", colors: ["navy"], pattern: "solid", warmth: 3, ...flags } },
  { key: "hoodie", name: "Hoodie", tags: { category: "top", subtype: "hoodie", slot: "mid", colors: ["gray"], pattern: "solid", warmth: 3, ...flags } },
  { key: "fleece", name: "Fleece pullover", tags: { category: "top", subtype: "fleece", slot: "mid", colors: ["black"], pattern: "solid", warmth: 4, ...flags } },
  { key: "denim-jacket", name: "Denim jacket", tags: { category: "outerwear", subtype: "denim jacket", slot: "outer", colors: ["blue"], pattern: "solid", warmth: 2, waterproof: false, windproof: true, breathable: true } },
  { key: "rain-jacket", name: "Rain jacket", tags: { category: "outerwear", subtype: "rain jacket", slot: "outer", colors: ["yellow"], pattern: "solid", warmth: 2, waterproof: true, windproof: true, breathable: false } },
  { key: "wool-coat", name: "Wool coat", tags: { category: "outerwear", subtype: "overcoat", slot: "outer", colors: ["camel"], pattern: "solid", warmth: 4, waterproof: false, windproof: true, breathable: false } },
  { key: "puffer", name: "Puffer jacket", tags: { category: "outerwear", subtype: "puffer jacket", slot: "outer", colors: ["black"], pattern: "solid", warmth: 5, waterproof: true, windproof: true, breathable: false } },
  { key: "jeans", name: "Jeans", tags: { category: "bottom", subtype: "jeans", slot: "bottom", colors: ["blue"], pattern: "solid", warmth: 3, waterproof: false, windproof: true, breathable: true } },
  { key: "chinos", name: "Chinos", tags: { category: "bottom", subtype: "chinos", slot: "bottom", colors: ["khaki"], pattern: "solid", warmth: 2, ...flags } },
  { key: "shorts", name: "Shorts", tags: { category: "bottom", subtype: "shorts", slot: "bottom", colors: ["navy"], pattern: "solid", warmth: 1, ...flags } },
  { key: "joggers", name: "Joggers", tags: { category: "bottom", subtype: "joggers", slot: "bottom", colors: ["charcoal"], pattern: "solid", warmth: 3, ...flags } },
  { key: "summer-dress", name: "Summer dress", tags: { category: "dress", subtype: "sundress", slot: "one_piece", colors: ["white"], pattern: "floral", warmth: 1, ...flags } },
  { key: "sneakers", name: "White sneakers", tags: { category: "footwear", subtype: "sneakers", slot: "shoes", colors: ["white"], pattern: "solid", warmth: 2, ...flags } },
  { key: "boots", name: "Leather boots", tags: { category: "footwear", subtype: "boots", slot: "shoes", colors: ["brown"], pattern: "solid", warmth: 4, waterproof: true, windproof: true, breathable: false } },
  { key: "sandals", name: "Sandals", tags: { category: "footwear", subtype: "sandals", slot: "shoes", colors: ["tan"], pattern: "solid", warmth: 1, ...flags } },
  { key: "beanie", name: "Beanie", tags: { category: "accessory", subtype: "beanie", slot: "accessory", colors: ["black"], pattern: "solid", warmth: 4, waterproof: false, windproof: true, breathable: true } },
  { key: "scarf", name: "Scarf", tags: { category: "accessory", subtype: "scarf", slot: "accessory", colors: ["gray"], pattern: "solid", warmth: 4, waterproof: false, windproof: true, breathable: true } },
  { key: "cap", name: "Baseball cap", tags: { category: "accessory", subtype: "cap", slot: "accessory", colors: ["navy"], pattern: "solid", warmth: 1, ...flags } },
];
