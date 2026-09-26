import type { TextToolSpec } from "../text-tool";
import {
  DIALECT_LABELS,
  DIALECTS,
  formatSql,
  type Dialect,
  type Keywords,
} from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "format",
      label: { tr: "Format", en: "Format" },
      sample:
        "select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=true group by u.id,u.name having count(o.id)>2 order by orders desc limit 10",
      placeholder: { tr: "SQL yapıştır", en: "Paste SQL" },
      run: (input, options) =>
        formatSql(
          input,
          options.dialect as Dialect,
          options.keywords as Keywords,
          Number(options.tabWidth),
        ),
    },
  ],
  options: [
    {
      kind: "select",
      id: "dialect",
      label: { tr: "Dialect", en: "Dialect" },
      default: "postgresql",
      choices: DIALECTS.map((name) => ({
        value: name,
        label: DIALECT_LABELS[name],
      })),
    },
    {
      kind: "select",
      id: "keywords",
      label: { tr: "Keyword'ler", en: "Keywords" },
      default: "upper",
      choices: [
        { value: "upper", label: { tr: "BÜYÜK", en: "UPPER" } },
        { value: "lower", label: { tr: "küçük", en: "lower" } },
        { value: "preserve", label: { tr: "olduğu gibi", en: "as written" } },
      ],
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
  ],
  outputExtension: "sql",
  code: true,
};
