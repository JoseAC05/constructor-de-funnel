import { query } from "../config/db.js";

export async function createNote({ lead_id, content, created_by }) {
  const res = await query(
    `
    INSERT INTO notes (lead_id, content, created_by)
    VALUES ($1, $2, $3)
    RETURNING *;
  `,
    [lead_id, content, created_by]
  );
  return res.rows[0];
}

export async function getNotesByLead(lead_id) {
  const res = await query(
    "SELECT * FROM notes WHERE lead_id = $1 ORDER BY created_at DESC",
    [lead_id]
  );
  return res.rows;
}
