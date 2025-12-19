-- Create boxes table to group items together
CREATE TABLE public.boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  qr_code TEXT,
  inventory_id UUID REFERENCES public.inventories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  box_size TEXT, -- small, medium, large, extra-large
  dimensions TEXT, -- e.g., "18x18x16 inches"
  max_weight NUMERIC DEFAULT 50,
  current_weight NUMERIC DEFAULT 0,
  is_fragile BOOLEAN DEFAULT false,
  room TEXT,
  notes TEXT
);

-- Add box_id to items table to link items to boxes
ALTER TABLE public.items ADD COLUMN box_id UUID REFERENCES public.boxes(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for boxes
CREATE POLICY "Users can view own boxes"
ON public.boxes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create boxes"
ON public.boxes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boxes"
ON public.boxes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boxes"
ON public.boxes
FOR DELETE
USING (auth.uid() = user_id);