import { ToolError } from "../text-tool";

/**
 * The licence text, with the year and the holder filled in.
 *
 * Only the ones people actually pick, and each with the line that decides it:
 * whether a change has to be published, and whether a patent grant comes with
 * it. The full text is what goes in the file; the summary is what goes in the
 * decision.
 */
export type LicenseId =
  "mit" | "apache-2.0" | "bsd-3" | "gpl-3.0" | "agpl-3.0" | "unlicense";

export const SUMMARIES: Record<LicenseId, { tr: string; en: string }> = {
  mit: {
    tr: "En izin verici: kullan, de\u011fi\u015ftir, sat. Tek ko\u015ful telif bildirimini korumak.",
    en: "The permissive default: use, modify, sell. The only condition is keeping the notice.",
  },
  "apache-2.0": {
    tr: "MIT gibi izin verici, ayr\u0131ca a\u00e7\u0131k patent izni verir \u2014 kurumsal projelerin tercihi.",
    en: "Permissive like MIT, plus an explicit patent grant — the usual corporate choice.",
  },
  "bsd-3": {
    tr: "MIT'e yak\u0131n; ek olarak ismini tan\u0131t\u0131mda kullanmay\u0131 yasaklar.",
    en: "Close to MIT, with a clause against using your name to endorse derivatives.",
  },
  "gpl-3.0": {
    tr: "Da\u011f\u0131t\u0131lan her t\u00fcrev ayn\u0131 lisansla ve kaynak koduyla yay\u0131lmal\u0131.",
    en: "Any distributed derivative must ship under the same licence, with source.",
  },
  "agpl-3.0": {
    tr: "GPL gibi, ayr\u0131ca a\u011f \u00fczerinden sunulan hizmetler de kayna\u011f\u0131n\u0131 a\u00e7mal\u0131.",
    en: "Like GPL, and a service offered over a network must publish its source too.",
  },
  unlicense: {
    tr: "Kamu mal\u0131na b\u0131rak\u0131r; hi\u00e7bir ko\u015ful yok.",
    en: "Dedicates the work to the public domain; no conditions at all.",
  },
};

const MIT = `MIT License

Copyright (c) {year} {holder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const BSD3 = `BSD 3-Clause License

Copyright (c) {year}, {holder}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
`;

const UNLICENSE = `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this
software, either in source code form or as a compiled binary, for any purpose,
commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors of this
software dedicate any and all copyright interest in the software to the public
domain. We make this dedication for the benefit of the public at large and to
the detriment of our heirs and successors. We intend this dedication to be an
overt act of relinquishment in perpetuity of all present and future rights to
this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>
`;

/**
 * The long copyleft texts are referenced rather than reproduced.
 *
 * GPL-3.0 and AGPL-3.0 run to some 700 lines each and must be copied verbatim
 * from the FSF to be the licence at all; a paraphrase would be worse than
 * useless. What is generated here is the header the project files carry,
 * alongside the canonical link.
 */
function copyleftHeader(
  name: string,
  url: string,
  year: string,
  holder: string,
): string {
  return `${name}

Copyright (C) ${year}  ${holder}

This program is free software: you can redistribute it and/or modify it under
the terms of the ${name} as published by the Free Software Foundation, either
version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the ${name} for more details.

You should have received a copy of the ${name} along with this program. If not,
see <https://www.gnu.org/licenses/>.

---

The full text must be copied verbatim into LICENSE from:
${url}
`;
}

export function render(id: LicenseId, year: string, holder: string): string {
  const who = holder.trim();
  if (!who) {
    throw new ToolError({
      tr: "Telif sahibinin ad\u0131 gerekli.",
      en: "The copyright holder's name is required.",
    });
  }

  const when = year.trim() || String(new Date().getFullYear());

  switch (id) {
    case "mit":
      return fill(MIT, when, who);
    case "bsd-3":
      return fill(BSD3, when, who);
    case "unlicense":
      return UNLICENSE;
    case "apache-2.0":
      return `Apache License 2.0

Copyright ${when} ${who}

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

---

The full text must be copied verbatim into LICENSE from:
https://www.apache.org/licenses/LICENSE-2.0.txt
`;
    case "gpl-3.0":
      return copyleftHeader(
        "GNU General Public License v3.0",
        "https://www.gnu.org/licenses/gpl-3.0.txt",
        when,
        who,
      );
    case "agpl-3.0":
      return copyleftHeader(
        "GNU Affero General Public License v3.0",
        "https://www.gnu.org/licenses/agpl-3.0.txt",
        when,
        who,
      );
  }
}

function fill(template: string, year: string, holder: string): string {
  return template.replace(/{year}/g, year).replace(/{holder}/g, holder);
}
