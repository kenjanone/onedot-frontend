"use client"

import { useAuth, type FeatureKey, type Plan } from "@/lib/auth"
import Link from "next/link"
import { Lock, Zap, Star, Crown, AlertTriangle, Clock } from "lucide-react"
import { useState } from "react"

// ── Pricing data ─────────────────────────────────────────────────────────────

const PLANS: {
  key: Plan
  label: string
  price: string
  ugx: string
  features: string[]
  icon: React.ElementType
  highlight?: boolean
}[] = [
  {
    key: "basic",
    label: "Basic",
    price: "$5",
    ugx: "UGX 18,000",
    icon: Zap,
    features: [
      "Match fixtures & results",
      "League standings",
      "AI predictions",
      "Free verified picks (homepage)",
      "Community feedback",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    price: "$12",
    ugx: "UGX 43,000",
    icon: Star,
    highlight: true,
    features: [
      "Everything in Basic",
      "Squad stats & analysis",
      "Markets & odds insights",
      "Home/Away split stats",
      "Head-to-Head comparison",
      "Player statistics",
    ],
  },
  {
    key: "elite",
    label: "Elite",
    price: "$20",
    ugx: "UGX 72,000",
    icon: Crown,
    features: [
      "Everything in Pro",
      "Data sync & management",
      "Performance analytics",
      "Priority feedback responses",
      "Early access to new features",
    ],
  },
]

const PAYMENT_METHODS = [
  "MTN Mobile Money",
  "Airtel Money",
  "Equity Bank",
  "ABSA Bank",
  "Bank Transfer (other)",
]

// Payment details — update these with real numbers
const PAYMENT_DETAILS = {
  mtn: "Contact admin for payment number",
  bank: "Account details provided by admin",
}

// ── PaywallGate component ────────────────────────────────────────────────────

interface PaywallGateProps {
  feature: FeatureKey
  children: React.ReactNode
  /** Optional description to show on the gate screen */
  featureLabel?: string
}

export function PaywallGate({ feature, children, featureLabel }: PaywallGateProps) {
  const { user, hasAccess, canAccess, trialDaysLeft, token, submitPayment } = useAuth()

  // Not logged in — always show gate
  if (!user) return <NotLoggedInGate />

  // Logged in and can access this feature — show content
  if (canAccess(feature)) {
    return (
      <>
        {/* Trial warning banner */}
        {trialDaysLeft > 0 && trialDaysLeft <= 3 && (
          <div className="sticky top-14 z-40 flex items-center justify-between gap-3 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-600">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</strong> left in your free trial.
              </span>
            </div>
            <Link href="/signup?step=pay" className="font-semibold underline hover:text-amber-700">
              Subscribe now →
            </Link>
          </div>
        )}
        {children}
      </>
    )
  }

  // Has access but feature requires higher plan
  if (hasAccess) return <UpgradeGate feature={feature} featureLabel={featureLabel} />

  // Expired trial or no active subscription
  return (
    <ExpiredGate
      token={token}
      onPaymentSubmit={submitPayment}
      trialExpired={!!(user && !hasAccess && user.trial_expires_at && new Date(user.trial_expires_at) < new Date())}
    />
  )
}

// ── Not logged in ─────────────────────────────────────────────────────────────

function NotLoggedInGate() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Sign in to access this page</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Get a <strong>7-day free trial</strong> with full access — no payment required to start.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start free trial
        </Link>
        <button
          id="gate-login-btn"
          onClick={() => document.getElementById("login-btn")?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
        >
          Log in
        </button>
      </div>
    </div>
  )
}

// ── Upgrade required ──────────────────────────────────────────────────────────

function UpgradeGate({ feature, featureLabel }: { feature: FeatureKey; featureLabel?: string }) {
  const { userPlan } = useAuth()
  const label = featureLabel || feature.replace(/_/g, " ")

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
        <Crown className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Upgrade to access {label}</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        Your current <strong className="capitalize">{userPlan}</strong> plan doesn't include this feature.
        Subscribe to a higher plan to unlock it.
      </p>
      <PricingTable highlightUpgrade />
    </div>
  )
}

// ── Expired / no active plan ──────────────────────────────────────────────────

function ExpiredGate({
  token,
  onPaymentSubmit,
  trialExpired,
}: {
  token: string | null
  onPaymentSubmit: (ref: string, amount: string, method: string, plan: any) => Promise<void>
  trialExpired: boolean
}) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("basic")
  const [ref, setRef] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ref.trim() || !amount.trim()) { setError("Please fill in all fields."); return }
    setLoading(true); setError("")
    try {
      await onPaymentSubmit(ref, amount, method, selectedPlan)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
          <Star className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Payment submitted! 🎉</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          An admin will verify your payment within 24 hours and activate your plan.
          You'll have full access as soon as it's confirmed.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] px-4 py-12 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4 mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {trialExpired ? "Your free trial has ended" : "Subscribe to continue"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {trialExpired
            ? "Your 7-day trial is over. Subscribe to keep accessing PlusOne."
            : "Subscribe to access this content."}
        </p>
      </div>

      <PricingTable selected={selectedPlan} onSelect={setSelectedPlan} />

      {/* Payment form */}
      <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Submit payment reference</h3>
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary/80">
          <strong>Payment instructions:</strong> Send the amount for your chosen plan via MTN MoMo, Airtel Money, or bank transfer.
          Contact admin for the payment number / bank account details. Then enter your transaction reference below.
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Transaction reference *</label>
            <input required value={ref} onChange={e => setRef(e.target.value)}
              placeholder="e.g. ABC123456789"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Amount paid *</label>
            <input required value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 18000 UGX or $5"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Payment method *</label>
            <select value={method} onChange={e => setMethod(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Plan selected</label>
            <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value as Plan)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              {PLANS.map(p => <option key={p.key} value={p.key}>{p.label} — {p.ugx} / {p.price}/mo</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {loading ? "Submitting…" : "Submit Payment Reference"}
        </button>
      </form>
    </div>
  )
}

// ── Pricing Table (reusable) ──────────────────────────────────────────────────

export function PricingTable({
  selected,
  onSelect,
  highlightUpgrade,
}: {
  selected?: Plan
  onSelect?: (p: Plan) => void
  highlightUpgrade?: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {PLANS.map((plan) => {
        const Icon = plan.icon
        const isSelected = selected === plan.key
        return (
          <div
            key={plan.key}
            onClick={() => onSelect?.(plan.key)}
            className={`relative rounded-xl border p-4 flex flex-col gap-3 cursor-pointer transition-all ${
              isSelected
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : plan.highlight
                ? "border-primary/40 bg-card hover:border-primary/70"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-2.5 py-0.5">
                POPULAR
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isSelected ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{plan.label}</p>
                <p className="text-[11px] text-muted-foreground">{plan.ugx} / {plan.price} /mo</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {onSelect && (
              <div className={`rounded-lg text-center py-1.5 text-xs font-semibold transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                {isSelected ? "Selected" : "Choose"}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
