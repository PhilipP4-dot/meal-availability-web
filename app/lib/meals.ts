import postgres from "postgres";
import { Meal, seedMeals } from "./seed";

const globalStore = globalThis as typeof globalThis & { mealSql?: ReturnType<typeof postgres>; localMeals?: Meal[] };

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  globalStore.mealSql ??= postgres(url, { max: 5, prepare: false });
  return globalStore.mealSql;
}

async function initialize() {
  const sql = client();
  if (!sql) {
    globalStore.localMeals ??= structuredClone(seedMeals);
    return;
  }
  await sql`CREATE TABLE IF NOT EXISTS meals (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    category TEXT NOT NULL,
    ingredients JSONB NOT NULL,
    recipe JSONB NOT NULL,
    available BOOLEAN NOT NULL DEFAULT FALSE,
    image_key TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE meals ADD COLUMN IF NOT EXISTS image_key TEXT`;
  const [{ count }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM meals`;
  if (count === 0) {
    for (const meal of seedMeals) {
      await sql`INSERT INTO meals (id, name, description, price, category, ingredients, recipe, available, image_key)
        VALUES (${meal.id}, ${meal.name}, ${meal.description}, ${meal.price}, ${meal.category}, ${sql.json(meal.ingredients)}, ${sql.json(meal.recipe)}, ${meal.available}, ${meal.imageKey ?? null})`;
    }
  }
}

function normalize(row: Record<string, unknown>): Meal {
  return {
    id: Number(row.id), name: String(row.name), description: String(row.description),
    price: Number(row.price), category: String(row.category),
    ingredients: row.ingredients as string[], recipe: row.recipe as string[], available: Boolean(row.available),
    imageKey: row.image_key ? String(row.image_key) : undefined,
  };
}

export async function listMeals() {
  await initialize();
  const sql = client();
  if (!sql) return globalStore.localMeals!;
  const rows = await sql`SELECT id, name, description, price, category, ingredients, recipe, available, image_key FROM meals ORDER BY id`;
  return rows.map(normalize);
}

export async function saveMeal(meal: Meal) {
  await initialize();
  const sql = client();
  if (!sql) {
    const index = globalStore.localMeals!.findIndex((item) => item.id === meal.id);
    if (index >= 0) globalStore.localMeals![index] = meal; else globalStore.localMeals!.push(meal);
    return listMeals();
  }
  await sql`INSERT INTO meals (id, name, description, price, category, ingredients, recipe, available, image_key, updated_at)
    VALUES (${meal.id}, ${meal.name}, ${meal.description}, ${meal.price}, ${meal.category}, ${sql.json(meal.ingredients)}, ${sql.json(meal.recipe)}, ${meal.available}, ${meal.imageKey ?? null}, NOW())
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, price=EXCLUDED.price,
      category=EXCLUDED.category, ingredients=EXCLUDED.ingredients, recipe=EXCLUDED.recipe, available=EXCLUDED.available, image_key=EXCLUDED.image_key, updated_at=NOW()`;
  return listMeals();
}

export async function setMealAvailability(id: number, available: boolean) {
  await initialize();
  const sql = client();
  if (!sql) {
    globalStore.localMeals = globalStore.localMeals!.map((meal) => meal.id === id ? { ...meal, available } : meal);
    return listMeals();
  }
  await sql`UPDATE meals SET available=${available}, updated_at=NOW() WHERE id=${id}`;
  return listMeals();
}
