-- Add track_number column to songs table
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS track_number INTEGER DEFAULT 1;

-- Update existing records to have track_number 1 (optional, handled by default)
-- UPDATE songs SET track_number = 1 WHERE track_number IS NULL;
