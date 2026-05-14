-- Add new admin role values
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'cms_editor';
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'operations';