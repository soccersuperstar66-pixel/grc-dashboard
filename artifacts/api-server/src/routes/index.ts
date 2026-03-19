import { Router, type IRouter } from "express";
import healthRouter from "./health";
import regulationsRouter from "./regulations";
import gapAnalysisRouter from "./gap-analysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/regulations", regulationsRouter);
router.use("/gap-analysis", gapAnalysisRouter);

export default router;
