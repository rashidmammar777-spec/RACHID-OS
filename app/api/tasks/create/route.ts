import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" });
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    content: "Test task",
    status: "INBOX",
    importance: 3,
    urgency: 3
  });

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  return NextResponse.json({ status: "Task created" });
}
