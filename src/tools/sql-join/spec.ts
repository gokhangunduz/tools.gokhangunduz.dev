import type { ReferenceSpec } from "../reference-tool";

export const spec: ReferenceSpec = {
  columns: [
    { tr: "JOIN", en: "JOIN" },
    { tr: "Sonuç", en: "Result" },
  ],
  rows: [
    [
      "INNER JOIN",
      "Yalnız iki tarafta da eşleşen satırlar / Only rows matching on both sides",
    ],
    [
      "LEFT JOIN",
      "Soldaki her satır; sağda eşleşme yoksa NULL / Every left row; NULLs where the right has none",
    ],
    ["RIGHT JOIN", "Sağdaki her satır; solda eşleşme yoksa NULL"],
    ["FULL OUTER JOIN", "İki taraftaki her satır, eşleşmeyenler NULL ile"],
    [
      "CROSS JOIN",
      "Kartezyen çarpım — her satır her satırla / Every row against every row",
    ],
    [
      "LEFT JOIN … WHERE b.id IS NULL",
      "Yalnız solda olanlar (anti-join) / Rows only on the left",
    ],
    ["SELF JOIN", "Tabloyu kendisiyle birleştirme — hiyerarşi için"],
    [
      "LATERAL / CROSS APPLY",
      "Her satır için alt sorgu çalıştır / Run a subquery per row",
    ],
    ["USING (id)", "İki tarafta da aynı adlı sütun; sonuçta tek kopya"],
    ["ON a.id = b.a_id", "Açık koşul — farklı sütun adları"],
    [
      "WHERE vs ON (LEFT JOIN)",
      "ON birleştirmeyi, WHERE sonucu filtreler — WHERE, LEFT JOIN'i INNER'a çevirir",
    ],
    [
      "EXISTS (…)",
      "Eşleşme var mı — satır çoğaltmadan / Existence without duplicating rows",
    ],
    [
      "IN (SELECT …)",
      "Küçük listeler için; NULL'larla dikkat / Careful with NULLs",
    ],
    ["UNION / UNION ALL", "Alt alta ekle; ALL tekrarları korur ve hızlıdır"],
    ["GROUP BY … HAVING", "Grupla, sonra grupları filtrele"],
    [
      "WINDOW: ROW_NUMBER() OVER (PARTITION BY …)",
      "Grup içinde sıra numarası — en son kaydı seçmek için",
    ],
  ],
};
