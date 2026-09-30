CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age integer,
  sex text,
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  goal text DEFAULT 'muscle_gain',
  baseline_activity text DEFAULT 'light',
  onboarding_done boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  meal_type text NOT NULL,
  name text NOT NULL,
  quantity numeric(8,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'porção',
  calories numeric(8,2) NOT NULL DEFAULT 0,
  protein numeric(8,2) NOT NULL DEFAULT 0,
  carbs numeric(8,2) NOT NULL DEFAULT 0,
  fat numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday integer NOT NULL,
  type text NOT NULL,
  duration_minutes integer NOT NULL,
  intensity text NOT NULL DEFAULT 'moderate',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  type text NOT NULL,
  duration_minutes integer NOT NULL,
  intensity text NOT NULL DEFAULT 'moderate',
  calories_estimated numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  weight_kg numeric(5,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS food_entries_user_date_idx ON food_entries(user_id, log_date);
CREATE INDEX IF NOT EXISTS workout_sessions_user_date_idx ON workout_sessions(user_id, log_date);
CREATE INDEX IF NOT EXISTS weight_logs_user_date_idx ON weight_logs(user_id, log_date);
