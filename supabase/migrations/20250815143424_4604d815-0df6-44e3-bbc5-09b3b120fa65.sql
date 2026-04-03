-- Clean up duplicate integration records, keeping only the most recent one per user
DELETE FROM public.sheets_integrations 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.sheets_integrations 
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.sheets_integrations 
ADD CONSTRAINT unique_user_integration UNIQUE (user_id);