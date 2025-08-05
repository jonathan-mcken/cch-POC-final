"use client"

import { useState, useEffect } from "react"
import type React from "react"

import Link from "next/link"
import {
  ArrowRight,
  Bot,
  CheckCircle,
  GanttChartSquare,
  Layers,
  LayoutDashboard,
  LinkIcon,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
        setUserInfo(data.user)
      } else {
        setIsAuthenticated(false)
        setUserInfo(null)
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
      setIsAuthenticated(false)
      setUserInfo(null)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const handleLogin = () => {
    window.location.href = "/api/auth/login"
  }

  const handleLogout = async () => {
    try {
      setIsAuthenticated(false)
      setUserInfo(null)
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (response.ok) {
        const data = await response.json()
        if (data.logoutUrl) {
          window.location.href = data.logoutUrl
        } else {
          // Fallback if no logout URL is provided
          window.location.reload()
        }
      }
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  if (isChecking) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-600" />
        <p className="mt-4 text-lg text-slate-600">Initializing Platform...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="#" className="flex items-center gap-2 font-bold text-lg">
            <Layers className="h-6 w-6 text-slate-900" />
            <span>Axcess Automate</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="#features" className="transition-colors hover:text-slate-900">
              Features
            </Link>
            <Link href="#solution" className="transition-colors hover:text-slate-900">
              Solution
            </Link>
            <Link href="#roi" className="transition-colors hover:text-slate-900">
              ROI
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={handleLogin}>
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-white">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-5"></div>
          <div className="container mx-auto px-4 md:px-6 text-center relative">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              Automate Your Tax Workflow. Seamlessly.
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-slate-600">
              The first platform to bridge CCH Axcess, Formations, and Hurdlr. Generate accurate, up-to-date tax returns
              using live financial data.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={handleLogin}>
                    Sign in with CCH Axcess
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#features">Learn More</Link>
                  </Button>
                </>
              )}
            </div>
            {isAuthenticated && userInfo && (
              <div className="mt-8 flex justify-center items-center gap-2 text-green-600 font-semibold">
                <CheckCircle className="h-5 w-5" />
                <span>Platform Connected. Account: {userInfo.a || "N/A"}</span>
              </div>
            )}
            <div className="mt-12 text-sm font-semibold text-slate-500">INTEGRATED WITH YOUR FAVORITE PLATFORMS</div>
            <div className="mt-4 flex justify-center items-center gap-8 opacity-70">
              <span className="font-bold text-lg">CCH Axcess</span>
              <span className="font-bold text-lg">Formations</span>
              <span className="font-bold text-lg">Hurdlr</span>
            </div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section id="solution" className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">From Manual Chaos to Automated Clarity</h2>
              <p className="mt-4 max-w-2xl mx-auto text-slate-600">
                Stop wasting 80% of your prep time on manual data entry. Our platform eliminates errors,
                inconsistencies, and version control nightmares.
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-2 gap-8 items-center">
              <div className="rounded-lg border bg-white p-8">
                <h3 className="text-2xl font-semibold text-slate-800">The Old Way</h3>
                <ul className="mt-4 space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">❌</span>
                    <span>Hours of manual data entry and re-entry.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">❌</span>
                    <span>Outdated financial data leading to inaccurate returns.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">❌</span>
                    <span>Juggling multiple systems, causing inefficiency.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">❌</span>
                    <span>Complex and error-prone version control.</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border-2 border-slate-900 bg-white p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold text-slate-900">The Axcess Automate Way</h3>
                <ul className="mt-4 space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✅</span>
                    <span>Real-time data synchronization from all your sources.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✅</span>
                    <span>Intelligent, automated tax return generation (V2).</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✅</span>
                    <span>Direct, secure integration with CCH Axcess.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✅</span>
                    <span>Complete visibility with real-time status tracking.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">A Smarter Way to Manage Tax Returns</h2>
              <p className="mt-4 max-w-2xl mx-auto text-slate-600">
                Our platform is packed with features designed to maximize your firm's efficiency and accuracy.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<RefreshCw className="h-8 w-8 text-slate-900" />}
                title="Real-Time Data Sync"
                description="Automatically pull current financial data from Hurdlr and business details from Formations. Your returns always reflect the latest information."
              />
              <FeatureCard
                icon={<Bot className="h-8 w-8 text-slate-900" />}
                title="Intelligent Return Generation"
                description="Create new tax return versions (V2) using live data. Our smart mapping ensures data is placed correctly, maintaining form structure and compliance."
              />
              <FeatureCard
                icon={<LinkIcon className="h-8 w-8 text-slate-900" />}
                title="Direct CCH Axcess Integration"
                description="Seamless, secure OAuth 2.0 integration with the industry-standard tax software. Handle batch processing for multiple returns with ease."
              />
              <FeatureCard
                icon={<GanttChartSquare className="h-8 w-8 text-slate-900" />}
                title="Complete Process Visibility"
                description="A centralized dashboard provides real-time status tracking for all operations, with detailed progress monitoring and error reporting."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-8 w-8 text-slate-900" />}
                title="Enterprise-Grade Security"
                description="Industry-standard OAuth, data encryption in transit and at rest, and comprehensive audit trails ensure your data and your clients' data is always protected."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-slate-900" />}
                title="One-Click Export"
                description="Effortlessly download existing or newly generated returns from CCH Axcess with automatic file management and organization."
              />
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section id="roi" className="py-16 md:py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold">Unlock Unprecedented Business Value</h2>
              <p className="mt-4 max-w-2xl mx-auto text-slate-300">
                Transform your practice with measurable improvements in efficiency, client service, and scalability.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="text-center p-6">
                <p className="text-5xl md:text-6xl font-extrabold text-white">70-80%</p>
                <p className="mt-2 text-lg font-medium text-slate-300">Reduction in Prep Time</p>
              </div>
              <div className="text-center p-6">
                <p className="text-5xl md:text-6xl font-extrabold text-white">3x</p>
                <p className="mt-2 text-lg font-medium text-slate-300">More Clients, Same Staff</p>
              </div>
              <div className="text-center p-6">
                <p className="text-5xl md:text-6xl font-extrabold text-white">99.9%</p>
                <p className="mt-2 text-lg font-medium text-slate-300">Accuracy via Automation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Ready to Revolutionize Your Tax Practice?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-600">
              Get started today and experience the future of automated tax preparation. Stop chasing data and start
              advising clients.
            </p>
            <div className="mt-8">
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Access Your Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" onClick={handleLogin}>
                  Start Automating Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-800 text-slate-300">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-white" />
              <span className="font-semibold text-white">Axcess Automate</span>
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-sm hover:text-white">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-700 pt-6">
            © {new Date().getFullYear()} Axcess Automate. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="bg-slate-200 p-3 rounded-lg">{icon}</div>
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">{description}</p>
      </CardContent>
    </Card>
  )
}
