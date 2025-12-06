import Link from "next/link";
import {
  Bell,
  TrendingUp,
  Zap,
  Shield,
  Link2,
  BarChart3,
  Twitter,
  Github,
  Linkedin,
  ArrowRight,
} from "lucide-react";
import { getSession } from "~/server/better-auth/server";
import { LightBeamBackground } from "~/app/_components/light-beam-background";

const stats = [
  { value: "50K+", unit: "", label: "Active traders using alerts", color: "bg-purple-100 text-purple-900", badge: "USERS" },
  { value: "2.5", unit: "sec", label: "Average alert delivery time", color: "bg-[#CDFF00] text-gray-900", badge: "SPEED" },
  { value: "94", unit: "%", label: "Users report better decisions", color: "bg-teal-100 text-teal-900", badge: "IMPACT" },
  { value: "1M+", unit: "", label: "News alerts sent monthly", color: "bg-white text-gray-900", badge: "SCALE" },
];

const features = [
  {
    icon: Bell,
    title: "Real-Time News Alerts",
    description: "Get instant notifications when breaking news could impact your Kalshi positions. Never miss a market-moving event.",
  },
  {
    icon: TrendingUp,
    title: "Track All Your Bets",
    description: "Monitor all your active positions in one centralized dashboard with live updates and performance analytics.",
  },
  {
    icon: Zap,
    title: "Lightning Fast Delivery",
    description: "News delivered in milliseconds. Stay ahead of market movements before prices adjust.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your trading data is encrypted and never shared. We take your privacy and security seriously.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Understand which news sources move your markets most. Make data-driven decisions.",
  },
  {
    icon: Link2,
    title: "Easy Integration",
    description: "Connect your Kalshi account in seconds. Automatic position syncing keeps everything up to date.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up for free in less than 60 seconds. No credit card required to get started.",
  },
  {
    number: "02",
    title: "Connect Kalshi",
    description: "Securely link your Kalshi account to automatically sync your active positions.",
  },
  {
    number: "03",
    title: "Get Personalized Alerts",
    description: "Receive news notifications tailored specifically to your open bets and interests.",
  },
  {
    number: "04",
    title: "Make Better Trades",
    description: "Use real-time information to make informed decisions and manage your portfolio effectively.",
  },
];

export default async function Home() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-[#CDFF00]" />
              <span className="text-xl font-semibold text-white">Kalshi Tracker</span>
            </div>
            <div className="flex items-center gap-8">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[#CDFF00] px-6 py-2.5 font-medium text-black transition-colors hover:bg-[#b8e600]"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-400 transition-colors hover:text-white">
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-[#CDFF00] px-6 py-2.5 font-medium text-black transition-colors hover:bg-[#b8e600]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-black py-32 sm:py-40">
        <LightBeamBackground />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 z-[1] bg-black/40" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-8 text-5xl font-bold leading-tight text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)] sm:text-6xl lg:text-7xl">
              The World's First Prediction Market Tracking Tool
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-white/90 drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
              Get the edge before the odds shift. Real-time news alerts delivered the moment they matter to your bets.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[#CDFF00] px-8 py-3.5 font-medium text-black transition-colors hover:bg-[#b8e600]"
            >
              Get Started - For Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-900 py-32">
        {/* Animated background gradient orbs */}
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#CDFF00] opacity-10 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-500 opacity-10 blur-[120px]"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="mb-8 inline-flex items-center gap-3">
              <div className="h-px w-12 bg-[#CDFF00]"></div>
              <span className="text-sm uppercase tracking-widest text-[#CDFF00]">Platform Metrics</span>
            </div>
            <h2 className="mb-8 max-w-4xl text-5xl font-bold text-white sm:text-6xl lg:text-7xl">
              The numbers don&apos;t lie
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Large featured stat */}
            <div className="flex min-h-[400px] flex-col justify-between rounded-3xl bg-white p-12 lg:row-span-2">
              <div>
                <div className="mb-6 inline-block rounded-full bg-black px-4 py-1.5 text-xs uppercase tracking-wider text-white">
                  {stats[0]?.badge}
                </div>
                <div className="mb-6">
                  <div className="mb-2 text-8xl font-bold text-black sm:text-9xl">
                    {stats[0]?.value}
                    <span className="text-6xl">{stats[0]?.unit}</span>
                  </div>
                </div>
              </div>
              <p className="text-xl text-gray-600">{stats[0]?.label}</p>
            </div>

            {/* Smaller stats */}
            {stats.slice(1).map((stat, index) => (
              <div key={index} className={`${stat.color} rounded-3xl p-8`}>
                <div className="mb-4 inline-block rounded-full bg-black/10 px-3 py-1 text-xs uppercase tracking-wider">
                  {stat.badge}
                </div>
                <div className="mb-3">
                  <span className="text-6xl font-bold">{stat.value}</span>
                  <span className="ml-1 text-4xl font-bold">{stat.unit}</span>
                </div>
                <p className="text-sm opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-black py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">A platform designed for traders</h2>
            <p className="mx-auto max-w-2xl text-gray-400">
              Everything you need to stay informed and make better trading decisions on Kalshi
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-3xl border border-gray-800 bg-gray-900 p-8 transition-colors hover:border-[#CDFF00]"
              >
                <feature.icon className="mb-4 h-6 w-6 text-[#CDFF00]" />
                <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="leading-relaxed text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#CDFF00] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="mb-4 inline-block rounded-full bg-black px-4 py-1 text-sm font-medium text-white">
              HOW IT WORKS
            </div>
            <h2 className="mb-4 max-w-2xl text-4xl font-bold text-gray-900">Get started in minutes</h2>
            <p className="max-w-2xl text-gray-900 opacity-80">
              Connect your Kalshi account and start receiving personalized news alerts immediately. No complex setup required.
            </p>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="rounded-2xl bg-white p-6">
                <div
                  className="mb-4 text-4xl font-bold text-[#CDFF00]"
                  style={{ WebkitTextStroke: "1px black", textShadow: "1px 1px 0 black" }}
                >
                  {step.number}
                </div>
                <h4 className="mb-3 font-semibold text-gray-900">{step.title}</h4>
                <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="inline-block rounded-full bg-black px-8 py-3 font-medium text-white transition-colors hover:bg-gray-900"
          >
            Start Tracking Now
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-block rounded-full bg-[#CDFF00] px-4 py-1 text-sm font-medium text-black">
            GET STARTED
          </div>
          <h2 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">Ready to trade smarter?</h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600">
            Join thousands of Kalshi traders who never miss important news. Get personalized alerts that help you make better decisions.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#CDFF00] px-8 py-3.5 font-medium text-black transition-colors hover:bg-[#b8e600]"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-black px-8 py-3.5 font-medium text-white transition-colors hover:bg-gray-900"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-[#CDFF00]" />
                <span className="text-xl font-semibold text-white">Kalshi Tracker</span>
              </div>
              <p className="text-gray-400">
                The smartest way to track your Kalshi bets with real-time news alerts.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between border-t border-gray-800 pt-8 md:flex-row">
            <p className="mb-6 text-gray-400 md:mb-0">
              © {new Date().getFullYear()} Kalshi Tracker. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-[#CDFF00]">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
