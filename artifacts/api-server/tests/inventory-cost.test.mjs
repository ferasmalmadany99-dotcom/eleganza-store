import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateInventoryMovementJournalAmountMinor,
  resolveInventoryMovementUnitCostMinor,
} from "../src/lib/inventory-cost.ts";

test("purchase movement accepts and preserves an explicit unit cost in minor units", async () => {
  const request = {
    productId: 7,
    type: "purchase",
    quantity: 3,
    unitCostMinor: 2750,
  };

  assert.equal(request.unitCostMinor, 2750);
  assert.equal(resolveInventoryMovementUnitCostMinor(request.unitCostMinor, 9100), 2750);

  const [route, apiSchema] = await Promise.all([
    readFile(new URL("../src/routes/inventory.ts", import.meta.url), "utf8"),
    readFile(new URL("../../../lib/api-zod/src/generated/api.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /resolveInventoryMovementUnitCostMinor\(parsed\.data\.unitCostMinor,\s*product\.costMinor\)/);
  assert.match(route, /tx\.insert\(inventoryMovementsTable\)\.values\(\{[\s\S]*?unitCostMinor,/);
  assert.match(apiSchema, /"unitCostMinor": zod\.number\(\)\.int\(\)\.min\(createInventoryMovementBodyUnitCostMinorMin\)\.optional\(\)/);
});

test("inventory journal amount uses quantity times the explicit purchase cost", () => {
  assert.equal(calculateInventoryMovementJournalAmountMinor(3, 2750, 9100), 8250);
  assert.equal(calculateInventoryMovementJournalAmountMinor(-3, 2750, 9100), 8250);
});

test("legacy movements without an explicit cost use the current product cost", async () => {
  assert.equal(resolveInventoryMovementUnitCostMinor(undefined, 9100), 9100);
  assert.equal(resolveInventoryMovementUnitCostMinor(null, 9100), 9100);
  assert.equal(calculateInventoryMovementJournalAmountMinor(3, undefined, 9100), 27300);

  const accounting = await readFile(new URL("../src/lib/accounting.ts", import.meta.url), "utf8");
  assert.match(
    accounting,
    /calculateInventoryMovementJournalAmountMinor\(input\.quantity,\s*input\.unitCostMinor,\s*product\.costMinor\)/,
  );
});
