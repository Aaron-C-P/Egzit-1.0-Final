import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calculator, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatJMD } from '@/lib/utils';

interface QuoteGeneratorProps {
  moveId: string;
  moveName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuoteGenerator({ moveId, moveName, open, onOpenChange }: QuoteGeneratorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quoteData, setQuoteData] = useState({
    base_price: 15000,
    distance_fee: 5000,
    weight_fee: 0,
    special_items_fee: 0,
    insurance_fee: 2500,
    tax: 0,
    notes: '',
    valid_days: 7,
  });

  const totalPrice = 
    quoteData.base_price + 
    quoteData.distance_fee + 
    quoteData.weight_fee + 
    quoteData.special_items_fee + 
    quoteData.insurance_fee + 
    quoteData.tax;

  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + quoteData.valid_days);

      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          move_id: moveId,
          base_price: quoteData.base_price,
          distance_fee: quoteData.distance_fee,
          weight_fee: quoteData.weight_fee,
          special_items_fee: quoteData.special_items_fee,
          insurance_fee: quoteData.insurance_fee,
          tax: quoteData.tax,
          total_price: totalPrice,
          notes: quoteData.notes || null,
          valid_until: validUntil.toISOString(),
          status: 'pending',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update move with quote reference
      await supabase
        .from('moves')
        .update({ quote_id: quote.id })
        .eq('id', moveId);

      // Add tracking event
      await supabase.from('move_tracking_events').insert({
        move_id: moveId,
        event_type: 'quote_sent',
        notes: `Quote sent: ${formatJMD(totalPrice)}`,
        created_by: user?.id,
      });

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-moves'] });
      toast.success('Quote sent successfully!');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Quote error:', error);
      toast.error('Failed to create quote');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Generate Quote for "{moveName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Base Price ($)</Label>
              <Input
                type="number"
                value={quoteData.base_price}
                onChange={(e) => setQuoteData({ ...quoteData, base_price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Distance Fee ($)</Label>
              <Input
                type="number"
                value={quoteData.distance_fee}
                onChange={(e) => setQuoteData({ ...quoteData, distance_fee: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Weight Fee ($)</Label>
              <Input
                type="number"
                value={quoteData.weight_fee}
                onChange={(e) => setQuoteData({ ...quoteData, weight_fee: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Special Items Fee ($)</Label>
              <Input
                type="number"
                value={quoteData.special_items_fee}
                onChange={(e) => setQuoteData({ ...quoteData, special_items_fee: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Insurance Fee ($)</Label>
              <Input
                type="number"
                value={quoteData.insurance_fee}
                onChange={(e) => setQuoteData({ ...quoteData, insurance_fee: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Tax ($)</Label>
              <Input
                type="number"
                value={quoteData.tax}
                onChange={(e) => setQuoteData({ ...quoteData, tax: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Valid For (days)</Label>
            <Input
              type="number"
              value={quoteData.valid_days}
              onChange={(e) => setQuoteData({ ...quoteData, valid_days: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={quoteData.notes}
              onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
              placeholder="Additional details about this quote..."
            />
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Quote:</span>
                <span className="text-2xl font-bold text-primary">{formatJMD(totalPrice)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => createQuoteMutation.mutate()} disabled={createQuoteMutation.isPending}>
            {createQuoteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
