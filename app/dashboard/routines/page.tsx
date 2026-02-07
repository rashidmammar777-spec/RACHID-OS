'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Repeat, Plus, Clock } from 'lucide-react';

interface Routine {
  id: string;
  name: string;
  description: string | null;
  frequency_type: string;
  frequency_value: string[] | null;
  default_time: string | null;
  duration_minutes: number | null;
  department: { name: string } | null;
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('routines')
        .select('*, department:departments(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRoutines(data);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyBadge = (type: string, value: string[] | null) => {
    if (type === 'DIARIO') return <Badge>Daily</Badge>;
    if (type === 'SEMANAL' && value) {
      return <Badge>Weekly: {value.join(', ')}</Badge>;
    }
    if (type === 'MENSUAL') return <Badge>Monthly</Badge>;
    return <Badge>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
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
          <h1 className="text-3xl font-bold text-slate-900">Routines</h1>
          <p className="text-slate-600 mt-1">Build consistency with recurring activities</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Routine
        </Button>
      </div>

      {routines.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Repeat className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No routines yet</h3>
            <p className="text-slate-600 mb-4">
              Create routines to build powerful habits and consistency
            </p>
            <Button>Create Your First Routine</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => (
            <Card key={routine.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Repeat className="h-5 w-5 text-blue-600" />
                  {routine.department && (
                    <Badge variant="outline">{routine.department.name}</Badge>
                  )}
                </div>
                <CardTitle>{routine.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {routine.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getFrequencyBadge(routine.frequency_type, routine.frequency_value)}

                  {routine.default_time && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {routine.default_time}
                    </div>
                  )}

                  {routine.duration_minutes && (
                    <div className="text-sm text-slate-600">
                      Duration: {routine.duration_minutes} minutes
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-4">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
