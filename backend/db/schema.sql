CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'normal',

  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_phone VARCHAR(100),
  client_business VARCHAR(255),

  business_type VARCHAR(255),
  business_stage VARCHAR(255),
  main_product TEXT,

  funnel_destination VARCHAR(255),
  traffic_source VARCHAR(255),
  target_audience TEXT,
  unique_value TEXT,

  followup_method VARCHAR(255),
  welcome_email TEXT,
  whatsapp_config TEXT,

  hero_title TEXT,
  hero_description TEXT,
  cta_text TEXT,
  guarantee TEXT,

  extra_modules JSONB,
  testimonials JSONB,
  faq JSONB,
  pricing_plans JSONB,
  social_links JSONB,

  primary_color VARCHAR(50),
  secondary_color VARCHAR(50),
  design_style VARCHAR(255),
  fonts VARCHAR(255),

  timeframe VARCHAR(255),
  additional_notes TEXT
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES admins(id)
);
