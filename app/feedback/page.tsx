"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { submitFeedback } from "@/lib/api"
import { MessageSquare, Star, Send, CheckCircle2, AlertCircle, Lightbulb, Bug, TrendingUp, BarChart3 } from "lucide-react"

const CATEGORIES = [
  { id: "prediction", label: "Prediction Accuracy", icon: TrendingUp, description: "Feedback on match predictions" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, description: "Something you'd like to see" },
  { id: "bug", label: "Bug Report", icon: Bug, description: "Something isn't working" },
  { id: "general", label: "General Feedback", icon: MessageSquare, description: "Anything else on your mind" },
]

const PREDICTION_PROMPTS = [
  "Which prediction surprised you the most this week?",
  "Is there a team or league you'd like more coverage of?",
  "Did a High Confidence pick let you down? Tell us why you disagree.",
  "What extra data would help you trust predictions more?",
  "Which feature would make this tool more useful for you?",
]

export default function FeedbackPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [category, setCategory] = useState("general")
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [prompt, setPrompt] = useState("")

  useEffect(() => {
    setPrompt(PREDICTION_PROMPTS[Math.floor(Math.random() * PREDICTION_PROMPTS.length)])
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) { setError("Please enter a message."); return }
    setSubmitting(true); setError("")
    try {
      await submitFeedback({ name: name || undefined, email: email || undefined, category, message, rating: rating || undefined })
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setName(""); setEmail(""); setCategory("general"); setMessage("")
    setRating(0); setSubmitted(false); setError("")
    setPrompt(PREDICTION_PROMPTS[Math.floor(Math.random() * PREDICTION_PROMPTS.length)])
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[900px] px-4 lg:px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Feedback & Community</h1>
              <p className="text-sm text-muted-foreground">Your insights genuinely shape predictions</p>
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mt-4">
            <div className="flex items-start gap-2">
              <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-primary/80">
                <strong className="text-primary">How your feedback helps:</strong> Confident disagreements on predictions, local knowledge about teams, and feature suggestions are reviewed and factored into model tuning. High-quality feedback from the community directly influences future prediction weights.
              </p>
            </div>
          </div>
        </div>

        {submitted ? (
          /* Success state */
          <div className="rounded-xl border border-success/30 bg-success/5 p-10 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
            <h2 className="text-lg font-bold text-foreground mb-1">Thank you! 🎉</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your feedback has been received. We review every submission and use genuine insights to improve prediction accuracy.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="h-4 w-4" /> Submit another
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Tips */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">💡 Today's prompt</h3>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"{prompt}"</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">What matters most</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2"><span className="text-success">✓</span> Specific match disagreements with reasoning</li>
                  <li className="flex gap-2"><span className="text-success">✓</span> League-specific knowledge we might miss</li>
                  <li className="flex gap-2"><span className="text-success">✓</span> Injury / squad rotation intel</li>
                  <li className="flex gap-2"><span className="text-success">✓</span> New league or data source requests</li>
                  <li className="flex gap-2"><span className="text-success">✓</span> Odds market feature ideas</li>
                </ul>
              </div>
            </div>

            {/* Right: Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                        category === cat.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <cat.icon className="h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-none">{cat.label}</p>
                        <p className="text-[10px] mt-0.5 opacity-75">{cat.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Star rating */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Rate the predictions <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s === rating ? 0 : s)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          s <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 self-center text-xs text-muted-foreground">
                      {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Your message <span className="text-destructive">*</span></label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts, prediction disagreements, or suggestions…"
                  rows={5}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length}/1000 characters</p>
              </div>

              {/* Optional name & email in a row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">Name <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">Email <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="For follow-up only"
                    className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive bg-destructive/5 px-3 py-2 flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting…" : "Send Feedback"}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Anonymous is fine. Email is only used if we need to follow up on a bug report.
              </p>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
