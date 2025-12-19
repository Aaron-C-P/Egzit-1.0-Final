import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  ArrowLeft, MapPin, Truck, Package, Clock, 
  CheckCircle2, Circle, Phone, MessageSquare, Navigation,
  AlertTriangle, Loader2, CreditCard
} from 'lucide-react';
import { useMoveTracking } from '@/hooks/useMoveTracking';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import UserChat from '@/components/chat/UserChat';
import { LiveTrackingMap } from '@/components/tracking/LiveTrackingMap';

export default function Track() {
  const { moveId } = useParams<{ moveId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const { move, events, progress, liveEta, isLoading, getEventDisplay } = useMoveTracking(moveId, user?.id);

  // Fetch quote for the move
  const { data: quote } = useQuery({
    queryKey: ['move-quote', moveId],
    queryFn: async () => {
      if (!moveId) return null;
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('move_id', moveId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!moveId,
  });

  // Demo payment - skips Stripe and marks as paid directly
  const handleDemoPayment = async () => {
    if (!move || !user || !quote) return;
    
    setIsProcessingPayment(true);
    try {
      // Create a booking record marked as paid
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          move_id: move.id,
          mover_id: move.assigned_mover_id,
          status: 'confirmed',
          payment_status: 'paid',
          quoted_price: Math.round(quote.total_price),
          final_price: Math.round(quote.total_price),
        });

      if (bookingError) throw bookingError;

      // Update move status to scheduled (ready for admin to start)
      const { error: moveError } = await supabase
        .from('moves')
        .update({ status: 'scheduled' })
        .eq('id', move.id);

      if (moveError) throw moveError;

      // Add tracking event
      await supabase.from('move_tracking_events').insert({
        move_id: move.id,
        event_type: 'payment_received',
        notes: 'Payment confirmed (demo mode)',
      });

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['move-tracking', moveId] });
      queryClient.invalidateQueries({ queryKey: ['move-quote', moveId] });
      queryClient.invalidateQueries({ queryKey: ['my-moves'] });

      toast({
        title: 'Payment Successful!',
        description: 'Your move has been scheduled and is ready to begin.',
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: 'Could not process payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'planning':
        return <StatusBadge status="pending" label="Pending Approval" />;
      case 'approved':
        return <StatusBadge status="pending" label="Awaiting Schedule" />;
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!move) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-warning" />
              <h2 className="text-xl font-bold mb-2">Move Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This move doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => navigate('/my-moves')}>
                View My Moves
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isPending = move.status === 'pending' || move.status === 'planning';
  const isApproved = move.status === 'approved';
  const isScheduled = move.status === 'scheduled';
  const isInProgress = move.status === 'in_progress';
  const isCompleted = move.status === 'completed';
  const showTracking = isScheduled || isInProgress || isCompleted;

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="gradient-hero text-primary-foreground px-4 pt-12 pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Track Your Move</h1>
                <p className="text-primary-foreground/80">
                  {move.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4 max-w-3xl mx-auto space-y-4 pb-6">
          {/* Status Card */}
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isInProgress ? 'bg-primary/10 animate-pulse-soft' : 'bg-muted'
                  }`}>
                    <Truck className={`h-6 w-6 ${isInProgress ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {isPending && 'Awaiting Approval'}
                      {isApproved && 'Ready to Schedule'}
                      {isScheduled && 'Scheduled'}
                      {isInProgress && 'Move In Progress'}
                      {isCompleted && 'Move Completed'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isPending && 'Your request is being reviewed by our team'}
                      {isApproved && 'Admin is scheduling your move'}
                      {isScheduled && `Scheduled for ${move.scheduled_time || 'TBD'}`}
                      {isInProgress && 'Items are being transported'}
                      {isCompleted && 'All items delivered successfully'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(move.status)}
              </div>

              {/* Progress Bar - Only show when tracking is active */}
              {showTracking && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Route & ETA Info - Only show when scheduled or in progress */}
              {showTracking && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {liveEta 
                        ? `ETA: ${format(liveEta, 'p')}` 
                        : 'Calculating ETA...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {move.estimated_duration 
                        ? `~${Math.round(move.estimated_duration / 60)} min total`
                        : 'Estimating...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Pending State Info */}
              {isPending && (
                <div className="mt-4 pt-4 border-t">
                  <div className="bg-warning/10 text-warning-foreground p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>What happens next?</strong> An admin will review your request and approve it. 
                      Once approved, your move will be scheduled with an assigned mover and you'll see the 
                      estimated route and arrival time.
                    </p>
                  </div>
                </div>
              )}

              {/* Approved State - Payment Required */}
              {isApproved && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {quote ? (
                    <>
                      <div className="bg-accent/10 text-accent-foreground p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                          <span className="font-semibold">Your move has been approved!</span>
                        </div>
                        <p className="text-sm mb-3">
                          Complete payment to confirm your booking and schedule your move.
                        </p>
                        <div className="bg-card/50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Base Price</span>
                            <span className="font-medium">J${quote.base_price?.toLocaleString()}</span>
                          </div>
                          {quote.distance_fee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Distance Fee</span>
                              <span>J${quote.distance_fee?.toLocaleString()}</span>
                            </div>
                          )}
                          {quote.weight_fee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Weight Fee</span>
                              <span>J${quote.weight_fee?.toLocaleString()}</span>
                            </div>
                          )}
                          {quote.insurance_fee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Insurance</span>
                              <span>J${quote.insurance_fee?.toLocaleString()}</span>
                            </div>
                          )}
                          {quote.tax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Tax</span>
                              <span>J${quote.tax?.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span className="text-primary">J${quote.total_price?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={handleDemoPayment} 
                        disabled={isProcessingPayment}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay Now - J${quote.total_price?.toLocaleString()}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Demo mode - no card required
                      </p>
                    </>
                  ) : (
                    <div className="bg-accent/10 text-accent-foreground p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Request approved!</strong> A quote is being prepared for your move.
                        You'll be able to pay once the quote is ready.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map / Live GPS - Only show when tracking */}
          {showTracking && (
            <Card className="shadow-soft overflow-hidden">
              <LiveTrackingMap
                currentLat={move.current_lat}
                currentLng={move.current_lng}
                pickupAddress={move.pickup_address}
                deliveryAddress={move.delivery_address}
                isInProgress={isInProgress}
              />
            </Card>
          )}

          {/* Timeline */}
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Move Timeline</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {events.length} events
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => {
                    const display = getEventDisplay(event);
                    const isLatest = index === events.length - 1;
                    const isComplete = !isLatest || isCompleted;
                    
                    return (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isComplete
                              ? 'bg-accent text-accent-foreground' 
                              : 'bg-primary text-primary-foreground animate-pulse'
                          }`}>
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </div>
                          {index < events.length - 1 && (
                            <div className="w-0.5 h-12 bg-accent" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${!isComplete ? 'text-primary' : ''}`}>
                              {display.title}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.event_time), 'p')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.notes || display.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Actions - Only show when tracking */}
          {(isScheduled || isInProgress) && (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4">
                <Phone className="h-5 w-5 mr-2" />
                Call Support
              </Button>
              <Button variant="outline" className="h-auto py-4" onClick={() => setChatOpen(true)}>
                <MessageSquare className="h-5 w-5 mr-2" />
                Message Team
              </Button>
            </div>
          )}

          {/* Chat Dialog */}
          <UserChat 
            moveId={move.id} 
            moveName={move.name} 
            open={chatOpen} 
            onOpenChange={setChatOpen} 
          />

          {/* Addresses */}
          <Card className="shadow-soft">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="font-medium">{move.pickup_address || 'Address pending'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery</p>
                  <p className="font-medium">{move.delivery_address || 'Address pending'}</p>
                </div>
              </div>
              {move.move_date && (
                <div className="flex items-start gap-3 pt-2 border-t">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium">
                      {format(new Date(move.move_date), 'PPP')}
                      {move.scheduled_time && ` at ${move.scheduled_time}`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}