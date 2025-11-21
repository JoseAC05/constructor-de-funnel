import { Router } from "express";
import { loginHandler, registerAdminOnce } from "../controllers/authController.js";

const router = Router();

router.post("/login", loginHandler);
// Solo usar /register para crear el primer admin
router.post("/register", registerAdminOnce);

export default router;
