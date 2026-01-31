import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tag } from "@prisma/client";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const formData = await request.formData();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "USER");
  const tags = formData.getAll("tags") as string[];
  const newPassword = String(formData.get("newPassword") ?? "");
  const mustChangePassword = formData.get("mustChangePassword") === "on";

  const data: {
    role?: string;
    tags?: Tag[];
    mustChangePassword?: boolean;
    passwordHash?: string;
  } = {
    role,
    tags: tags as Tag[],
    mustChangePassword
  };

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    data.passwordHash = await hashPassword(newPassword);
  }

  await prisma.user.update({
    where: { id: userId },
    data
  });

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
