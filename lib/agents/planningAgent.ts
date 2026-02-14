import { createServerClient } from "@/lib/supabase/server";

type Block = {
  start: Date;
  end: Date;
  type: "STRUCTURAL" | "TASK";
  taskId?: string;
  label?: string;
};

export async function planningAgent(userId: string) {
  const supabase = await createServerClient();
  const today = new Date();
  const dateString = today.toISOString().split("T")[0];
  const dayOfWeek = today.getDay();

  // ===== DAILY MODE =====

  let { data: dailyMode } = await supabase
    .from("daily_modes")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateString)
    .single();

  if (!dailyMode) {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const autoMode = isWeekend ? "LIGHT_PROGRESS" : "STRATEGIC";

    const { data: newMode } = await supabase
      .from("daily_modes")
      .insert({
        user_id: userId,
        date: dateString,
        mode: autoMode,
        auto_generated: true
      })
      .select()
      .single();

    dailyMode = newMode;
  }

  let loadFactor = 0.75;

  switch (dailyMode.mode) {
    case "FULL_REST":
      loadFactor = 0.2;
      break;
    case "LIGHT_PROGRESS":
      loadFactor = 0.5;
      break;
    case "STRATEGIC":
      loadFactor = 0.75;
      break;
    case "HIGH_PERFORMANCE":
      loadFactor = 0.9;
      break;
    case "RECOVERY":
      loadFactor = 0.3;
      break;
  }

  // ===== USER STRUCTURE =====

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

  const wake = new Date(`${dateString}T${wakeTime}`);
  const sleep = new Date(`${dateString}T${sleepTime}`);

  let blocks: Block[] = [];

  // ===== STRUCTURAL BLOCKS =====

  // Trabajo
  if (workStart && workEnd) {
    const ws = new Date(`${dateString}T${workStart}`);
    const we = new Date(`${dateString}T${workEnd}`);

    blocks.push({ start: ws, end: we, type: "STRUCTURAL", label: "Trabajo" });

    if (commute > 0) {
      const commuteStart = new Date(ws.getTime() - commute * 60000);
      blocks.push({
        start: commuteStart,
        end: ws,
        type: "STRUCTURAL",
        label: "Desplazamiento"
      });

      const commuteBackEnd = new Date(we.getTime() + commute * 60000);
      blocks.push({
        start: we,
        end: commuteBackEnd,
        type: "STRUCTURAL",
        label: "Desplazamiento"
      });
    }
  }

  // Desayuno flexible antes del trabajo
  const breakfastDuration = 20;
  const breakfastEnd = workStart
    ? new Date(`${dateString}T${workStart}`)
    : new Date(wake.getTime() + 2 * 60 * 60000);

  const breakfastStart = new Date(
    breakfastEnd.getTime() - breakfastDuration * 60000
  );

  blocks.push({
    start: breakfastStart,
    end: breakfastEnd,
    type: "STRUCTURAL",
    label: "Desayuno"
  });

  // Comida
  const lunchStart = new Date(`${dateString}T14:00:00`);
  const lunchEnd = new Date(lunchStart.getTime() + 60 * 60000);

  blocks.push({
    start: lunchStart,
    end: lunchEnd,
    type: "STRUCTURAL",
    label: "Comida"
  });

  // Cena
  const dinnerStart = new Date(`${dateString}T21:00:00`);
  const dinnerEnd = new Date(dinnerStart.getTime() + 40 * 60000);

  blocks.push({
    start: dinnerStart,
    end: dinnerEnd,
    type: "STRUCTURAL",
    label: "Cena"
  });

  // Siesta
  if (siestaMinutes > 0) {
    const siestaStart = new Date(`${dateString}T15:30:00`);
    const siestaEnd = new Date(
      siestaStart.getTime() + siestaMinutes * 60000
    );

    blocks.push({
      start: siestaStart,
      end: siestaEnd,
      type: "STRUCTURAL",
      label: "Descanso"
    });
  }

  blocks.sort((a, b) => a.start.getTime() - b.start.getTime());

  // ===== TASKS =====

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "INBOX")
    .order("importance", { ascending: false })
    .order("urgency", { ascending: false });

  const totalAwakeMinutes =
    (sleep.getTime() - wake.getTime()) / 60000;

  const maxStrategicMinutes = totalAwakeMinutes * loadFactor;
  let usedStrategicMinutes = 0;
  let taskIndex = 0;

  function insertTasksInGap(gapStart: Date, gapEnd: Date) {
    let pointer = new Date(gapStart);

    while (
      taskIndex < (tasks?.length || 0) &&
      pointer.getTime() < gapEnd.getTime()
    ) {
      const task = tasks![taskIndex];
      const duration = task.estimated_minutes || 60;

      const potentialEnd = new Date(
        pointer.getTime() + duration * 60000
      );

      if (
        potentialEnd.getTime() > gapEnd.getTime() ||
        usedStrategicMinutes + duration > maxStrategicMinutes
      )
        break;

      blocks.push({
        start: new Date(pointer),
        end: potentialEnd,
        type: "TASK",
        taskId: task.id
      });

      pointer = potentialEnd;
      usedStrategicMinutes += duration;
      taskIndex++;
    }
  }

  // Huecos
  if (blocks.length > 0 && wake < blocks[0].start) {
    insertTasksInGap(wake, blocks[0].start);
  }

  for (let i = 0; i < blocks.length - 1; i++) {
    const currentEnd = blocks[i].end;
    const nextStart = blocks[i + 1].start;

    if (currentEnd < nextStart) {
      insertTasksInGap(currentEnd, nextStart);
    }
  }

  const lastBlockEnd = blocks[blocks.length - 1]?.end;
  if (lastBlockEnd && lastBlockEnd < sleep) {
    insertTasksInGap(lastBlockEnd, sleep);
  }

  // ===== SAVE =====

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

  await supabase
    .from("plan_items")
    .delete()
    .eq("daily_plan_id", dailyPlan.id);

  for (const block of blocks) {
    await supabase.from("plan_items").insert({
      user_id: userId,
      daily_plan_id: dailyPlan.id,
      start_time: block.start.toISOString(),
      end_time: block.end.toISOString(),
      item_type: block.type,
      task_id: block.taskId || null,
      routine_id: null,
      status: "PENDIENTE"
    });
  }

  return {
  mode: dailyMode.mode,
  total_blocks: blocks.length,
  strategic_load_percent: Math.round(loadFactor * 100),
  used_minutes: usedStrategicMinutes,
  total_awake_minutes: totalAwakeMinutes,
  real_load_percentage:
    totalAwakeMinutes > 0
      ? Math.round((usedStrategicMinutes / totalAwakeMinutes) * 100)
      : 0
};

