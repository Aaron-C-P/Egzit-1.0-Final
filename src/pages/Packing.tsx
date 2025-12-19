import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/navigation/AppLayout';
import { ProgressRing } from '@/components/ui/progress-ring';
import { 
  Package, 
  AlertTriangle, 
  Star, 
  Box, 
  Printer,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface PackingRecommendations {
  categories: {
    heavy: { items: string[]; tips: string[]; boxType: string };
    fragile: { items: string[]; tips: string[]; boxType: string };
    essentials: { items: string[]; tips: string[]; boxType: string };
    general: { items: string[]; tips: string[]; boxType: string };
  };
  boxEstimate: {
    small: { count: number; dimensions: string; forItems: string };
    medium: { count: number; dimensions: string; forItems: string };
    large: { count: number; dimensions: string; forItems: string };
    wardrobe: { count: number; dimensions: string; forItems: string };
  };
  packingOrder: string[];
  warnings: string[];
}

interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  room: string | null;
  packed: boolean | null;
}

const Packing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [recommendations, setRecommendations] = useState<PackingRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [packedItems, setPackedItems] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      const { data: inventories, error: invError } = await supabase
        .from('inventories')
        .select('id')
        .eq('user_id', user.id);

      if (invError) throw invError;

      if (!inventories || inventories.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .in('inventory_id', inventories.map(inv => inv.id));

      if (error) throw error;
      
      const itemsData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        room: item.room,
        packed: item.packed
      }));
      setItems(itemsData);
      setPackedItems(new Set(itemsData.filter(item => item.packed).map(item => item.id)));
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (items.length === 0) {
      toast({
        title: 'No items',
        description: 'Add items to your inventory first',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/packing-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          items: items.map(i => ({ name: i.name, category: i.category, room: i.room })),
          action: 'recommendations'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      setRecommendations(data);
      toast({
        title: 'Recommendations ready!',
        description: 'AI has generated your personalized packing plan',
      });
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate recommendations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const togglePacked = async (itemId: string) => {
    const newPacked = new Set(packedItems);
    const isPacked = !newPacked.has(itemId);
    
    if (isPacked) {
      newPacked.add(itemId);
    } else {
      newPacked.delete(itemId);
    }
    setPackedItems(newPacked);

    try {
      await supabase
        .from('items')
        .update({ packed: isPacked })
        .eq('id', itemId);
    } catch (error) {
      console.error('Error updating packed status:', error);
    }
  };

  const handleFeedback = (category: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [category]: prev[category] === type ? null : type
    }));
    
    toast({
      title: type === 'up' ? 'Thanks for the feedback!' : 'We\'ll improve this',
      description: 'Your feedback helps us provide better recommendations',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const packedCount = packedItems.size;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen p-6">
          <div className="max-w-lg mx-auto space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen print:bg-white">
        {/* Header */}
        <div className="gradient-hero text-primary-foreground px-4 pt-12 pb-6 print:hidden">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-1">AI Packing Assistant</h1>
            <p className="text-primary-foreground/80">Smart recommendations for your move</p>
          </div>
        </div>

        <div className="px-4 -mt-4 max-w-lg mx-auto space-y-4 pb-6">
          {/* Progress Card */}
          <Card className="shadow-card animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center gap-6">
                <ProgressRing progress={progressPercent} size={80} strokeWidth={8} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Packing Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {packedCount} of {totalCount} items packed
                  </p>
                  <Button 
                    onClick={generateRecommendations} 
                    disabled={generating || items.length === 0}
                    className="mt-3 w-full"
                    size="sm"
                  >
                    {generating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {recommendations ? 'Regenerate Plan' : 'Generate Plan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print Button */}
          {recommendations && (
            <Button variant="outline" onClick={handlePrint} className="w-full print:hidden">
              <Printer className="h-4 w-4 mr-2" />
              Print Packing Guide
            </Button>
          )}

          {!recommendations ? (
            <Card className="shadow-soft print:hidden animate-fade-in" style={{ animationDelay: '50ms' }}>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Ready to generate your packing plan?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our AI will analyze your {items.length} items and create a personalized strategy
                </p>
                {items.length === 0 && (
                  <Button variant="outline" onClick={() => navigate('/inventory')}>
                    Add Items First
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Category Tabs */}
              <Tabs defaultValue="heavy" className="space-y-3">
                <TabsList className="grid w-full grid-cols-4 print:hidden">
                  <TabsTrigger value="heavy" className="text-xs">
                    <Package className="h-3.5 w-3.5 mr-1" />
                    Heavy
                  </TabsTrigger>
                  <TabsTrigger value="fragile" className="text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Fragile
                  </TabsTrigger>
                  <TabsTrigger value="essentials" className="text-xs">
                    <Star className="h-3.5 w-3.5 mr-1" />
                    Essential
                  </TabsTrigger>
                  <TabsTrigger value="general" className="text-xs">
                    <Box className="h-3.5 w-3.5 mr-1" />
                    General
                  </TabsTrigger>
                </TabsList>

                {(['heavy', 'fragile', 'essentials', 'general'] as const).map((category) => (
                  <TabsContent key={category} value={category} className="print:block">
                    <Card className="shadow-soft">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="capitalize text-base flex items-center gap-2">
                              {category === 'heavy' && <Package className="h-4 w-4 text-primary" />}
                              {category === 'fragile' && <AlertTriangle className="h-4 w-4 text-warning" />}
                              {category === 'essentials' && <Star className="h-4 w-4 text-accent" />}
                              {category === 'general' && <Box className="h-4 w-4 text-primary" />}
                              {category} Items
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Box: {recommendations.categories[category].boxType}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1 print:hidden">
                            <Button
                              variant={feedback[category] === 'up' ? 'default' : 'ghost'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleFeedback(category, 'up')}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={feedback[category] === 'down' ? 'destructive' : 'ghost'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleFeedback(category, 'down')}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        {/* Items Checklist */}
                        <div>
                          <h4 className="font-medium text-sm mb-2">Items to Pack</h4>
                          <div className="space-y-1.5">
                            {recommendations.categories[category].items.map((item, idx) => {
                              const inventoryItem = items.find(i => 
                                i.name.toLowerCase().includes(item.toLowerCase()) ||
                                item.toLowerCase().includes(i.name.toLowerCase())
                              );
                              const itemId = inventoryItem?.id || `${category}-${idx}`;
                              const isPacked = inventoryItem ? packedItems.has(inventoryItem.id) : false;

                              return (
                                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                                  <Checkbox
                                    id={itemId}
                                    checked={isPacked}
                                    onCheckedChange={() => inventoryItem && togglePacked(inventoryItem.id)}
                                    disabled={!inventoryItem}
                                  />
                                  <label 
                                    htmlFor={itemId}
                                    className={`flex-1 text-sm cursor-pointer ${isPacked ? 'line-through text-muted-foreground' : ''}`}
                                  >
                                    {item}
                                  </label>
                                  {isPacked && <CheckCircle2 className="h-4 w-4 text-accent" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tips */}
                        <div className="pt-2 border-t">
                          <h4 className="font-medium text-sm mb-2">Tips</h4>
                          <ul className="space-y-1">
                            {recommendations.categories[category].tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="text-primary">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Box Calculator */}
              <Card className="shadow-soft animate-fade-in">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Box className="h-4 w-4 text-primary" />
                    Box Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(recommendations.boxEstimate).map(([size, info]) => (
                      <div key={size} className="p-3 bg-muted/50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">{info.count}</div>
                        <div className="text-xs font-medium capitalize">{size}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Packing Order */}
              <Card className="shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Packing Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {recommendations.packingOrder.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="shrink-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {idx + 1}
                        </Badge>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Warnings */}
              {recommendations.warnings.length > 0 && (
                <Card className="shadow-soft border-warning/50 bg-warning/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      Important Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {recommendations.warnings.map((warning, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Packing;
