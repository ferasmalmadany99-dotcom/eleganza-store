import { ReplitConnectors } from "@replit/connectors-sdk";
import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { logger } from "./logger";

const connectors = new ReplitConnectors();

type ShopifyProduct = {
  id: string;
  title: string;
  variants: { nodes: Array<{ id: string; sku: string | null; price: string; inventoryQuantity: number }> };
};

export async function syncShopifyCatalog(): Promise<{ syncedProducts: number; syncedOrders: number }> {
  const connections = await connectors.listConnections({ connector_names: "shopify-store", refresh_policy: "none" });
  if (!connections.some((connection) => connection.status !== "error")) {
    throw new Error("Shopify Store connection is not configured");
  }
  const response = await connectors.proxy("shopify-store", "/admin/api/2025-01/graphql.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query EleganzaCatalog { products(first: 100) { nodes { id title variants(first: 100) { nodes { id sku price inventoryQuantity } } } } }`,
    }),
  });
  if (!response.ok) throw new Error(`Shopify sync failed (${response.status})`);
  const payload = await response.json() as { data?: { products?: { nodes: ShopifyProduct[] } }; errors?: unknown[] };
  if (payload.errors?.length || !payload.data?.products) throw new Error("Shopify returned an invalid catalog response");
  let syncedProducts = 0;
  for (const product of payload.data.products.nodes) {
    for (const variant of product.variants.nodes) {
      if (!variant.sku) continue;
      const [local] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.sku, variant.sku));
      if (!local) continue;
      await db.update(productsTable).set({
        shopifyProductId: product.id,
        shopifyVariantId: variant.id,
        quantityOnHand: variant.inventoryQuantity,
      }).where(eq(productsTable.id, local.id));
      syncedProducts += 1;
    }
  }
  logger.info({ syncedProducts }, "Shopify catalog sync completed");
  return { syncedProducts, syncedOrders: 0 };
}