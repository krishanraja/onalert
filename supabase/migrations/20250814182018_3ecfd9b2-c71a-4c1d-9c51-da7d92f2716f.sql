-- Fix critical security vulnerability: Replace hardcoded 'default_user' with proper authentication

-- Update all RLS policies to use auth.uid() instead of hardcoded 'default_user'

-- AI_CONVERSATIONS table policies
DROP POLICY IF EXISTS "Users can create their own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON ai_conversations;

CREATE POLICY "Users can create their own conversations" 
ON ai_conversations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own conversations" 
ON ai_conversations 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = user_id);

-- DAILY_PROGRESS table policies
DROP POLICY IF EXISTS "Users can create their own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can view their own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can update their own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can delete their own daily progress" ON daily_progress;

CREATE POLICY "Users can create their own daily progress" 
ON daily_progress 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own daily progress" 
ON daily_progress 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own daily progress" 
ON daily_progress 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own daily progress" 
ON daily_progress 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = user_id);

-- MONTHLY_GOALS table policies
DROP POLICY IF EXISTS "Users can create their own monthly goals" ON monthly_goals;
DROP POLICY IF EXISTS "Users can view their own monthly goals" ON monthly_goals;
DROP POLICY IF EXISTS "Users can update their own monthly goals" ON monthly_goals;
DROP POLICY IF EXISTS "Users can delete their own monthly goals" ON monthly_goals;

CREATE POLICY "Users can create their own monthly goals" 
ON monthly_goals 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own monthly goals" 
ON monthly_goals 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own monthly goals" 
ON monthly_goals 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own monthly goals" 
ON monthly_goals 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = user_id);

-- MONTHLY_SNAPSHOTS table policies
DROP POLICY IF EXISTS "Users can create their own monthly snapshots" ON monthly_snapshots;
DROP POLICY IF EXISTS "Users can view their own monthly snapshots" ON monthly_snapshots;
DROP POLICY IF EXISTS "Users can update their own monthly snapshots" ON monthly_snapshots;
DROP POLICY IF EXISTS "Users can delete their own monthly snapshots" ON monthly_snapshots;

CREATE POLICY "Users can create their own monthly snapshots" 
ON monthly_snapshots 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own monthly snapshots" 
ON monthly_snapshots 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own monthly snapshots" 
ON monthly_snapshots 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own monthly snapshots" 
ON monthly_snapshots 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = user_id);

-- OPPORTUNITIES table policies
DROP POLICY IF EXISTS "Users can create their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can view their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can update their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can delete their own opportunities" ON opportunities;

CREATE POLICY "Users can create their own opportunities" 
ON opportunities 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own opportunities" 
ON opportunities 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own opportunities" 
ON opportunities 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own opportunities" 
ON opportunities 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = user_id);

-- REVENUE_ENTRIES table policies
DROP POLICY IF EXISTS "Users can create their own revenue entries" ON revenue_entries;
DROP POLICY IF EXISTS "Users can view their own revenue entries" ON revenue_entries;
DROP POLICY IF EXISTS "Users can update their own revenue entries" ON revenue_entries;
DROP POLICY IF EXISTS "Users can delete their own revenue entries" ON revenue_entries;

CREATE POLICY "Users can create their own revenue entries" 
ON revenue_entries 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own revenue entries" 
ON revenue_entries 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own revenue entries" 
ON revenue_entries 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own revenue entries" 
ON revenue_entries 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = user_id);

-- SPREADSHEET_SYNC table policies
DROP POLICY IF EXISTS "Users can create their own spreadsheet sync" ON spreadsheet_sync;
DROP POLICY IF EXISTS "Users can view their own spreadsheet sync" ON spreadsheet_sync;
DROP POLICY IF EXISTS "Users can update their own spreadsheet sync" ON spreadsheet_sync;
DROP POLICY IF EXISTS "Users can delete their own spreadsheet sync" ON spreadsheet_sync;

CREATE POLICY "Users can create their own spreadsheet sync" 
ON spreadsheet_sync 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own spreadsheet sync" 
ON spreadsheet_sync 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own spreadsheet sync" 
ON spreadsheet_sync 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own spreadsheet sync" 
ON spreadsheet_sync 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = user_id);

-- USER_BUSINESS_CONTEXT table policies
DROP POLICY IF EXISTS "Users can create their own business context" ON user_business_context;
DROP POLICY IF EXISTS "Users can view their own business context" ON user_business_context;
DROP POLICY IF EXISTS "Users can update their own business context" ON user_business_context;

CREATE POLICY "Users can create their own business context" 
ON user_business_context 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own business context" 
ON user_business_context 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own business context" 
ON user_business_context 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = user_id);

-- Update user_id column defaults to remove 'default_user' where applicable
-- Note: We cannot change defaults for NOT NULL columns with existing data safely
-- These will be handled in the application code instead