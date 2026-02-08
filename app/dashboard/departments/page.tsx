'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Heart, DollarSign, Dumbbell, GraduationCap, Users, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

const DEPARTMENT_OPTIONS = [
  { name: 'Career', icon: 'Briefcase' },
  { name: 'Health & Fitness', icon: 'Dumbbell' },
  { name: 'Finance', icon: 'DollarSign' },
  { name: 'Relationships', icon: 'Heart' },
  { name: 'Learning & Growth', icon: 'GraduationCap' },
  { name: 'Social Life', icon: 'Users' },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vision: '',
    purpose: '',
    values: '',
  });
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

  const handleCreateDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error('Please select a department name');
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('departments').insert({
        user_id: user.id,
        name: formData.name,
        vision: formData.vision || null,
        purpose: formData.purpose || null,
        values: formData.values || null,
      });

      if (error) throw error;

      toast.success('Department created successfully');
      setDialogOpen(false);
      setFormData({ name: '', vision: '', purpose: '', values: '' });
      loadDepartments();
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast.error(error.message || 'Failed to create department');
    } finally {
      setSaving(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-600 mt-1">Manage the key areas of your life</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
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
            <Button onClick={() => setDialogOpen(true)}>Create Your First Department</Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>
              Add a new department to organize an area of your life
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Select
                value={formData.name}
                onValueChange={(value) => setFormData({ ...formData, name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <SelectItem key={dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vision">Vision</Label>
              <Textarea
                id="vision"
                placeholder="What is your vision for this area?"
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="Why is this area important to you?"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="values">Core Values</Label>
              <Input
                id="values"
                placeholder="Enter values separated by commas"
                value={formData.values}
                onChange={(e) => setFormData({ ...formData, values: e.target.value })}
              />
              <p className="text-xs text-slate-500">Example: Growth, Balance, Excellence</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreateDepartment} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Department'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
