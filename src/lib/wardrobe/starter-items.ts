import type { ItemTags } from "@/lib/schemas";
import { findPreset } from "./presets";

export type StarterItem = { key: string; name: string; tags: ItemTags };

function starter(key: string, name: string, subtype: string, colors: string[], pattern = "solid"): StarterItem {
  const preset = findPreset(subtype);
  if (!preset) throw new Error(`No preset for starter subtype "${subtype}"`);
  return { key, name, tags: { ...preset, colors, pattern } };
}

export const STARTER_ITEMS: StarterItem[] = [
  starter("white-tee", "White tee", "t-shirt", ["white"]),
  starter("black-tee", "Black tee", "t-shirt", ["black"]),
  starter("oxford-shirt", "Oxford shirt", "button-down shirt", ["light blue"]),
  starter("long-sleeve-tee", "Long-sleeve tee", "long-sleeve t-shirt", ["gray"]),
  starter("crewneck-sweater", "Crewneck sweater", "crewneck sweater", ["navy"]),
  starter("hoodie", "Hoodie", "hoodie", ["gray"]),
  starter("fleece", "Fleece pullover", "fleece", ["black"]),
  starter("denim-jacket", "Denim jacket", "denim jacket", ["blue"]),
  starter("rain-jacket", "Rain jacket", "rain jacket", ["yellow"]),
  starter("wool-coat", "Wool coat", "overcoat", ["camel"]),
  starter("puffer", "Puffer jacket", "puffer jacket", ["black"]),
  starter("jeans", "Jeans", "jeans", ["blue"]),
  starter("chinos", "Chinos", "chinos", ["khaki"]),
  starter("shorts", "Shorts", "shorts", ["navy"]),
  starter("joggers", "Joggers", "joggers", ["charcoal"]),
  starter("summer-dress", "Summer dress", "sundress", ["white"], "floral"),
  starter("sneakers", "White sneakers", "sneakers", ["white"]),
  starter("boots", "Leather boots", "boots", ["brown"]),
  starter("sandals", "Sandals", "sandals", ["tan"]),
  starter("beanie", "Beanie", "beanie", ["black"]),
  starter("scarf", "Scarf", "scarf", ["gray"]),
  starter("cap", "Baseball cap", "cap", ["navy"]),
];
