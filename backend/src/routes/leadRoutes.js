import { Router } from "express";
import {
  createLeadHandler,
  listLeadsHandler,
  getLeadHandler,
  updateLeadHandler,
  deleteLeadHandler,
  addNoteHandler
} from "../controllers/leadController.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { validateLeadCreate } from "../middleware/validateRequest.js";

const router = Router();

// Público: creación desde REQUALV
router.post("/", validateLeadCreate, createLeadHandler);

// Protegido: gestión en dashboard
router.get("/", authRequired, listLeadsHandler);
router.get("/:id", authRequired, getLeadHandler);
router.put("/:id", authRequired, updateLeadHandler);
router.delete("/:id", authRequired, deleteLeadHandler);
router.post("/:id/notes", authRequired, addNoteHandler);

export default router;
