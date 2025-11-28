-- Migration: Add color field to milestones table
-- Created: 2025-01-28
-- Description: Add neon color field for test tube visualization

-- Add color column to milestones table
ALTER TABLE "public"."milestones"
ADD COLUMN IF NOT EXISTS "color" text DEFAULT '#00FF00' NOT NULL;

-- Add color validation constraint (valid hex colors)
ALTER TABLE "public"."milestones"
ADD CONSTRAINT "color_hex_format"
CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON COLUMN "public"."milestones"."color" IS
  'Neon color for test tube visualization (hex format, e.g., #00FF00)';

-- Default neon colors available:
-- #00FF00 - Neon Green (default)
-- #FF00FF - Neon Pink
-- #00FFFF - Neon Cyan
-- #FFFF00 - Neon Yellow
-- #FF6600 - Neon Orange
-- #0066FF - Neon Blue
