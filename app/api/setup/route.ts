import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setupSchema } from "@/lib/validation";
import { hashPassword, createSession } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = {
    setupKey: String(formData.get("setupKey") ?? ""),
    username: String(formData.get("username") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    password: String(formData.get("password") ?? "")
  };
  const parsed = setupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid setup data." }, { status: 400 });
  }
  if (parsed.data.setupKey !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: "Invalid setup key." }, { status: 401 });
  }
  const adminExists = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (adminExists) {
    return NextResponse.json({ error: "Admin already exists." }, { status: 400 });
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      passwordHash,
      role: Role.ADMIN
    }
  });
  await createSession(user.id);
  return NextResponse.redirect(new URL("/", request.url), 303);
}
