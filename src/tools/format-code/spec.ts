import type { TextToolSpec } from "../text-tool";
import { formatCode, LANGUAGES, type Language } from "./logic";

const LABELS: Record<Language, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  json: "JSON",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  html: "HTML",
  vue: "Vue",
  markdown: "Markdown",
  yaml: "YAML",
  graphql: "GraphQL",
};

export const spec: TextToolSpec = {
  directions: [
    {
      id: "format",
      label: { tr: "Biçimlendir", en: "Format" },
      sample: `const user={name:"Gökhan",roles:['admin','editor'],meta:{active:true,visits:12}}
function greet(u){if(!u)return null
return \`Merhaba \${u.name}\`}`,
      placeholder: { tr: "Kodu yapıştır", en: "Paste code" },
      run: (input, options) =>
        formatCode(input, {
          language: options.language as Language,
          width: Number(options.width),
          tabWidth: Number(options.tabWidth),
          semi: options.semi !== false,
          singleQuote: options.singleQuote === true,
        }),
    },
  ],
  options: [
    {
      kind: "select",
      id: "language",
      label: { tr: "Dil", en: "Language" },
      default: "javascript",
      choices: LANGUAGES.map((name) => ({
        value: name,
        label: { tr: LABELS[name], en: LABELS[name] },
      })),
    },
    {
      kind: "select",
      id: "width",
      label: { tr: "Satır genişliği", en: "Print width" },
      default: "80",
      choices: ["60", "80", "100", "120"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "select",
      id: "tabWidth",
      label: { tr: "Girinti", en: "Indent" },
      default: "2",
      choices: ["2", "4"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "switch",
      id: "semi",
      label: { tr: "Noktalı virgül", en: "Semicolons" },
      default: true,
    },
    {
      kind: "switch",
      id: "singleQuote",
      label: { tr: "Tek tırnak", en: "Single quotes" },
      default: false,
    },
  ],
};
