import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export async function AppHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          {process.env.NEXT_PUBLIC_APP_NAME ?? "Politics Camp Social"}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                Profile
              </Link>
              {user.role === "ADMIN" ? (
                <Link href="/admin" className="text-slate-600 hover:text-slate-900">
                  Admin
                </Link>
              ) : null}
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="rounded-md bg-brand-500 px-3 py-1.5 text-white">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
