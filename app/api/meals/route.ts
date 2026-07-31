import { NextResponse } from "next/server";
import { isOwner } from "@/app/lib/auth";
import { listMeals, saveMeal } from "@/app/lib/meals";
import type { Meal } from "@/app/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const meals = await listMeals();
    return NextResponse.json((await isOwner()) ? meals : meals.filter((meal) => meal.available));
  }
  catch { return NextResponse.json({ error: "Meals are temporarily unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const meal = await request.json() as Meal;
  if (!meal.name || !meal.description || !meal.category || !Array.isArray(meal.ingredients) || !Array.isArray(meal.recipe)) {
    return NextResponse.json({ error: "Please complete every meal field." }, { status: 400 });
  }
  return NextResponse.json(await saveMeal({ ...meal, id: Number(meal.id) || Date.now(), price: Number(meal.price) }));
}
