import { createServerClient } from "@/lib/supabase/server";

export async function planningAgent(userId: string) {
  const supabase = await createServerClient();
  const today = new Date().toISOString().split("T")[0];

  // 1️⃣ Obtener tarea más prioritaria
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "INBOX")
    .order("importance", { ascending: false })
    .order("urgency", { ascending: false })
    .limit(1);

  if (!tasks || tasks.length === 0) {
    return { message: "No tasks available" };
  }

  const topTask = tasks[0];

  // 2️⃣ Buscar si ya existe plan para hoy
  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  let dailyPlan = existingPlan;

  // 3️⃣ Si no existe, crearlo
  if (!existingPlan) {
    const { data: newPlan, error: planError } = await supabase
      .from("daily_plans")
      .insert({
        user_id: userId,
        date: today,
        status: "GENERATED",
        agent_id: "planning_agent"
      })
      .select()
      .single();

    if (planError || !newPlan) {
      return { error: planError?.message || "Daily plan failed" };
    }

    dailyPlan = newPlan;
  }

  // 4️⃣ Insertar bloque en plan_items
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
    return {
      error: "Plan item insert failed",
      details: planItemError.message
    };
  }

  return {
    priority_of_the_day: topTask.content,
    note: "Daily plan ready"
  };
// 🧹 Borrar bloques anteriores del día
await supabase
  .from("plan_items")
  .delete()
  .eq("daily_plan_id", dailyPlan.id);



