import "./globals.css";
import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Politics Camp Social";

export const metadata: Metadata = {
  title: appName,
  description: "Private social network for a summer politics camp"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <AppHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
