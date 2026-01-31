import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId: params.postId,
        userId: user.id
      }
    }
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { postId: params.postId, userId: user.id }
    });
  }
  const count = await prisma.like.count({ where: { postId: params.postId } });
  return NextResponse.json({ liked: !existing, count });
}
