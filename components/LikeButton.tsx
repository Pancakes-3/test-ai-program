"use client";

import { useState } from "react";

export function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  const [isLiked, setIsLiked] = useState(liked);
  const [likes, setLikes] = useState(count);

  async function toggleLike() {
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as { liked: boolean; count: number };
    setIsLiked(data.liked);
    setLikes(data.count);
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs"
    >
      <span>{isLiked ? "❤️" : "🤍"}</span>
      <span>{likes}</span>
    </button>
  );
}
