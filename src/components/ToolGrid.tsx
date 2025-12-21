import type { Locale } from "@/i18n";
import type { ToolMeta } from "@/tools/types";
import ToolCard from "@/components/ToolCard";

export default function ToolGrid({
  locale,
  tools,
}: {
  locale: Locale;
  tools: ToolMeta[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.id} locale={locale} tool={tool} />
      ))}
    </div>
  );
}
