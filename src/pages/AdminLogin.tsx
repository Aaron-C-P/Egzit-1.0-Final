import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Shield, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading } = useUserRole();

  // If user is logged in and is admin, redirect to admin panel
  useEffect(() => {
    if (user && isAdmin && !isLoading) {
      navigate('/admin');
    }
  }, [user, isAdmin, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/10 via-background to-primary/10 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">EGZIT Portal</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Choose your access type
          </p>
        </CardHeader>

        <CardContent className="pt-4 space-y-6">
          {/* User Access */}
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2">User Access</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in or create an account to book movers, track your items, and manage your moves.
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate('/auth')}
              >
                Sign In / Sign Up
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Continue as Guest
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Admin Access</span>
            </div>
          </div>

          {/* Admin Access Info */}
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-7 w-7 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Admin Panel</h3>
            
            {user && !isLoading && !isAdmin ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Your account doesn't have admin privileges</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Contact an administrator to request access.
                </p>
              </div>
            ) : user && isAdmin ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  You have admin access.
                </p>
                <Button 
                  className="w-full bg-destructive hover:bg-destructive/90"
                  onClick={() => navigate('/admin')}
                >
                  Go to Admin Panel
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Admin access requires a verified admin account. Sign in first, then return here if you have admin privileges.
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => navigate('/auth')}
                >
                  Sign In as Admin
                </Button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Admin access is restricted to authorized personnel only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
