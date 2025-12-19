import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrackingEvent {
  id: string;
  move_id: string;
  event_type: string;
  event_time: string;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

interface MoveWithTracking {
  id: string;
  name: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  move_date: string;
  scheduled_time: string;
  assigned_mover_id: string;
  estimated_duration: number;
  actual_start_time: string;
  actual_end_time: string;
  route_data: Record<string, unknown>;
  current_lat: number;
  current_lng: number;
  estimated_arrival_time: string;
  movers: { name: string; phone: string } | null;
}

export function useMoveTracking(moveId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  const [liveEta, setLiveEta] = useState<Date | null>(null);
  const [progress, setProgress] = useState(0);

  // Fetch move details
  const { data: move, isLoading: moveLoading, refetch: refetchMove } = useQuery({
    queryKey: ['move-tracking', moveId],
    queryFn: async () => {
      console.log('Fetching move:', moveId, 'for user:', userId);
      const { data, error } = await supabase
        .from('moves')
        .select(`
          *,
          movers:assigned_mover_id(name, phone)
        `)
        .eq('id', moveId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.error('Move fetch error:', error);
        throw error;
      }
      console.log('Move data:', data);
      return data as MoveWithTracking | null;
    },
    enabled: !!moveId && !!userId,
    refetchInterval: 5000, // Refetch every 5 seconds for more responsive live updates
  });

  // Fetch tracking events
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['move-events', moveId],
    queryFn: async () => {
      console.log('Fetching events for move:', moveId);
      const { data, error } = await supabase
        .from('move_tracking_events')
        .select('*')
        .eq('move_id', moveId)
        .order('event_time', { ascending: true });
      if (error) {
        console.error('Events fetch error:', error);
        throw error;
      }
      console.log('Events count:', data?.length);
      return data as TrackingEvent[];
    },
    enabled: !!moveId,
    refetchInterval: 5000, // Refetch events frequently for live tracking
  });

  // Subscribe to real-time tracking events
  useEffect(() => {
    if (!moveId) return;

    console.log('Setting up realtime subscription for move:', moveId);

    const channel = supabase
      .channel(`move-tracking-${moveId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'move_tracking_events',
          filter: `move_id=eq.${moveId}`,
        },
        (payload) => {
          console.log('New tracking event received:', payload);
          queryClient.invalidateQueries({ queryKey: ['move-events', moveId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'moves',
          filter: `id=eq.${moveId}`,
        },
        (payload) => {
          console.log('Move updated via realtime:', payload);
          queryClient.invalidateQueries({ queryKey: ['move-tracking', moveId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moves',
        },
        (payload) => {
          // Also listen to any move changes as backup
          if ((payload.new as any)?.id === moveId) {
            console.log('Move update detected (backup listener):', payload);
            queryClient.invalidateQueries({ queryKey: ['move-tracking', moveId] });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [moveId, queryClient]);

  // Calculate progress and ETA based on events
  useEffect(() => {
    if (!move || !events.length) return;

    const eventProgress: Record<string, number> = {
      created: 5,
      approved: 15,
      scheduled: 25,
      started: 35,
      pickup_arrived: 45,
      loading: 55,
      in_transit: 70,
      delivery_arrived: 85,
      unloading: 95,
      completed: 100,
    };

    const lastEvent = events[events.length - 1];
    const calculatedProgress = eventProgress[lastEvent?.event_type] || 0;
    setProgress(calculatedProgress);

    // Calculate dynamic ETA based on progress
    if (move.estimated_arrival_time && move.status === 'in_progress') {
      const baseEta = new Date(move.estimated_arrival_time);
      const now = new Date();
      
      // Simulate speed variations (in production, this would come from real GPS data)
      const remainingTime = baseEta.getTime() - now.getTime();
      const adjustedEta = new Date(now.getTime() + remainingTime);
      setLiveEta(adjustedEta);
    } else if (move.estimated_arrival_time) {
      setLiveEta(new Date(move.estimated_arrival_time));
    }
  }, [move, events]);

  // Map event types to display info
  const getEventDisplay = (event: TrackingEvent) => {
    const displays: Record<string, { title: string; description: string }> = {
      created: { title: 'Move Requested', description: 'Move request submitted' },
      approved: { title: 'Approved', description: 'Move request approved by admin' },
      scheduled: { title: 'Scheduled', description: 'Move scheduled with assigned mover' },
      started: { title: 'Move Started', description: 'Moving team has begun' },
      pickup_arrived: { title: 'Arrived at Pickup', description: 'Team arrived at pickup location' },
      loading: { title: 'Loading Items', description: 'Items being loaded onto truck' },
      in_transit: { title: 'In Transit', description: 'On the way to destination' },
      delivery_arrived: { title: 'Arrived at Destination', description: 'Team arrived at delivery location' },
      unloading: { title: 'Unloading Items', description: 'Items being unloaded' },
      completed: { title: 'Move Complete', description: 'All items delivered successfully' },
    };
    return displays[event.event_type] || { title: event.event_type, description: event.notes || '' };
  };

  return {
    move,
    events,
    progress,
    liveEta,
    isLoading: moveLoading || eventsLoading,
    getEventDisplay,
  };
}