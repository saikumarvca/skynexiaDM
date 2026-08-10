import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return children;
}
