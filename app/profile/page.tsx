import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/profile");
  redirect(`/profile/${user.id}`);
}
