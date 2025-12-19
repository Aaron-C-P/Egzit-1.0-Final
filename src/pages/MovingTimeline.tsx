import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { NotificationSetup } from '@/components/notifications/NotificationSetup';
import { 
  Package, Box, Truck, CheckCircle2, Clock, MapPin, 
  ArrowRight, FileText, Key, Home, Sparkles, Bell
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'upcoming';
  action?: { label: string; path: string };
  subTasks?: { id: string; label: string; completed: boolean }[];
}

export default function MovingTimeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('moving-timeline-tasks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Fetch user data
  const { data: itemsData } = useQuery({
    queryKey: ['items-count', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, packed: 0 };
      const { data: inventories } = await supabase
        .from('inventories')
        .select('id')
        .eq('user_id', user.id);
      
      if (!inventories?.length) return { total: 0, packed: 0 };
      
      const { data } = await supabase
        .from('items')
        .select('id, packed')
        .in('inventory_id', inventories.map(inv => inv.id));
      
      return { 
        total: data?.length || 0, 
        packed: data?.filter(i => i.packed).length || 0 
      };
    },
    enabled: !!user,
  });

  const { data: boxesData } = useQuery({
    queryKey: ['boxes-count', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0 };
      const { data } = await supabase
        .from('boxes')
        .select('id')
        .eq('user_id', user.id);
      return { total: data?.length || 0 };
    },
    enabled: !!user,
  });

  const { data: activeMove } = useQuery({
    queryKey: ['active-move', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('moves')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Persist checked tasks
  useEffect(() => {
    localStorage.setItem('moving-timeline-tasks', JSON.stringify([...checkedTasks]));
  }, [checkedTasks]);

  const toggleTask = (taskId: string) => {
    setCheckedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Determine current step based on data
  const hasItems = (itemsData?.total || 0) > 0;
  const hasBoxes = (boxesData?.total || 0) > 0;
  const hasMove = !!activeMove;
  const moveInProgress = activeMove?.status === 'in_progress';
  const moveCompleted = activeMove?.status === 'completed';

  const getStepStatus = (stepId: string): 'completed' | 'current' | 'upcoming' => {
    if (moveCompleted && stepId !== 'unpack') return 'completed';
    if (moveCompleted && stepId === 'unpack') return 'current';
    if (moveInProgress && stepId === 'moving-day') return 'current';
    if (moveInProgress && ['inventory', 'pack', 'book'].includes(stepId)) return 'completed';
    if (hasMove && stepId === 'book') return 'completed';
    if (hasMove && stepId === 'moving-day') return 'current';
    if (hasBoxes && stepId === 'pack') return 'completed';
    if (hasBoxes && stepId === 'book') return 'current';
    if (hasItems && stepId === 'inventory') return 'completed';
    if (hasItems && stepId === 'pack') return 'current';
    if (stepId === 'inventory') return 'current';
    return 'upcoming';
  };

  const timelineSteps: TimelineStep[] = [
    {
      id: 'inventory',
      title: '1. Add Your Items',
      description: 'Catalog everything you\'re moving. Take photos, add categories, and get organized.',
      icon: Package,
      status: getStepStatus('inventory'),
      action: { label: 'Go to Inventory', path: '/inventory' },
      subTasks: [
        { id: 'inv-1', label: 'Take photos of valuable items', completed: checkedTasks.has('inv-1') },
        { id: 'inv-2', label: 'Add items room by room', completed: checkedTasks.has('inv-2') },
        { id: 'inv-3', label: 'Mark fragile items', completed: checkedTasks.has('inv-3') },
      ],
    },
    {
      id: 'pack',
      title: '2. Pack Into Boxes',
      description: 'Use AI suggestions to group items efficiently. Each box gets a QR code.',
      icon: Box,
      status: getStepStatus('pack'),
      action: { label: 'Pack Boxes', path: '/boxes' },
      subTasks: [
        { id: 'pack-1', label: 'Get packing supplies', completed: checkedTasks.has('pack-1') },
        { id: 'pack-2', label: 'Generate box suggestions', completed: checkedTasks.has('pack-2') },
        { id: 'pack-3', label: 'Print QR labels', completed: checkedTasks.has('pack-3') },
        { id: 'pack-4', label: 'Keep essentials separate', completed: checkedTasks.has('pack-4') },
      ],
    },
    {
      id: 'book',
      title: '3. Book Movers',
      description: 'Compare quotes, check reviews, and book a verified moving company.',
      icon: Truck,
      status: getStepStatus('book'),
      action: { label: 'Find Movers', path: '/movers' },
      subTasks: [
        { id: 'book-1', label: 'Get at least 2 quotes', completed: checkedTasks.has('book-1') },
        { id: 'book-2', label: 'Confirm insurance coverage', completed: checkedTasks.has('book-2') },
        { id: 'book-3', label: 'Schedule move date', completed: checkedTasks.has('book-3') },
      ],
    },
    {
      id: 'moving-day',
      title: '4. Moving Day',
      description: 'Track your move in real-time. Confirm each box as it\'s loaded and unloaded.',
      icon: MapPin,
      status: getStepStatus('moving-day'),
      action: activeMove ? { label: 'Track Move', path: `/track/${activeMove.id}` } : undefined,
      subTasks: [
        { id: 'day-1', label: 'Take final photos of old place', completed: checkedTasks.has('day-1') },
        { id: 'day-2', label: 'Check all rooms are empty', completed: checkedTasks.has('day-2') },
        { id: 'day-3', label: 'Hand over keys', completed: checkedTasks.has('day-3') },
        { id: 'day-4', label: 'Confirm all boxes delivered', completed: checkedTasks.has('day-4') },
      ],
    },
    {
      id: 'unpack',
      title: '5. Settle In',
      description: 'Scan box QR codes to know what\'s inside. Unpack room by room.',
      icon: Home,
      status: getStepStatus('unpack'),
      action: { label: 'View Boxes', path: '/boxes' },
      subTasks: [
        { id: 'unpack-1', label: 'Unpack essentials first', completed: checkedTasks.has('unpack-1') },
        { id: 'unpack-2', label: 'Set up beds and bathroom', completed: checkedTasks.has('unpack-2') },
        { id: 'unpack-3', label: 'Update your address', completed: checkedTasks.has('unpack-3') },
        { id: 'unpack-4', label: 'Rate your movers', completed: checkedTasks.has('unpack-4') },
      ],
    },
  ];

  const totalSubTasks = timelineSteps.flatMap(s => s.subTasks || []).length;
  const completedSubTasks = checkedTasks.size;
  const overallProgress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="gradient-hero text-primary-foreground px-4 pt-12 pb-6">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-1">Moving Timeline</h1>
            <p className="text-primary-foreground/80">
              Your step-by-step moving guide
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="px-4 -mt-4 max-w-lg mx-auto">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{completedSubTasks}/{totalSubTasks} tasks</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(overallProgress)}% complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="px-4 mt-4 max-w-lg mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/essentials')}>
              <Key className="h-4 w-4 mr-1" />
              Essentials
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/moving-day-checklist')}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Moving Day
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/address-changes')}>
              <FileText className="h-4 w-4 mr-1" />
              Address Changes
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/packing')}>
              <Sparkles className="h-4 w-4 mr-1" />
              AI Tips
            </Button>
          </div>
        </div>

        {/* Notification Setup */}
        {activeMove?.move_date && (
          <div className="px-4 mt-4 max-w-lg mx-auto">
            <NotificationSetup 
              moveDate={new Date(activeMove.move_date)} 
              moveName={activeMove.name || 'Your Move'} 
            />
          </div>
        )}

        {/* Timeline */}
        <div className="px-4 mt-4 max-w-lg mx-auto pb-6 space-y-4">
          {timelineSteps.map((step, index) => (
            <Card 
              key={step.id}
              className={`shadow-soft animate-fade-in ${
                step.status === 'current' ? 'ring-2 ring-primary border-primary' : ''
              } ${step.status === 'completed' ? 'opacity-75' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'current' ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      {step.status === 'current' && (
                        <Badge className="bg-primary">Current</Badge>
                      )}
                      {step.status === 'completed' && (
                        <Badge variant="outline" className="text-green-600 border-green-600">Done</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Sub-tasks */}
                {step.subTasks && (
                  <div className="space-y-2 mb-4">
                    {step.subTasks.map((task) => (
                      <div 
                        key={task.id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded transition-colors"
                        onClick={() => toggleTask(task.id)}
                      >
                        <Checkbox 
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                          {task.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action button */}
                {step.action && step.status !== 'completed' && (
                  <Button 
                    variant={step.status === 'current' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => navigate(step.action!.path)}
                    className="w-full"
                  >
                    {step.action.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
