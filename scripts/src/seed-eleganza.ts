import { db, productsTable } from "@workspace/db";

const catalog = [
  ["p01", "Santal No. 03", "Perfume", 14500],
  ["m01", "Rose Veil", "Makeup", 4800],
  ["a01", "Lune Hoops", "Accessories", 9200],
  ["m02", "Velvet Muse", "Makeup", 3600],
  ["p02", "Amber Reverie", "Perfume", 16800],
  ["m03", "Silk Petal", "Makeup", 4400],
  ["a02", "Solstice Chain", "Accessories", 11800],
  ["m04", "Nocturne Rouge", "Makeup", 3900],
  ["p03", "Cedar Afterglow", "Perfume", 15200],
  ["m05", "Dawn Flush", "Makeup", 4600],
  ["a03", "Aurelia Drops", "Accessories", 10500],
  ["m06", "Plum Élan", "Makeup", 3800],
] as const;

if (process.env.NODE_ENV === "production") {
  throw new Error("The Eleganza seed is development-only");
}

for (const [sku, nameEn, category, salePriceMinor] of catalog) {
  await db.insert(productsTable).values({
    sku, nameEn, nameAr: "", category, salePriceMinor, costMinor: 0,
    quantityOnHand: 0, reorderThreshold: 0, imageUrls: [],
  }).onConflictDoNothing({ target: productsTable.sku });
}

await db.$client.end();