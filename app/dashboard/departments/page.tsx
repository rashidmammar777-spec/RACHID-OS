'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Heart, DollarSign, Dumbbell, GraduationCap, Users, Plus } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Career: Briefcase,
  'Health & Fitness': Dumbbell,
  Finance: DollarSign,
  Relationships: Heart,
  'Learning & Growth': GraduationCap,
  'Social Life': Users,
};

interface Department {
  id: string;
  name: string;
  vision: string | null;
  purpose: string | null;
  values: string | null;
  created_at: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-600 mt-1">Manage the key areas of your life</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No departments yet</h3>
            <p className="text-slate-600 mb-4">
              Create departments to organize different areas of your life
            </p>
            <Button>Create Your First Department</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const Icon = ICON_MAP[dept.name] || Briefcase;
            return (
              <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <CardTitle className="mt-4">{dept.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {dept.vision || 'No vision set'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dept.values && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Core Values</p>
                      <div className="flex flex-wrap gap-2">
                        {dept.values.split(',').map((value, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {value.trim()}
                          </Badge>
                        ))}
                      </div>
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
