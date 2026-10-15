export function resolveInventoryMovementUnitCostMinor(
  unitCostMinor: number | null | undefined,
  currentProductCostMinor: number,
): number {
  return unitCostMinor ?? currentProductCostMinor;
}

export function calculateInventoryMovementJournalAmountMinor(
  quantity: number,
  unitCostMinor: number | null | undefined,
  currentProductCostMinor: number,
): number {
  return Math.abs(quantity) * resolveInventoryMovementUnitCostMinor(unitCostMinor, currentProductCostMinor);
}
