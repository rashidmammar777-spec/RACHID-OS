import { createServerClient } from "@/lib/supabase/server";

export async function planningAgent(userId: string) {
  const supabase = await createServerClient();
  const today = new Date();
  const dateString = today.toISOString().split("T")[0];
  const dayOfWeek = today.getDay();

  // 1️⃣ Obtener estructura base
  const { data: profile } = await supabase
    .from("user_schedule_profile")
    .select("*")
    .eq("user_id", userId)
    .single();

  const wakeTime = profile?.wake_time || "08:00";
  const sleepTime = profile?.sleep_time || "22:00";
  const minRest = profile?.minimum_rest_minutes || 60;

  const { data: weekly } = await supabase
    .from("weekly_schedule")
    .select("*")
    .eq("user_id", userId)
    .eq("day_of_week", dayOfWeek)
    .single();

  const workStart = weekly?.work_start_time;
  const workEnd = weekly?.work_end_time;
  const commute = weekly?.commute_minutes || 0;
  const siestaMinutes = weekly?.midday_rest_minutes || 0;

  // 2️⃣ Calcular minutos despierto
  const wake = new Date(`${dateString}T${wakeTime}`);
  const sleep = new Date(`${dateString}T${sleepTime}`);
  const totalAwakeMinutes =
    (sleep.getTime() - wake.getTime()) / 60000;

  let structuralMinutes = minRest;

  if (workStart && workEnd) {
    const workStartDate = new Date(`${dateString}T${workStart}`);
    const workEndDate = new Date(`${dateString}T${workEnd}`);
    structuralMinutes +=
      (workEndDate.getTime() - workStartDate.getTime()) / 60000;
    structuralMinutes += commute;
  }

  structuralMinutes += siestaMinutes;

  // Comidas estándar
  const breakfast = 20;
  const lunch = 60;
  const dinner = 40;
  structuralMinutes += breakfast + lunch + dinner;

  const capacityMinutes =
    totalAwakeMinutes - structuralMinutes;

  if (capacityMinutes <= 0) {
    return { error: "No capacity available today" };
  }

  // 3️⃣ Obtener tareas prioritarias
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "INBOX")
    .order("importance", { ascending: false })
    .order("urgency", { ascending: false });

  if (!tasks || tasks.length === 0) {
    return { message: "No tasks available" };
  }

  // 4️⃣ Crear o recuperar plan del día
  let { data: dailyPlan } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateString)
    .single();

  if (!dailyPlan) {
    const { data: newPlan } = await supabase
      .from("daily_plans")
      .insert({
        user_id: userId,
        date: dateString,
        status: "GENERATED",
        agent_id: "planning_agent"
      })
      .select()
      .single();

    dailyPlan = newPlan;
  }

  // 5️⃣ Borrar bloques anteriores
  await supabase
    .from("plan_items")
    .delete()
    .eq("daily_plan_id", dailyPlan.id);

  let usedMinutes = 0;
  let currentTime = wake;

  for (const task of tasks) {
    const duration = task.estimated_minutes || 60;

    if (usedMinutes + duration > capacityMinutes) break;

    const start = new Date(currentTime);
    const end = new Date(currentTime.getTime() + duration * 60000);

    await supabase.from("plan_items").insert({
      user_id: userId,
      daily_plan_id: dailyPlan.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      item_type: "TASK",
      task_id: task.id,
      routine_id: null,
      status: "PENDIENTE"
    });

    usedMinutes += duration;
    currentTime = end;
  }

  return {
    priority_of_the_day: tasks[0].content,
    total_capacity_minutes: capacityMinutes,
    used_minutes: usedMinutes,
    load_percentage: Math.round(
      (usedMinutes / capacityMinutes) * 100
    ),
    note: "Adaptive plan generated"
  };
}
