import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionRouter from "./session";
import dashboardRouter from "./dashboard";
import productsRouter from "./products";
import inventoryRouter from "./inventory";
import ordersRouter from "./orders";
import expensesRouter from "./expenses";
import staffRouter from "./staff";
import auditRouter from "./audit";
import shopifyRouter from "./shopify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionRouter);
router.use(dashboardRouter);
router.use(productsRouter);
router.use(inventoryRouter);
router.use(ordersRouter);
router.use(expensesRouter);
router.use(staffRouter);
router.use(auditRouter);
router.use(shopifyRouter);

export default router;
