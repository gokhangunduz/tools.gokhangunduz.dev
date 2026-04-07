import type { FileToolSpec } from "../file-tool";
import { describePayload, readQr } from "./logic";

export const spec: FileToolSpec = {
  accept: "image/*",
  run: async (file) => {
    const value = await readQr(file);
    const kind = describePayload(value);
    return {
      text: value,
      note: { tr: `içerik türü: ${kind}`, en: `payload type: ${kind}` },
    };
  },
};
