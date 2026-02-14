import { NextResponse } from "next/server";
import { planningAgent } from "@/lib/agents/planningAgent";
import { createClient } from "@/lib/supabase/server";


export async function GET() {
  const supabase = createClient();


  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" });
  }

  const result = await planningAgent(user.id);

  return NextResponse.json(result);
}
