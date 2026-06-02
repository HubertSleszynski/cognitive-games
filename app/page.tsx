import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const userId = await getSessionUserId();

  if (userId) {
    redirect("/dashboard");
  }

  redirect("/register");
}