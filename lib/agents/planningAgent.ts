import { createServerClient } from "@/lib/supabase/server";

export async function planningAgent(userId: string) {
  const supabase = await createServerClient();
  const today = new Date().toISOString().split("T")[0];

  // Obtener tarea más prioritaria
  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "INBOX")
    .order("importance", { ascending: false })
    .order("urgency", { ascending: false })
    .limit(1);

  if (taskError) {
    return { error: taskError.message };
  }

  if (!tasks || tasks.length === 0) {
    return { message: "No tasks available" };
  }

  const topTask = tasks[0];

  // Crear daily_plan
  const { data: dailyPlan, error: planError } = await supabase
    .from("daily_plans")
    .insert({
      user_id: userId,
      date: today,
      status: "GENERATED",
      agent_id: "planning_agent"
    })
    .select()
    .single();

  if (planError || !dailyPlan) {
    return { error: planError?.message || "Daily plan failed" };
  }

  // Crear bloque plan_item
  const { error: planItemError } = await supabase
    .from("plan_items")
    .insert({
      user_id: userId,
      daily_plan_id: dailyPlan.id,
      start_time: today + "T08:00:00",
      end_time: today + "T09:00:00",
      item_type: "TASK",
      task_id: topTask.id,
      routine_id: null,
      status: "PENDIENTE"
    });

  if (planItemError) {
    return { error: planItemError.message };
  }

  return {
    priority_of_the_day: topTask.content,
    note: "Daily plan created"
  };
}

