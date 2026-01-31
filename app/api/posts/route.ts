import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { postSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { getMediaType, isValidMediaType } from "@/lib/media";
import { saveFile } from "@/lib/upload";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/request";
import { Tag } from "@prisma/client";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const feed = searchParams.get("feed") ?? "main";
  const cursor = searchParams.get("cursor");

  let whereClause = {} as Record<string, unknown>;
  if (feed === "following") {
    const follows = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true }
    });
    const followingIds = follows.map((follow) => follow.followingId);
    whereClause = { authorId: { in: followingIds } };
  }
  if (feed === "breaking") {
    whereClause = { author: { tags: { has: Tag.BREAKING_NEWS } } };
  }
  if (feed === "candidates") {
    whereClause = {
      author: {
        tags: {
          hasSome: [Tag.CANDIDATE, Tag.PRESIDENT]
        }
      }
    };
  }

  const posts = await prisma.post.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      author: true,
      media: true,
      likes: { where: { userId: user.id } },
      _count: { select: { likes: true } }
    }
  });

  const hasMore = posts.length > PAGE_SIZE;
  const items = posts.slice(0, PAGE_SIZE).map((post) => ({
    id: post.id,
    text: post.text,
    createdAt: post.createdAt.toISOString(),
    author: {
      username: post.author.username,
      displayName: post.author.displayName,
      avatarUrl: post.author.avatarUrl
    },
    media: post.media.map((media) => ({
      id: media.id,
      type: media.type,
      url: media.url,
      mimeType: media.mimeType
    })),
    likesCount: post._count.likes,
    likedByMe: post.likes.length > 0
  }));

  return NextResponse.json({
    items,
    nextCursor: hasMore ? posts[PAGE_SIZE].id : null
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const ip = getClientIp();
  const limiter = rateLimit(`post:${user.id}:${ip}`, 10, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Posting too quickly." }, { status: 429 });
  }

  const formData = await request.formData();
  const text = String(formData.get("text") ?? "");
  const parsed = postSchema.safeParse({ text });
  if (!parsed.success) {
    return NextResponse.json({ error: "Post text is too long." }, { status: 400 });
  }
  const sanitizedText = parsed.data.text ? sanitizeText(parsed.data.text) : null;
  const files = formData.getAll("media") as File[];
  const maxSizeMb = Number(process.env.MAX_UPLOAD_MB ?? 20);
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  if (files.length > 6) {
    return NextResponse.json({ error: "Too many files." }, { status: 400 });
  }
  if (!sanitizedText && files.length === 0) {
    return NextResponse.json({ error: "Add text or media." }, { status: 400 });
  }

  const mediaInputs = [] as {
    type: "image" | "video";
    url: string;
    mimeType: string;
  }[];

  for (const file of files) {
    if (!isValidMediaType(file.type)) {
      return NextResponse.json({ error: "Unsupported media type." }, { status: 400 });
    }
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: "File too large." }, { status: 400 });
    }
    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      return NextResponse.json({ error: "Invalid media type." }, { status: 400 });
    }
    const saved = await saveFile(file, user.username);
    mediaInputs.push({
      type: mediaType,
      url: saved.publicPath,
      mimeType: file.type
    });
  }

  await prisma.post.create({
    data: {
      authorId: user.id,
      text: sanitizedText,
      media: {
        create: mediaInputs
      }
    }
  });

  return NextResponse.json({ ok: true });
}
