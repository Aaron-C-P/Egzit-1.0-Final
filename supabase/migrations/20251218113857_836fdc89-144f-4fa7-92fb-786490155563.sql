-- Chat messages table for move-specific and general support conversations
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id uuid REFERENCES public.moves(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  is_admin boolean DEFAULT false,
  message text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for their own moves
CREATE POLICY "Users can view messages for own moves"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM moves WHERE moves.id = chat_messages.move_id AND moves.user_id = auth.uid()
  )
  OR sender_id = auth.uid()
);

-- Users can send messages for their own moves
CREATE POLICY "Users can send messages for own moves"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND (
    move_id IS NULL OR
    EXISTS (SELECT 1 FROM moves WHERE moves.id = chat_messages.move_id AND moves.user_id = auth.uid())
  )
);

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
ON public.chat_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Quotes table for move pricing
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id uuid REFERENCES public.moves(id) ON DELETE CASCADE NOT NULL,
  base_price numeric NOT NULL,
  distance_fee numeric DEFAULT 0,
  weight_fee numeric DEFAULT 0,
  special_items_fee numeric DEFAULT 0,
  insurance_fee numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total_price numeric NOT NULL,
  notes text,
  valid_until timestamp with time zone,
  status text DEFAULT 'pending', -- pending, accepted, rejected, expired
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Users can view quotes for their own moves
CREATE POLICY "Users can view quotes for own moves"
ON public.quotes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM moves WHERE moves.id = quotes.move_id AND moves.user_id = auth.uid()
  )
);

-- Users can update quote status (accept/reject)
CREATE POLICY "Users can update quote status"
ON public.quotes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM moves WHERE moves.id = quotes.move_id AND moves.user_id = auth.uid()
  )
);

-- Admins can manage all quotes
CREATE POLICY "Admins can manage quotes"
ON public.quotes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add quote_id to moves table
ALTER TABLE public.moves ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id);

-- Add cancellation columns to moves if not exists
ALTER TABLE public.moves ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.moves ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;