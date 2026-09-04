import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isOwner } from "@/app/lib/auth";
import { uploadMealImage } from "@/app/lib/storage";

export const runtime = "nodejs";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  const extension = allowedTypes.get(file.type);
  if (!extension) return NextResponse.json({ error: "Use a JPEG, PNG, or WebP image." }, { status: 415 });
  if (file.size === 0 || file.size > maxBytes) return NextResponse.json({ error: "Images must be smaller than 5 MB." }, { status: 413 });

  const imageKey = `meals/${randomUUID()}.${extension}`;
  try {
    await uploadMealImage(imageKey, new Uint8Array(await file.arrayBuffer()), file.type);
    return NextResponse.json({ imageKey });
  } catch {
    return NextResponse.json({ error: "The image could not be stored. Check the Railway bucket settings." }, { status: 503 });
  }
}
