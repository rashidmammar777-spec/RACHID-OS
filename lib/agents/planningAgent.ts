// Importar el cliente de Supabase para operaciones en el servidor
import { createServerClient } from "@/lib/supabase/server";

// Definir el tipo de dato para un bloque de planificación
type Block = {
  start: Date;
  end: Date;
  type: "STRUCTURAL" | "TASK";
  taskId?: string;
  label?: string;
};

/**
 * Agente de Planificación Inteligente
 *
 * Este agente genera un plan diario para un usuario basado en su modo diario,
 * su horario, sus tareas y su perfil de nutrición.
 *
 * @param userId - El ID del usuario para el cual generar el plan.
 */
export async function planningAgent(userId: string) {
  // 1. INICIALIZACIÓN
  // =========================
  const supabase = await createServerClient();
  const today = new Date();
  const dateString = today.toISOString().split("T")[0];
  const dayOfWeek = today.getDay();

  // 2. MODO DIARIO (DAILY MODE)
  // Determina el modo del usuario para el día (ej. estratégico, descanso).
  // Si no existe, lo crea automáticamente.
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

  // Ajusta el factor de carga (cuántas tareas programar) según el modo.
  let loadFactor = 0.75;
  switch (dailyMode.mode) {
      // ===== ENERGY ADJUSTMENT =====
const sleepHours =
  (sleep.getTime() - wake.getTime()) / 3600000; 

if (sleepHours < 6) {
  loadFactor = loadFactor * 0.7;
}


if (sleepHours < 6) {
  loadFactor = Math.min(loadFactor, 0.4);
}

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

  // 3. HORARIO DEL USUARIO (USER STRUCTURE)
  // Obtiene las horas de despertar y dormir para definir el día.
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
  if (dailyMode.mode === "FULL_REST") {
  blocks.push({
    start: new Date(`${dateString}T10:00:00`),
    end: new Date(`${dateString}T10:30:00`),
    type: "STRUCTURAL",
    label: "Movimiento ligero"
  });

  blocks.push({
    start: new Date(`${dateString}T18:00:00`),
    end: new Date(`${dateString}T18:30:00`),
    type: "STRUCTURAL",
    label: "Contacto familiar"
  });
}


  // 4. BLOQUES ESTRUCTURALES (COMIDAS)
  // Crea los bloques fijos para las comidas del día.
  // =========================
  const { data: nutrition } = await supabase
    .from("nutrition_profile")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!nutrition || nutrition.eating_pattern === "NORMAL") {
    const breakfast = nutrition?.breakfast_time || "08:00";
    const lunch = nutrition?.lunch_time || "14:00";
    const dinner = nutrition?.dinner_time || "21:00";
    blocks.push({
      start: new Date(`${dateString}T${breakfast}`),
      end: new Date(new Date(`${dateString}T${breakfast}`).getTime() + 20 * 60000),
      type: "STRUCTURAL",
      label: "Desayuno"
    });
    blocks.push({
      start: new Date(`${dateString}T${lunch}`),
      end: new Date(new Date(`${dateString}T${lunch}`).getTime() + 60 * 60000),
      type: "STRUCTURAL",
      label: "Comida"
    });
    blocks.push({
      start: new Date(`${dateString}T${dinner}`),
      end: new Date(new Date(`${dateString}T${dinner}`).getTime() + 40 * 60000),
      type: "STRUCTURAL",
      label: "Cena"
    });
  }

  if (nutrition?.eating_pattern === "RAMADAN") {
    if (nutrition.suhoor_time) {
      blocks.push({
        start: new Date(`${dateString}T${nutrition.suhoor_time}`),
        end: new Date(new Date(`${dateString}T${nutrition.suhoor_time}`).getTime() + 30 * 60000),
        type: "STRUCTURAL",
        label: "Suhoor"
      });
    }
    if (nutrition.iftar_time) {
      blocks.push({
        start: new Date(`${dateString}T${nutrition.iftar_time}`),
        end: new Date(new Date(`${dateString}T${nutrition.iftar_time}`).getTime() + 60 * 60000),
        type: "STRUCTURAL",
        label: "Iftar"
      });
    }
  }

  // Ordena los bloques estructurales para poder encontrar huecos entre ellos.
  blocks.sort((a, b) => a.start.getTime() - b.start.getTime());

  // 5. EXTRACCIÓN DE TAREAS (TASK EXTRACTION)
  // Obtiene todas las tareas pendientes del usuario, priorizadas.
  // =========================
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "INBOX")
    .order("forced_priority", { ascending: false })
    .order("importance", { ascending: false })
    .order("urgency", { ascending: false });

  const totalAwakeMinutes = (sleep.getTime() - wake.getTime()) / 60000;
  const maxStrategicMinutes = totalAwakeMinutes * loadFactor;
  let usedStrategicMinutes = 0;
  let taskIndex = 0;

  // 6. DISTRIBUCIÓN DE TAREAS EN HUECOS (GAP DISTRIBUTION)
  // =========================
  async function insertTasksInGap(gapStart: Date, gapEnd: Date) {
    let pointer = new Date(gapStart);
    while (taskIndex < (tasks?.length || 0) && pointer.getTime() < gapEnd.getTime()) {
      const task = tasks![taskIndex];
      const duration = task.estimated_minutes || 60;
      const potentialEnd = new Date(pointer.getTime() + duration * 60000);

      if (potentialEnd.getTime() > gapEnd.getTime()) break;

      // Control de capacidad y "castigo inteligente" para tareas aplazadas.
      if (usedStrategicMinutes + duration > maxStrategicMinutes) {
        const newDeferredCount = (task.deferred_count || 0) + 1;
        let newImportance = task.importance || 1;
        let newUrgency = task.urgency || 1;
        let forced = task.forced_priority || false;

        if (newDeferredCount >= 3 && newImportance < 5) newImportance++;
        if (newDeferredCount >= 5 && newUrgency < 5) newUrgency++;
        if (newDeferredCount >= 7) forced = true;

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

      // Si la tarea cabe, se crea el bloque.
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
  
  // Rellena los huecos con tareas.
  if (blocks.length > 0) {
    // Hueco 1: Desde que se despierta hasta el primer bloque.
    if (wake < blocks[0].start) {
      await insertTasksInGap(wake, blocks[0].start);
    }
    // Huecos intermedios: Entre cada bloque estructural.
    for (let i = 0; i < blocks.length - 1; i++) {
      const currentEnd = blocks[i].end;
      const nextStart = blocks[i + 1].start;
      if (currentEnd < nextStart) {
        await insertTasksInGap(currentEnd, nextStart);
      }
    }
    // Hueco final: Desde el último bloque hasta la hora de dormir.
    const lastBlockEnd = blocks[blocks.length - 1]?.end;
    if (lastBlockEnd && lastBlockEnd < sleep) {
      await insertTasksInGap(lastBlockEnd, sleep);
    }
  } else {
    // Si no hay bloques estructurales, todo el día es un gran hueco.
    await insertTasksInGap(wake, sleep);
  }

  // 7. GUARDADO DEL PLAN (SAVE PLAN)
  // Borra el plan antiguo y guarda el nuevo en la base de datos.
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
  
  if (!dailyPlan) {
    throw new Error("Error fatal: No se pudo crear o encontrar un plan diario.");
  }

  // Borra los items del plan anterior para este día.
  await supabase.from("plan_items").delete().eq("daily_plan_id", dailyPlan.id);

  // Ordena la lista final de bloques (comidas + tareas) cronológicamente.
  blocks.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Inserta todos los nuevos bloques en la tabla 'plan_items'.
  for (const block of blocks) {
    await supabase.from("plan_items").insert({
      user_id: userId,
      daily_plan_id: dailyPlan.id,
      start_time: block.start.toISOString(),
      end_time: block.end.toISOString(),
      item_type: block.type,
      task_id: block.taskId || null,
      routine_id: null, // Campo reservado para el futuro
      status: "PENDIENTE",
    });
  }

  // 8. RESULTADO
  // Devuelve un resumen del plan generado.
  // =========================
  const strategicSummary = `
Modo del día: ${dailyMode.mode}
Bloques totales: ${blocks.length}
Carga real: ${Math.round((usedStrategicMinutes / totalAwakeMinutes) * 100)}%
`;

await supabase
  .from("daily_plans")
  .update({
    strategic_summary: strategicSummary
  })
  .eq("id", dailyPlan.id);

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
