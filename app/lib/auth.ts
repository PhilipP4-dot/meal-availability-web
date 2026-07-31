import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "meal_owner_session";
const sessionLength = 60 * 60 * 12;

function secret() {
  const value = process.env.SESSION_SECRET ?? "";
  return value.length >= 32 ? value : "";
}

function signature(expires: string) {
  return createHmac("sha256", secret()).update(expires).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function validOwnerPassword(password: string) {
  const configured = process.env.OWNER_PASSWORD;
  return Boolean(configured && configured.length >= 12 && secret() && safeEqual(password, configured));
}

export async function createOwnerSession() {
  const expires = String(Math.floor(Date.now() / 1000) + sessionLength);
  const store = await cookies();
  store.set(cookieName, `${expires}.${signature(expires)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionLength,
    path: "/",
  });
}

export async function clearOwnerSession() {
  const store = await cookies();
  store.set(cookieName, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" });
}

export async function isOwner() {
  if (!secret()) return false;
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;
  const [expires, received] = token.split(".");
  if (!expires || !received || Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(received, signature(expires));
}
