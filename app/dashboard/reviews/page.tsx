'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus } from 'lucide-react';

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reviews</h1>
          <p className="text-slate-600 mt-1">Weekly and monthly performance insights</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Review
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 text-center py-12">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No reviews yet</h3>
          <p className="text-slate-600 mb-4">
            Reviews will be automatically generated weekly and monthly
          </p>
          <Button>Generate Manual Review</Button>
        </CardContent>
      </Card>
    </div>
  );
}
