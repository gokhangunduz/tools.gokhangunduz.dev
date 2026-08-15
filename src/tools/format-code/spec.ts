import type { OptionValues, TextToolSpec } from "../text-tool";
import {
  changedLines,
  detectLanguage,
  EXTENSIONS,
  formatCode,
  LANGUAGES,
  type Language,
  type TrailingComma,
} from "./logic";

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

const SCRIPT = new Set(["auto", "javascript", "typescript", "vue"]);
const QUOTED = new Set([...SCRIPT, "css", "scss", "less"]);

const chosen = (values: OptionValues) => String(values.language);

// `outputExtension` gets only the options, so the detected language of the last run is kept here.
let detected: Language = "javascript";

const languageOf = (input: string, values: OptionValues): Language =>
  chosen(values) === "auto"
    ? detectLanguage(input)
    : (chosen(values) as Language);

export const spec: TextToolSpec = {
  directions: [
    {
      id: "format",
      label: { tr: "Format", en: "Format" },
      sample: `const user={name:"Gökhan",roles:['admin','editor'],meta:{active:true,visits:12}}
function greet(u){if(!u)return null
return \`Merhaba \${u.name}\`}`,
      sampleOptions: { language: "auto" },
      placeholder: {
        tr: "Kodu yapıştır; dil otomatik tanınır",
        en: "Paste code; the language is detected",
      },
      run: (input, values) => {
        const language = languageOf(input, values);
        if (chosen(values) === "auto") detected = language;
        return formatCode(input, {
          language,
          width: Number(values.width),
          tabWidth: values.tabWidth === "4" ? 4 : 2,
          useTabs: values.tabWidth === "tab",
          semi: values.semi !== false,
          singleQuote: values.singleQuote === true,
          trailingComma: (values.trailingComma as TrailingComma) ?? "all",
        });
      },
      headline: (output, input, values) =>
        output && chosen(values) === "auto"
          ? {
              text: {
                tr: `${LABELS[detectLanguage(input)]} (otomatik)`,
                en: `${LABELS[detectLanguage(input)]} (auto)`,
              },
            }
          : null,
      footnote: (input, output) => {
        const changed = changedLines(input, output);
        if (changed === 0) {
          return {
            tr: "Değişiklik yok — zaten biçimli",
            en: "No changes — already formatted",
          };
        }
        return {
          tr: `${changed.toLocaleString("tr")} satır değişti`,
          en: `${changed.toLocaleString("en")} ${changed === 1 ? "line" : "lines"} changed`,
        };
      },
      outputExtension: (values) =>
        EXTENSIONS[
          chosen(values) === "auto" ? detected : (chosen(values) as Language)
        ] ?? "txt",
    },
  ],
  options: [
    {
      kind: "select",
      id: "language",
      label: { tr: "Dil", en: "Language" },
      default: "auto",
      choices: [
        { value: "auto", label: { tr: "Otomatik", en: "Auto" } },
        ...LANGUAGES.map((name) => ({
          value: name,
          label: { tr: LABELS[name], en: LABELS[name] },
        })),
      ],
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
      choices: [
        { value: "2", label: { tr: "2", en: "2" } },
        { value: "4", label: { tr: "4", en: "4" } },
        { value: "tab", label: { tr: "Tab", en: "Tab" } },
      ],
    },
    {
      kind: "select",
      id: "trailingComma",
      label: { tr: "Sondaki virgül", en: "Trailing commas" },
      default: "all",
      visibleWhen: (values) => SCRIPT.has(chosen(values)),
      choices: [
        { value: "all", label: { tr: "Hepsi", en: "All" } },
        { value: "es5", label: { tr: "ES5", en: "ES5" } },
        { value: "none", label: { tr: "Yok", en: "None" } },
      ],
    },
    {
      kind: "switch",
      id: "semi",
      label: { tr: "Noktalı virgül", en: "Semicolons" },
      default: true,
      visibleWhen: (values) => SCRIPT.has(chosen(values)),
    },
    {
      kind: "switch",
      id: "singleQuote",
      label: { tr: "Tek tırnak", en: "Single quotes" },
      default: false,
      visibleWhen: (values) => QUOTED.has(chosen(values)),
    },
  ],
  code: true,
  acceptFile:
    ".js,.mjs,.cjs,.jsx,.ts,.tsx,.mts,.cts,.json,.css,.scss,.less,.html,.htm,.vue,.md,.markdown,.yaml,.yml,.graphql,.gql",
};
