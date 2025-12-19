import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  Key, FileText, Pill, CreditCard, Smartphone, 
  AlertTriangle, ArrowLeft, Camera, Briefcase
} from 'lucide-react';

interface EssentialItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  priority: 'critical' | 'high' | 'medium';
}

const essentialItems: EssentialItem[] = [
  { id: 'passport', label: 'Passports & IDs', description: 'All family member documents', icon: FileText, priority: 'critical' },
  { id: 'keys', label: 'Keys', description: 'Old home, new home, car, mailbox', icon: Key, priority: 'critical' },
  { id: 'medications', label: 'Medications', description: 'Prescriptions and first aid kit', icon: Pill, priority: 'critical' },
  { id: 'wallet', label: 'Wallet & Cards', description: 'Cash, credit cards, insurance cards', icon: CreditCard, priority: 'critical' },
  { id: 'phone-chargers', label: 'Phone & Chargers', description: 'Phones, laptops, power banks', icon: Smartphone, priority: 'critical' },
  { id: 'valuables', label: 'Jewelry & Valuables', description: 'Small expensive items to carry yourself', icon: Briefcase, priority: 'high' },
  { id: 'documents', label: 'Important Documents', description: 'Lease, deeds, birth certificates', icon: FileText, priority: 'high' },
  { id: 'photos', label: 'Photo Backup', description: 'Backup photos before the move', icon: Camera, priority: 'medium' },
];

export default function Essentials() {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('essentials-checklist');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('essentials-checklist', JSON.stringify([...checkedItems]));
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

  const criticalItems = essentialItems.filter(i => i.priority === 'critical');
  const otherItems = essentialItems.filter(i => i.priority !== 'critical');
  const completedCount = checkedItems.size;
  const progress = (completedCount / essentialItems.length) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
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
              <h1 className="text-xl font-bold">Essential Documents</h1>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
          {/* Warning Banner */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Keep these with you!</p>
                <p className="text-sm text-amber-700">
                  Never pack these items in the moving truck. Carry them personally.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Checklist Progress</span>
                <span className="text-sm text-muted-foreground">{completedCount}/{essentialItems.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Critical Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-red-600">🔴</span> Critical - Never Pack
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checkedItems.has(item.id) ? 'bg-green-50 border-green-200' : 'bg-card hover:bg-muted/50'
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <Checkbox 
                    checked={checkedItems.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-medium ${checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Other Important Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-orange-500">🟠</span> Also Keep Handy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {otherItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checkedItems.has(item.id) ? 'bg-green-50 border-green-200' : 'bg-card hover:bg-muted/50'
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <Checkbox 
                    checked={checkedItems.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-medium ${checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                        {item.label}
                      </span>
                      <Badge className={getPriorityColor(item.priority)} variant="outline">
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tip */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm">
                <strong>Pro Tip:</strong> Pack a separate "first night" bag with toiletries, 
                pajamas, and phone chargers so you're not searching through boxes on your first night.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
