import { createServerClient } from "@/lib/supabase/server";

export async function planningAgent(userId: string) {
  const supabase = await createServerClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "INBOX")
    .order("importance", { ascending: false })
    .order("urgency", { ascending: false })
    .limit(3);

  if (error) {
    return {
      error: "Error fetching tasks"
    };
  }

  return {
    priority_of_the_day: tasks?.[0]?.content || "No tasks available",
    top_tasks: tasks?.map(t => t.content) || [],
    note: "Basic prioritization active"
  };
}
