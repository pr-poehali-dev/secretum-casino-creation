CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER NOT NULL,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_promo_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  promo_code_id INTEGER REFERENCES promo_codes(id),
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, promo_code_id)
);

CREATE TABLE IF NOT EXISTS case_openings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  case_name VARCHAR(100) NOT NULL,
  case_price DECIMAL(10, 2) NOT NULL,
  prize_amount DECIMAL(10, 2) NOT NULL,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO promo_codes (code, amount, max_uses) VALUES 
  ('exe', 40.00, 1),
  ('Ismailov', 30000.00, 1),
  ('гурманов', 200.00, 3)
ON CONFLICT (code) DO NOTHING;
