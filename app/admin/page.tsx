import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TAGS, parseTags } from "@/lib/tags";

export default async function AdminPage({
  searchParams
}: {
  searchParams: { query?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const query = searchParams.query?.trim();
  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { displayName: { contains: query, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin panel</h1>
        <p className="text-sm text-slate-600">Create and manage camp accounts.</p>
      </div>
      <form
        action="/admin"
        method="get"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <input
          name="query"
          defaultValue={query}
          placeholder="Search users"
          className="flex-1 rounded-lg border border-slate-200 p-2"
        />
        <button type="submit" className="rounded-full border border-slate-200 px-4 py-2 text-sm">
          Search
        </button>
      </form>
      <form
        action="/api/admin/create-user"
        method="post"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Create user</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Username</label>
            <input name="username" className="mt-1 w-full rounded-lg border border-slate-200 p-2" required />
          </div>
          <div>
            <label className="text-sm font-medium">Display name</label>
            <input name="displayName" className="mt-1 w-full rounded-lg border border-slate-200 p-2" required />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select name="role" className="mt-1 w-full rounded-lg border border-slate-200 p-2">
              <option value="USER">User</option>
              <option value="MOD">Mod</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Temporary password</label>
            <input name="password" className="mt-1 w-full rounded-lg border border-slate-200 p-2" required />
          </div>
        </div>
        <fieldset className="flex flex-wrap gap-4 text-sm">
          {TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-2">
              <input type="checkbox" name="tags" value={tag} />
              {tag.replace("_", " ")}
            </label>
          ))}
        </fieldset>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" name="mustChangePassword" defaultChecked />
          Force password change on first login
        </div>
        <button type="submit" className="rounded-full bg-brand-500 px-4 py-2 text-white">
          Create account
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Manage users</h2>
        <div className="mt-4 space-y-4">
          {users.map((user) => (
            <form
              key={user.id}
              action="/api/admin/update-user"
              method="post"
              className="rounded-xl border border-slate-100 p-4"
            >
              <input type="hidden" name="userId" value={user.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {user.displayName} <span className="text-xs text-slate-500">@{user.username}</span>
                  </div>
                  <div className="text-xs text-slate-500">Role: {user.role}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select name="role" defaultValue={user.role} className="rounded-md border border-slate-200 p-2 text-xs">
                    <option value="USER">User</option>
                    <option value="MOD">Mod</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <input
                    name="newPassword"
                    placeholder="Reset password"
                    className="rounded-md border border-slate-200 p-2 text-xs"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input type="checkbox" name="mustChangePassword" defaultChecked={user.mustChangePassword} />
                    Require change
                  </label>
                </div>
              </div>
              <fieldset className="mt-3 flex flex-wrap gap-3 text-xs">
                {TAGS.map((tag) => (
                  <label key={`${user.id}-${tag}`} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag}
                      defaultChecked={parseTags(user.tags).includes(tag)}
                    />
                    {tag.replace("_", " ")}
                  </label>
                ))}
              </fieldset>
              <button type="submit" className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs">
                Update user
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
