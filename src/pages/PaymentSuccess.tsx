import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Home, Truck, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId, bookingId },
        });

        if (error) throw error;

        if (data.paid) {
          setPaymentVerified(true);
          toast({
            title: 'Payment Successful!',
            description: 'Your booking has been confirmed.',
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: 'Verification Error',
          description: 'Could not verify payment. Please contact support.',
          variant: 'destructive',
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, bookingId]);

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full shadow-card animate-fade-in">
          <CardHeader className="text-center pb-2">
            {isVerifying ? (
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : paymentVerified ? (
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-warning" />
              </div>
            )}
            <CardTitle className="text-2xl">
              {isVerifying 
                ? 'Verifying Payment...' 
                : paymentVerified 
                  ? 'Payment Successful!' 
                  : 'Payment Received'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {isVerifying ? (
              <p className="text-muted-foreground">
                Please wait while we confirm your payment...
              </p>
            ) : paymentVerified ? (
              <>
                <p className="text-muted-foreground">
                  Your booking has been confirmed. The mover will contact you shortly to finalize the details.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-accent">Confirmed</span>
                  </div>
                  {bookingId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Booking ID</span>
                      <span className="font-mono text-xs">{bookingId.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                We received your payment. Your booking is being processed.
              </p>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => navigate('/')} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/movers')}>
                <Truck className="mr-2 h-4 w-4" />
                View Movers
              </Button>
            </div>
            
            {/* Stripe branding */}
            <div className="pt-4 mt-4 border-t flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto fill-muted-foreground">
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-5.13L32.37 0v3.77l-4.13.88V.44zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.45-3.32.43zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.41zm-4.91.7c0 2.97-2.31 4.79-5.88 4.79a11.59 11.59 0 0 1-4.44-.9v-3.52c1.42.74 3.33 1.2 4.52 1.2.77 0 1.38-.25 1.38-.9 0-1.82-6.06-1.14-6.06-5.7 0-2.87 2.16-4.76 5.57-4.76 1.46 0 2.96.26 4.18.73v3.47c-1.25-.59-2.85-.93-3.96-.93-.7 0-1.33.22-1.33.79 0 1.7 6.02.92 6.02 5.73z"/>
              </svg>
              <span>Payments powered by Stripe</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
