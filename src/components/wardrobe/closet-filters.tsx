import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "./slots";

export type FilterOption = { value: string; label: string; count: number };

const pill = (active: boolean) =>
  cn(
    "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    active ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/70",
  );

// "" stands for "any color", since a select item needs a value.
export function ClosetFilters({
  types,
  type,
  onTypeChange,
  colors,
  color,
  onColorChange,
}: {
  types: FilterOption[];
  type: string | null;
  onTypeChange: (value: string | null) => void;
  colors: FilterOption[];
  color: string | null;
  onColorChange: (value: string | null) => void;
}) {
  const colorLabels = Object.fromEntries([["", "Any color"], ...colors.map((c) => [c.value, c.label])]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Filter by type" className="contents">
        {[{ value: null, label: "All" }, ...types].map((option) => (
          <button
            key={option.value ?? "all"}
            type="button"
            aria-pressed={type === option.value}
            onClick={() => onTypeChange(option.value)}
            className={pill(type === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {colors.length > 1 && (
        <Select items={colorLabels} value={color ?? ""} onValueChange={(v) => onColorChange(v || null)}>
          <SelectTrigger
            aria-label="Filter by color"
            className={cn(pill(color !== null), "border-0 pr-2.5 data-placeholder:text-foreground", color ? "dark:bg-foreground dark:hover:bg-foreground" : "dark:bg-secondary dark:hover:bg-secondary/70")}
          >
            <SelectValue>
              {(value: string) =>
                value ? (
                  <>
                    <ColorSwatch color={value} className="size-3" />
                    <span className="first-letter:uppercase">{colorLabels[value]}</span>
                  </>
                ) : (
                  "Color"
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" className="min-w-44">
            <SelectItem value="">Any color</SelectItem>
            {colors.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <ColorSwatch color={c.value} className="size-3" />
                <span className="first-letter:uppercase">{c.label}</span>
                <span className="text-muted-foreground">{c.count}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
