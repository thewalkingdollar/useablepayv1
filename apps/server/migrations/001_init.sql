CREATE TABLE users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id text PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);

CREATE TABLE billers (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO billers (name, category) VALUES
  ('Electricity', 'utility'),
  ('Water', 'utility'),
  ('Internet', 'telecom'),
  ('Mobile', 'telecom');

CREATE TABLE payments (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  biller_id integer NOT NULL REFERENCES billers(id),
  reference text NOT NULL,
  phone text NOT NULL,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  provider text NOT NULL,
  provider_reference text NOT NULL UNIQUE,
  provider_transaction_id text,
  failure_reason text,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_user_created_idx ON payments(user_id, created_at DESC);
CREATE INDEX payments_status_idx ON payments(status);
