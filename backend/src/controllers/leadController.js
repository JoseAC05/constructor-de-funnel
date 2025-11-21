import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead
} from "../models/leadModel.js";
import { createNote, getNotesByLead } from "../models/noteModel.js";

export async function createLeadHandler(req, res, next) {
  try {
    const lead = await createLead(req.body);
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
}

export async function listLeadsHandler(req, res, next) {
  try {
    const { status, business_type, page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const leads = await getLeads({
      status,
      business_type,
      offset,
      limit: Number(limit),
      search
    });
    res.json(leads);
  } catch (err) {
    next(err);
  }
}

export async function getLeadHandler(req, res, next) {
  try {
    const lead = await getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead no encontrado" });
    const notes = await getNotesByLead(req.params.id);
    res.json({ ...lead, notes });
  } catch (err) {
    next(err);
  }
}

export async function updateLeadHandler(req, res, next) {
  try {
    const lead = await updateLead(req.params.id, req.body);
    if (!lead) return res.status(404).json({ message: "Lead no encontrado" });
    res.json(lead);
  } catch (err) {
    next(err);
  }
}

export async function deleteLeadHandler(req, res, next) {
  try {
    await deleteLead(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addNoteHandler(req, res, next) {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "El contenido es obligatorio" });
    }
    const note = await createNote({
      lead_id: req.params.id,
      content,
      created_by: req.user?.id ?? null
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}
