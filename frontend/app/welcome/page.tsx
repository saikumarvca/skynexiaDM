import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  redirect("/dashboard");
}

