import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { followers: true, following: true }
  });
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="text-sm text-slate-600">
          @{profile.username} · {profile.followers.length} followers · {profile.following.length} following
        </p>
      </div>
      <form
        action="/api/profile"
        method="post"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium">Display name</label>
          <input
            name="displayName"
            defaultValue={profile.displayName}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            rows={4}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Avatar URL</label>
          <input
            name="avatarUrl"
            defaultValue={profile.avatarUrl ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
          />
        </div>
        <button type="submit" className="rounded-full bg-brand-500 px-4 py-2 text-white">
          Save profile
        </button>
      </form>
    </div>
  );
}
