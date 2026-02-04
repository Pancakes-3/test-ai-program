"use client";

import { useEffect, useState } from "react";
import { FeedTab } from "@/components/FeedTabs";
import { PostCard, PostItem } from "@/components/PostCard";

export function FeedView({ feed }: { feed: FeedTab }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  async function loadPosts(reset = false) {
    setLoading(true);
    const params = new URLSearchParams({ feed });
    if (!reset && cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/posts?${params.toString()}`);
    setLoading(false);
    if (!res.ok) return;
    const data = (await res.json()) as { items: PostItem[]; nextCursor: string | null };
    setPosts((prev) => (reset ? data.items : [...prev, ...data.items]));
    setCursor(data.nextCursor);
    setHasMore(Boolean(data.nextCursor));
  }

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed]);

  return (
    <div className="space-y-4">
      {posts.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-500">
          No posts yet.
        </div>
      ) : null}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {hasMore ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => loadPosts()}
          className="w-full rounded-full border border-slate-200 bg-white py-2 text-sm"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
