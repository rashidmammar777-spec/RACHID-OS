import { NextResponse } from "next/server";
import { planningAgent } from "@/lib/agents/planningAgent";

export async function GET() {
  const result = await planningAgent("test-user");
  return NextResponse.json(result);
}

export async function POST() {
  const result = await planningAgent("test-user");
  return NextResponse.json(result);
}
}
