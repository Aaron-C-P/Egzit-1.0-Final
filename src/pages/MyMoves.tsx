import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Truck, Calendar, MapPin, XCircle, 
  Loader2, Plus, AlertTriangle, CheckCircle2, Eye
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MyMoves() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingMoveId, setCancellingMoveId] = useState<string | null>(null);

  // Fetch user's moves (excluding cancelled)
  const { data: moves = [], isLoading } = useQuery({
    queryKey: ['my-moves', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('moves')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled') // Hide cancelled moves
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Cancel move mutation
  const cancelMoveMutation = useMutation({
    mutationFn: async (moveId: string) => {
      const { error } = await supabase
        .from('moves')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', moveId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-moves'] });
      queryClient.invalidateQueries({ queryKey: ['active-move'] });
      toast({
        title: 'Move Cancelled',
        description: 'Your move has been cancelled successfully.',
      });
      setCancellingMoveId(null);
    },
    onError: (error) => {
      console.error('Cancel error:', error);
      toast({
        title: 'Error',
        description: 'Could not cancel move. Please try again.',
        variant: 'destructive',
      });
      setCancellingMoveId(null);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'planning':
        return <StatusBadge status="pending" label="Pending Approval" />;
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

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-card border-b px-4 pt-4 pb-3 sticky top-0 z-10">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">My Moves</h1>
            </div>
            <Button size="sm" onClick={() => navigate('/request-move')}>
              <Plus className="h-4 w-4 mr-1" />
              New Move
            </Button>
          </div>
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : moves.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center">
                <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">No Moves Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by requesting a move or finding a mover
                </p>
                <Button onClick={() => navigate('/request-move')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Move
                </Button>
              </CardContent>
            </Card>
          ) : (
            moves.map((move, index) => (
              <Card 
                key={move.id}
                className="shadow-soft animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{move.name}</CardTitle>
                      {getStatusBadge(move.status || 'planning')}
                    </div>
                    {move.status !== 'cancelled' && move.status !== 'completed' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-warning" />
                              Cancel Move
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel "{move.name}"? This action cannot be undone. 
                              If you've made a payment, please contact support for refund options.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Move</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setCancellingMoveId(move.id);
                                cancelMoveMutation.mutate(move.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {cancellingMoveId === move.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                'Yes, Cancel Move'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {move.move_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(move.move_date), 'PPP')}</span>
                    </div>
                  )}
                  
                  {move.pickup_address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">From: </span>
                        {move.pickup_address}
                      </div>
                    </div>
                  )}
                  
                  {move.delivery_address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-accent mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">To: </span>
                        {move.delivery_address}
                      </div>
                    </div>
                  )}

                  {move.status === 'cancelled' && move.cancelled_at && (
                    <div className="bg-destructive/10 text-destructive text-xs p-2 rounded-lg flex items-center gap-2">
                      <XCircle className="h-3 w-3" />
                      Cancelled on {format(new Date(move.cancelled_at), 'PPP')}
                    </div>
                  )}

                      {move.status === 'completed' && (
                        <div className="bg-accent/10 text-accent text-xs p-2 rounded-lg flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3" />
                          Move completed successfully
                        </div>
                      )}

                      {/* Track button for active moves */}
                      {(move.status === 'scheduled' || move.status === 'in_progress' || move.status === 'approved' || move.status === 'pending' || move.status === 'planning') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => navigate(`/track/${move.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Status
                        </Button>
                      )}
                    </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
