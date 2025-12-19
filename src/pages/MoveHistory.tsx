import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, MapPin, Calendar, Truck, Package, 
  Star, Download, ChevronRight, Loader2, Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Move {
  id: string;
  name: string;
  status: string;
  pickup_address: string | null;
  delivery_address: string | null;
  move_date: string | null;
  created_at: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  movers: { name: string } | null;
}

interface Quote {
  id: string;
  move_id: string;
  total_price: number;
  base_price: number;
  distance_fee: number | null;
  weight_fee: number | null;
  insurance_fee: number | null;
  tax: number | null;
}

interface Booking {
  id: string;
  move_id: string;
  final_price: number | null;
  payment_status: string | null;
  created_at: string;
}

export default function MoveHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('completed');

  // Fetch completed moves
  const { data: completedMoves = [], isLoading: loadingCompleted } = useQuery({
    queryKey: ['completed-moves', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moves')
        .select(`
          *,
          movers:assigned_mover_id(name)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('actual_end_time', { ascending: false });
      if (error) throw error;
      return data as Move[];
    },
    enabled: !!user?.id,
  });

  // Fetch cancelled moves
  const { data: cancelledMoves = [], isLoading: loadingCancelled } = useQuery({
    queryKey: ['cancelled-moves', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moves')
        .select(`
          *,
          movers:assigned_mover_id(name)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'cancelled')
        .order('cancelled_at', { ascending: false });
      if (error) throw error;
      return data as Move[];
    },
    enabled: !!user?.id,
  });

  // Fetch quotes for all moves
  const allMoveIds = [...completedMoves, ...cancelledMoves].map(m => m.id);
  const { data: quotes = [] } = useQuery({
    queryKey: ['move-quotes', allMoveIds],
    queryFn: async () => {
      if (allMoveIds.length === 0) return [];
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .in('move_id', allMoveIds);
      if (error) throw error;
      return data as Quote[];
    },
    enabled: allMoveIds.length > 0,
  });

  // Fetch bookings for all moves
  const { data: bookings = [] } = useQuery({
    queryKey: ['move-bookings', allMoveIds],
    queryFn: async () => {
      if (allMoveIds.length === 0) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('move_id', allMoveIds);
      if (error) throw error;
      return data as Booking[];
    },
    enabled: allMoveIds.length > 0,
  });

  const getQuoteForMove = (moveId: string) => quotes.find(q => q.move_id === moveId);
  const getBookingForMove = (moveId: string) => bookings.find(b => b.move_id === moveId);

  const isLoading = loadingCompleted || loadingCancelled;

  const MoveCard = ({ move, type }: { move: Move; type: 'completed' | 'cancelled' }) => {
    const quote = getQuoteForMove(move.id);
    const booking = getBookingForMove(move.id);
    const finalPrice = booking?.final_price || quote?.total_price;

    return (
      <Card className="shadow-soft hover:shadow-card transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{move.name}</h3>
              <p className="text-sm text-muted-foreground">
                {move.move_date 
                  ? format(new Date(move.move_date), 'PPP')
                  : 'Date not set'}
              </p>
            </div>
            <StatusBadge 
              status={type === 'completed' ? 'success' : 'error'} 
              label={type === 'completed' ? 'Completed' : 'Cancelled'} 
            />
          </div>

          <div className="space-y-2 text-sm">
            {move.pickup_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{move.pickup_address}</span>
              </div>
            )}
            {move.delivery_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate">{move.delivery_address}</span>
              </div>
            )}
            {move.movers?.name && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>{move.movers.name}</span>
              </div>
            )}
          </div>

          {finalPrice && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Paid</span>
              <span className="font-bold text-primary">
                J${finalPrice.toLocaleString()}
              </span>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/track/${move.id}`)}
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {type === 'completed' && finalPrice && (
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ type }: { type: 'completed' | 'cancelled' }) => (
    <div className="text-center py-12">
      <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
      <h3 className="font-semibold mb-1">
        No {type} moves yet
      </h3>
      <p className="text-sm text-muted-foreground">
        {type === 'completed' 
          ? 'Your completed moves will appear here with full details and receipts.'
          : 'Any cancelled moves will be shown here for your records.'}
      </p>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="gradient-hero text-primary-foreground px-4 pt-12 pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <History className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Move History</h1>
            </div>
            <p className="text-primary-foreground/80">
              View your completed and cancelled moves
            </p>
          </div>
        </div>

        <div className="px-4 -mt-4 max-w-3xl mx-auto pb-6">
          <Card className="shadow-card">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Completed ({completedMoves.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Cancelled ({cancelledMoves.length})
                </TabsTrigger>
              </TabsList>

              <div className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <TabsContent value="completed" className="mt-0 space-y-3">
                      {completedMoves.length === 0 ? (
                        <EmptyState type="completed" />
                      ) : (
                        completedMoves.map(move => (
                          <MoveCard key={move.id} move={move} type="completed" />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="cancelled" className="mt-0 space-y-3">
                      {cancelledMoves.length === 0 ? (
                        <EmptyState type="cancelled" />
                      ) : (
                        cancelledMoves.map(move => (
                          <MoveCard key={move.id} move={move} type="cancelled" />
                        ))
                      )}
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </Card>

          {/* Stats Summary */}
          {(completedMoves.length > 0 || cancelledMoves.length > 0) && (
            <Card className="mt-4 shadow-soft">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-accent/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-accent">{completedMoves.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-2xl font-bold">{cancelledMoves.length}</p>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
