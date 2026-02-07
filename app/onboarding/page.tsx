'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Heart, DollarSign, Dumbbell, GraduationCap, Users, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import Confetti from 'react-confetti';

const DEPARTMENT_TEMPLATES = [
  { id: 'career', name: 'Career', icon: Briefcase, color: 'bg-blue-500' },
  { id: 'health', name: 'Health & Fitness', icon: Dumbbell, color: 'bg-green-500' },
  { id: 'finance', name: 'Finance', icon: DollarSign, color: 'bg-yellow-500' },
  { id: 'relationships', name: 'Relationships', icon: Heart, color: 'bg-red-500' },
  { id: 'learning', name: 'Learning & Growth', icon: GraduationCap, color: 'bg-purple-500' },
  { id: 'social', name: 'Social Life', icon: Users, color: 'bg-pink-500' },
];

interface Department {
  name: string;
  vision: string;
  purpose: string;
  values: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [departmentDetails, setDepartmentDetails] = useState<Record<string, Department>>({});
  const [currentDeptIndex, setCurrentDeptIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const totalSteps = 2 + selectedDepartments.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleNext = () => {
    if (step === 0) {
      if (selectedDepartments.length === 0) return;
      setStep(1);
    } else if (step === 1) {
      if (currentDeptIndex < selectedDepartments.length - 1) {
        setCurrentDeptIndex(currentDeptIndex + 1);
      } else {
        setStep(2);
      }
    }
  };

  const handleBack = () => {
    if (step === 1) {
      if (currentDeptIndex > 0) {
        setCurrentDeptIndex(currentDeptIndex - 1);
      } else {
        setStep(0);
      }
    }
  };

  const updateDepartmentDetail = (field: keyof Department, value: string) => {
    const currentDept = selectedDepartments[currentDeptIndex];
    setDepartmentDetails((prev) => ({
      ...prev,
      [currentDept]: {
        ...prev[currentDept],
        name: prev[currentDept]?.name || DEPARTMENT_TEMPLATES.find((t) => t.id === currentDept)?.name || '',
        [field]: value,
      },
    }));
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      for (const deptId of selectedDepartments) {
        const details = departmentDetails[deptId];
        const template = DEPARTMENT_TEMPLATES.find((t) => t.id === deptId);

        await supabase.from('departments').insert({
          user_id: user.id,
          name: details?.name || template?.name || '',
          vision: details?.vision || '',
          purpose: details?.purpose || '',
          values: details?.values || '',
        });
      }

      setShowConfetti(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 3000);
    } catch (error) {
      console.error('Error creating departments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showConfetti) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Confetti />
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle className="h-20 w-20 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Welcome to RACHID OS!</CardTitle>
            <CardDescription className="text-lg">
              Your departments are set up. Let&apos;s start building your best life.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Welcome to RACHID OS</h1>
            <Badge variant="secondary">
              Step {step + 1} of {totalSteps}
            </Badge>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Choose Your Life Departments</CardTitle>
              <CardDescription>
                Select the areas of your life you want to manage. You can always add more later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {DEPARTMENT_TEMPLATES.map((dept) => {
                  const Icon = dept.icon;
                  const isSelected = selectedDepartments.includes(dept.id);
                  return (
                    <button
                      key={dept.id}
                      onClick={() => toggleDepartment(dept.id)}
                      className={`p-6 border-2 rounded-lg transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${dept.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{dept.name}</h3>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-blue-500 mt-2" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleNext}
                  disabled={selectedDepartments.length === 0}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 text-sm text-slate-600 mb-2">
                <Sparkles className="h-4 w-4" />
                <span>
                  Department {currentDeptIndex + 1} of {selectedDepartments.length}
                </span>
              </div>
              <CardTitle className="text-2xl">
                Define Your{' '}
                {DEPARTMENT_TEMPLATES.find((t) => t.id === selectedDepartments[currentDeptIndex])
                  ?.name}{' '}
                Department
              </CardTitle>
              <CardDescription>
                Help RACHID OS understand what this area means to you. Be specific about your vision
                and values.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vision">Vision</Label>
                <Textarea
                  id="vision"
                  placeholder="What is your ideal future for this area? Where do you want to be in 3-5 years?"
                  value={departmentDetails[selectedDepartments[currentDeptIndex]]?.vision || ''}
                  onChange={(e) => updateDepartmentDetail('vision', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  placeholder="Why is this area important to you? What deeper meaning does it serve?"
                  value={departmentDetails[selectedDepartments[currentDeptIndex]]?.purpose || ''}
                  onChange={(e) => updateDepartmentDetail('purpose', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="values">Core Values</Label>
                <Input
                  id="values"
                  placeholder="e.g., Growth, Balance, Excellence, Authenticity"
                  value={departmentDetails[selectedDepartments[currentDeptIndex]]?.values || ''}
                  onChange={(e) => updateDepartmentDetail('values', e.target.value)}
                />
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext}>
                  {currentDeptIndex === selectedDepartments.length - 1 ? (
                    <>
                      Complete Setup <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next Department <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Review Your Setup</CardTitle>
              <CardDescription>
                Here&apos;s a summary of your life departments. Ready to start?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                {selectedDepartments.map((deptId) => {
                  const template = DEPARTMENT_TEMPLATES.find((t) => t.id === deptId);
                  const details = departmentDetails[deptId];
                  const Icon = template?.icon || Briefcase;
                  return (
                    <div key={deptId} className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded ${template?.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-2">
                            {details?.name || template?.name}
                          </h3>
                          {details?.vision && (
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Vision:</strong> {details.vision}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button size="lg" onClick={handleComplete} disabled={loading}>
                  {loading ? 'Creating Your OS...' : "Let's Go!"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
