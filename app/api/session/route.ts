import { NextResponse } from "next/server";
import { clearOwnerSession, createOwnerSession, isOwner, validOwnerPassword } from "@/app/lib/auth";

const globalAuth = globalThis as typeof globalThis & { ownerLoginAttempts?: Map<string, { count: number; reset: number }> };
globalAuth.ownerLoginAttempts ??= new Map();

export async function GET() {
  return NextResponse.json({ authenticated: await isOwner() });
}

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || "unknown";
  const now = Date.now();
  const attempt = globalAuth.ownerLoginAttempts!.get(address);
  if (attempt && attempt.reset > now && attempt.count >= 5) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const { password } = await request.json();
  if (!validOwnerPassword(String(password ?? ""))) {
    const active = attempt && attempt.reset > now ? attempt : { count: 0, reset: now + 15 * 60 * 1000 };
    globalAuth.ownerLoginAttempts!.set(address, { ...active, count: active.count + 1 });
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  globalAuth.ownerLoginAttempts!.delete(address);
  await createOwnerSession();
  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  await clearOwnerSession();
  return NextResponse.json({ authenticated: false });
}
