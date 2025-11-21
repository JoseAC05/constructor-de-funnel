import { query } from "../config/db.js";

export async function findAdminByEmail(email) {
  const res = await query("SELECT * FROM admins WHERE email = $1", [email]);
  return res.rows[0];
}

export async function createAdmin({ email, password_hash }) {
  const res = await query(
    "INSERT INTO admins (email, password_hash) VALUES ($1, $2) RETURNING *",
    [email, password_hash]
  );
  return res.rows[0];
}
