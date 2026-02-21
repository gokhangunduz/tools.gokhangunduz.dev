import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-schema-validate",
  category: "validate",
  icon: "squareCheck",
  name: { tr: "JSON Schema doğrula", en: "Validate against JSON Schema" },
  blurb: {
    tr: "Veriyi şemaya göre Ajv ile denetler — sunucunun vereceği hataların aynısını verir.",
    en: "Checks data against a schema with Ajv, so the errors match what the server would say.",
  },
  keywords: {
    tr: ["json schema", "doğrula", "ajv", "şema", "api", "sözleşme"],
    en: ["json schema", "validate", "ajv", "schema", "api", "contract"],
  },
  related: ["json-to-types", "validate"],
};
