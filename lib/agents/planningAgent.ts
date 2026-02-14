export async function planningAgent(userId: string) {
  console.log("Running planning agent for user:", userId);

  return {
    priority_of_the_day: "Test priority",
    blocks: [],
    note: "Planning agent is connected"
  };
}
