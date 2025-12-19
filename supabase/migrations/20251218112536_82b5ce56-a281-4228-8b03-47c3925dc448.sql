-- Add new columns to moves table for full lifecycle tracking
ALTER TABLE public.moves 
ADD COLUMN IF NOT EXISTS scheduled_time time,
ADD COLUMN IF NOT EXISTS assigned_mover_id uuid REFERENCES public.movers(id),
ADD COLUMN IF NOT EXISTS estimated_duration integer, -- in seconds
ADD COLUMN IF NOT EXISTS actual_start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS actual_end_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS route_data jsonb,
ADD COLUMN IF NOT EXISTS current_lat numeric,
ADD COLUMN IF NOT EXISTS current_lng numeric,
ADD COLUMN IF NOT EXISTS estimated_arrival_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS performance_data jsonb;

-- Create move tracking events table for timeline
CREATE TABLE IF NOT EXISTS public.move_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id uuid REFERENCES public.moves(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- 'created', 'approved', 'scheduled', 'started', 'pickup_arrived', 'loading', 'in_transit', 'delivery_arrived', 'unloading', 'completed'
  event_time timestamp with time zone NOT NULL DEFAULT now(),
  location_lat numeric,
  location_lng numeric,
  notes text,
  created_by uuid,
  metadata jsonb
);

-- Enable RLS on tracking events
ALTER TABLE public.move_tracking_events ENABLE ROW LEVEL SECURITY;

-- Users can view tracking events for their own moves
CREATE POLICY "Users can view tracking events for own moves"
ON public.move_tracking_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM moves WHERE moves.id = move_tracking_events.move_id AND moves.user_id = auth.uid()
  )
);

-- Admins can manage all tracking events
CREATE POLICY "Admins can manage tracking events"
ON public.move_tracking_events FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create move performance analytics table
CREATE TABLE IF NOT EXISTS public.move_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id uuid REFERENCES public.moves(id) ON DELETE CASCADE NOT NULL UNIQUE,
  estimated_duration integer, -- seconds
  actual_duration integer, -- seconds
  distance_km numeric,
  average_speed_kmh numeric,
  delays_count integer DEFAULT 0,
  delay_reasons jsonb,
  on_time boolean,
  rating integer,
  feedback text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on performance table
ALTER TABLE public.move_performance ENABLE ROW LEVEL SECURITY;

-- Users can view performance for their own moves
CREATE POLICY "Users can view performance for own moves"
ON public.move_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM moves WHERE moves.id = move_performance.move_id AND moves.user_id = auth.uid()
  )
);

-- Admins can manage all performance data
CREATE POLICY "Admins can manage performance data"
ON public.move_performance FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for move tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.move_tracking_events;

-- Update moves table status constraint to reflect full lifecycle
-- Status values: 'pending', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled'