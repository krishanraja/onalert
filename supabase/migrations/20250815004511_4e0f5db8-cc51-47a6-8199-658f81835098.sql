-- Create conversation sessions table for chat management
CREATE TABLE public.conversation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation sessions
CREATE POLICY "Users can view their own sessions" 
ON public.conversation_sessions 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.conversation_sessions 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.conversation_sessions 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.conversation_sessions 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Create messages table for individual chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages
CREATE POLICY "Users can view their own messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Create function to update session timestamp and message count
CREATE OR REPLACE FUNCTION public.update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversation_sessions 
  SET 
    updated_at = now(),
    message_count = (
      SELECT COUNT(*) 
      FROM public.chat_messages 
      WHERE session_id = NEW.session_id
    )
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic session updates
CREATE TRIGGER update_session_on_message_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_session_on_message();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversation_sessions_updated_at
BEFORE UPDATE ON public.conversation_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();