"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Switch({
  checked = false,
  onCheckedChange,
  className,
  onClick,
  ...props
}: Omit<React.ComponentProps<"button">, "onChange"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-slot="switch"
      data-state={checked ? "checked" : "unchecked"}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange?.(!checked);
      }}
      className={cn(
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-tint data-[state=unchecked]:border-border data-[state=unchecked]:bg-muted",
        className,
      )}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        data-state={checked ? "checked" : "unchecked"}
        className="pointer-events-none block size-3.5 rounded-full shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[0.9375rem] data-[state=checked]:bg-tint-foreground data-[state=unchecked]:translate-x-px data-[state=unchecked]:bg-muted-foreground"
      />
    </button>
  );
}

export { Switch };
