-- =====================================================
-- FIX: Row Level Security Policies for Songs
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =====================================================

-- 1. Enable RLS on songs table (it should already be enabled, but good to ensure)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing insecure/incorrect policies
-- We drop these to start fresh and ensure no "anyone can edit" loopholes
DROP POLICY IF EXISTS "Users can update own songs" ON songs;
DROP POLICY IF EXISTS "Users can update their own songs" ON songs;
DROP POLICY IF EXISTS "Enable read access for all users" ON songs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON songs;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON songs;

-- 3. Create Correct Policies

-- READ: Everyone can see songs (it's a social player!)
CREATE POLICY "Enable read access for all users" 
ON songs FOR SELECT 
USING (true);

-- INSERT: Only logged in users can upload songs
CREATE POLICY "Enable insert for authenticated users only" 
ON songs FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Users can ONLY update their OWN songs
-- This fixes the issue where others could change your song art
CREATE POLICY "Users can update their own songs" 
ON songs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can ONLY delete their OWN songs
CREATE POLICY "Users can delete their own songs" 
ON songs FOR DELETE 
USING (auth.uid() = user_id);
