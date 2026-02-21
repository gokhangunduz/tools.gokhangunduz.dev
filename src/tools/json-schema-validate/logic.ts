import { parseJson } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * A document against a JSON Schema, with the errors a validator would give.
 *
 * Ajv is the validator most Node services actually run, so the verdict here
 * matches the one the API would return — which is the point of checking a
 * payload against a schema by hand in the first place.
 */
export async function validateAgainstSchema(
  schemaText: string,
  dataText: string,
): Promise<string> {
  if (!schemaText.trim() && !dataText.trim()) return "";
  if (!schemaText.trim()) {
    throw new ToolError({ tr: "Şema girilmedi.", en: "No schema given." });
  }
  if (!dataText.trim()) {
    throw new ToolError({
      tr: "Doğrulanacak veri girilmedi.",
      en: "No data to validate.",
    });
  }

  const schema = parseJson(schemaText);
  const data = parseJson(dataText);

  const [{ default: Ajv }, { default: addFormats }] = await Promise.all([
    import("ajv"),
    import("ajv-formats"),
  ]);

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  let validate;
  try {
    validate = ajv.compile(schema as object);
  } catch (cause) {
    throw new ToolError({
      tr: `Şema derlenemedi: ${cause instanceof Error ? cause.message : ""}`,
      en: `Could not compile the schema: ${cause instanceof Error ? cause.message : ""}`,
    });
  }

  if (validate(data)) {
    return "✓ Veri şemaya uyuyor. / The data matches the schema.";
  }

  return (validate.errors ?? [])
    .map((error) => {
      const where = error.instancePath || "(kök / root)";
      const extra = Object.entries(error.params ?? {})
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(" ");
      return `✗ ${where}  ${error.message}${extra ? `  [${extra}]` : ""}`;
    })
    .join("\n");
}
