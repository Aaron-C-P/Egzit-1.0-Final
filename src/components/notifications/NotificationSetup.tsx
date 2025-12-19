import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

interface NotificationSetupProps {
  moveDate?: Date;
  moveName?: string;
  compact?: boolean;
}

export function NotificationSetup({ moveDate, moveName, compact = false }: NotificationSetupProps) {
  const { 
    isSupported, 
    permission, 
    requestPermission, 
    scheduleRemindersForMoveDate,
    MOVING_DAY_REMINDERS,
  } = useNotifications();

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if reminders are already set
    const savedReminders = localStorage.getItem('egzit-reminders');
    if (savedReminders && JSON.parse(savedReminders).length > 0) {
      setRemindersEnabled(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    const granted = await requestPermission();
    
    if (granted) {
      if (moveDate && moveName) {
        await scheduleRemindersForMoveDate(moveDate, moveName);
        setRemindersEnabled(true);
        toast.success('Reminders enabled!', {
          description: 'You\'ll receive helpful reminders before your move.',
        });
      } else {
        toast.success('Notifications enabled!', {
          description: 'Set a move date to receive reminders.',
        });
      }
    } else {
      toast.error('Notifications blocked', {
        description: 'Please enable notifications in your browser settings.',
      });
    }
    
    setIsLoading(false);
  };

  const handleDisableReminders = () => {
    localStorage.removeItem('egzit-reminders');
    setRemindersEnabled(false);
    toast.info('Reminders disabled');
  };

  if (!isSupported) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Moving Reminders</span>
        </div>
        <Switch
          checked={remindersEnabled && permission === 'granted'}
          onCheckedChange={(checked) => {
            if (checked) {
              handleEnableNotifications();
            } else {
              handleDisableReminders();
            }
          }}
          disabled={isLoading}
        />
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Moving Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Get helpful reminders before your move so you never forget important tasks:
        </p>
        
        <ul className="space-y-2 text-sm">
          {MOVING_DAY_REMINDERS.map((reminder, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>
                <strong>{reminder.daysBefore === 0 ? 'Moving day' : `${reminder.daysBefore} day${reminder.daysBefore > 1 ? 's' : ''} before`}:</strong>{' '}
                {reminder.title.replace(/[!🚚]/g, '')}
              </span>
            </li>
          ))}
        </ul>

        <div className="pt-2">
          {permission === 'granted' && remindersEnabled ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Reminders Active</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDisableReminders}
                className="text-muted-foreground"
              >
                <BellOff className="h-4 w-4 mr-1" />
                Disable
              </Button>
            </div>
          ) : permission === 'denied' ? (
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" />
              <span className="text-sm">Notifications blocked in browser settings</span>
            </div>
          ) : (
            <Button 
              onClick={handleEnableNotifications} 
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Enabling...' : 'Enable Reminders'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
