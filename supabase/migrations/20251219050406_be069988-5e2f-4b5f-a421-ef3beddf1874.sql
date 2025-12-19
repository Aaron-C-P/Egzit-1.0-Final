-- Enable replica identity full for better realtime updates on moves
ALTER TABLE public.moves REPLICA IDENTITY FULL;

-- Add moves to realtime publication (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'moves'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.moves;
  END IF;
END $$;