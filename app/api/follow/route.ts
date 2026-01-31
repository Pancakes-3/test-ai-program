import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 });
  }
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: user.id,
        followingId: target.id
      }
    }
  });
  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: target.id
        }
      }
    });
  } else {
    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: target.id
      }
    });
  }
  return NextResponse.redirect(new URL(`/users/${target.username}`, request.url), 303);
}
