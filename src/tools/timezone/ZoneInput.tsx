"use client";

import { useId, useSyncExternalStore } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { browserZone, listZones, resolveZone } from "./zones";

const noSubscription = () => () => {};

/** The browser's zone once hydrated, UTC on the server, so both renders agree. */
export function useBrowserZone(): string {
  return useSyncExternalStore(noSubscription, browserZone, () => "UTC");
}

/**
 * A time zone field that searches the engine's own list as you type. A native
 * datalist keeps it light: it filters by substring, so "istanbul" finds
 * Europe/Istanbul, and a city typed without its region is resolved on blur.
 */
export default function ZoneInput({
  label,
  value,
  onChange,
  invalid,
  placeholder,
  className,
  onEnter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  onEnter?: (value: string) => void;
}) {
  const listId = useId();
  const client = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const zones = client ? listZones() : [];
  return (
    <label
      className={cn(
        "flex min-w-0 items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="shrink-0">{label}</span>
      <Input
        list={listId}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          const zone = resolveZone(value);
          if (zone && zone !== value) onChange(zone);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onEnter) {
            event.preventDefault();
            onEnter(value);
          }
        }}
        aria-invalid={invalid || undefined}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        className={cn(
          "h-8 min-w-0 flex-1 font-mono text-sm text-foreground placeholder:font-sans sm:w-56 sm:flex-none [&::-webkit-calendar-picker-indicator]:hidden!",
          invalid && "border-destructive focus-visible:border-destructive",
        )}
      />
      <datalist id={listId}>
        {zones.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
    </label>
  );
}
