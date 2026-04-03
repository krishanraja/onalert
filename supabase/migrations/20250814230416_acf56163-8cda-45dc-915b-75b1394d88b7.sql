-- Add missing RLS policies for ai_conversations table
CREATE POLICY "Users can update their own conversations" 
ON public.ai_conversations 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.ai_conversations 
FOR DELETE 
USING (auth.uid()::text = user_id);