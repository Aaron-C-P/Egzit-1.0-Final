import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Download, LogOut, Shield, Key, ChevronDown, ChevronUp, Crown, Check, Sparkles, Route, Zap } from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import PasswordChangeForm from '@/components/profile/PasswordChangeForm';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    if (error) {
      toast.error('Error loading profile');
      return;
    }

    if (data) {
      setName(data.name || '');
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      toast.error('Error updating profile');
      return;
    }

    toast.success('Profile updated successfully');
  };

  const exportData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: inventories } = await supabase
      .from('inventories')
      .select('*')
      .eq('user_id', user.id);

    const exportData = {
      profile,
      inventories,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `egzit-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="gradient-hero text-primary-foreground px-4 pt-12 pb-6">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-1">Profile</h1>
            <p className="text-primary-foreground/80">{user?.email}</p>
          </div>
        </div>

        <div className="px-4 -mt-4 max-w-lg mx-auto space-y-4 pb-6">
          {/* Subscription Tier Card */}
          <Card className="shadow-card animate-fade-in overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-6 w-6 text-white" />
                  <div>
                    <h3 className="text-white font-bold">Premium Plan</h3>
                    <p className="text-white/80 text-sm">Full access to all features</p>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-0">Active</Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-sm">Premium Features Included:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span>AI Packing Assistant</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span>Advanced Route Optimization</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span>Priority Mover Matching</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span>Real-time GPS Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span>Unlimited Item Inventory</span>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Next billing date</p>
                  <p className="font-medium text-sm">January 15, 2026</p>
                </div>
                <Button variant="outline" size="sm">Manage Plan</Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="shadow-card animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <Button onClick={updateProfile} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-medium text-sm">Change Password</h4>
                  <p className="text-xs text-muted-foreground">
                    Update your account password
                  </p>
                </div>
                {showPasswordForm ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {showPasswordForm && (
                <div className="pt-2">
                  <PasswordChangeForm onSuccess={() => setShowPasswordForm(false)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '75ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Data & Privacy
              </CardTitle>
              <CardDescription>Manage your data and account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Export Your Data</h4>
                  <p className="text-xs text-muted-foreground">
                    Download your profile and inventory
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <div>
                  <h4 className="font-medium text-sm text-destructive">Sign Out</h4>
                  <p className="text-xs text-muted-foreground">
                    Log out of your account
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary mb-1">EGZIT</p>
              <p className="text-xs text-muted-foreground">
                AI-Powered Smart Moving Assistant
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Version 1.0.0
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
