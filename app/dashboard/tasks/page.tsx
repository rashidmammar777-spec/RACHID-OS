'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  CheckSquare,
  Inbox,
  Calendar,
  AlertCircle,
  Search,
  Plus,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  content: string;
  status: string;
  urgency: number | null;
  importance: number | null;
  due_date: string | null;
  source: string | null;
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const supabase = createBrowserClient();

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeTab === 'inbox') {
        query = query.eq('status', 'INBOX');
      } else if (activeTab === 'active') {
        query = query.in('status', ['ACTIVO', 'EN_PROGRESO']);
      } else if (activeTab === 'completed') {
        query = query.eq('status', 'COMPLETADO');
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: number | null) => {
    if (!urgency) return 'bg-slate-200';
    if (urgency >= 4) return 'bg-red-500';
    if (urgency >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSourceBadge = (source: string | null) => {
    if (!source) return null;
    const colors: Record<string, string> = {
      gmail: 'bg-red-100 text-red-700',
      whatsapp: 'bg-green-100 text-green-700',
      manual: 'bg-blue-100 text-blue-700',
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[source] || ''}`}>
        {source}
      </Badge>
    );
  };

  const filteredTasks = tasks.filter((task) =>
    task.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-600 mt-1">Capture, organize, and execute your work</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox">
            <Inbox className="h-4 w-4 mr-2" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="active">
            <CheckSquare className="h-4 w-4 mr-2" />
            Active
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckSquare className="h-4 w-4 mr-2" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks found</h3>
                  <p className="text-slate-600">
                    {activeTab === 'inbox'
                      ? 'Your inbox is empty. Create a task to get started.'
                      : `No ${activeTab} tasks at the moment.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white"
                    >
                      <div
                        className={`w-1 h-12 rounded-full ${getUrgencyColor(task.urgency)}`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 mb-1">{task.content}</p>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          {getSourceBadge(task.source)}
                          {task.due_date && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(task.due_date), 'MMM d')}
                            </div>
                          )}
                          {task.urgency && (
                            <div className="flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Urgency: {task.urgency}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
