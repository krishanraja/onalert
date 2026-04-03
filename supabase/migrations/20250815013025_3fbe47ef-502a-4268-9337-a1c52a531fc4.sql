-- Create sheets_integrations table for Google Sheets integration
CREATE TABLE public.sheets_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  google_sheet_id TEXT,
  sheet_name TEXT,
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  integration_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'auto_sync'
  sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending', -- 'pending' | 'syncing' | 'success' | 'error'
  sync_error TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sheets_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for sheets_integrations
CREATE POLICY "Users can view their own sheets integrations" 
ON public.sheets_integrations 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own sheets integrations" 
ON public.sheets_integrations 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own sheets integrations" 
ON public.sheets_integrations 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own sheets integrations" 
ON public.sheets_integrations 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_sheets_integrations_updated_at
BEFORE UPDATE ON public.sheets_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();