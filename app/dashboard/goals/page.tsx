'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  target_date: string | null;
  kpi_metric: string | null;
  kpi_start_value: number | null;
  kpi_target_value: number | null;
  kpi_current_value: number | null;
  department: { name: string };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('goals')
        .select('*, department:departments(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SHORT_TERM: 'bg-blue-100 text-blue-700',
      ANNUAL: 'bg-purple-100 text-purple-700',
      GRAND: 'bg-orange-100 text-orange-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const calculateProgress = (goal: Goal) => {
    if (!goal.kpi_start_value || !goal.kpi_target_value || !goal.kpi_current_value) return 0;
    const range = goal.kpi_target_value - goal.kpi_start_value;
    const current = goal.kpi_current_value - goal.kpi_start_value;
    return Math.min(100, Math.max(0, (current / range) * 100));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Goals</h1>
          <p className="text-slate-600 mt-1">Track your progress toward what matters most</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No goals yet</h3>
            <p className="text-slate-600 mb-4">Set your first goal to start achieving greatness</p>
            <Button>Create Your First Goal</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = calculateProgress(goal);
            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getTypeColor(goal.type)}>{goal.type}</Badge>
                    <Badge variant="outline">{goal.department?.name}</Badge>
                  </div>
                  <CardTitle className="text-xl">{goal.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {goal.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {goal.kpi_metric && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">{goal.kpi_metric}</span>
                        <span className="font-medium">
                          {goal.kpi_current_value} / {goal.kpi_target_value}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {progress.toFixed(0)}% complete
                      </div>
                    </div>
                  )}

                  {goal.target_date && (
                    <div className="text-sm text-slate-600 mb-4">
                      Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                    </div>
                  )}

                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
