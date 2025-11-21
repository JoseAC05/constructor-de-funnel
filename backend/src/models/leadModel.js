import { query } from "../config/db.js";

export async function createLead(data) {
  const text = `
    INSERT INTO leads (
      status, priority,
      client_name, client_email, client_phone, client_business,
      business_type, business_stage, main_product,
      funnel_destination, traffic_source, target_audience, unique_value,
      followup_method, welcome_email, whatsapp_config,
      hero_title, hero_description, cta_text, guarantee,
      extra_modules, testimonials, faq, pricing_plans, social_links,
      primary_color, secondary_color, design_style, fonts,
      timeframe, additional_notes
    ) VALUES (
      COALESCE($1, 'pending'), COALESCE($2, 'normal'),
      $3, $4, $5, $6,
      $7, $8, $9,
      $10, $11, $12, $13,
      $14, $15, $16,
      $17, $18, $19, $20,
      $21::jsonb, $22::jsonb, $23::jsonb, $24::jsonb, $25::jsonb,
      $26, $27, $28, $29,
      $30, $31
    )
    RETURNING *;
  `;
  const values = [
    data.status,
    data.priority,
    data.client_name,
    data.client_email,
    data.client_phone,
    data.client_business,
    data.business_type,
    data.business_stage,
    data.main_product,
    data.funnel_destination,
    data.traffic_source,
    data.target_audience,
    data.unique_value,
    data.followup_method,
    data.welcome_email,
    data.whatsapp_config,
    data.hero_title,
    data.hero_description,
    data.cta_text,
    data.guarantee,
    JSON.stringify(data.extra_modules ?? null),
    JSON.stringify(data.testimonials ?? null),
    JSON.stringify(data.faq ?? null),
    JSON.stringify(data.pricing_plans ?? null),
    JSON.stringify(data.social_links ?? null),
    data.primary_color,
    data.secondary_color,
    data.design_style,
    data.fonts,
    data.timeframe,
    data.additional_notes
  ];
  const result = await query(text, values);
  return result.rows[0];
}

export async function getLeads({ status, business_type, offset = 0, limit = 20, search }) {
  let text = "SELECT * FROM leads WHERE 1=1";
  const values = [];
  let idx = 1;

  if (status) {
    text += ` AND status = $${idx++}`;
    values.push(status);
  }
  if (business_type) {
    text += ` AND business_type = $${idx++}`;
    values.push(business_type);
  }
  if (search) {
    text += ` AND (client_name ILIKE $${idx} OR client_email ILIKE $${idx})`;
    values.push(`%${search}%`);
    idx++;
  }

  text += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
  values.push(limit, offset);

  const result = await query(text, values);
  return result.rows;
}

export async function getLeadById(id) {
  const result = await query("SELECT * FROM leads WHERE id = $1", [id]);
  return result.rows[0];
}

export async function updateLead(id, data) {
  const result = await query(
    `
    UPDATE leads
    SET
      status = COALESCE($2, status),
      priority = COALESCE($3, priority),
      additional_notes = COALESCE($4, additional_notes),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `,
    [id, data.status, data.priority, data.additional_notes]
  );
  return result.rows[0];
}

export async function deleteLead(id) {
  await query("DELETE FROM leads WHERE id = $1", [id]);
}
