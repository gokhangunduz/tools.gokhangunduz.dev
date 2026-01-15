import type { TextToolSpec } from "../text-tool";
import { decodeForm, decodeUrl, encodeUrl } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "encode",
      label: { tr: "Kodla", en: "Encode" },
      sample: "ad soyad=Şükrü Gündüz&şehir=İstanbul",
      run: (input, options) => encodeUrl(input, options.whole === true),
    },
    {
      id: "decode",
      label: { tr: "Çöz", en: "Decode" },
      sample: "ad%20soyad%3D%C5%9E%C3%BCkr%C3%BC+G%C3%BCnd%C3%BCz",
      run: (input, options) =>
        options.plus === true
          ? decodeForm(input)
          : decodeUrl(input, options.whole === true),
    },
  ],
  options: [
    {
      kind: "switch",
      id: "whole",
      label: {
        tr: "Tam URL (: / ? & korunur)",
        en: "Whole URL (keep : / ? &)",
      },
      default: false,
    },
    {
      kind: "switch",
      id: "plus",
      label: { tr: "+ = boşluk (form)", en: "+ means space (form)" },
      default: false,
    },
  ],
};
