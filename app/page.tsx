import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Calendar, Target, TrendingUp, Zap, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900">Focus</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        <section className="text-center py-20 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Your Digital CEO for Life
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Focus is an operating system for ambitious entrepreneurs and professionals.
            Plan, execute, and review your goals with AI-powered intelligence that acts as
            your personal chief executive for life management.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free Today</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        <section className="py-16 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Everything You Need to Manage Life Like a Business
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Department Structure</CardTitle>
                <CardDescription>
                  Organize your life into departments like Career, Health, Finance, and Relationships.
                  Each with its own vision and goals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>AI-Powered Planning</CardTitle>
                <CardDescription>
                  Every evening, AI prepares your next day plan based on your goals, tasks, and routines.
                  Review and approve with one click.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Time-Block Dashboard</CardTitle>
                <CardDescription>
                  Visual drag-and-drop daily schedule. See your entire day at a glance and adjust
                  in real-time as priorities shift.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Smart Task Capture</CardTitle>
                <CardDescription>
                  Capture tasks from anywhere: the app, Gmail, or WhatsApp. AI automatically
                  categorizes and prioritizes for you.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Periodic Reviews</CardTitle>
                <CardDescription>
                  Weekly and monthly AI-generated reviews show your progress, insights, and
                  help you plan the next cycle.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Brain className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Learning AI</CardTitle>
                <CardDescription>
                  The system learns from your corrections and preferences, becoming more
                  accurate over time.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="py-16 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Stop Planning. Start Executing.
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join ambitious professionals who have taken control of their lives with Focus.
            Your digital CEO is waiting.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">Create Your Account</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>Focus - Your Operating System for Life</p>
        </div>
      </footer>
    </div>
  );
}
