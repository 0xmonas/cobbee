-- Add thank_you_message column to users table
-- Migration: 20250112000001_add_thank_you_message.sql
-- This allows creators to customize their thank you message to supporters

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS thank_you_message TEXT;

COMMENT ON COLUMN public.users.thank_you_message IS 'Custom thank you message shown to supporters after they send coffee';
