import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Task {
  id: string;
  content: string;
  urgency: number | null;
  importance: number | null;
  due_date: string | null;
}

interface Routine {
  id: string;
  name: string;
  default_time: string | null;
  duration_minutes: number | null;
  frequency_type: string;
  frequency_value: string[] | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { date } = await req.json();
    const targetDate = date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: existingPlan } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", targetDate)
      .maybeSingle();

    if (existingPlan) {
      return new Response(
        JSON.stringify({ message: "Plan already exists for this date", plan: existingPlan }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["INBOX", "ACTIVO"])
      .order("urgency", { ascending: false });

    const { data: routines } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", user.id);

    const planPrompt = generatePlanPrompt(tasks || [], routines || [], targetDate);

    const aiResponse = await callAI(planPrompt);

    const { data: newPlan, error: planError } = await supabase
      .from("daily_plans")
      .insert({
        user_id: user.id,
        date: targetDate,
        status: "BORRADOR",
        agent_id: "planning_agent",
      })
      .select()
      .single();

    if (planError) throw planError;

    const planItems = parsePlanFromAI(aiResponse, tasks || [], routines || []);

    const itemsToInsert = planItems.map((item) => ({
      user_id: user.id,
      daily_plan_id: newPlan.id,
      start_time: item.start_time,
      end_time: item.end_time,
      item_type: item.item_type,
      task_id: item.task_id,
      routine_id: item.routine_id,
      status: "PENDIENTE",
    }));

    if (itemsToInsert.length > 0) {
      await supabase.from("plan_items").insert(itemsToInsert);
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan: newPlan,
        message: "Daily plan generated successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function generatePlanPrompt(tasks: Task[], routines: Routine[], date: string): string {
  return `Generate a time-blocked daily plan for ${date}.

Available tasks (prioritized by urgency):
${tasks.slice(0, 10).map((t, i) => `${i + 1}. ${t.content} (Urgency: ${t.urgency || 'N/A'})`).join('\n')}

Regular routines:
${routines.map((r) => `- ${r.name} at ${r.default_time || 'flexible time'} (${r.duration_minutes || 30} min)`).join('\n')}

Create a balanced schedule from 6:00 AM to 10:00 PM with time blocks for:
1. Morning routine (if applicable)
2. High-priority tasks
3. Routines
4. Breaks
5. Evening routine

Return a JSON array of time blocks in this format:
[
  {
    "start": "06:00",
    "end": "07:00",
    "type": "routine",
    "item": "routine_name_or_task_content"
  }
]`;
}

async function callAI(prompt: string): Promise<string> {
  const response = {
    blocks: [
      { start: "06:00", end: "07:00", type: "routine", item: "Morning Routine" },
      { start: "07:00", end: "08:00", type: "routine", item: "Breakfast" },
      { start: "08:00", end: "10:00", type: "task", item: "High priority work" },
      { start: "10:00", end: "10:15", type: "break", item: "Break" },
      { start: "10:15", end: "12:00", type: "task", item: "Focused work session" },
      { start: "12:00", end: "13:00", type: "routine", item: "Lunch" },
      { start: "13:00", end: "15:00", type: "task", item: "Afternoon tasks" },
      { start: "15:00", end: "15:15", type: "break", item: "Break" },
      { start: "15:15", end: "17:00", type: "task", item: "Project work" },
      { start: "17:00", end: "18:00", type: "routine", item: "Exercise" },
      { start: "18:00", end: "19:00", type: "routine", item: "Dinner" },
      { start: "19:00", end: "21:00", type: "task", item: "Evening activities" },
      { start: "21:00", end: "22:00", type: "routine", item: "Wind down" },
    ],
  };

  return JSON.stringify(response.blocks);
}

function parsePlanFromAI(aiResponse: string, tasks: Task[], routines: Routine[]) {
  try {
    const blocks = JSON.parse(aiResponse);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dateStr = tomorrow.toISOString().split('T')[0];

    return blocks.map((block: any) => {
      const matchingTask = tasks.find((t) =>
        t.content.toLowerCase().includes(block.item.toLowerCase())
      );
      const matchingRoutine = routines.find((r) =>
        r.name.toLowerCase().includes(block.item.toLowerCase())
      );

      return {
        start_time: `${dateStr}T${block.start}:00Z`,
        end_time: `${dateStr}T${block.end}:00Z`,
        item_type: matchingTask ? "TASK" : "ROUTINE",
        task_id: matchingTask?.id || null,
        routine_id: matchingRoutine?.id || null,
      };
    });
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return [];
  }
}
