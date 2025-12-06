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
import { AsciiMatrixBackground } from "~/app/_components/ascii-matrix-background";

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
      <section className="relative flex min-h-[calc(100vh-88px)] items-center bg-black py-16 sm:py-32">
        <LightBeamBackground />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 z-[1] bg-black/40" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-8 text-5xl font-bold leading-tight text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)] sm:text-6xl lg:text-7xl">
              The World&apos;s First Prediction Market Tracking Tool
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
        {/* ASCII Matrix Background */}
        <AsciiMatrixBackground />
        {/* Animated background gradient orbs */}
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#CDFF00] opacity-10 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-500 opacity-10 blur-[120px]"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Title Section - Now at Top */}
          <div className="mb-20 text-center">
            <span className="mb-4 inline-block rounded-full border border-gray-700 bg-gray-800/50 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gray-400">
              Transformation
            </span>
            <h2 className="mb-6 text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
              Before
              <span className="text-[#CDFF00]"> &amp; </span>
              After
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-400">
              Stop scrolling through Twitter hoping to catch breaking news.<br className="hidden sm:block" />
              Get instant alerts matched to your open positions.
            </p>
          </div>

          {/* Mockup Screenshots */}
          <div className="relative flex flex-col items-center justify-center gap-12 lg:flex-row lg:items-start lg:gap-8">
            {/* Hand-drawn decorative arrow - top */}
            <svg className="absolute -top-16 left-1/2 hidden h-20 w-32 -translate-x-1/2 text-[#CDFF00]/40 lg:block" viewBox="0 0 128 80">
              <path d="M20 60 C40 20, 80 20, 108 50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" />
              <path d="M100 42 L108 50 L98 54" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Before Mockup */}
            <div className="group relative w-full max-w-lg">
              {/* Label */}
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">✕</span>
                <span className="text-lg font-semibold text-gray-400">Without Kalshi Tracker</span>
              </div>
              {/* Card with perspective */}
              <div className="relative transform transition-all duration-500 [transform-style:preserve-3d] group-hover:scale-[1.02] lg:-rotate-2 lg:group-hover:rotate-0">
                {/* Shadow/glow */}
                <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-2xl bg-red-500/5 blur-xl"></div>
                <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="ml-4 flex-1 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-500">
                      twitter.com/search?q=kalshi+news
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6">
                    {/* Multiple tweet skeletons */}
                    {[1, 2].map((i) => (
                      <div key={i} className={`${i > 1 ? "mt-4 border-t border-gray-800 pt-4" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-800"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-20 rounded bg-gray-700"></div>
                              <div className="h-2 w-12 rounded bg-gray-800"></div>
                            </div>
                            <div className="mt-2 space-y-1.5">
                              <div className="h-3 w-full rounded bg-gray-800"></div>
                              <div className="h-3 w-4/5 rounded bg-gray-800"></div>
                            </div>
                            <div className="mt-3 flex gap-6">
                              <div className="h-4 w-8 rounded bg-gray-800"></div>
                              <div className="h-4 w-8 rounded bg-gray-800"></div>
                              <div className="h-4 w-8 rounded bg-gray-800"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Warning banner */}
                    <div className="mt-6 rounded-xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-red-600/5 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">😰</span>
                        <div>
                          <p className="text-sm font-medium text-red-400">News is 2+ hours old</p>
                          <p className="text-xs text-gray-500">Market already moved. You missed it.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Arrow */}
            <div className="flex flex-col items-center justify-center py-4 lg:py-20">
              <svg className="h-16 w-16 rotate-90 text-[#CDFF00] lg:h-24 lg:w-24 lg:rotate-0" viewBox="0 0 100 50">
                <path
                  d="M5 25 C20 10, 40 10, 50 25 C60 40, 80 40, 95 25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                />
                <path d="M85 18 L95 25 L85 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* After Mockup */}
            <div className="group relative w-full max-w-lg">
              {/* Label */}
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CDFF00]/20 text-sm font-bold text-[#CDFF00]">✓</span>
                <span className="text-lg font-semibold text-white">With Kalshi Tracker</span>
              </div>
              {/* Card with perspective */}
              <div className="relative transform transition-all duration-500 [transform-style:preserve-3d] group-hover:scale-[1.02] lg:rotate-2 lg:group-hover:rotate-0">
                {/* Glow effect */}
                <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-2xl bg-[#CDFF00]/10 blur-xl"></div>
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#CDFF00]/30 via-transparent to-[#CDFF00]/10"></div>
                <div className="relative overflow-hidden rounded-2xl border border-[#CDFF00]/20 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl shadow-[#CDFF00]/5">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="ml-4 flex-1 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-500">
                      kalshitracker.com/dashboard
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#CDFF00]" />
                        <span className="font-semibold text-white">Your Alerts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#CDFF00] opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#CDFF00]"></span>
                        </span>
                        <span className="text-xs font-medium text-[#CDFF00]">Live</span>
                      </div>
                    </div>
                    {/* Alert Cards */}
                    <div className="space-y-3">
                      <div className="rounded-xl border border-[#CDFF00]/30 bg-[#CDFF00]/5 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#CDFF00]">🔔 Breaking: Fed Rate Decision</span>
                          <span className="rounded-full bg-[#CDFF00]/20 px-2 py-0.5 text-xs font-medium text-[#CDFF00]">2s ago</span>
                        </div>
                        <p className="text-sm text-gray-300">Federal Reserve holds rates steady at 5.25%...</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">FED-RATE</span>
                          <span className="text-xs text-[#CDFF00]">+12% position impact</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-300">📊 BTC Price Movement</span>
                          <span className="text-xs text-gray-500">1m ago</span>
                        </div>
                        <p className="text-sm text-gray-400">Your BTCUSD position affected by...</p>
                      </div>
                    </div>
                    {/* Success banner */}
                    <div className="mt-5 rounded-xl border border-[#CDFF00]/30 bg-gradient-to-r from-[#CDFF00]/10 to-[#CDFF00]/5 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🚀</span>
                        <div>
                          <p className="text-sm font-medium text-[#CDFF00]">You&apos;re 2 hours ahead</p>
                          <p className="text-xs text-gray-400">React before the market moves.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-[#CDFF00] px-10 py-4 text-lg font-semibold text-black transition-all hover:bg-[#b8e600] hover:shadow-lg hover:shadow-[#CDFF00]/20"
            >
              Start Trading Smarter
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 text-sm text-gray-500">Free to start. No credit card required.</p>
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
