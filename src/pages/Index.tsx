import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, QrCode, Truck, Sparkles, ArrowRight, CheckCircle2, Clock, MapPin, Plus, Route, Settings, Crown, Lock, Box, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/navigation/AppLayout';
import { ProgressRing } from '@/components/ui/progress-ring';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  // Fetch user's profile name
  const { data: profileData } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's items count via inventories
  const { data: itemsData } = useQuery({
    queryKey: ['items-count', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, packed: 0 };
      
      // Get inventories for this user
      const { data: inventories } = await supabase
        .from('inventories')
        .select('id')
        .eq('user_id', user.id);
      
      if (!inventories || inventories.length === 0) return { total: 0, packed: 0 };
      
      const inventoryIds = inventories.map(inv => inv.id);
      
      const { data, error } = await supabase
        .from('items')
        .select('id, packed')
        .in('inventory_id', inventoryIds);
      
      if (error) throw error;
      const total = data?.length || 0;
      const packed = data?.filter(item => item.packed).length || 0;
      return { total, packed };
    },
    enabled: !!user,
  });

  // Fetch boxes count
  const { data: boxesData } = useQuery({
    queryKey: ['boxes-count', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, complete: 0 };
      
      const { data: boxes, error } = await supabase
        .from('boxes')
        .select('id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { total: boxes?.length || 0 };
    },
    enabled: !!user,
  });

  // Fetch active move
  const { data: activeMove } = useQuery({
    queryKey: ['active-move', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('moves')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['planning', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const packingProgress = itemsData?.total ? Math.round((itemsData.packed / itemsData.total) * 100) : 0;
  const daysUntilMove = activeMove?.move_date 
    ? Math.max(0, Math.ceil((new Date(activeMove.move_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Hero Header */}
        <div className="gradient-hero text-primary-foreground px-4 pt-12 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Hi, {profileData?.name || user?.user_metadata?.name || 'there'}! 👋
                </h1>
                <p className="text-primary-foreground/80 text-lg">
                  {activeMove ? "Your move is on track" : "Ready to start your move?"}
                </p>
              </div>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20 hidden lg:flex"
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid - Responsive */}
        <div className="px-4 -mt-4 max-w-6xl mx-auto pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Move Status Card */}
              <Card className="shadow-card animate-fade-in">
                <CardContent className="p-5">
                  {activeMove ? (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge 
                            status={activeMove.status === 'in_progress' ? 'loading' : 'pending'} 
                            label={activeMove.status === 'in_progress' ? 'In Progress' : 'Planning'} 
                          />
                        </div>
                        <h3 className="font-semibold text-lg">{activeMove.name || 'Moving Day'}</h3>
                        <p className="text-muted-foreground text-sm">
                          {daysUntilMove === 0 ? "Today!" : `${daysUntilMove} days remaining`}
                        </p>
                        {activeMove.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => navigate(`/track/${activeMove.id}`)}
                          >
                            Track Live
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-primary">{daysUntilMove ?? '—'}</div>
                        <p className="text-xs text-muted-foreground">days</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 lg:py-6">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="font-semibold mb-1">No Active Move</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start by finding a mover or adding items
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button onClick={() => navigate('/movers')}>
                          <Truck className="mr-2 h-4 w-4" />
                          Find Movers
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/request-move')}>
                          Request Move
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions - Grid for Desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card 
                  className="shadow-soft cursor-pointer card-interactive animate-fade-in"
                  onClick={() => navigate('/inventory')}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">My Items</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {itemsData?.total || 0} cataloged
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="shadow-soft cursor-pointer card-interactive animate-fade-in"
                  onClick={() => navigate('/boxes')}
                  style={{ animationDelay: '50ms' }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                      <Box className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-sm">My Boxes</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {boxesData?.total || 0} packed
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="shadow-soft cursor-pointer card-interactive animate-fade-in"
                  onClick={() => navigate('/movers')}
                  style={{ animationDelay: '100ms' }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
                      <Truck className="h-6 w-6 text-warning" />
                    </div>
                    <h3 className="font-semibold text-sm">Find Movers</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Compare & book
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="shadow-soft cursor-pointer card-interactive animate-fade-in relative overflow-hidden"
                  onClick={() => navigate('/packing')}
                  style={{ animationDelay: '150ms' }}
                >
                  <div className="absolute top-1 right-1">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                      <Crown className="h-2.5 w-2.5 mr-0.5" />
                      PRO
                    </Badge>
                  </div>
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Smart tips
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Moving Timeline Card */}
              <Card 
                className="shadow-soft cursor-pointer card-interactive animate-fade-in"
                onClick={() => navigate('/timeline')}
                style={{ animationDelay: '200ms' }}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <ListChecks className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">Moving Timeline</h3>
                    <p className="text-xs text-muted-foreground">
                      Step-by-step guide & checklists
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>

              {/* Route Planner Card */}
              <Card 
                className="shadow-soft cursor-pointer card-interactive animate-fade-in relative overflow-hidden"
                onClick={() => navigate('/route')}
                style={{ animationDelay: '200ms' }}
              >
                <div className="absolute top-2 right-2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                    <Crown className="h-2.5 w-2.5 mr-0.5" />
                    PRO
                  </Badge>
                </div>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Route className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">Route Planner</h3>
                    <p className="text-xs text-muted-foreground">
                      Optimize your move route with ETA
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Progress & Features */}
            <div className="space-y-4">
              {/* Progress Overview */}
              <Card className="shadow-card animate-fade-in" style={{ animationDelay: '100ms' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span>Packing Progress</span>
                    {itemsData?.total ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        {itemsData.packed}/{itemsData.total} items
                      </span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-5">
                  <div className="flex items-center gap-6">
                    <ProgressRing progress={packingProgress} size={80} strokeWidth={8} />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Packed</span>
                        <span className="font-medium text-accent">{itemsData?.packed || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium">{(itemsData?.total || 0) - (itemsData?.packed || 0)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => navigate('/packing')}
                      >
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Get Packing Tips
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Preview */}
              <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '300ms' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span>What EGZIT Offers</span>
                    <Badge variant="outline" className="text-xs font-normal">Free & Pro</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-5">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/inventory')}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <QrCode className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">QR Code Tracking</h4>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">FREE</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">Never lose track of your items</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/packing')}>
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">Smart Packing</h4>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0">PRO</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">AI-powered recommendations</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/my-moves')}>
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">Live Tracking</h4>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0">PRO</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">Real-time move updates</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
