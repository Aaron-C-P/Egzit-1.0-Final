import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { NotificationSetup } from '@/components/notifications/NotificationSetup';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  ArrowLeft, Droplets, Coffee, Phone, Camera, 
  Key, Trash2, Lightbulb, Users, ClipboardList, 
  Bell, Dog, Pill, Baby, Heart
} from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: 'before' | 'during' | 'after' | 'essentials';
}

const checklistItems: ChecklistItem[] = [
  // Essential reminders - things people often forget
  { id: 'pets', label: 'Arrange care/transport for pets 🐾', icon: Dog, category: 'essentials' },
  { id: 'medications', label: 'Pack medications in personal bag 💊', icon: Pill, category: 'essentials' },
  { id: 'kids-items', label: 'Pack kids\' comfort items separately 🧸', icon: Baby, category: 'essentials' },
  { id: 'valuables', label: 'Keep jewelry & valuables with you', icon: Heart, category: 'essentials' },
  { id: 'important-docs', label: 'Secure IDs, passports, medical records', icon: ClipboardList, category: 'essentials' },
  
  // Before movers arrive
  { id: 'charge-devices', label: 'Charge all devices and power banks', icon: Phone, category: 'before' },
  { id: 'pack-snacks', label: 'Pack snacks and water bottles', icon: Coffee, category: 'before' },
  { id: 'final-walkthrough', label: 'Do final walkthrough of old home', icon: ClipboardList, category: 'before' },
  { id: 'photo-before', label: 'Take photos of empty rooms (for deposit)', icon: Camera, category: 'before' },
  { id: 'confirm-movers', label: 'Confirm arrival time with movers', icon: Users, category: 'before' },
  
  // During the move
  { id: 'direct-movers', label: 'Direct movers where boxes go at new place', icon: Users, category: 'during' },
  { id: 'check-boxes', label: 'Check each box off as it\'s loaded', icon: ClipboardList, category: 'during' },
  { id: 'keep-essentials', label: 'Keep essentials bag with you (not on truck)', icon: Key, category: 'during' },
  { id: 'stay-hydrated', label: 'Take breaks, stay hydrated', icon: Droplets, category: 'during' },
  
  // Before leaving old place
  { id: 'check-all-rooms', label: 'Check ALL rooms, closets, and storage', icon: ClipboardList, category: 'after' },
  { id: 'check-outside', label: 'Check garage, shed, and outdoor areas', icon: Lightbulb, category: 'after' },
  { id: 'turn-off-utilities', label: 'Turn off lights and lock up', icon: Lightbulb, category: 'after' },
  { id: 'dispose-trash', label: 'Dispose of any remaining trash', icon: Trash2, category: 'after' },
  { id: 'return-keys', label: 'Return keys to landlord/new owner', icon: Key, category: 'after' },
  { id: 'photo-final', label: 'Take final photos for records', icon: Camera, category: 'after' },
];

export default function MovingDayChecklist() {
  const navigate = useNavigate();
  const { sendEssentialReminder, permission, requestPermission, isSupported } = useNotifications();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('moving-day-checklist');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('moving-day-checklist', JSON.stringify([...checkedItems]));
  }, [checkedItems]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSendReminder = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Please enable notifications to receive reminders');
        return;
      }
    }
    sendEssentialReminder();
    toast.success('Reminder sent!');
  };

  const essentialItems = checklistItems.filter(i => i.category === 'essentials');
  const beforeItems = checklistItems.filter(i => i.category === 'before');
  const duringItems = checklistItems.filter(i => i.category === 'during');
  const afterItems = checklistItems.filter(i => i.category === 'after');
  
  const completedCount = checkedItems.size;
  const progress = (completedCount / checklistItems.length) * 100;

  const getCategoryProgress = (category: 'before' | 'during' | 'after' | 'essentials') => {
    const items = checklistItems.filter(i => i.category === category);
    const completed = items.filter(i => checkedItems.has(i.id)).length;
    return { completed, total: items.length };
  };

  const renderCategory = (title: string, emoji: string, items: ChecklistItem[], category: 'before' | 'during' | 'after' | 'essentials', highlight?: boolean) => {
    const { completed, total } = getCategoryProgress(category);
    const isComplete = completed === total;
    
    return (
      <Card className={`${isComplete ? 'border-green-200 bg-green-50/50' : ''} ${highlight ? 'ring-2 ring-amber-400 border-amber-200' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>{emoji}</span> {title}
              {highlight && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Don't Forget!</span>}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {completed}/{total}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <div 
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                checkedItems.has(item.id) ? 'bg-green-100/50' : 'hover:bg-muted/50'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <Checkbox 
                checked={checkedItems.has(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className={`text-sm ${checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                {item.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-card border-b px-4 pt-4 pb-3 sticky top-0 z-10">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Moving Day Checklist</h1>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{completedCount}/{checklistItems.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
              {progress === 100 && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  ✅ All done! You're ready for your move!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notification reminder button */}
          {isSupported && (
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Get reminded about essentials</p>
                  <p className="text-xs text-muted-foreground">Pets, medications, valuables...</p>
                </div>
                <Button size="sm" variant="secondary" onClick={handleSendReminder}>
                  Remind Me
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Checklists by category */}
          {renderCategory('Essential Reminders', '⚠️', essentialItems, 'essentials', true)}
          {renderCategory('Before Movers Arrive', '🌅', beforeItems, 'before')}
          {renderCategory('During the Move', '🚚', duringItems, 'during')}
          {renderCategory('Before Leaving Old Place', '👋', afterItems, 'after')}

          {/* Reset button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setCheckedItems(new Set());
              localStorage.removeItem('moving-day-checklist');
            }}
          >
            Reset Checklist
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
