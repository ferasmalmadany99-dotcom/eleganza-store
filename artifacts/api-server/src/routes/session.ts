import { Router, type IRouter } from "express";
import { GetSessionResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/session/me", requireAuth, (req, res): void => {
  res.json(GetSessionResponse.parse(req.staff));
});

export default router;