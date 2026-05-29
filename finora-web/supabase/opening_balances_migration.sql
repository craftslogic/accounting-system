-- ============================================================
-- OPENING BALANCES — Supabase PostgreSQL Migration
-- ============================================================
-- IMPORTANT: Run STEP 1 first, then run STEP 2 separately.
-- PostgreSQL requires new enum values to be committed before they can be used in constraints.

-- ============================================================
-- STEP 1: Add new enum values
-- Highlight lines 10-18 and click "Run", or run them by themselves.
-- ============================================================

-- 1. Add opening_balance to transaction_type
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'opening_balance';

-- 2. Add opening_balance to fund_transaction_type
ALTER TYPE fund_transaction_type ADD VALUE IF NOT EXISTS 'opening_balance';

-- 3. Add opening types to balance_type for people balances
ALTER TYPE balance_type ADD VALUE IF NOT EXISTS 'opening_payable';
ALTER TYPE balance_type ADD VALUE IF NOT EXISTS 'opening_receivable';

-- ============================================================
-- STEP 2: Update table constraints
-- After Step 1 is successful, run the following lines.
-- ============================================================

-- 4. Update constraints in transactions table to support opening_balance
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS income_needs_to_account;

ALTER TABLE transactions ADD CONSTRAINT income_needs_to_account
  CHECK (type NOT IN ('income', 'opening_balance') OR to_account_id IS NOT NULL);
