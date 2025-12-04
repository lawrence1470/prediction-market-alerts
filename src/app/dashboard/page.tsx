"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Bell, LogOut, User } from "lucide-react";
import { authClient } from "~/server/better-auth/client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#CDFF00] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/" className="flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-[#CDFF00]" />
              <span className="text-xl font-semibold text-white">Kalshi Tracker</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">{session.user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-full border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-gray-400">Welcome back! Your alerts are ready.</p>
        </div>

        {/* Empty State */}
        <div className="rounded-3xl border border-gray-800 bg-gray-900 p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800">
            <Bell className="h-10 w-10 text-[#CDFF00]" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">No alerts yet</h2>
          <p className="mx-auto mb-8 max-w-md text-gray-400">
            Connect your Kalshi account to start receiving personalized news alerts for your positions.
          </p>
          <button className="rounded-full bg-[#CDFF00] px-8 py-3 font-medium text-black transition-colors hover:bg-[#b8e600]">
            Connect Kalshi Account
          </button>
        </div>
      </main>
    </div>
  );
}
