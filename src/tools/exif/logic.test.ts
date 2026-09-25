import { describe, expect, it } from "vitest";
import { describeLocation, FIELDS, readFields, writeFields } from "./logic";

const EXIF = {
  "0th": { 271: "Canon", 272: "EOS R6", 315: "" },
  Exif: { 36867: "2026:09:25 14:30:00" },
  GPS: {
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
  },
};

describe("readFields", () => {
  it("pulls the editable values out by tag", () => {
    const values = readFields(EXIF);
    expect(values.Make).toBe("Canon");
    expect(values.Model).toBe("EOS R6");
    expect(values.DateTimeOriginal).toBe("2026:09:25 14:30:00");
  });

  it("gives an empty string for a field that is absent", () => {
    expect(readFields(EXIF).Copyright).toBe("");
  });

  it("covers every advertised field", () => {
    const values = readFields(EXIF);
    for (const field of FIELDS) expect(values).toHaveProperty(field.id);
  });
});

describe("writeFields", () => {
  it("sets a value in the right IFD", () => {
    const next = writeFields(readFields(EXIF) && EXIF, {
      ...readFields(EXIF),
      Artist: "Gökhan Gündüz",
    });
    expect(next["0th"][315]).toBe("Gökhan Gündüz");
  });

  it("removes the tag when the field is cleared", () => {
    const next = writeFields(EXIF, { ...readFields(EXIF), Make: "" });
    expect(next["0th"][271]).toBeUndefined();
  });

  it("does not mutate the object it was given", () => {
    writeFields(EXIF, { ...readFields(EXIF), Make: "Nikon" });
    expect(EXIF["0th"][271]).toBe("Canon");
  });
});

describe("describeLocation", () => {
  it("converts the GPS rationals to decimal degrees", () => {
    // 41° 0' 4.93" N, 28° 58' 49.8" E — İstanbul.
    expect(describeLocation(EXIF)).toBe("41.00137, 28.98050");
  });

  it("returns null when there is no GPS block", () => {
    expect(describeLocation({ "0th": {}, Exif: {} })).toBeNull();
  });

  it("handles the southern and western hemispheres", () => {
    const south = describeLocation({
      "0th": {},
      Exif: {},
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
