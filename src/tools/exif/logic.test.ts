import piexif from "piexifjs";
import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import {
  changedFields,
  describeLocation,
  editJpeg,
  FIELDS,
  fromBinary,
  inspect,
  normalizeFields,
  outputName,
  pickJpeg,
  readFields,
  splitJpeg,
  stripJpeg,
  summarize,
  toBinary,
  writeFields,
  type ExifObject,
} from "./logic";

const GPS = {
  1: "N",
  2: [
    [41, 1],
    [0, 1],
    [493, 100],
  ],
  3: "E",
  4: [
    [28, 1],
    [58, 1],
    [4980, 100],
  ],
};

const EXIF: ExifObject = {
  "0th": { 271: "Canon", 272: "Canon EOS R6", 274: 6 },
  Exif: {
    36867: "2026:09:25 14:30:00",
    33437: [28, 10],
    33434: [1, 250],
    34855: 400,
    37386: [50, 1],
  },
  GPS,
};

const APP0 = "\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00";
const SCAN = "\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x12\x34\x56\xff\xd9";
const XMP_GPS = xmp('<x exif:GPSLatitude="41,0.08N"/>');

function xmp(body: string): string {
  const payload = `http://ns.adobe.com/xap/1.0/\0${body}`;
  const length = payload.length + 2;
  return `\xff\xe1${String.fromCharCode(length >> 8, length & 0xff)}${payload}`;
}

function jpeg(exif?: ExifObject, extra = ""): Uint8Array {
  let head = `\xff\xd8${APP0}${extra}`;
  if (exif) {
    head = piexif.insert(piexif.dump(exif), `${head}\xff\xda`).slice(0, -2);
  }
  return fromBinary(head + SCAN);
}

const values = (overrides: Partial<Record<string, string>> = {}) => ({
  ...readFields(EXIF),
  ...overrides,
});

describe("pickJpeg", () => {
  it("takes the first JPEG and counts the rest", () => {
    const files = [
      { name: "a.png", type: "image/png" },
      { name: "b.JPG", type: "" },
      { name: "c.jpeg", type: "image/jpeg" },
    ];
    expect(pickJpeg(files)).toEqual({ file: files[1], ignored: 2 });
  });

  it("refuses anything else in both languages", () => {
    try {
      pickJpeg([{ name: "shot.png", type: "image/png" }]);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      const { tr, en } = (error as ToolError).localized;
      expect(tr).toContain("shot.png");
      expect(en).toContain("not a JPEG");
    }
  });
});

describe("splitJpeg", () => {
  it("keeps the scan data byte for byte", () => {
    const bytes = jpeg(EXIF);
    const { head, body } = splitJpeg(bytes);
    expect(toBinary(body)).toBe(SCAN);
    expect(head.startsWith("\xff\xd8")).toBe(true);
  });

  it("rejects bytes that are not a JPEG", () => {
    expect(() => splitJpeg(fromBinary("\x89PNG\r\n\x1a\n"))).toThrow(ToolError);
  });

  it("rejects a JPEG that ends before its scan", () => {
    expect(() => splitJpeg(fromBinary(`\xff\xd8${APP0}`))).toThrow(ToolError);
  });
});

describe("inspect", () => {
  it("reads the fields, the location and the tag count", () => {
    const result = inspect(jpeg(EXIF));
    expect(readFields(result.exif).Make).toBe("Canon");
    expect(result.location).toEqual({ coordinates: "41.00137, 28.98050" });
    expect(result.tagCount).toBeGreaterThan(8);
  });

  it("sees a location that only XMP carries", () => {
    const result = inspect(jpeg(undefined, XMP_GPS));
    expect(result.location).toEqual({ coordinates: null });
  });

  it("reports no location for a clean photo", () => {
    expect(inspect(jpeg()).location).toBeNull();
  });
});

describe("readFields and writeFields", () => {
  it("covers every advertised field", () => {
    const read = readFields(EXIF);
    for (const field of FIELDS) expect(read).toHaveProperty(field.id);
    expect(read.Copyright).toBe("");
  });

  it("removes the tag when the field is cleared", () => {
    const next = writeFields(EXIF, values({ Make: "  " }));
    expect(next["0th"][271]).toBeUndefined();
  });

  it("does not mutate the object it was given", () => {
    writeFields(EXIF, values({ Make: "Nikon" }), { dropLocation: true });
    expect(EXIF["0th"][271]).toBe("Canon");
    expect(EXIF.GPS[1]).toBe("N");
  });

  it("drops the GPS block on request", () => {
    expect(writeFields(EXIF, values(), { dropLocation: true }).GPS).toEqual({});
  });
});

describe("changedFields", () => {
  it("lists what differs, ignoring surrounding spaces", () => {
    const before = readFields(EXIF);
    expect(changedFields(before, { ...before, Make: " Canon " })).toEqual([]);
    expect(changedFields(before, { ...before, Artist: "G" })).toEqual([
      "Artist",
    ]);
  });
});

describe("normalizeFields", () => {
  it("accepts ISO-style dates and writes them the EXIF way", () => {
    expect(
      normalizeFields(values({ DateTimeOriginal: "2026-09-25T14:30" }))
        .DateTimeOriginal,
    ).toBe("2026:09:25 14:30:00");
  });

  it("names the field when the date is wrong", () => {
    try {
      normalizeFields(values({ DateTimeOriginal: "2026:13:01 10:00:00" }));
      expect.unreachable();
    } catch (error) {
      expect((error as ToolError).field).toBe("DateTimeOriginal");
    }
  });
});

describe("editJpeg", () => {
  it("writes the edits into a file that reads back the same", () => {
    const source = inspect(jpeg(EXIF));
    const out = editJpeg(
      source,
      values({ Artist: "Gökhan Gündüz", UserComment: "İstanbul, Şişli" }),
    );
    const again = readFields(inspect(out).exif);
    expect(again.Artist).toBe("Gökhan Gündüz");
    expect(again.UserComment).toBe("İstanbul, Şişli");
    expect(again.Make).toBe("Canon");
    expect(toBinary(splitJpeg(out).body)).toBe(SCAN);
  });

  it("round-trips an ASCII comment", () => {
    const out = editJpeg(inspect(jpeg(EXIF)), values({ UserComment: "hi" }));
    expect(readFields(inspect(out).exif).UserComment).toBe("hi");
  });

  it("removes the location from EXIF and XMP", () => {
    const out = editJpeg(inspect(jpeg(EXIF, XMP_GPS)), values(), {
      dropLocation: true,
    });
    const again = inspect(out);
    expect(again.location).toBeNull();
    expect(readFields(again.exif).Make).toBe("Canon");
  });

  it("refuses to write an invalid date", () => {
    expect(() =>
      editJpeg(inspect(jpeg(EXIF)), values({ DateTimeOriginal: "yesterday" })),
    ).toThrow(ToolError);
  });
});

describe("stripJpeg", () => {
  it("leaves nothing but the orientation", () => {
    const out = stripJpeg(inspect(jpeg(EXIF, XMP_GPS)));
    const again = inspect(out);
    expect(again.location).toBeNull();
    expect(again.exif["0th"]).toEqual({ 274: 6 });
    expect(Object.keys(again.exif.Exif)).toHaveLength(0);
    expect(toBinary(out)).not.toContain("ns.adobe.com");
    expect(toBinary(out)).toContain("JFIF");
  });

  it("adds no EXIF at all when the photo is upright", () => {
    const out = stripJpeg(
      inspect(jpeg({ ...EXIF, "0th": { 271: "Canon", 274: 1 } })),
    );
    expect(toBinary(out)).not.toContain("Exif\0\0");
  });
});

describe("describeLocation", () => {
  it("converts the GPS rationals to decimal degrees", () => {
    expect(describeLocation(EXIF)).toBe("41.00137, 28.98050");
  });

  it("returns null when there is no GPS block", () => {
    expect(describeLocation({ "0th": {}, Exif: {} })).toBeNull();
  });

  it("handles the southern and western hemispheres", () => {
    const south = describeLocation({
      GPS: {
        1: "S",
        2: [
          [33, 1],
          [52, 1],
          [0, 1],
        ],
        3: "W",
        4: [
          [70, 1],
          [40, 1],
          [0, 1],
        ],
      },
    });
    expect(south).toBe("-33.86667, -70.66667");
  });
});

describe("summarize", () => {
  it("reads camera, date, size and exposure", () => {
    const rows = summarize(EXIF, { width: 4000, height: 3000 });
    const byLabel = Object.fromEntries(
      rows.map((row) => [(row.label as { en: string }).en, row.value]),
    );
    expect(byLabel).toEqual({
      Camera: "Canon EOS R6",
      "Taken at": "2026-09-25 14:30:00",
      Dimensions: "4000 × 3000 · 12.0 MP",
      Exposure: "f/2.8 · 1/250 s · ISO 400 · 50 mm",
    });
  });

  it("leaves out what the photo does not say", () => {
    expect(summarize({ "0th": {}, Exif: {} }, null)).toEqual([]);
  });
});

describe("outputName", () => {
  it("names the file in the visitor's language", () => {
    expect(outputName("IMG_1.JPG", "edited")).toEqual({
      tr: "IMG_1-duzenlenmis.jpg",
      en: "IMG_1-edited.jpg",
    });
    expect(outputName("a.jpeg", "stripped").en).toBe("a-clean.jpeg");
  });
});
