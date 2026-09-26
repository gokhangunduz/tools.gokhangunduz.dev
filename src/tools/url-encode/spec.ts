import type { Localized } from "@/i18n";
import type { OptionValues, TextToolSpec } from "../text-tool";
import { decodeUrl, encodeUrl, looksEncoded, toScope } from "./logic";

const CAPTION: Record<ReturnType<typeof toScope>, Localized> = {
  value: {
    tr: "Query değeri ya da path parçası: & = / ? # da encode edilir.",
    en: "A query value or path segment: & = / ? # are encoded too.",
  },
  url: {
    tr: "Birleştirilmiş tam URL: : / ? & = # olduğu gibi kalır.",
    en: "An assembled URL: : / ? & = # are left as they are.",
  },
  form: {
    tr: "Form gövdesi (x-www-form-urlencoded): boşluk + olur.",
    en: "A form body (x-www-form-urlencoded): a space becomes +.",
  },
};

const caption = (options: OptionValues) => CAPTION[toScope(options.scope)];

export const spec: TextToolSpec = {
  directions: [
    {
      id: "encode",
      label: { tr: "Encode", en: "Encode" },
      sample: "ad soyad=Şükrü Gündüz&şehir=İstanbul",
      placeholder: {
        tr: "Encode edilecek metin ya da URL",
        en: "Text or a URL to encode",
      },
      run: (input, options) => encodeUrl(input, toScope(options.scope)),
      hint: (input) =>
        looksEncoded(input)
          ? {
              text: {
                tr: "Girdi zaten encode edilmiş görünüyor",
                en: "The input already looks encoded",
              },
              action: {
                label: { tr: "Decode'a geç", en: "Switch to Decode" },
                direction: "decode",
              },
            }
          : null,
      footnote: (_input, _output, options) => caption(options),
    },
    {
      id: "decode",
      label: { tr: "Decode", en: "Decode" },
      sample: "ad+soyad%3D%C5%9E%C3%BCkr%C3%BC+G%C3%BCnd%C3%BCz",
      sampleOptions: { scope: "form" },
      placeholder: {
        tr: "%C3%A7 gibi percent-encoded metin",
        en: "Percent-encoded text, like %C3%A7",
      },
      run: (input, options) => decodeUrl(input, toScope(options.scope)),
      footnote: (_input, _output, options) => caption(options),
    },
  ],
  options: [
    {
      kind: "select",
      id: "scope",
      label: { tr: "Kapsam", en: "Scope" },
      default: "value",
      choices: [
        {
          value: "value",
          label: {
            tr: "Değer · encodeURIComponent",
            en: "Value · encodeURIComponent",
          },
        },
        {
          value: "url",
          label: { tr: "Tam URL · encodeURI", en: "Whole URL · encodeURI" },
        },
        {
          value: "form",
          label: { tr: "Form · + boşluk", en: "Form · + for space" },
        },
      ],
    },
  ],
  inverse: true,
};
