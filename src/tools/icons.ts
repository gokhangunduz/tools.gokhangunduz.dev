import {
  ArrowLeftRight,
  Binary,
  Braces,
  CalendarClock,
  Camera,
  CaseSensitive,
  Clock,
  Code,
  Database,
  Diff,
  FileImage,
  FileKey,
  FileType,
  Fingerprint,
  GitCompare,
  Globe,
  IdCard,
  Image,
  Images,
  KeySquare,
  Link,
  ListTree,
  MapPin,
  Network,
  NotebookPen,
  Percent,
  QrCode,
  Regex,
  ScanSearch,
  Server,
  Sheet,
  ShieldCheck,
  Stamp,
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
  arrowLeftRight: ArrowLeftRight,
  binary: Binary,
  braces: Braces,
  calendarClock: CalendarClock,
  camera: Camera,
  caseSensitive: CaseSensitive,
  clock: Clock,
  code: Code,
  database: Database,
  diff: Diff,
  fileImage: FileImage,
  fileKey: FileKey,
  fileType: FileType,
  fingerprint: Fingerprint,
  gitCompare: GitCompare,
  globe: Globe,
  idCard: IdCard,
  image: Image,
  images: Images,
  keySquare: KeySquare,
  link: Link,
  listTree: ListTree,
  mapPin: MapPin,
  network: Network,
  notebookPen: NotebookPen,
  percent: Percent,
  qrCode: QrCode,
  regex: Regex,
  scanSearch: ScanSearch,
  server: Server,
  sheet: Sheet,
  shieldCheck: ShieldCheck,
  stamp: Stamp,
  type: Type,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName): LucideIcon {
  return ICONS[name];
}
