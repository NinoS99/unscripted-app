import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export default async function Home() {
  const { userId } = await auth();

  let username: string | null = null;

  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    username = dbUser?.username ?? null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white text-center">
      <h1 className="text-3xl font-bold mb-4 text-green-300">
        {username ? `Hi, ${username}!` : "Login / Signup to join the fun!"}
      </h1>
      <p className="text-lg max-w-xl text-green-200">
        {username
          ? "Welcome back to unscripted. Dive into the latest Reality TV predictions and community insights!"
          : "Reality Punch is your hub for Reality TV predictions and discussions. Sign up to get started!"}
      </p>
    </div>
  );
}
