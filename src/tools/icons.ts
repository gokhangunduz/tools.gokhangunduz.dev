import {
  Binary,
  Braces,
  CalendarClock,
  FileCode2,
  Fingerprint,
  Hash,
  Image,
  KeyRound,
  Network,
  PlayCircle,
  Shuffle,
  SquareCheck,
  Table,
  Type,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons are named, not imported, by tool metadata.
 *
 * A `ToolMeta` crosses the server/client boundary — the home page renders on
 * the server, the favourites row on the client — and a React component is not
 * serializable, so holding the component itself in the registry made every
 * list a client component. A string does not have that problem, and this map
 * is the one place that turns it back into something renderable.
 */
export const ICONS = {
  binary: Binary,
  braces: Braces,
  calendarClock: CalendarClock,
  fileCode: FileCode2,
  fingerprint: Fingerprint,
  hash: Hash,
  image: Image,
  keyRound: KeyRound,
  network: Network,
  playCircle: PlayCircle,
  shuffle: Shuffle,
  squareCheck: SquareCheck,
  table: Table,
  type: Type,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName): LucideIcon {
  return ICONS[name];
}
