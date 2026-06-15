import { Router, type IRouter } from "express";
import healthRouter from "./health";
import configRouter from "./config";
import cronRouter from "./cron";
import secRouter from "./sec";
import marketRouter from "./market";
import llmRouter from "./llm";
import analysesRouter from "./analyses";

const router: IRouter = Router();

router.use(healthRouter);
router.use(configRouter);
router.use(cronRouter);
router.use(secRouter);
router.use(marketRouter);
router.use(llmRouter);
router.use(analysesRouter);

export default router;
