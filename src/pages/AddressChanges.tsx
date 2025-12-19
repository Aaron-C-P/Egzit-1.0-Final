import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, CreditCard, Mail, Wifi, 
  Zap, Droplets, ShieldCheck, Car, GraduationCap,
  Heart, ShoppingBag, Globe, Phone
} from 'lucide-react';

interface AddressChangeItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'financial' | 'utilities' | 'government' | 'subscriptions' | 'other';
  priority: 'high' | 'medium' | 'low';
}

const addressChangeItems: AddressChangeItem[] = [
  // Financial
  { id: 'bank', label: 'Banks & Credit Unions', description: 'Update all bank accounts', icon: Building2, category: 'financial', priority: 'high' },
  { id: 'credit-cards', label: 'Credit Card Companies', description: 'All card issuers', icon: CreditCard, category: 'financial', priority: 'high' },
  { id: 'insurance-auto', label: 'Auto Insurance', description: 'May affect your rates', icon: Car, category: 'financial', priority: 'high' },
  { id: 'insurance-health', label: 'Health Insurance', description: 'Update provider network', icon: Heart, category: 'financial', priority: 'high' },
  
  // Government
  { id: 'post-office', label: 'Post Office', description: 'Set up mail forwarding', icon: Mail, category: 'government', priority: 'high' },
  { id: 'drivers-license', label: "Driver's License", description: 'Usually within 30 days', icon: Car, category: 'government', priority: 'high' },
  { id: 'voter-registration', label: 'Voter Registration', description: 'Update before elections', icon: ShieldCheck, category: 'government', priority: 'medium' },
  { id: 'tax-office', label: 'Tax Office (NIS/TRN)', description: 'Update tax records', icon: Building2, category: 'government', priority: 'medium' },
  
  // Utilities
  { id: 'electric', label: 'Electric Company (JPS)', description: 'Transfer or new service', icon: Zap, category: 'utilities', priority: 'high' },
  { id: 'water', label: 'Water Authority (NWC)', description: 'Transfer or new service', icon: Droplets, category: 'utilities', priority: 'high' },
  { id: 'internet', label: 'Internet Provider', description: 'Flow, Digicel, etc.', icon: Wifi, category: 'utilities', priority: 'high' },
  { id: 'phone', label: 'Mobile Provider', description: 'Update billing address', icon: Phone, category: 'utilities', priority: 'medium' },
  
  // Subscriptions
  { id: 'streaming', label: 'Streaming Services', description: 'Netflix, Spotify, etc.', icon: Globe, category: 'subscriptions', priority: 'low' },
  { id: 'shopping', label: 'Online Shopping', description: 'Amazon, eBay accounts', icon: ShoppingBag, category: 'subscriptions', priority: 'low' },
  { id: 'school', label: 'Schools & Education', description: 'If you have children', icon: GraduationCap, category: 'subscriptions', priority: 'medium' },
];

export default function AddressChanges() {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('address-changes-checklist');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('address-changes-checklist', JSON.stringify([...checkedItems]));
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

  const categories = [
    { id: 'financial', title: 'Financial', emoji: '💰' },
    { id: 'government', title: 'Government', emoji: '🏛️' },
    { id: 'utilities', title: 'Utilities', emoji: '⚡' },
    { id: 'subscriptions', title: 'Subscriptions & Other', emoji: '📦' },
  ];

  const completedCount = checkedItems.size;
  const progress = (completedCount / addressChangeItems.length) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
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
              <h1 className="text-xl font-bold">Address Changes</h1>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
          {/* Info Banner */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <strong>Don't forget!</strong> Many organizations require address updates. 
                Tick off each one as you notify them.
              </p>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Notifications Complete</span>
                <span className="text-sm text-muted-foreground">{completedCount}/{addressChangeItems.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
              {progress === 100 && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  ✅ Everyone has been notified!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          {categories.map((category) => {
            const items = addressChangeItems.filter(i => i.category === category.id);
            const completed = items.filter(i => checkedItems.has(i.id)).length;
            
            return (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{category.emoji}</span> {category.title}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {completed}/{items.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checkedItems.has(item.id) ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox 
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span className={`font-medium ${checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                            {item.label}
                          </span>
                          <Badge className={`${getPriorityColor(item.priority)} text-xs`}>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* Reset button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setCheckedItems(new Set());
              localStorage.removeItem('address-changes-checklist');
            }}
          >
            Reset Checklist
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
