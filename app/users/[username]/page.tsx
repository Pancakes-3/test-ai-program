import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await prisma.user.findUnique({
    where: { username: params.username },
    include: { followers: true, following: true }
  });
  if (!profile) return <div>User not found.</div>;
  const isFollowing = profile.followers.some((follow) => follow.followerId === user.id);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
        <p className="text-sm text-slate-600">@{profile.username}</p>
        <p className="mt-3 text-sm text-slate-700">{profile.bio}</p>
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
          <span>{profile.followers.length} followers</span>
          <span>{profile.following.length} following</span>
        </div>
        {user.id !== profile.id ? (
          <form action="/api/follow" method="post" className="mt-4">
            <input type="hidden" name="username" value={profile.username} />
            <button
              type="submit"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm"
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
