import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Truck, HelpCircle } from 'lucide-react';

export default function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full shadow-card animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              Your payment was cancelled. No charges have been made to your account.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                What happened?
              </h4>
              <p className="text-sm text-muted-foreground">
                You cancelled the payment process before completing. Your booking is still pending and you can try again whenever you're ready.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => navigate(-1)} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back & Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/movers')}>
                <Truck className="mr-2 h-4 w-4" />
                Browse Other Movers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
