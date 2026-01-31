import { formatDistanceToNow } from "@/lib/time";
import { LikeButton } from "@/components/LikeButton";

export type PostMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  mimeType: string;
};

export type PostItem = {
  id: string;
  text: string | null;
  createdAt: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  media: PostMedia[];
  likesCount: number;
  likedByMe: boolean;
};

export function PostCard({ post }: { post: PostItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
          {post.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <div className="font-semibold">{post.author.displayName}</div>
          <div className="text-xs text-slate-500">
            @{post.author.username} · {formatDistanceToNow(post.createdAt)}
          </div>
        </div>
      </div>
      {post.text ? <p className="mt-3 whitespace-pre-wrap text-sm">{post.text}</p> : null}
      {post.media.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {post.media.map((media) =>
            media.type === "image" ? (
              <div key={media.id} className="overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.url} alt="" className="h-auto w-full object-cover" />
              </div>
            ) : (
              <video
                key={media.id}
                controls
                className="w-full rounded-xl border border-slate-200"
              >
                <source src={media.url} type={media.mimeType} />
              </video>
            )
          )}
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
        <LikeButton postId={post.id} liked={post.likedByMe} count={post.likesCount} />
      </div>
    </article>
  );
}
