-- ============================================================
-- People Balances V2 Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add account_id column to associate balance entries with accounts
ALTER TABLE people_balances ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Add subtype column for more granular categorization
-- Subtypes: borrow | lend | repay | collect | adjustment | writeoff | null (for opening entries)
ALTER TABLE people_balances ADD COLUMN IF NOT EXISTS subtype TEXT;

-- Add index for account_id
CREATE INDEX IF NOT EXISTS idx_people_balances_account ON people_balances(account_id);

-- Update balance_type enum to support new transaction-based types
-- Note: We reuse payable/receivable for new transactions too, distinguished by subtype
-- opening_payable: legacy debt I owe (no transaction)
-- opening_receivable: legacy debt owed to me (no transaction)
-- payable + subtype='borrow': I borrowed money (account credit)
-- payable + subtype='repay': I repaid debt (account debit)
-- receivable + subtype='lend': I lent money (account debit)
-- receivable + subtype='collect': Received repayment (account credit)
-- payable/receivable + subtype='adjustment': Manual balance fix
-- payable/receivable + subtype='writeoff': Debt forgiveness

-- Backfill existing payable/receivable rows with subtype='borrow'/'lend' if not opening
UPDATE people_balances 
SET subtype = CASE 
  WHEN type = 'payable' THEN 'borrow'
  WHEN type = 'receivable' THEN 'lend'
  ELSE NULL
END
WHERE subtype IS NULL 
  AND type IN ('payable', 'receivable');
