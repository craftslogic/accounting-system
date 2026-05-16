-- ============================================================
-- FinanceOS — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('cash', 'bank', 'wallet', 'savings', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('income', 'expense');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- Accounts table
-- NOTE: No balance column. Balances are calculated dynamically from transactions.
CREATE TABLE IF NOT EXISTS accounts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        account_type NOT NULL DEFAULT 'bank',
  currency    CHAR(3) NOT NULL DEFAULT 'USD',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       category_type NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6366f1',
  icon       TEXT NOT NULL DEFAULT '💰',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table
-- NOTE: amount stored as NUMERIC(12,2) for precision. No floating-point issues.
-- BALANCE LOGIC:
--   income:   adds `amount` to `to_account_id`
--   expense:  subtracts `amount` from `from_account_id`
--   transfer: subtracts from `from_account_id`, adds to `to_account_id`
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             transaction_type NOT NULL,
  amount           NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  from_account_id  UUID REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id    UUID REFERENCES accounts(id) ON DELETE SET NULL,
  note             TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraints
  CONSTRAINT income_needs_to_account
    CHECK (type != 'income' OR to_account_id IS NOT NULL),
  CONSTRAINT expense_needs_from_account
    CHECK (type != 'expense' OR from_account_id IS NOT NULL),
  CONSTRAINT transfer_needs_both_accounts
    CHECK (type != 'transfer' OR (from_account_id IS NOT NULL AND to_account_id IS NOT NULL)),
  CONSTRAINT transfer_different_accounts
    CHECK (type != 'transfer' OR from_account_id != to_account_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_archived ON accounts(is_archived);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ---- ACCOUNTS POLICIES ----

DROP POLICY IF EXISTS "accounts_select" ON accounts;
CREATE POLICY "accounts_select"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_insert" ON accounts;
CREATE POLICY "accounts_insert"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_update" ON accounts;
CREATE POLICY "accounts_update"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_delete" ON accounts;
CREATE POLICY "accounts_delete"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ---- CATEGORIES POLICIES ----

DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- ---- TRANSACTIONS POLICIES ----

DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert" ON transactions;
CREATE POLICY "transactions_insert"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete" ON transactions;
CREATE POLICY "transactions_delete"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Create a bucket for avatar images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ---- STORAGE BUCKET POLICIES ----
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- DO $$
-- DECLARE
--   demo_user_id UUID := 'YOUR-USER-UUID-HERE'; -- Replace with your user's UUID from auth.users
--   acc_cash_id  UUID := uuid_generate_v4();
--   acc_bank_id  UUID := uuid_generate_v4();
--   cat_salary   UUID := uuid_generate_v4();
--   cat_food     UUID := uuid_generate_v4();
--   cat_rent     UUID := uuid_generate_v4();
-- BEGIN
--   -- Accounts
--   INSERT INTO accounts (id, user_id, name, type, currency)
--   VALUES
--     (acc_cash_id, demo_user_id, 'Cash Wallet', 'cash', 'USD'),
--     (acc_bank_id, demo_user_id, 'Chase Bank', 'bank', 'USD');
--
--   -- Categories
--   INSERT INTO categories (id, user_id, name, type, color, icon)
--   VALUES
--     (cat_salary, demo_user_id, 'Salary', 'income', '#22c55e', '💼'),
--     (cat_food,   demo_user_id, 'Food & Dining', 'expense', '#f97316', '🍔'),
--     (cat_rent,   demo_user_id, 'Rent', 'expense', '#ef4444', '🏠');
--
--   -- Transactions
--   INSERT INTO transactions (user_id, type, amount, category_id, to_account_id, note, transaction_date)
--   VALUES
--     (demo_user_id, 'income', 5000.00, cat_salary, acc_bank_id, 'Monthly salary', CURRENT_DATE - 5);
--
--   INSERT INTO transactions (user_id, type, amount, category_id, from_account_id, note, transaction_date)
--   VALUES
--     (demo_user_id, 'expense', 1500.00, cat_rent, acc_bank_id, 'Rent payment', CURRENT_DATE - 3),
--     (demo_user_id, 'expense', 120.50, cat_food, acc_cash_id, 'Weekly groceries', CURRENT_DATE - 1);
--
--   INSERT INTO transactions (user_id, type, amount, from_account_id, to_account_id, note, transaction_date)
--   VALUES
--     (demo_user_id, 'transfer', 500.00, acc_bank_id, acc_cash_id, 'ATM withdrawal', CURRENT_DATE - 2);
-- END $$;
