import { ICONS, type IconName } from "@/tools/icons";
import { cn } from "@/lib/utils";

/**
 * Renders an icon named by a string.
 *
 * Tool and category metadata crosses the server/client boundary, so it holds
 * the icon's name rather than the component. This is the single place that
 * looks one up.
 */
export default function ToolIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={className} />;
}

const BADGE_SIZES = {
  sm: "size-5 rounded-[5px] [&>svg]:size-3",
  md: "size-8 rounded-lg [&>svg]:size-4",
  lg: "size-11 rounded-xl [&>svg]:size-5",
} as const;

/** An icon on a tile of the surrounding category's hue (`--tint`). */
export function IconBadge({
  name,
  size = "md",
  className,
}: {
  name: IconName;
  size?: keyof typeof BADGE_SIZES;
  className?: string;
}) {
  const Icon = ICONS[name];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-tint/15 text-tint",
        BADGE_SIZES[size],
        className,
      )}
    >
      <Icon />
    </span>
  );
}
