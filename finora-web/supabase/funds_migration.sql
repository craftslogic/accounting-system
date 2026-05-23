-- ============================================================
-- FUNDS SYSTEM — Supabase PostgreSQL Migration
-- Run this in your Supabase SQL Editor after schema.sql
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE fund_transaction_type AS ENUM ('allocate', 'withdraw', 'adjustment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- Funds table
-- A fund is a named "envelope" inside an account, not a separate account.
CREATE TABLE IF NOT EXISTS funds (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'custom',        -- e.g. emergency, savings, vacation, custom
  target_amount  NUMERIC(14, 2),                         -- optional savings goal
  current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  color          TEXT NOT NULL DEFAULT '#6366f1',
  icon           TEXT NOT NULL DEFAULT '🏦',
  description    TEXT,
  is_archived    BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fund Transactions table
-- Tracks money flowing into/out of funds (allocate / withdraw / adjustment)
CREATE TABLE IF NOT EXISTS fund_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id          UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  account_id       UUID REFERENCES accounts(id) ON DELETE SET NULL,  -- source/destination account
  type             fund_transaction_type NOT NULL,
  amount           NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  note             TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recurring Fund Allocations
-- Optional: schedule automatic monthly allocations to funds
CREATE TABLE IF NOT EXISTS fund_recurring (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id                   UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  account_id                UUID REFERENCES accounts(id) ON DELETE SET NULL,
  amount                    NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  frequency                 recurring_frequency NOT NULL DEFAULT 'monthly',
  next_date                 DATE NOT NULL,
  auto_generate_transaction BOOLEAN NOT NULL DEFAULT false,
  auto_reminder             BOOLEAN NOT NULL DEFAULT true,
  note                      TEXT,
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_funds_user_id        ON funds(user_id);
CREATE INDEX IF NOT EXISTS idx_funds_is_archived    ON funds(is_archived);
CREATE INDEX IF NOT EXISTS idx_fund_tx_user_id      ON fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_tx_fund_id      ON fund_transactions(fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_tx_date         ON fund_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fund_recurring_user  ON fund_recurring(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_recurring_fund  ON fund_recurring(fund_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE funds            ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_recurring   ENABLE ROW LEVEL SECURITY;

-- Funds
DROP POLICY IF EXISTS "funds_all" ON funds;
CREATE POLICY "funds_all"
  ON funds FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fund Transactions
DROP POLICY IF EXISTS "fund_transactions_all" ON fund_transactions;
CREATE POLICY "fund_transactions_all"
  ON fund_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fund Recurring
DROP POLICY IF EXISTS "fund_recurring_all" ON fund_recurring;
CREATE POLICY "fund_recurring_all"
  ON fund_recurring FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- HELPER: Get total reserved amount across all funds
-- ============================================================

CREATE OR REPLACE FUNCTION get_total_reserved(p_user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(current_amount), 0)
  FROM funds
  WHERE user_id = p_user_id AND is_archived = false;
$$ LANGUAGE sql SECURITY DEFINER;
