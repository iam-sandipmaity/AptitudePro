import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUserProfile } from "@/lib/repository";

export async function requireAppUser() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return syncUserProfile({
    id: userId,
    email: user.emailAddresses[0]?.emailAddress ?? "unknown@example.com",
    name: user.fullName ?? user.firstName ?? "Learner",
    avatarUrl: user.imageUrl
  });
}
