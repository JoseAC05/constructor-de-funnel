import { Router } from "express";
import { statsHandler } from "../controllers/statsController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authRequired, statsHandler);

export default router;
