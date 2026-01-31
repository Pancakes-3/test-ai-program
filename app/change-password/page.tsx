import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Update your password</h1>
      <p className="mt-2 text-sm text-slate-600">Choose a new password to continue.</p>
      <form
        className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        action="/api/change-password"
        method="post"
      >
        <div>
          <label className="text-sm font-medium">New password</label>
          <input
            name="password"
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            required
          />
        </div>
        <button type="submit" className="w-full rounded-full bg-brand-500 py-2 text-white">
          Save password
        </button>
      </form>
    </div>
  );
}
