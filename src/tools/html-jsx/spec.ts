import type { TextToolSpec } from "../text-tool";
import { htmlToJsx } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "to-jsx",
      label: { tr: "HTML → JSX", en: "HTML → JSX" },
      sample:
        '<div class="card" style="padding: 12px; border-radius: 8px">\n  <!-- başlık -->\n  <label for="ad">Ad</label>\n  <input id="ad" tabindex="1" data-test="name" required>\n  <img src="/logo.svg" alt="logo">\n</div>',
      placeholder: { tr: "HTML yapıştır", en: "Paste HTML" },
      run: (input) => htmlToJsx(input),
    },
  ],
  outputExtension: "jsx",
};
