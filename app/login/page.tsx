import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-sm text-slate-600">Use the username and password provided by camp staff.</p>
      <form
        className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        action="/api/login"
        method="post"
      >
        <div>
          <label className="text-sm font-medium">Username</label>
          <input name="username" className="mt-1 w-full rounded-lg border border-slate-200 p-2" required />
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
          Log in
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-500">
        First time logging in? You will be asked to change your password.
      </p>
    </div>
  );
}
