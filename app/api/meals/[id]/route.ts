import { NextResponse } from "next/server";
import { isOwner } from "@/app/lib/auth";
import { setMealAvailability } from "@/app/lib/meals";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { available } = await request.json();
  return NextResponse.json(await setMealAvailability(Number(id), Boolean(available)));
}
