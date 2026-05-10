"use client"

import { useState, Suspense } from "react"
import { useAuth, type Plan } from "@/lib/auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PricingTable } from "@/components/paywall-gate"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react"

const PAYMENT_METHODS = [
  "MTN Mobile Money",
  "Airtel Money",
  "Equity Bank",
  "ABSA Bank",
  "Bank Transfer (other)",
]

function SignupContent() {
  const { register, submitPayment } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Step 1 = create account, step 2 = choose plan & pay
  const [step, setStep] = useState<1 | 2>(searchParams.get("step") === "pay" ? 2 : 1)

  // Step 1 fields
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [step1Loading, setStep1Loading] = useState(false)
  const [step1Error, setStep1Error] = useState("")

  // Step 2 fields
  const [selectedPlan, setSelectedPlan] = useState<Plan>("basic")
  const [payRef, setPayRef] = useState("")
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0])
  const [step2Loading, setStep2Loading] = useState(false)
  const [step2Error, setStep2Error] = useState("")
  const [step2Done, setStep2Done] = useState(false)
  const [skipPay, setSkipPay] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setStep1Error("")
    if (password !== confirm) { setStep1Error("Passwords do not match."); return }
    if (password.length < 8) { setStep1Error("Password must be at least 8 characters."); return }
    setStep1Loading(true)
    try {
      await register(email, password, phone || undefined)
      setStep(2)
    } catch (err: unknown) {
      setStep1Error(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setStep1Loading(false)
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setStep2Error("")
    if (!payRef.trim() || !payAmount.trim()) { setStep2Error("Please fill in all fields."); return }
    setStep2Loading(true)
    try {
      await submitPayment(payRef, payAmount, payMethod, selectedPlan)
      setStep2Done(true)
    } catch (err: unknown) {
      setStep2Error(err instanceof Error ? err.message : "Submission failed.")
    } finally {
      setStep2Loading(false)
    }
  }

  function handleSkip() {
    setSkipPay(true)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[
            { n: 1, label: "Create account" },
            { n: 2, label: "Choose plan" },
          ].map(({ n, label }, idx) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step > n ? "bg-primary text-primary-foreground" :
                step === n ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-secondary text-muted-foreground"
              }`}>
                {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
              </div>
              <span className={`text-xs font-medium ${step >= n ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {idx < 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Create account ── */}
        {step === 1 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="text-xl font-bold text-foreground mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Get <strong>7 days free</strong> — full access, no payment required to start.
            </p>

            {step1Error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2.5 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" /> {step1Error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">Email *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">Phone <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+256 700 000 000"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">Password *</label>
                <div className="relative">
                  <input required type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">Confirm password *</label>
                <input required type={showPw ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <button type="submit" disabled={step1Loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {step1Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {step1Loading ? "Creating account…" : "Start 7-day free trial →"}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Already have an account?{" "}
              <button onClick={() => document.getElementById("login-btn")?.click()} className="text-primary hover:underline font-medium">
                Log in
              </button>
            </p>
          </div>
        )}

        {/* ── Step 2: Choose plan & pay ── */}
        {step === 2 && !step2Done && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 mb-4">
                <CheckCircle2 className="h-3.5 w-3.5" /> Account created! 7-day trial is active.
              </div>
              <h2 className="text-xl font-bold text-foreground">Choose your plan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pay after your trial ends, or subscribe now to keep access guaranteed.
              </p>
            </div>

            <PricingTable selected={selectedPlan} onSelect={setSelectedPlan} />

            {/* Payment form */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Submit your payment reference</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Send your chosen plan amount via MTN MoMo, Airtel Money, or bank transfer.
                Contact an admin for payment account details. Then enter your transaction reference below.
              </p>

              {step2Error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-3">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {step2Error}
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Transaction reference *</label>
                    <input required value={payRef} onChange={e => setPayRef(e.target.value)}
                      placeholder="e.g. ABC123456789"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Amount paid *</label>
                    <input required value={payAmount} onChange={e => setPayAmount(e.target.value)}
                      placeholder="e.g. 18000 UGX or $5"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Payment method</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Plan</label>
                    <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value as Plan)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="basic">Basic — UGX 18,000 / $5/mo</option>
                      <option value="pro">Pro — UGX 43,000 / $12/mo</option>
                      <option value="elite">Elite — UGX 72,000 / $20/mo</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={step2Loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {step2Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {step2Loading ? "Submitting…" : "Submit Payment Reference"}
                </button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Admin reviews payments within 24 hours.{" "}
                <button onClick={handleSkip} className="text-primary hover:underline">
                  Skip — use my free trial for now
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2 success ── */}
        {step2Done && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold text-foreground mb-2">Payment submitted! 🎉</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              An admin will verify your payment within 24 hours and activate your plan.
              Your 7-day trial gives you full access in the meantime.
            </p>
            <Link href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Go to Dashboard →
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
