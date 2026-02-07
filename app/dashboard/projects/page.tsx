'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">Organize work that supports your goals</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 text-center py-12">
          <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-600 mb-4">
            Create projects to organize tasks and achieve your goals
          </p>
          <Button>Create Your First Project</Button>
        </CardContent>
      </Card>
    </div>
  );
}
