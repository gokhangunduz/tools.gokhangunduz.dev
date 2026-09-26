import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // `font-mono` on purpose: almost everything typed into these boxes is
        // a token, a key or a payload, where the difference between l, 1 and I
        // is the difference between a working and a broken value.
        "min-h-40 max-h-[75vh] w-full resize-y rounded-md border bg-background px-3 py-2.5 font-mono text-sm leading-relaxed outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/10 disabled:opacity-50 field-sizing-content",
        className,
      )}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      {...props}
    />
  );
}

export { Textarea };
