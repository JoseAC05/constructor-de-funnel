import { query } from "../config/db.js";

export async function statsHandler(req, res, next) {
  try {
    const total = await query("SELECT COUNT(*) FROM leads");
    const byStatus = await query(
      "SELECT status, COUNT(*) FROM leads GROUP BY status"
    );
    const last30Days = await query(
      `
      SELECT
        DATE(created_at) AS date,
        COUNT(*) AS count
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `
    );

    res.json({
      total: Number(total.rows[0].count),
      byStatus: byStatus.rows,
      last30Days: last30Days.rows
    });
  } catch (err) {
    next(err);
  }
}
