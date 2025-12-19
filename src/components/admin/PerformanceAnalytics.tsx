import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, TrendingUp, Clock, CheckCircle2, 
  AlertTriangle, Truck, Calendar, Timer 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function PerformanceAnalytics() {
  // Fetch move statistics
  const { data: stats } = useQuery({
    queryKey: ['performance-stats'],
    queryFn: async () => {
      const { data: moves, error } = await supabase
        .from('moves')
        .select('id, status, created_at, actual_start_time, actual_end_time, estimated_duration');

      if (error) throw error;

      const total = moves?.length || 0;
      const completed = moves?.filter(m => m.status === 'completed').length || 0;
      const inProgress = moves?.filter(m => m.status === 'in_progress').length || 0;
      const pending = moves?.filter(m => m.status === 'pending' || m.status === 'planning').length || 0;
      const cancelled = moves?.filter(m => m.status === 'cancelled').length || 0;

      return {
        total,
        completed,
        inProgress,
        pending,
        cancelled,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
      };
    },
  });

  // Fetch performance data
  const { data: performance } = useQuery({
    queryKey: ['move-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('move_performance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const onTimeCount = data?.filter(p => p.on_time).length || 0;
      const totalWithData = data?.length || 0;
      const onTimeRate = totalWithData > 0 ? ((onTimeCount / totalWithData) * 100).toFixed(1) : 0;

      const avgDelay = data?.reduce((acc, p) => {
        if (p.actual_duration && p.estimated_duration) {
          const delay = Math.max(0, p.actual_duration - p.estimated_duration);
          return acc + delay;
        }
        return acc;
      }, 0) || 0;

      const avgDelayMinutes = totalWithData > 0 ? Math.round((avgDelay / totalWithData) / 60) : 0;

      const avgRating = data?.filter(p => p.rating).reduce((acc, p, _, arr) => {
        return acc + (p.rating! / arr.length);
      }, 0) || 0;

      return {
        onTimeRate,
        avgDelayMinutes,
        avgRating: avgRating.toFixed(1),
        totalCompleted: totalWithData,
      };
    },
  });

  // Fetch daily move counts for chart
  const { data: dailyData = [] } = useQuery({
    queryKey: ['daily-moves'],
    queryFn: async () => {
      const days = 14;
      const result = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const start = startOfDay(date).toISOString();
        const end = endOfDay(date).toISOString();

        const { count: total } = await supabase
          .from('moves')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end);

        const { count: completed } = await supabase
          .from('moves')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('created_at', start)
          .lte('created_at', end);

        result.push({
          date: format(date, 'MMM d'),
          total: total || 0,
          completed: completed || 0,
        });
      }

      return result;
    },
  });

  const statusData = [
    { name: 'Completed', value: stats?.completed || 0 },
    { name: 'In Progress', value: stats?.inProgress || 0 },
    { name: 'Pending', value: stats?.pending || 0 },
    { name: 'Cancelled', value: stats?.cancelled || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-primary">{stats?.completionRate || 0}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Progress value={Number(stats?.completionRate) || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On-Time Delivery</p>
                <p className="text-2xl font-bold text-accent">{performance?.onTimeRate || 0}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Timer className="h-5 w-5 text-accent" />
              </div>
            </div>
            <Progress value={Number(performance?.onTimeRate) || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Delay</p>
                <p className="text-2xl font-bold text-warning">{performance?.avgDelayMinutes || 0} min</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {performance?.avgDelayMinutes === 0 ? 'All moves on time!' : 'Average delay time'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-2xl font-bold">{performance?.avgRating || 'N/A'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {performance?.totalCompleted || 0} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Move Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Move Activity (Last 14 Days)
            </CardTitle>
            <CardDescription>Daily move requests and completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total Moves"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--accent))"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status Distribution
            </CardTitle>
            <CardDescription>Current move statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {statusData.map((entry, index) => (
                <Badge
                  key={entry.name}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: COLORS[index % COLORS.length] }}
                >
                  {entry.name}: {entry.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Move Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total Moves</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold text-primary">{stats?.completed || 0}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10">
              <p className="text-2xl font-bold text-accent">{stats?.inProgress || 0}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10">
              <p className="text-2xl font-bold text-warning">{stats?.pending || 0}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="text-2xl font-bold text-destructive">{stats?.cancelled || 0}</p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
