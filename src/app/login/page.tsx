"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, ArrowLeft, Mail, Loader2 } from "lucide-react";
import { authClient } from "~/server/better-auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setStep("otp");
    } catch (err) {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (result.error) {
        setError(result.error.message ?? "Invalid code. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError("");

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setError("");
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/" className="flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-[#CDFF00]" />
              <span className="text-xl font-semibold text-white">Kalshi Tracker</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {step === "email" ? (
            <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#CDFF00]">
                  <Mail className="h-8 w-8 text-black" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-white">Welcome back</h1>
                <p className="text-gray-400">
                  Enter your email to receive a sign-in code
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-[#CDFF00] focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#CDFF00] px-6 py-3 font-medium text-black transition-colors hover:bg-[#b8e600] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    "Continue with Email"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <span className="text-[#CDFF00]">We&apos;ll create one for you</span>
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8">
              <button
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="mb-6 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#CDFF00]">
                  <span className="text-2xl font-bold text-black">#</span>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-white">Check your email</h1>
                <p className="text-gray-400">
                  We sent a 6-digit code to{" "}
                  <span className="text-white">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="mb-2 block text-sm font-medium text-gray-300">
                    Verification code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    required
                    maxLength={6}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-gray-500 transition-colors focus:border-[#CDFF00] focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#CDFF00] px-6 py-3 font-medium text-black transition-colors hover:bg-[#b8e600] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-gray-400 transition-colors hover:text-[#CDFF00] disabled:opacity-50"
                >
                  Didn&apos;t receive a code? Resend
                </button>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-gray-500">
            By continuing, you agree to our{" "}
            <Link href="#" className="text-gray-400 hover:text-white">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-gray-400 hover:text-white">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
