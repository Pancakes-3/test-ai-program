"use client";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-slate-300"
    >
      Log out
    </button>
  );
}
