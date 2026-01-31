import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FeedClient } from "@/components/FeedClient";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  return <FeedClient />;
}
