"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import { ArrowRight, Bot, CheckCircle, LayoutDashboard, LogOut, RefreshCw, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

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
        <p className="mt-4 text-lg text-slate-600">Connecting Formations & Agora...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="#" className="flex items-center gap-4 font-bold text-lg">
            <div className="flex items-center gap-3">
              <img
                src="/formations-logo.png"
                alt="Formations Logo"
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=32&width=120&text=Formations"
                }}
              />
              <span className="text-slate-400">×</span>
              <img
                src="/agora-logo.png"
                alt="Agora Logo"
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=32&width=120&text=Agora"
                }}
              />
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="#partnership" className="transition-colors hover:text-slate-900">
              Partnership
            </Link>
            <Link href="#solution" className="transition-colors hover:text-slate-900">
              Solution
            </Link>
            <Link href="#benefits" className="transition-colors hover:text-slate-900">
              Benefits
            </Link>
            <Link href="/partnership-workflow" className="transition-colors hover:text-slate-900">
              Workflow
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
                <Button variant="outline" asChild>
                  <Link href="/partnership-workflow">
                    Workflow
                    <ArrowRight className="ml-2 h-4 w-4" />
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
          <div className="absolute inset-0 bg-[url('/modern-office.png')] bg-cover bg-center opacity-5"></div>
          <div className="container mx-auto px-4 md:px-6 text-center relative">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              Tech-Enabled 1065 Tax Preparation.
              <br />
              <span className="text-blue-600">Formations × Agora Partnership.</span>
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-slate-600">
              Formations delivers incredibly efficient 1065 tax preparation through automated inputs, automatic QA, and
              decades of tax team experience. Agora benefits from streamlined turnaround times and consistent quality tax preparation.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Access Partnership Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={handleLogin}>
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#metrics">See Results</Link>
                  </Button>
                </>
              )}
              {isAuthenticated && (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/partnership-workflow">View Workflow</Link>
                </Button>
              )}
            </div>
            {isAuthenticated && userInfo && (
              <div className="mt-8 flex justify-center items-center gap-2 text-green-600 font-semibold">
                <CheckCircle className="h-5 w-5" />
                <span>Partnership Connected. Account: {userInfo.a || "N/A"}</span>
              </div>
            )}
          </div>
        </section>

        {/* Metrics Section */}
        <section id="metrics" className="py-20 md:py-32 bg-slate-900 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold">Partnership Results</h2>
              <p className="mt-4 text-xl text-slate-300">Automated inputs. Automatic QA. Expert oversight.</p>
            </div>

            <div className="grid gap-12 md:grid-cols-3 mb-16">
              <div className="text-center">
                <div className="text-6xl md:text-8xl font-extrabold text-blue-400 mb-4">3,000+</div>
                <div className="text-xl font-semibold text-white mb-2">Annual Returns</div>
                <div className="text-slate-400">Processed efficiently through tech-enabled workflows</div>
              </div>
              <div className="text-center">
                <div className="text-6xl md:text-8xl font-extrabold text-green-400 mb-4">100%</div>
                <div className="text-xl font-semibold text-white mb-2">On-Time Filing</div>
                <div className="text-slate-400">Original deadlines met consistently</div>
              </div>
              <div className="text-center">
                <div className="text-6xl md:text-8xl font-extrabold text-yellow-400 mb-4">50%</div>
                <div className="text-xl font-semibold text-white mb-2">Faster Processing</div>
                <div className="text-slate-400">Compared to traditional tax preparation</div>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Formations</h3>
                    <p className="text-slate-400">Tech-Enabled Tax Preparation</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-300">Automated input processing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-300">Automatic quality assurance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-300">Expert tax team oversight</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-600 p-3 rounded-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Agora</h3>
                    <p className="text-slate-400">Real Estate Technology</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-300">Faster turnaround times</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-300">Consistent deadline compliance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-300">Streamlined processes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-16">
              {isAuthenticated ? (
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" asChild>
                  <Link href="/dashboard">
                    Access Partnership Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" onClick={handleLogin}>
                  Start Partnership Process
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
            <div className="flex items-center gap-3">
              <img
                src="/formations-logo.png"
                alt="Formations Logo"
                className="h-6 w-auto brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=24&width=100&text=Formations"
                }}
              />
              <span className="text-slate-500">×</span>
              <img
                src="/agora-logo.png"
                alt="Agora Logo"
                className="h-6 w-auto brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=24&width=100&text=Agora"
                }}
              />
              <span className="font-semibold text-white ml-2">Partnership</span>
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
            © {new Date().getFullYear()} Formations × Agora Partnership. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
