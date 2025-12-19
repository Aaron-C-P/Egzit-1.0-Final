import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Home, Package, Sparkles, Truck, User, LogOut, Route, ClipboardList, Crown, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  path: string;
  adminOnly?: boolean;
  premium?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'My Items', path: '/inventory' },
  { icon: Sparkles, label: 'Packing Tips', path: '/packing', premium: true },
  { icon: Truck, label: 'Find Movers', path: '/movers' },
  { icon: ClipboardList, label: 'My Moves', path: '/my-moves' },
  { icon: History, label: 'Move History', path: '/move-history' },
  { icon: Route, label: 'Route Planner', path: '/route', premium: true },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  
  // All regular items are visible - no admin link here
  // Admin access is only through /admin-login portal
  const visibleItems = sidebarItems;

  // Demo: Always show as premium user
  const isPremium = true;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-card lg:border-r lg:border-border lg:z-50">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EGZIT</span>
          </Link>
          {isPremium && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
              <Crown className="h-3 w-3 mr-1" />
              PRO
            </Badge>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium flex-1">{item.label}</span>
                {item.premium && (
                  <Crown className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-amber-200" : "text-amber-500"
                  )} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "lg:ml-64",
        hideNav ? "" : "pb-20 lg:pb-0"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Nav - Hidden on desktop */}
      {!hideNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
