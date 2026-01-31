import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validation";
import { serializeTags } from "@/lib/tags";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const formData = await request.formData();
  const payload = {
    username: String(formData.get("username") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    role: String(formData.get("role") ?? "USER"),
    tags: formData.getAll("tags") as string[]
  };
  const parsed = createUserSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user data." }, { status: 400 });
  }
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  const mustChangePassword = formData.get("mustChangePassword") === "on";
  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      tags: serializeTags(parsed.data.tags),
      passwordHash,
      mustChangePassword
    }
  });
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
