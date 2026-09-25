import type { TextToolSpec } from "../text-tool";
import { decodeToken, expiryNote, verifyToken } from "./logic";

const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkfDtmtoYW4gR8O8bmTDvHoiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.qQ1sFq8m8Yk3WQhZxHqKYq0S7cUQ9Yl5oJQbHN3mWzE";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "decode",
      label: { tr: "Çöz", en: "Decode" },
      sample: SAMPLE,
      placeholder: { tr: "JWT yapıştır", en: "Paste a JWT" },
      run: (input, options) => decodeToken(input, options.dates !== false),
      footnote: (input) => {
        const note = expiryNote(input);
        if (!note) return null;
        return note.expired
          ? {
              tr: `süresi ${note.text} önce doldu`,
              en: `expired ${note.text} ago`,
            }
          : {
              tr: `${note.text} sonra dolacak`,
              en: `expires in ${note.text}`,
            };
      },
    },
    {
      id: "verify",
      label: { tr: "İmzayı doğrula", en: "Verify signature" },
      sample: SAMPLE,
      placeholder: { tr: "JWT yapıştır", en: "Paste a JWT" },
      run: async (input, options) => {
        if (!input.trim()) return "";
        const verdict = await verifyToken(input, String(options.key));
        return `${verdict}\n\n${decodeToken(input, options.dates !== false)}`;
      },
    },
  ],
  options: [
    {
      kind: "text",
      id: "key",
      label: { tr: "Anahtar", en: "Key" },
      default: "",
      placeholder: { tr: "secret ya da PEM", en: "secret or PEM" },
    },
    {
      kind: "switch",
      id: "dates",
      label: {
        tr: "Zaman damgalarını tarihe çevir",
        en: "Timestamps as dates",
      },
      default: true,
    },
  ],
  outputExtension: "json",
};
