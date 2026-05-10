"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "https://onedot.onrender.com"

// ── Types ───────────────────────────────────────────────────────────────────

export type Plan = "trial" | "basic" | "pro" | "elite" | "admin"

export interface AuthUser {
  id: number
  email: string
  role: "user" | "admin"
  plan: Plan
  phone?: string | null
  is_active: boolean
  trial_expires_at?: string | null
  subscription_expires_at?: string | null
  payment_ref?: string | null
  payment_method?: string | null
  payment_amount?: string | null
  created_at?: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  isAdmin: boolean
  hasAccess: boolean
  userPlan: Plan
  trialDaysLeft: number
  canAccess: (feature: FeatureKey) => boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, phone?: string) => Promise<AuthUser>
  submitPayment: (ref: string, amount: string, method: string, plan: Plan) => Promise<void>
  logout: () => void
}

// ── Feature → minimum plan map ──────────────────────────────────────────────

export type FeatureKey =
  | "predictions"
  | "standings"
  | "matches"
  | "free_picks"
  | "squad_stats"
  | "markets"
  | "home_away_split"
  | "head_to_head"
  | "players"
  | "sync"
  | "performance"
  | "admin"

const PLAN_ORDER: Record<Plan, number> = {
  trial: 0,
  basic: 1,
  pro: 2,
  elite: 3,
  admin: 4,
}

const FEATURE_MIN_PLAN: Record<FeatureKey, Plan> = {
  free_picks:       "trial",   // visible to all (incl. not logged in = shown as sample)
  predictions:      "basic",
  standings:        "basic",
  matches:          "basic",
  squad_stats:      "pro",
  markets:          "pro",
  home_away_split:  "pro",
  head_to_head:     "pro",
  players:          "pro",
  sync:             "elite",
  performance:      "elite",
  admin:            "admin",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeAccess(user: AuthUser | null): {
  hasAccess: boolean
  trialDaysLeft: number
} {
  if (!user) return { hasAccess: false, trialDaysLeft: 0 }
  if (user.role === "admin" || user.plan === "admin") return { hasAccess: true, trialDaysLeft: 0 }

  const now = Date.now()

  // Active subscription check
  if (user.is_active && user.subscription_expires_at) {
    if (new Date(user.subscription_expires_at).getTime() > now) {
      return { hasAccess: true, trialDaysLeft: 0 }
    }
  }

  // Trial check
  if (user.trial_expires_at) {
    const trialMs = new Date(user.trial_expires_at).getTime() - now
    const trialDaysLeft = Math.max(0, Math.ceil(trialMs / (1000 * 60 * 60 * 24)))
    if (trialMs > 0) return { hasAccess: true, trialDaysLeft }
  }

  return { hasAccess: false, trialDaysLeft: 0 }
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("plusone_token") : null
    if (!stored) { setLoading(false); return }
    setToken(stored)
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("session expired")
        const data = await res.json()
        setUser(data as AuthUser)
      })
      .catch(() => {
        localStorage.removeItem("plusone_token")
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || "Login failed")
    localStorage.setItem("plusone_token", data.token)
    setToken(data.token)
    setUser(data.user as AuthUser)
  }

  const register = async (email: string, password: string, phone?: string): Promise<AuthUser> => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, phone: phone || null }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || "Registration failed")
    localStorage.setItem("plusone_token", data.token)
    setToken(data.token)
    setUser(data.user as AuthUser)
    return data.user as AuthUser
  }

  const submitPayment = async (ref: string, amount: string, method: string, plan: Plan) => {
    if (!token) throw new Error("Not logged in")
    const res = await fetch(`${API}/api/auth/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_ref: ref, payment_amount: amount, payment_method: method, plan }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || "Failed to submit payment")
    setUser(data.user as AuthUser)
  }

  const logout = () => {
    localStorage.removeItem("plusone_token")
    setToken(null)
    setUser(null)
  }

  const isAdmin = user?.role === "admin" || user?.plan === "admin"
  const { hasAccess, trialDaysLeft } = computeAccess(user)
  const userPlan: Plan = user?.plan ?? "trial"

  const canAccess = (feature: FeatureKey): boolean => {
    if (!user) return false
    if (isAdmin) return true
    if (!hasAccess) return false
    const minPlan = FEATURE_MIN_PLAN[feature]
    const minOrder = PLAN_ORDER[minPlan]
    // Trial = basic access for the duration
    const effectivePlan: Plan = trialDaysLeft > 0 ? "basic" : userPlan
    return PLAN_ORDER[effectivePlan] >= minOrder
  }

  return (
    <AuthContext.Provider
      value={{
        user, token, loading, isAdmin, hasAccess,
        userPlan, trialDaysLeft, canAccess,
        login, register, submitPayment, logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
