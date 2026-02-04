import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/request";

export async function POST(request: Request) {
  const ip = getClientIp();
  const limiter = rateLimit(`login:${ip}`, 10, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }
  const formData = await request.formData();
  const payload = {
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? "")
  };
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  await createSession(user.id);
  const redirectUrl = user.mustChangePassword ? "/change-password" : "/";
  return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
}
