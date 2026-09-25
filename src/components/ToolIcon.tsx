import { ICONS, type IconName } from "@/tools/icons";

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
