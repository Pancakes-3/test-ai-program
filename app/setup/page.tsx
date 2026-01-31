import { prisma } from "@/lib/prisma";

export default async function SetupPage() {
  const adminExists = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (adminExists) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-semibold">Setup complete</h1>
        <p className="mt-2 text-sm text-slate-600">An admin already exists.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Create the first admin</h1>
      <p className="mt-2 text-sm text-slate-600">Use the setup key from your environment.</p>
      <form
        action="/api/setup"
        method="post"
        className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium">Setup key</label>
          <input name="setupKey" className="mt-1 w-full rounded-lg border border-slate-200 p-2" required />
        </div>
        <div>
          <label className="text-sm font-medium">Username</label>
          <input name="username" className="mt-1 w-full rounded-lg border border-slate-200 p-2" required />
        </div>
        <div>
          <label className="text-sm font-medium">Display name</label>
          <input name="displayName" className="mt-1 w-full rounded-lg border border-slate-200 p-2" required />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            required
          />
        </div>
        <button type="submit" className="w-full rounded-full bg-brand-500 py-2 text-white">
          Create admin
        </button>
      </form>
    </div>
  );
}
