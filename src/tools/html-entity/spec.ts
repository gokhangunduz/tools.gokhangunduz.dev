import type { TextToolSpec } from "../text-tool";
import { decodeEntities, encodeEntities } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "encode",
      label: { tr: "Kodla", en: "Encode" },
      sample: `<a href="x?a=1&b=2">Şükrü'nün bağlantısı</a>`,
      run: (input, options) => encodeEntities(input, options.all === true),
    },
    {
      id: "decode",
      label: { tr: "Çöz", en: "Decode" },
      sample: "&lt;b&gt;kalın&lt;/b&gt; &copy; &#199;a&#287;r&#305;",
      run: (input) => decodeEntities(input),
    },
  ],
  options: [
    {
      kind: "switch",
      id: "all",
      label: {
        tr: "ASCII dışındaki her şeyi kodla",
        en: "Encode everything non-ASCII",
      },
      default: false,
    },
  ],
  outputExtension: "html",
};
