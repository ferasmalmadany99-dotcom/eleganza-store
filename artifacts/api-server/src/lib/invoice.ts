import { randomUUID } from "node:crypto";

export function salesInvoiceNumber(orderId: number) {
  return `SALE ${orderId}`;
}

export function draftOrderNumber() {
  return `PENDING-${randomUUID()}`;
}