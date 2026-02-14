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

  // =========================
  // DAILY MODE
  // =========================

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
        auto_generated: true,
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

  // =========================
  // USER STRUCTURE
  // =========================

  const { data: profile } = await supabase
    .from("user_schedule_profile")
    .select("*")
    .eq("user_id", userId)
    .single();

  const wakeTime = profile?.wake_time || "08:00";
  const sleepTime = profile?.sleep_time || "22:00";

  const wake = new Date(`${dateString}T${wakeTime}`);
  const sleep = new Date(`${dateString}T${sleepTime}`);

  let blocks: Block[] = [];

  // =========================
  // STRUCTURAL BLOCKS
  // =========================

  const lunchStart = new Date(`${dateString}T14:00:00`);
  const lunchEnd = new Date(lunchStart.getTime() + 60 * 60000);

  blocks.push({
    start: lunchStart,
    end: lunchEnd,
    type: "STRUCTURAL",
    label: "Comida",
  });

  blocks.sort((a, b) => a.start.getTime() - b.start.getTime());

  // =========================
  // TASK EXTRACTION
  // =========================

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "INBOX")
    .order("forced_priority", { ascending: false })
    .order("importance", { ascending: false })
    .order("urgency", { ascending: false });

  const totalAwakeMinutes =
    (sleep.getTime() - wake.getTime()) / 60000;

  const maxStrategicMinutes = totalAwakeMinutes * loadFactor;
  let usedStrategicMinutes = 0;
  let taskIndex = 0;

  async function insertTasksInGap(gapStart: Date, gapEnd: Date) {
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

      if (potentialEnd.getTime() > gapEnd.getTime()) break;

      // ===== CAPACITY CONTROL + CASTIGO INTELIGENTE =====
      if (usedStrategicMinutes + duration > maxStrategicMinutes) {
        const newDeferredCount = (task.deferred_count || 0) + 1;

        let newImportance = task.importance || 1;
        let newUrgency = task.urgency || 1;
        let forced = task.forced_priority || false;

        if (newDeferredCount >= 3 && newImportance < 5) {
          newImportance++;
        }

        if (newDeferredCount >= 5 && newUrgency < 5) {
          newUrgency++;
        }

        if (newDeferredCount >= 7) {
          forced = true;
        }

        await supabase
          .from("tasks")
          .update({
            deferred_count: newDeferredCount,
            last_deferred_at: new Date().toISOString(),
            importance: newImportance,
            urgency: newUrgency,
            forced_priority: forced,
          })
          .eq("id", task.id);

        taskIndex++;
        continue;
      }

      blocks.push({
        start: new Date(pointer),
        end: potentialEnd,
        type: "TASK",
        taskId: task.id,
      });

      pointer = potentialEnd;
      usedStrategicMinutes += duration;
      taskIndex++;
    }
  }

  // =========================
  // GAP DISTRIBUTION
  // =========================

  if (wake < blocks[0].start) {
    await insertTasksInGap(wake, blocks[0].start);
  }

  for (let i = 0; i < blocks.length - 1; i++) {
    const currentEnd = blocks[i].end;
    const nextStart = blocks[i + 1].start;

    if (currentEnd < nextStart) {
      await insertTasksInGap(currentEnd, nextStart);
    }
  }

  const lastBlockEnd = blocks[blocks.length - 1]?.end;
  if (lastBlockEnd && lastBlockEnd < sleep) {
    await insertTasksInGap(lastBlockEnd, sleep);
  }

  // =========================
  // SAVE PLAN
  // =========================

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
        agent_id: "planning_agent",
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
      status: "PENDIENTE",
    });
  }

  return {
    mode: dailyMode.mode,
    total_blocks: blocks.length,
    used_minutes: usedStrategicMinutes,
    real_load_percent: Math.round(
      (usedStrategicMinutes / totalAwakeMinutes) * 100
    ),
    note: "Adaptive intelligent plan generated",
  };
}
