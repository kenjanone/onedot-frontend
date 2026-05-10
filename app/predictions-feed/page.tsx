"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getMarketsUpcoming, getPublicPredictions, getUpcomingPredictions, getLeagues, getMatchPreview } from "@/lib/api"
import {
  Sparkles, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
  RefreshCw, AlertCircle, Target, Zap, Clock, Trophy, BarChart3,
  ChevronRight, Shield, Calendar, ArrowRight, Activity,
} from "lucide-react"
import Image from "next/image"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prediction {
  predicted_outcome: string
  confidence: string
  confidence_score: number
  probabilities: { home_win: number; draw: number; away_win: number }
  expected_goals?: { home_xg: number; away_xg: number; predicted_score: string }
  match?: {
    match_id?: number
    home_team: string
    away_team: string
    home_team_id?: number
    away_team_id?: number
    home_logo?: string
    away_logo?: string
    league: string
    league_id?: number
    date?: string
    match_date?: string
    gameweek?: number | string
    season?: string
  }
  key_factors?: string[]
  h2h?: { home_wins: number; draws: number; away_wins: number; last_5?: string[] }
  team_comparison?: {
    home?: { clean_sheet_rate?: number; blank_rate?: number; form_score?: number }
    away?: { clean_sheet_rate?: number; blank_rate?: number; form_score?: number }
  }
  bet_recommendations?: Array<{ bet: string; prob: number | null; tier: string }>
  model_breakdown?: any
  engine?: string
}

interface FormResult { date: string | null; gameweek?: number; opponent: string; venue: "H" | "A"; score: string; result: "W" | "D" | "L"; league: string }
interface UpcomingFx   { date: string | null; gameweek?: number; opponent: string; venue: "H" | "A"; league: string }
interface TeamStats    { played: number; wins: number; draws: number; losses: number; goals_for: number; goals_against: number; avg_goals_for: number; avg_goals_against: number; clean_sheets: number; clean_sheet_pct: number }
interface H2HMatch     { date: string | null; home_team: string; away_team: string; score: string; result: "H" | "A" | "D"; league: string; gameweek?: number }
interface MatchPreview {
  home: { form: FormResult[]; stats: TeamStats; upcoming: UpcomingFx[] }
  away: { form: FormResult[]; stats: TeamStats; upcoming: UpcomingFx[] }
  h2h:  { summary: { home_wins: number; draws: number; away_wins: number; total: number }; matches: H2HMatch[] }
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return "TBD"
  const dt = new Date(d + (!d.includes("T") ? "T12:00:00" : ""))
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

function ResultBadge({ r }: { r: "W" | "D" | "L" }) {
  const c = r === "W" ? "bg-emerald-500 text-white" : r === "L" ? "bg-rose-500 text-white" : "bg-secondary text-muted-foreground"
  return <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-black ${c}`}>{r}</span>
}

function VenueBadge({ v }: { v: "H" | "A" }) {
  return <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${v === "H" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{v}</span>
}

function OutcomeBadge({ outcome, confidence }: { outcome: string; confidence: string }) {
  const colours: Record<string, string> = {
    "Home Win": "bg-primary/15 text-primary border-primary/30",
    "Draw":     "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "Away Win": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  }
  const icons: Record<string, JSX.Element> = {
    "Home Win": <TrendingUp className="h-3 w-3" />,
    "Draw":     <Minus className="h-3 w-3" />,
    "Away Win": <TrendingDown className="h-3 w-3" />,
  }
  const confColour = confidence === "High" ? "text-emerald-400" : confidence === "Medium" ? "text-amber-400" : "text-muted-foreground"
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${colours[outcome] || "bg-secondary text-muted-foreground"}`}>
        {icons[outcome]}{outcome}
      </span>
      <span className={`text-[10px] font-semibold ${confColour}`}>{confidence} Confidence</span>
    </div>
  )
}

function ProbBar({ label, value, colour }: { label: string; value: number; colour: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-xs font-mono font-bold text-foreground">{pct}%</span>
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground leading-none text-center">{label}</span>
    </div>
  )
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const colour = pct >= 60 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-muted-foreground/50"
  return (
    <div className="flex items-center gap-2 w-full max-w-[120px]">
      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono">{pct}%</span>
    </div>
  )
}

function BetBadge({ bet, tier }: { bet: string; tier: string }) {
  const styles: Record<string, string> = {
    high:       "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    medium:     "bg-primary/10 border-primary/30 text-primary",
    btts:       "bg-sky-500/10 border-sky-500/30 text-sky-400",
    draw_value: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  }
  return <div className={`rounded-md border px-3 py-2 text-xs font-medium leading-snug ${styles[tier] || "bg-secondary border-border text-muted-foreground"}`}>{bet}</div>
}

// ─── Team section inside expanded card ───────────────────────────────────────

function TeamSection({ name, side, preview, homeName, awayName }: {
  name: string; side: "home" | "away"; preview: MatchPreview; homeName: string; awayName: string
}) {
  const data  = preview[side]
  const stats = data.stats || {}
  const form  = data.form  || []
  const upcoming = data.upcoming || []
  const accentColour = side === "home" ? "text-primary" : "text-sky-400"
  const borderColour = side === "home" ? "border-primary/20" : "border-sky-500/20"
  const bgColour     = side === "home" ? "bg-primary/5"     : "bg-sky-500/5"

  return (
    <div className={`rounded-lg border ${borderColour} ${bgColour} p-4 space-y-4`}>
      <p className={`text-xs font-black uppercase tracking-wider ${accentColour}`}>{name}</p>

      {/* Season Stats */}
      {stats.played > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Season Record</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[
              ["P", stats.played],
              ["W", stats.wins],
              ["D", stats.draws],
              ["L", stats.losses],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-md bg-card/60 border border-border p-2 text-center">
                <p className="text-sm font-black text-foreground font-mono">{v}</p>
                <p className="text-[9px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md bg-card/60 border border-border p-2 text-center">
              <p className="text-xs font-bold text-emerald-400 font-mono">{stats.avg_goals_for}</p>
              <p className="text-[9px] text-muted-foreground">Avg GF</p>
            </div>
            <div className="rounded-md bg-card/60 border border-border p-2 text-center">
              <p className="text-xs font-bold text-rose-400 font-mono">{stats.avg_goals_against}</p>
              <p className="text-[9px] text-muted-foreground">Avg GA</p>
            </div>
            <div className="rounded-md bg-card/60 border border-border p-2 text-center">
              <p className="text-xs font-bold text-foreground font-mono">{stats.clean_sheet_pct}%</p>
              <p className="text-[9px] text-muted-foreground">Clean Sheets</p>
            </div>
          </div>
        </div>
      )}

      {/* Last 5 Form */}
      {form.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Last {form.length} Results
          </p>
          <div className="flex gap-1.5 mb-2">
            {form.map((f, i) => <ResultBadge key={i} r={f.result} />)}
          </div>
          <div className="space-y-1.5">
            {form.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ResultBadge r={f.result} />
                  <VenueBadge v={f.venue} />
                  <span className="text-foreground font-medium truncate">{f.opponent}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="font-mono font-bold text-foreground">{f.score}</span>
                  <span className="text-[10px] text-muted-foreground">{fmtDate(f.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Next {upcoming.length} Fixtures
          </p>
          <div className="space-y-1.5">
            {upcoming.map((u, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <VenueBadge v={u.venue} />
                  <span className="text-foreground truncate">{u.opponent}</span>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{fmtDate(u.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ pred, rank }: { pred: Prediction; rank: number }) {
  const [open,    setOpen]    = useState(false)
  const [preview, setPreview] = useState<MatchPreview | null>(null)
  const [prevLoading, setPrevLoading] = useState(false)

  const match = pred.match || {}
  const probs = pred.probabilities || { home_win: 0.33, draw: 0.33, away_win: 0.34 }
  const xg    = pred.expected_goals || null
  const bets  = pred.bet_recommendations || []
  const factors = pred.key_factors || []
  const breakdown = pred.model_breakdown || null

  const homeId = match.home_team_id
  const awayId = match.away_team_id

  // Lazy-load preview when first expanded, only if we have team IDs
  const onToggle = useCallback(async () => {
    const next = !open
    setOpen(next)
    if (next && !preview && homeId && awayId && !prevLoading) {
      setPrevLoading(true)
      try {
        const data = await getMatchPreview(homeId, awayId)
        setPreview(data)
      } catch { /* preview unavailable — still show base info */ }
      finally { setPrevLoading(false) }
    }
  }, [open, preview, homeId, awayId, prevLoading])

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 ${open ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border hover:border-border/60"}`}>

      {/* ── Card header (always visible) ─────────────────────────────── */}
      <button className="w-full text-left" onClick={onToggle} aria-expanded={open}>
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          {/* Rank */}
          <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground mt-0.5">{rank}</div>

          {/* Teams + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold text-primary truncate">{match.league}</span>
              {match.gameweek && <span className="text-[10px] text-muted-foreground">· GW{match.gameweek}</span>}
              {match.season   && <span className="text-[10px] text-muted-foreground">· {match.season}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-sm font-semibold text-foreground leading-tight truncate">{match.home_team}</span>
                <div className="w-6 h-6 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center relative shrink-0">
                   <Image src={match.home_logo || "/placeholder-logo.png"} alt={match.home_team} fill sizes="24px" className="object-contain p-0.5" />
                </div>
              </div>
              
              <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">vs</span>
              
              <div className="flex items-center gap-2 flex-1 justify-start">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center relative shrink-0">
                   <Image src={match.away_logo || "/placeholder-logo.png"} alt={match.away_team} fill sizes="24px" className="object-contain p-0.5" />
                </div>
                <span className="text-sm font-semibold text-foreground leading-tight truncate">{match.away_team}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3 inline-block" />
              {fmtDate(match.date || match.match_date)}
            </p>
          </div>

          {/* Outcome badge */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <OutcomeBadge outcome={pred.predicted_outcome} confidence={pred.confidence} />
            <ConfidenceBar score={pred.confidence_score} />
          </div>

          {/* Chevron */}
          <div className="flex-shrink-0 mt-1 text-muted-foreground">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Probability bars */}
        <div className="flex items-end gap-3 px-5 pb-4 pt-0">
          <ProbBar label={match.home_team || "Home"} value={probs.home_win} colour="bg-primary" />
          <ProbBar label="Draw"                      value={probs.draw}     colour="bg-amber-500" />
          <ProbBar label={match.away_team || "Away"} value={probs.away_win} colour="bg-sky-500" />
        </div>
      </button>

      {/* ── Expanded detail ──────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-border bg-secondary/5 px-5 py-5 space-y-6">

          {/* 1. xG & Predicted Score */}
          {xg && (
            <div className="rounded-lg border border-border bg-card px-4 py-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Expected Goals (xG) · Predicted Score</p>
              <div className="flex items-center justify-between gap-3">
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">{xg.home_xg}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{match.home_team}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground mb-1">Predicted</span>
                  <span className="text-xl font-bold text-foreground font-mono px-4 py-1.5 rounded-lg border border-border">{xg.predicted_score}</span>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-sky-400">{xg.away_xg}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{match.away_team}</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Team detail (form, stats, upcoming) — lazy loaded */}
          {prevLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading team detail…
            </div>
          )}

          {preview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TeamSection name={match.home_team || "Home"} side="home" preview={preview} homeName={match.home_team || ""} awayName={match.away_team || ""} />
              <TeamSection name={match.away_team || "Away"} side="away" preview={preview} homeName={match.home_team || ""} awayName={match.away_team || ""} />
            </div>
          )}

          {/* 3. Head-to-Head table */}
          {preview && preview.h2h.matches.length > 0 && (
            <div className="rounded-lg border border-border bg-card px-4 py-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" /> Head to Head — Last {preview.h2h.matches.length} Meetings
              </p>
              {/* Summary */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center flex-1">
                  <p className="text-2xl font-black text-primary">{preview.h2h.summary.home_wins}</p>
                  <p className="text-[10px] text-muted-foreground">{match.home_team?.split(" ")[0]}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-black text-muted-foreground">{preview.h2h.summary.draws}</p>
                  <p className="text-[10px] text-muted-foreground">Draws</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-black text-sky-400">{preview.h2h.summary.away_wins}</p>
                  <p className="text-[10px] text-muted-foreground">{match.away_team?.split(" ")[0]}</p>
                </div>
              </div>
              {/* Results table */}
              <div className="space-y-1.5">
                {preview.h2h.matches.map((h, i) => {
                  const outcome = h.result === "H" ? match.home_team : h.result === "A" ? match.away_team : "Draw"
                  const outcomeColour = h.result === "H" ? "text-primary" : h.result === "A" ? "text-sky-400" : "text-muted-foreground"
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                      <span className="text-muted-foreground w-20 flex-shrink-0">{fmtDate(h.date)}</span>
                      <span className="flex-1 truncate text-foreground font-medium">{h.home_team} <span className="text-muted-foreground">vs</span> {h.away_team}</span>
                      <span className="font-mono font-bold text-foreground">{h.score}</span>
                      <span className={`font-semibold flex-shrink-0 ${outcomeColour}`}>{outcome}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. Key Factors */}
          {factors.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Target className="h-3 w-3" /> Key Deciding Factors
              </p>
              <ul className="space-y-1.5">
                {factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. Consensus Model Breakdown */}
          {breakdown && Object.keys(breakdown).length > 0 && (
            <div className="rounded-lg border border-border bg-card px-4 py-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Model Breakdown (Consensus Engine)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Model", "Weight", "Home Win", "Draw", "Away Win"].map(h => (
                        <th key={h} className="py-2 text-muted-foreground font-medium text-right first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Dixon-Coles", breakdown.dc, pred.weights?.dc],
                      ["XGBoost ML",  breakdown.ml, pred.weights?.ml],
                      ["Rule-based",  breakdown.legacy, pred.weights?.legacy],
                      ["Enrichment",  breakdown.enrichment, pred.weights?.enrichment],
                    ].map(([name, m, w]: any) => m && (
                      <tr key={name} className="border-b border-border/40">
                        <td className="py-2 text-muted-foreground">{name}</td>
                        <td className="py-2 text-muted-foreground text-right">{w ? Math.round(w * 100) + '%' : '0%'}</td>
                        <td className="py-2 text-right font-mono">{Math.round((m.home_win ?? 0) * 100)}%</td>
                        <td className="py-2 text-right font-mono">{Math.round((m.draw ?? 0) * 100)}%</td>
                        <td className="py-2 text-right font-mono">{Math.round((m.away_win ?? 0) * 100)}%</td>
                      </tr>
                    ))}
                    <tr className="bg-primary/5">
                      <td className="py-2 font-bold text-primary">Calibrated ✓</td>
                      <td className="py-2 text-right font-mono font-bold text-primary">{Math.round(probs.home_win * 100)}%</td>
                      <td className="py-2 text-right font-mono font-bold text-amber-400">{Math.round(probs.draw * 100)}%</td>
                      <td className="py-2 text-right font-mono font-bold text-sky-400">{Math.round(probs.away_win * 100)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Bet Recommendations */}
          {bets.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-400" /> Recommended Bets
              </p>
              <div className="space-y-2">
                {bets.map((b, i) => <BetBadge key={i} bet={b.bet} tier={b.tier} />)}
              </div>
              <p className="text-[9px] text-muted-foreground/60 mt-2">⚠️ For informational purposes only. Gambling involves risk. 18+.</p>
            </div>
          )}

          {/* 7. Deep dive link */}
          {homeId && awayId && (
            <div className="border-t border-border/50 pt-4">
              <Link
                href={`/markets?home_team_id=${homeId}&away_team_id=${awayId}`}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Open full market sheet (AH · O/U · Correct Score · BTTS)
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ─── Main page ────────────────────────────────────────────────────────────────

export default function PredictionsFeedPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [leagues, setLeagues]         = useState<any[]>([])
  const [leagueFilter, setLeagueFilter] = useState("")
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [refreshing,  setRefreshing]  = useState(false)

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [leaguesRes] = await Promise.all([getLeagues().catch(() => [])])
      setLeagues(Array.isArray(leaguesRes) ? leaguesRes : [])

      // Priority 1: DC engine (best accuracy)
      // Priority 2: ML /public (if DC not trained)
      // Priority 3: ML /upcoming (if /public is 404)
      let predsRes: any = null
      try {
        predsRes = await getMarketsUpcoming({ limit: 30 })
      } catch (dcErr: any) {
        const notTrained = String(dcErr?.message || "").includes("503") || String(dcErr?.message || "").toLowerCase().includes("not trained")
        if (notTrained) {
          try {
            predsRes = await getPublicPredictions({ limit: 30 })
          } catch (pubErr: any) {
            if (String(pubErr?.message || "").includes("404")) {
              predsRes = await getUpcomingPredictions({ limit: 30 })
            } else { throw pubErr }
          }
        } else { throw dcErr }
      }

      const preds = Array.isArray(predsRes?.predictions) ? predsRes.predictions : []
      setPredictions(preds)
      setGeneratedAt(predsRes?.generated_at || new Date().toISOString())
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("422") || msg.toLowerCase().includes("not trained")) {
        setError("No model trained yet. Go to Betting Markets → Train Engine, or Predictions → Train Engine.")
      } else if (msg.includes("503") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Backend is offline. Start uvicorn on port 8000 and refresh.")
      } else {
        setError("Could not load predictions — " + (msg || "API unavailable."))
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = leagueFilter
    ? predictions.filter(p => String(p.match?.league_id) === leagueFilter || p.match?.league === leagueFilter)
    : predictions

  const sorted = [...filtered].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 }
    const ao = order[a.confidence as keyof typeof order] ?? 3
    const bo = order[b.confidence as keyof typeof order] ?? 3
    if (ao !== bo) return ao - bo
    return (b.confidence_score || 0) - (a.confidence_score || 0)
  })

  const highCount = sorted.filter(p => p.confidence === "High").length
  const medCount  = sorted.filter(p => p.confidence === "Medium").length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[900px] px-4 lg:px-6 py-6">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Free Picks</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg">
                Dixon-Coles + Elo + xG + Monte Carlo ensemble.
                Click any match to see full team analysis, H2H history, and bet recommendations.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => load(true)} disabled={refreshing} title="Refresh"
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
              <Link href="/markets" className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors">
                <Target className="h-3.5 w-3.5" />
                Betting Markets
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          {generatedAt && (
            <p className="text-[10px] text-muted-foreground/60 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(generatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              {" · "}Click a match card to expand full analysis
            </p>
          )}
        </div>

        {/* Stat row */}
        {!loading && !error && sorted.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-2xl font-black text-foreground font-mono">{sorted.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Trophy className="h-3 w-3" /> Predictions</p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-2xl font-black text-emerald-400 font-mono">{highCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-400" /> High Confidence</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-2xl font-black text-amber-400 font-mono">{medCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><BarChart3 className="h-3 w-3 text-amber-400" /> Medium Confidence</p>
            </div>
          </div>
        )}

        {/* League filter */}
        {!loading && !error && leagues.length > 0 && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Filter:</span>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setLeagueFilter("")}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${leagueFilter === "" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground bg-secondary/20"}`}>
                All Leagues
              </button>
              {leagues.map(l => (
                <button key={l.id} onClick={() => setLeagueFilter(String(l.id))}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${leagueFilter === String(l.id) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground bg-secondary/20"}`}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm font-semibold text-destructive mb-1">Predictions Unavailable</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => load()} className="rounded-lg bg-secondary/50 border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
                Try Again
              </button>
              <Link href="/markets" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors">
                Go to Betting Markets
              </Link>
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-foreground mb-1">No upcoming fixtures found</p>
            <p className="text-xs text-muted-foreground">Try a different league filter or sync new fixture data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((pred, i) => <MatchCard key={i} pred={pred} rank={i + 1} />)}
          </div>
        )}

        {/* Disclaimer */}
        {!loading && !error && sorted.length > 0 && (
          <div className="mt-8 rounded-lg border border-border/50 bg-secondary/10 px-4 py-3 text-center">
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              Predictions from Dixon-Coles + Elo + xG + Monte Carlo (DC engine) when trained, otherwise XGBoost ML ensemble.
              For informational purposes only — not financial advice. Always gamble responsibly. 18+.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
