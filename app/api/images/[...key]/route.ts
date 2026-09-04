import { getMealImage } from "@/app/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const imageKey = key.join("/");
  if (!/^meals\/[a-f0-9-]+\.(jpg|png|webp)$/.test(imageKey)) return new Response("Not found", { status: 404 });
  try {
    const object = await getMealImage(imageKey);
    if (!object.Body) return new Response("Not found", { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    const body = Uint8Array.from(bytes).buffer;
    return new Response(body, {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
