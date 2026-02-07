'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanGenerator } from '@/components/plan-generator';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  Download,
  RefreshCw,
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

interface PlanItem {
  id: number;
  start_time: string;
  end_time: string;
  item_type: string;
  status: string;
  task?: { content: string };
  routine?: { name: string };
}

interface DailyPlan {
  id: string;
  user_id: string;
  date: string;
  status: string;
  plan_document_url: string | null;
  review_document_url: string | null;
  user_feedback: string | null;
  agent_id: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const supabase = createBrowserClient();

  useEffect(() => {
    loadTodayPlan();
  }, []);

  const loadTodayPlan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: planData, error: planError } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (!planError && planData) {
        const plan = planData as DailyPlan;
        setDailyPlan(plan);

        const { data: itemsData } = await supabase
          .from('plan_items')
          .select(
            `
            *,
            task:tasks(content),
            routine:routines(name)
          `
          )
          .eq('daily_plan_id', plan.id)
          .order('start_time', { ascending: true });

        if (itemsData) {
          const items = itemsData as PlanItem[];
          setPlanItems(items);
          const completed = items.filter((i) => i.status === 'COMPLETADO').length;
          setStats({
            total: items.length,
            completed,
            pending: items.length - completed,
          });
        }
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemComplete = async (itemId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETADO' ? 'PENDIENTE' : 'COMPLETADO';

    // @ts-ignore
    await supabase.from('plan_items').update({ status: newStatus }).eq('id', itemId);

    setPlanItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );

    const updatedItems = planItems.map((item) =>
      item.id === itemId ? { ...item, status: newStatus } : item
    );
    const completed = updatedItems.filter((i) => i.status === 'COMPLETADO').length;
    setStats({
      total: updatedItems.length,
      completed,
      pending: updatedItems.length - completed,
    });
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {format(new Date(), 'EEEE, MMMM d')}
          </h1>
          <p className="text-slate-600 mt-1">Your day at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTodayPlan}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Tasks and routines today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Circle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Remaining items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today&apos;s Schedule</CardTitle>
                  <CardDescription>Time-blocked plan for maximum productivity</CardDescription>
                </div>
                {dailyPlan && (
                  <Badge variant={dailyPlan.status === 'APROBADO' ? 'default' : 'secondary'}>
                    {dailyPlan.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {planItems.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No plan for today</h3>
                  <p className="text-slate-600 mb-4">
                    Your AI assistant will prepare tomorrow&apos;s plan at 8:00 PM
                  </p>
                  <Button>Create Manual Plan</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {planItems.map((item, index) => {
                    const isCompleted = item.status === 'COMPLETADO';
                    const content =
                      item.item_type === 'TASK'
                        ? item.task?.content
                        : item.routine?.name;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center space-x-4 p-4 border rounded-lg transition-all ${
                          isCompleted
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-slate-200 hover:shadow-sm'
                        }`}
                      >
                        <button
                          onClick={() => toggleItemComplete(item.id, item.status)}
                          className="flex-shrink-0"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>

                        <div className="flex items-center space-x-3 text-sm text-slate-600 flex-shrink-0">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                          </span>
                        </div>

                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              isCompleted ? 'text-slate-600 line-through' : 'text-slate-900'
                            }`}
                          >
                            {content}
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.item_type}
                          </Badge>
                        </div>

                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PlanGenerator />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Completion Rate</span>
                <span className="text-lg font-bold">{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Completed</span>
                  <span className="font-medium text-green-600">{stats.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-medium text-slate-600">{stats.pending}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
