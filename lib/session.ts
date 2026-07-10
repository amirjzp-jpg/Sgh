import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type SessionUser = { id: string; name: string; email: string; isAdmin: boolean };

export async function currentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin ?? false,
  };
}
