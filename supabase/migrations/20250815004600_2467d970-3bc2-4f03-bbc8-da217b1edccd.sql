-- Fix the search path security issue
CREATE OR REPLACE FUNCTION public.update_session_on_message()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;