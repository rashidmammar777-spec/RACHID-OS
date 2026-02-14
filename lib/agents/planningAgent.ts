import { createServerClient } from "@/lib/supabase/server";

export async function planningAgent(userId: string) {
  const supabase = await createServerClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return {
      error: "Error fetching tasks"
    };
  }

  return {
    total_tasks: tasks?.length || 0,
    note: "Planning agent connected to database"
  };
}
