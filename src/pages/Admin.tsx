import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Plus, Truck, Star, Shield, Edit2, Trash2, 
  Loader2, CheckCircle2, Users, Package, BarChart3, ShieldX, 
  ClipboardList, MessageCircle, Navigation, Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SampleMoversImport from '@/components/admin/SampleMoversImport';
import MoveManagement from '@/components/admin/MoveManagement';
import AdminChat from '@/components/admin/AdminChat';
import PerformanceAnalytics from '@/components/admin/PerformanceAnalytics';
import GPSSimulator from '@/components/admin/GPSSimulator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface MoverForm {
  name: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  min_price: number;
  price_range: string;
  response_time: string;
  available: boolean;
  verified: boolean;
  insured: boolean;
  logo_url: string;
}

const initialForm: MoverForm = {
  name: '',
  description: '',
  location: '',
  phone: '',
  email: '',
  website: '',
  min_price: 15000,
  price_range: '$$',
  response_time: '< 2 hours',
  available: true,
  verified: false,
  insured: false,
  logo_url: '',
};

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMover, setEditingMover] = useState<string | null>(null);
  const [form, setForm] = useState<MoverForm>(initialForm);
  const [services, setServices] = useState<string>('');

  // Access denied if not logged in or not admin
  const isAccessDenied = !roleLoading && (!user || !isAdmin);

  // Fetch movers
  const { data: movers = [], isLoading } = useQuery({
    queryKey: ['admin-movers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin && !!user,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [movesRes, usersRes, bookingsRes, messagesRes, moversRes] = await Promise.all([
        supabase.from('moves').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('bookings').select('id', { count: 'exact' }),
        supabase.from('chat_messages').select('id', { count: 'exact' }).is('read_at', null).eq('is_admin', false),
        supabase.from('movers').select('id', { count: 'exact' }),
      ]);
      return {
        moves: movesRes.count || 0,
        users: usersRes.count || 0,
        bookings: bookingsRes.count || 0,
        movers: moversRes.count || 0,
        unreadMessages: messagesRes.count || 0,
      };
    },
    enabled: !!isAdmin && !!user,
  });

  // Create/Update mover mutation
  const saveMoverMutation = useMutation({
    mutationFn: async (data: { form: MoverForm; id?: string; services: string[] }) => {
      if (data.id) {
        const { error } = await supabase
          .from('movers')
          .update({
            name: data.form.name,
            description: data.form.description,
            location: data.form.location,
            phone: data.form.phone,
            email: data.form.email,
            website: data.form.website,
            min_price: data.form.min_price,
            price_range: data.form.price_range,
            response_time: data.form.response_time,
            available: data.form.available,
            verified: data.form.verified,
            insured: data.form.insured,
            logo_url: data.form.logo_url,
          })
          .eq('id', data.id);
        if (error) throw error;

        await supabase.from('mover_services').delete().eq('mover_id', data.id);
        if (data.services.length > 0) {
          await supabase.from('mover_services').insert(
            data.services.map(service => ({ mover_id: data.id, service }))
          );
        }
      } else {
        const { data: newMover, error } = await supabase
          .from('movers')
          .insert({
            name: data.form.name,
            description: data.form.description,
            location: data.form.location,
            phone: data.form.phone,
            email: data.form.email,
            website: data.form.website,
            min_price: data.form.min_price,
            price_range: data.form.price_range,
            response_time: data.form.response_time,
            available: data.form.available,
            verified: data.form.verified,
            insured: data.form.insured,
            logo_url: data.form.logo_url,
            rating: 0,
            review_count: 0,
          })
          .select()
          .single();
        if (error) throw error;

        if (data.services.length > 0 && newMover) {
          await supabase.from('mover_services').insert(
            data.services.map(service => ({ mover_id: newMover.id, service }))
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movers'] });
      toast.success(editingMover ? 'Mover updated successfully' : 'Mover added successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving mover:', error);
      toast.error('Failed to save mover');
    },
  });

  // Delete mover mutation
  const deleteMoverMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('mover_services').delete().eq('mover_id', id);
      await supabase.from('mover_reviews').delete().eq('mover_id', id);
      const { error } = await supabase.from('movers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movers'] });
      toast.success('Mover deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting mover:', error);
      toast.error('Failed to delete mover');
    },
  });

  const handleOpenDialog = async (moverId?: string) => {
    if (moverId) {
      const mover = movers.find(m => m.id === moverId);
      if (mover) {
        setForm({
          name: mover.name,
          description: mover.description || '',
          location: mover.location || '',
          phone: mover.phone || '',
          email: mover.email || '',
          website: mover.website || '',
          min_price: mover.min_price || 99,
          price_range: mover.price_range || '$$',
          response_time: mover.response_time || '< 2 hours',
          available: mover.available ?? true,
          verified: mover.verified ?? false,
          insured: mover.insured ?? false,
          logo_url: mover.logo_url || '',
        });
        const { data: servicesData } = await supabase
          .from('mover_services')
          .select('service')
          .eq('mover_id', moverId);
        setServices(servicesData?.map(s => s.service).join(', ') || '');
        setEditingMover(moverId);
      }
    } else {
      setForm(initialForm);
      setServices('');
      setEditingMover(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMover(null);
    setForm(initialForm);
    setServices('');
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Please enter a mover name');
      return;
    }
    const servicesList = services.split(',').map(s => s.trim()).filter(Boolean);
    saveMoverMutation.mutate({ form, id: editingMover || undefined, services: servicesList });
  };

  return (
    <AppLayout>
      {roleLoading ? (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isAccessDenied ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-6">
                You don't have permission to access the admin panel. Please contact an administrator if you believe this is an error.
              </p>
              <Button onClick={() => navigate('/')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="min-h-screen">
          {/* Header */}
        <div className="bg-card border-b px-4 pt-4 pb-3 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <SampleMoversImport />
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mover
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.users || 0}</p>
                    <p className="text-xs text-muted-foreground">Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.movers || 0}</p>
                    <p className="text-xs text-muted-foreground">Movers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.moves || 0}</p>
                    <p className="text-xs text-muted-foreground">Moves</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.bookings || 0}</p>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.unreadMessages || 0}</p>
                    <p className="text-xs text-muted-foreground">Unread</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="moves" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="moves" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Moves</span>
              </TabsTrigger>
              <TabsTrigger value="movers" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Movers</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
                {(stats?.unreadMessages || 0) > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {stats?.unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="gps" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <span className="hidden sm:inline">GPS</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="moves" className="mt-6">
              <MoveManagement />
            </TabsContent>

            <TabsContent value="movers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Movers</CardTitle>
                  <CardDescription>Add, edit, or remove moving companies from the marketplace</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : movers.length === 0 ? (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No movers added yet</p>
                      <Button onClick={() => handleOpenDialog()} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Mover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {movers.map((mover) => (
                        <div
                          key={mover.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={mover.logo_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop'}
                              alt={mover.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{mover.name}</h3>
                                {mover.verified && <Shield className="h-4 w-4 text-accent" />}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-warning text-warning" />
                                  {mover.rating || 0}
                                </span>
                                <span>{mover.location || 'No location'}</span>
                                <Badge variant={mover.available ? 'default' : 'secondary'}>
                                  {mover.available ? 'Available' : 'Busy'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(mover.id)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Mover</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{mover.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMoverMutation.mutate(mover.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <AdminChat />
            </TabsContent>

            <TabsContent value="gps" className="mt-6">
              <GPSSimulator />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <PerformanceAnalytics />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mover Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMover ? 'Edit Mover' : 'Add New Mover'}</DialogTitle>
              <DialogDescription>
                {editingMover ? 'Update mover information' : 'Add a new moving company to the marketplace'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Swift Movers Jamaica"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of services..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g., Kingston"
                  />
                </div>
                <div>
                  <Label htmlFor="min_price">Min Price (JMD)</Label>
                  <Input
                    id="min_price"
                    type="number"
                    value={form.min_price}
                    onChange={(e) => setForm({ ...form, min_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g., +1 876-555-0123"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="services">Services (comma-separated)</Label>
                <Input
                  id="services"
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  placeholder="e.g., Local Moving, Packing, Storage"
                />
              </div>

              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={form.available}
                    onCheckedChange={(checked) => setForm({ ...form, available: checked })}
                  />
                  <Label htmlFor="available">Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="verified"
                    checked={form.verified}
                    onCheckedChange={(checked) => setForm({ ...form, verified: checked })}
                  />
                  <Label htmlFor="verified">Verified</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="insured"
                    checked={form.insured}
                    onCheckedChange={(checked) => setForm({ ...form, insured: checked })}
                  />
                  <Label htmlFor="insured">Insured</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveMoverMutation.isPending}>
                {saveMoverMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMover ? 'Update' : 'Add'} Mover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      )}
    </AppLayout>
  );
}
