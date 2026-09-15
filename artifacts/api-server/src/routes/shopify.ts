import { Router, type IRouter } from "express";
import { SyncShopifyResponse } from "@workspace/api-zod";
import { requireAuth, requireManager } from "../middlewares/auth";
import { syncShopifyCatalog } from "../lib/shopify";

const router: IRouter = Router();
router.post("/shopify/sync", requireAuth, requireManager, async (_req, res): Promise<void> => {
  try {
    const result = await syncShopifyCatalog();
    res.json(SyncShopifyResponse.parse(result));
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "Shopify sync failed" });
  }
});

export default router;