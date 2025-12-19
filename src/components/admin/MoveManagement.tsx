import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  Loader2, CheckCircle2, Clock, MapPin, Calendar, 
  Truck, Play, Square, Route, Eye, Calculator 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import QuoteGenerator from './QuoteGenerator';

interface Move {
  id: string;
  name: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  move_date: string;
  scheduled_time: string;
  assigned_mover_id: string;
  estimated_duration: number;
  actual_start_time: string | null;
  user_id: string;
  created_at: string;
  quote_id: string | null;
  profiles?: { name: string; email: string };
  movers?: { name: string };
}

export default function MoveManagement() {
  const queryClient = useQueryClient();
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [quoteDialog, setQuoteDialog] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    time: '',
    mover_id: '',
  });

  // Fetch all moves with user info
  const { data: moves = [], isLoading } = useQuery({
    queryKey: ['admin-all-moves'],
    queryFn: async () => {
      const { data: movesData, error } = await supabase
        .from('moves')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(movesData?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      // Fetch movers
      const moverIds = [...new Set(movesData?.filter(m => m.assigned_mover_id).map(m => m.assigned_mover_id) || [])];
      const { data: moversList } = moverIds.length > 0 
        ? await supabase.from('movers').select('id, name').in('id', moverIds)
        : { data: [] };

      // Merge data
      return (movesData || []).map(move => ({
        ...move,
        profiles: profiles?.find(p => p.id === move.user_id),
        movers: moversList?.find(m => m.id === move.assigned_mover_id),
      })) as Move[];
    },
  });

  // Fetch available movers
  const { data: movers = [] } = useQuery({
    queryKey: ['available-movers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movers')
        .select('id, name')
        .eq('available', true);
      if (error) throw error;
      return data;
    },
  });

  // Approve move mutation
  const approveMutation = useMutation({
    mutationFn: async (moveId: string) => {
      const { error } = await supabase
        .from('moves')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', moveId);
      if (error) throw error;

      // Add tracking event
      await supabase.from('move_tracking_events').insert({
        move_id: moveId,
        event_type: 'approved',
        notes: 'Move request approved by admin',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-moves'] });
      toast.success('Move approved successfully');
    },
    onError: () => toast.error('Failed to approve move'),
  });

  // Schedule move mutation
  const scheduleMutation = useMutation({
    mutationFn: async ({ moveId, time, moverId }: { moveId: string; time: string; moverId: string }) => {
      // First, get route info
      const move = moves.find(m => m.id === moveId);
      if (!move) throw new Error('Move not found');

      // Calculate route (simplified - in production you'd geocode addresses)
      let routeData = null;
      let estimatedDuration = 3600; // Default 1 hour

      try {
        const { data } = await supabase.functions.invoke('route-optimizer', {
          body: {
            pickup: [18.0179, -76.8099], // Default Jamaica coords
            delivery: [18.1096, -77.2975],
          },
        });
        if (data?.primary) {
          routeData = data.primary;
          // Ensure duration is an integer
          estimatedDuration = Math.round(data.primary.duration || 3600);
        }
      } catch (e) {
        console.log('Route calculation skipped');
      }

      // Calculate ETA
      const moveDate = new Date(move.move_date);
      const [hours, minutes] = time.split(':').map(Number);
      moveDate.setHours(hours, minutes, 0, 0);
      const eta = new Date(moveDate.getTime() + estimatedDuration * 1000);

      const { error } = await supabase
        .from('moves')
        .update({
          status: 'scheduled',
          scheduled_time: time,
          assigned_mover_id: moverId,
          estimated_duration: Math.round(estimatedDuration), // Ensure integer
          route_data: routeData,
          estimated_arrival_time: eta.toISOString(),
        })
        .eq('id', moveId);
      if (error) throw error;

      // Add tracking event
      await supabase.from('move_tracking_events').insert({
        move_id: moveId,
        event_type: 'scheduled',
        notes: `Move scheduled for ${time}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-moves'] });
      toast.success('Move scheduled successfully');
      setScheduleDialog(false);
      setSelectedMove(null);
    },
    onError: () => toast.error('Failed to schedule move'),
  });

  // Start move mutation
  const startMoveMutation = useMutation({
    mutationFn: async (moveId: string) => {
      const { error } = await supabase
        .from('moves')
        .update({
          status: 'in_progress',
          actual_start_time: new Date().toISOString(),
        })
        .eq('id', moveId);
      if (error) throw error;

      await supabase.from('move_tracking_events').insert({
        move_id: moveId,
        event_type: 'started',
        notes: 'Move has started',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-moves'] });
      toast.success('Move started');
    },
    onError: () => toast.error('Failed to start move'),
  });

  // Complete move mutation
  const completeMutation = useMutation({
    mutationFn: async (moveId: string) => {
      const move = moves.find(m => m.id === moveId);
      const actualEnd = new Date();
      const actualStart = move?.actual_start_time ? new Date(move.actual_start_time) : actualEnd;
      const actualDuration = Math.floor((actualEnd.getTime() - actualStart.getTime()) / 1000);

      const { error } = await supabase
        .from('moves')
        .update({
          status: 'completed',
          actual_end_time: actualEnd.toISOString(),
        })
        .eq('id', moveId);
      if (error) throw error;

      // Store performance data
      await supabase.from('move_performance').insert({
        move_id: moveId,
        estimated_duration: move?.estimated_duration || 0,
        actual_duration: actualDuration,
        on_time: actualDuration <= (move?.estimated_duration || actualDuration),
      });

      await supabase.from('move_tracking_events').insert({
        move_id: moveId,
        event_type: 'completed',
        notes: 'Move completed successfully',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-moves'] });
      toast.success('Move marked as complete');
    },
    onError: () => toast.error('Failed to complete move'),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'planning':
        return <StatusBadge status="pending" label="Pending Review" />;
      case 'approved':
        return <StatusBadge status="pending" label="Approved" />;
      case 'scheduled':
        return <StatusBadge status="loading" label="Scheduled" />;
      case 'in_progress':
        return <StatusBadge status="loading" label="In Progress" />;
      case 'completed':
        return <StatusBadge status="success" label="Completed" />;
      case 'cancelled':
        return <StatusBadge status="error" label="Cancelled" />;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openScheduleDialog = (move: Move) => {
    setSelectedMove(move);
    setScheduleData({ time: '', mover_id: '' });
    setScheduleDialog(true);
  };

  const pendingMoves = moves.filter(m => m.status === 'pending' || m.status === 'planning');
  const approvedMoves = moves.filter(m => m.status === 'approved');
  const scheduledMoves = moves.filter(m => m.status === 'scheduled');
  const inProgressMoves = moves.filter(m => m.status === 'in_progress');

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pending Approval ({pendingMoves.length})
          </CardTitle>
          <CardDescription>Move requests awaiting admin review</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingMoves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending moves</p>
          ) : (
            <div className="space-y-3">
              {pendingMoves.map(move => (
                <div key={move.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{move.name}</span>
                      {getStatusBadge(move.status)}
                      {move.quote_id && (
                        <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                          Quote Ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {move.profiles?.name || 'Unknown'} • {move.move_date ? format(new Date(move.move_date), 'PPP') : 'No date'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {move.pickup_address || 'No address'} → {move.delivery_address || 'No address'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMove(move);
                        setQuoteDialog(true);
                      }}
                    >
                      <Calculator className="h-4 w-4 mr-1" />
                      {move.quote_id ? 'Update' : 'Quote'}
                    </Button>
                    <Button
                      onClick={() => approveMutation.mutate(move.id)}
                      disabled={approveMutation.isPending || !move.quote_id}
                      title={!move.quote_id ? 'Create a quote first' : 'Approve move'}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved - Ready to Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            Ready to Schedule ({approvedMoves.length})
          </CardTitle>
          <CardDescription>Approved moves awaiting scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          {approvedMoves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No approved moves</p>
          ) : (
            <div className="space-y-3">
              {approvedMoves.map(move => (
                <div key={move.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{move.name}</span>
                      {getStatusBadge(move.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {move.profiles?.name || 'Unknown'} • {move.move_date ? format(new Date(move.move_date), 'PPP') : 'No date'}
                    </p>
                  </div>
                  <Button onClick={() => openScheduleDialog(move)}>
                    <Route className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled - Ready to Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Scheduled ({scheduledMoves.length})
          </CardTitle>
          <CardDescription>Moves scheduled and ready to begin</CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledMoves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No scheduled moves</p>
          ) : (
            <div className="space-y-3">
              {scheduledMoves.map(move => (
                <div key={move.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{move.name}</span>
                      {getStatusBadge(move.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {move.movers?.name || 'No mover'} • {move.scheduled_time || 'No time'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ETA: {move.estimated_duration ? `~${Math.round(move.estimated_duration / 60)} min` : 'Calculating...'}
                    </p>
                  </div>
                  <Button onClick={() => startMoveMutation.mutate(move.id)} disabled={startMoveMutation.isPending}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Move
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            In Progress ({inProgressMoves.length})
          </CardTitle>
          <CardDescription>Active moves currently being tracked</CardDescription>
        </CardHeader>
        <CardContent>
          {inProgressMoves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No moves in progress</p>
          ) : (
            <div className="space-y-3">
              {inProgressMoves.map(move => (
                <div key={move.id} className="flex items-center justify-between p-4 border rounded-lg bg-accent/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{move.name}</span>
                      {getStatusBadge(move.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Started: {move.actual_start_time ? format(new Date(move.actual_start_time), 'p') : 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Track
                    </Button>
                    <Button 
                      onClick={() => completeMutation.mutate(move.id)} 
                      disabled={completeMutation.isPending}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Move</DialogTitle>
            <DialogDescription>
              Assign a time and mover for "{selectedMove?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Scheduled Time</Label>
              <Input
                type="time"
                value={scheduleData.time}
                onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign Mover</Label>
              <Select
                value={scheduleData.mover_id}
                onValueChange={(value) => setScheduleData(prev => ({ ...prev, mover_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mover" />
                </SelectTrigger>
                <SelectContent>
                  {movers.map(mover => (
                    <SelectItem key={mover.id} value={mover.id}>
                      {mover.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedMove && scheduleData.time && scheduleData.mover_id) {
                  scheduleMutation.mutate({
                    moveId: selectedMove.id,
                    time: scheduleData.time,
                    moverId: scheduleData.mover_id,
                  });
                }
              }}
              disabled={!scheduleData.time || !scheduleData.mover_id || scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Schedule Move'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Generator Dialog */}
      {selectedMove && (
        <QuoteGenerator
          moveId={selectedMove.id}
          moveName={selectedMove.name}
          open={quoteDialog}
          onOpenChange={setQuoteDialog}
        />
      )}
    </div>
  );
}