"use client"

import Image from "next/image"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useEffect, useState } from "react"
import { getLeagues, getHealth, getMatches, getPlayers, getStandings, getPredictionAccuracy } from "@/lib/api"
import { useStore } from "@/lib/store"
import {
  Trophy,
  Calendar,
  Users,
  TrendingUp,
  ChevronRight,
  Target,
  BarChart3,
  Activity,
  Globe,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react"
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { TeamLogo } from "@/components/team-logo"

const API = process.env.NEXT_PUBLIC_API_URL || "https://onedot.onrender.com"

export default function DashboardPage() {
  const [leagues, setLeagues] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])  // upcoming fixtures (no score, future date)
  const [players, setPlayers] = useState<any[]>([])
  const [standings, setStandings] = useState<any[]>([])
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [matchCount, setMatchCount] = useState(0)
  const [playerCount, setPlayerCount] = useState(0)
  const [accuracyData, setAccuracyData] = useState<any>(null)
  const [freePicks, setFreePicks] = useState<any[]>([])
  const [picksLoading, setPicksLoading] = useState(true)

  const { compactMode, animationsEnabled } = useStore()

  // Base animation class, applied if enabled
  const baseAnim = animationsEnabled 
    ? "transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg" 
    : "transition-colors"
  const entryAnim = animationsEnabled ? "animate-in fade-in slide-in-from-bottom-4 duration-500" : ""
  
  // Compact classes
  const gapClass = compactMode ? "gap-2" : "gap-4 lg:gap-6"
  const paddingClass = compactMode ? "px-2 py-2" : "px-4 lg:px-6 py-6"
  const cardPadding = compactMode ? "p-3" : "p-6"

  useEffect(() => {
    Promise.all([
      getLeagues().then(res => setLeagues(Array.isArray(res) ? res : [])).catch(() => { }),
      // Fetch recent results (with scores)
      getMatches({ limit: 6, has_score: 'true' }).then(res => {
        const arr = Array.isArray(res) ? res : []
        setMatches(arr)
      }).catch(() => { }),
      // Fetch upcoming fixtures (no score AND date in the future)
      getMatches({ limit: 6, has_score: 'false' }).then(res => {
        setFixtures(Array.isArray(res) ? res : [])
      }).catch(() => { }),
      // Use larger limits for total counts
      getPlayers({ limit: 5 }).then(res => {
        const arr = Array.isArray(res) ? res : []
        setPlayers(arr)
      }).catch(() => { }),
      getStandings({ limit: 6 }).then(res => {
        const arr = Array.isArray(res) ? res : []
        setStandings(arr)
      }).catch(() => { }),
      getHealth().then(setHealth).catch(() => setHealth({ status: 'unhealthy' })),
      getPredictionAccuracy().then(res => setAccuracyData(res)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  // Fetch high-confidence verified picks (public, no auth needed)
  // Draw picks are dynamically suppressed until the system's Draw accuracy
  // crosses 30% — no hardcoding, they auto-reappear when models improve.
  useEffect(() => {
    // Parallel: fetch predictions + current per-outcome accuracy
    Promise.all([
      fetch(`${API}/api/predictions/feed?limit=6`)
        .then(async (res) => {
          if (!res.ok) return []
          const data = await res.json()
          return Array.isArray(data) ? data : (data.predictions ?? data.results ?? [])
        })
        .catch(() => []),
      fetch(`${API}/api/performance/engines`)
        .then(async (res) => {
          if (!res.ok) return null
          return res.json()
        })
        .catch(() => null),
    ])
      .then(([arr, enginesData]) => {
        // Determine current Draw accuracy from per-outcome engine stats
        // If we can't get it (no data yet), be conservative and suppress Draws
        const drawAccuracy: number = enginesData?.per_outcome?.Draw?.accuracy ?? 0
        const drawReliable = drawAccuracy >= 30  // auto-unlocks when models improve

        const highConf = arr
          .filter((p: any) => {
            const conf = p.confidence ?? p.probability ?? 0
            if (conf < 0.80) return false
            // Suppress Draw picks unless the model has proven reliable on Draws
            const outcome = p.predicted_outcome ?? ""
            if (outcome === "Draw" && !drawReliable) return false
            return true
          })
          .slice(0, 6)

        setFreePicks(highConf)
      })
      .finally(() => setPicksLoading(false))
  }, [])

  // Fetch total counts separately
  useEffect(() => {
    getMatches({ limit: 1 }).then(res => {
      // We can't get total count from paginated API, show available data
      setMatchCount(Array.isArray(res) ? res.length : 0)
    }).catch(() => { })
    getPlayers({ limit: 500 }).then(res => {
      setPlayerCount(Array.isArray(res) ? res.length : 0)
    }).catch(() => { })
  }, [])

  // Recent results: matches with scores, upcoming: without scores
  const recentMatches = matches.slice(0, 4)
  const upcomingMatches = fixtures.slice(0, 4)
  const topScorers = [...players].sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 5)
  const topStandings = standings.slice(0, 6)

  // Real prediction accuracy — derived from API, falls back to null while loading
  const accuracy     = accuracyData?.overall_accuracy != null
    ? Math.round(accuracyData.overall_accuracy * 100)
    : accuracyData?.accuracy_pct ?? null
  const correctPreds = accuracyData?.correct   ?? accuracyData?.correct_count   ?? null
  const totalPreds   = accuracyData?.total     ?? accuracyData?.total_evaluated  ?? null

  // Weekly trend from API (gameweek array) or empty while loading
  const weeklyTrends: { week: string; accuracy: number }[] = (
    Array.isArray(accuracyData?.by_gameweek)
      ? accuracyData.by_gameweek.slice(-8).map((gw: any) => ({
          week: gw.gameweek ? `GW${gw.gameweek}` : (gw.week ?? ""),
          accuracy: gw.accuracy_pct != null
            ? Math.round(gw.accuracy_pct)
            : gw.accuracy != null
            ? Math.round(gw.accuracy * 100)
            : 0,
        }))
      : []
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={`mx-auto max-w-[1280px] ${paddingClass}`}>
        {/* Welcome Banner */}
        <div className={`mb-6 rounded-lg border border-border bg-card ${cardPadding} ${entryAnim}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground text-balance">
                Welcome to PlusOne
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg text-pretty">
                Your football analytics hub. Track {leagues.length} leagues,
                view live standings, match results, player stats, and WPA-powered predictions
                across Europe's top competitions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-medium text-primary">
                  {health?.status === 'healthy' ? 'API Online' : 'API Connecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Today's Verified Picks ─────────────────────────────────── */}
        <div className={`mb-6 rounded-xl border border-primary/20 bg-card overflow-hidden ${entryAnim} delay-75`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Today's Verified Picks</h2>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">80%+ CONFIDENCE</span>
            </div>
            <Link href="/predictions-feed" className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {picksLoading ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading verified picks…</div>
          ) : freePicks.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No high-confidence picks available today.</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">The model only shows picks it's statistically certain about. Check back tomorrow.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {freePicks.map((pick: any, idx: number) => {
                const confidence = pick.confidence ?? pick.probability ?? 0
                const confPct = Math.round(confidence * 100)
                const confColor = confPct >= 85 ? "text-emerald-500" : confPct >= 75 ? "text-amber-500" : "text-orange-400"
                const barColor = confPct >= 85 ? "bg-emerald-500" : confPct >= 75 ? "bg-amber-500" : "bg-orange-400"
                const homeId = pick.home_team_id ?? pick.home_id
                const awayId = pick.away_team_id ?? pick.away_id
                return (
                  <div key={pick.id ?? idx} className="p-4 hover:bg-secondary/20 transition-colors">
                    {/* League + time */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">{pick.league ?? "League"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {pick.match_date ? new Date(pick.match_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBC"}
                      </span>
                    </div>
                    {/* Teams row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Link
                        href={homeId ? `/team/${homeId}` : "#"}
                        className="flex flex-col items-center gap-1 flex-1 hover:opacity-80 transition-opacity group"
                      >
                        <TeamLogo src={pick.home_logo} alt={`${pick.home_team} logo`} size={36} className="bg-white/5" />
                        <span className="text-xs font-semibold text-foreground text-center line-clamp-1 group-hover:text-primary transition-colors">{pick.home_team}</span>
                      </Link>
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <span className="text-xs font-bold text-muted-foreground">vs</span>
                      </div>
                      <Link
                        href={awayId ? `/team/${awayId}` : "#"}
                        className="flex flex-col items-center gap-1 flex-1 hover:opacity-80 transition-opacity group"
                      >
                        <TeamLogo src={pick.away_logo} alt={`${pick.away_team} logo`} size={36} className="bg-white/5" />
                        <span className="text-xs font-semibold text-foreground text-center line-clamp-1 group-hover:text-primary transition-colors">{pick.away_team}</span>
                      </Link>
                    </div>
                    {/* Prediction */}
                    <div className="rounded-lg bg-secondary/50 px-3 py-2 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Predicted outcome</span>
                        <span className={`text-xs font-bold ${confColor}`}>{confPct}%</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {pick.predicted_outcome ?? pick.prediction ?? pick.outcome ?? "—"}
                      </p>
                      {/* Confidence bar */}
                      <div className="mt-1.5 h-1 w-full rounded-full bg-secondary">
                        <div className={`h-1 rounded-full ${barColor} transition-all`} style={{ width: `${confPct}%` }} />
                      </div>
                    </div>
                    {/* Markets */}
                    <div className="flex flex-wrap gap-1">
                      {pick.btts != null && (
                        <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                          BTTS: {pick.btts ? "Yes" : "No"}
                        </span>
                      )}
                      {pick.over_under != null && (
                        <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                          {pick.over_under}
                        </span>
                      )}
                      {pick.market_accuracy != null && (
                        <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] font-medium text-primary">
                          Model: {Math.round(pick.market_accuracy * 100)}% acc
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Model accuracy footer */}
          <div className="px-4 py-2 border-t border-border bg-secondary/20">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary shrink-0" />
              Only showing predictions where the model's confidence is 80% or above.
              {accuracyData?.correct != null && accuracyData?.total != null && (
                <span> Model has graded <strong className="text-foreground">{accuracyData.correct}/{accuracyData.total}</strong> predictions correctly.</span>
              )}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 ${entryAnim} delay-100`}>
          <KpiCard
            icon={Globe}
            label="Leagues Tracked"
            value={String(leagues.length)}
            sub={`${new Set(leagues.map((l) => l.country)).size} countries`}
            href="/leagues"
          />
          <KpiCard
            icon={Calendar}
            label="Matches"
            value={loading ? "-" : String(matchCount || matches.length)}
            sub={`${recentMatches.length} recent results`}
            href="/matches"
          />
          <KpiCard
            icon={Users}
            label="Players"
            value={loading ? "-" : String(playerCount || players.length)}
            sub={`${players.length} loaded`}
            href="/players"
          />
          <KpiCard
            icon={Target}
            label="Prediction Accuracy"
            value={loading || accuracy == null ? "-" : `${accuracy}%`}
            sub={
              correctPreds != null && totalPreds != null
                ? `${correctPreds}/${totalPreds} correct`
                : accuracy == null
                ? "No graded predictions yet"
                : "Graded predictions"
            }
            href="/predictions"
          />
        </div>

        {/* Main Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 ${gapClass} ${entryAnim} delay-200`}>

          {/* League Standings Preview */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Premier League Standings</h2>
              </div>
              <Link
                href="/leagues"
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-10">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Team</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">MP</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">W</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">D</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">L</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">GD</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {topStandings.map((row, idx) => (
                    <tr key={row.team || idx} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-2 text-center text-xs font-bold font-mono text-muted-foreground">{row.rank || idx + 1}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-foreground">{row.team}</td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{row.matches_played || 0}</td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{row.wins || 0}</td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{row.draws || 0}</td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{row.losses || 0}</td>
                      <td className={`px-2 py-2 text-center text-xs font-mono font-bold hidden md:table-cell ${(row.goals_for - row.goals_against) > 0 ? "text-primary" : "text-destructive"
                        }`}>
                        {(row.goals_for - row.goals_against) > 0 ? `+${row.goals_for - row.goals_against}` : (row.goals_for - row.goals_against) || 0}
                      </td>
                      <td className="px-2 py-2 text-center text-sm font-bold font-mono text-foreground">{row.points || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Scorers */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Top Scorers</h2>
              </div>
              <Link
                href="/players"
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex flex-col">
              {topScorers.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-muted-foreground w-5 text-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{player.name || player.playerName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TeamLogo src={player.logo_url} alt={`${player.team || player.team_id} logo`} size={12} className="bg-transparent" />
                        <p className="text-[10px] text-muted-foreground">{player.team || player.team_id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-foreground">{player.goals || 0}</p>
                      <p className="text-[9px] text-muted-foreground">goals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-muted-foreground">{player.assists || 0}</p>
                      <p className="text-[9px] text-muted-foreground">assists</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Results */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Recent Results</h2>
              </div>
              <Link
                href="/matches"
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex flex-col">
              {recentMatches.map((m) => (
                <div key={m.id} className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-primary font-medium">{m.league || "League"}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(m.date || m.matchDate)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 gap-2">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className={`text-sm font-medium ${(m.home_score ?? 0) >= (m.away_score ?? 0) ? "text-foreground" : "text-foreground/60"}`}>
                        {m.home_team}
                      </span>
                      <TeamLogo src={m.home_logo} alt={`${m.home_team} logo`} size={20} className="bg-white/5" />
                    </div>
                    
                    <span className="text-sm font-bold font-mono text-foreground shrink-0 text-center w-12">
                      {m.home_score} - {m.away_score}
                    </span>
                    
                    <div className="flex items-center gap-2 flex-1 justify-start">
                      <TeamLogo src={m.away_logo} alt={`${m.away_team} logo`} size={20} className="bg-white/5" />
                      <span className={`text-sm font-medium ${(m.away_score ?? 0) >= (m.home_score ?? 0) ? "text-foreground" : "text-foreground/60"}`}>
                        {m.away_team}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Fixtures */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-info" />
                <h2 className="text-sm font-semibold text-foreground">Upcoming Fixtures</h2>
              </div>
              <Link
                href="/matches"
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex flex-col">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-primary font-medium">{m.league || "League"}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(m.date || m.matchDate)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 gap-2">
                    <div className="flex flex-1 items-center justify-end gap-2">
                      <span className="text-sm font-medium text-foreground text-right">{m.home_team || m.homeTeam}</span>
                      <TeamLogo src={m.home_logo} alt={`${m.home_team} logo`} size={20} className="bg-white/5" />
                    </div>
                    
                    <span className="text-xs text-muted-foreground shrink-0 text-center w-8">vs</span>
                    
                    <div className="flex flex-1 items-center justify-start gap-2">
                      <TeamLogo src={m.away_logo} alt={`${m.away_team} logo`} size={20} className="bg-white/5" />
                      <span className="text-sm font-medium text-foreground">{m.away_team || m.awayTeam}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 text-center">{m.venue}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prediction Accuracy Chart */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Accuracy Trend</h2>
              </div>
              <Link
                href="/predictions"
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Details <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="h-[180px] w-full">
              {weeklyTrends.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <BarChart3 className="h-6 w-6 opacity-30" />
                  <p className="text-xs">{loading ? "Loading trend…" : "No graded predictions yet"}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 9, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[50, 100]}
                      tick={{ fontSize: 9, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-lg border border-border bg-card p-2 shadow-xl">
                            <p className="text-xs font-semibold text-foreground">{d.week}: {d.accuracy}%</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="accuracy" radius={[3, 3, 0, 0]}>
                      {weeklyTrends.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.accuracy >= 80 ? "oklch(0.65 0.19 145)" : entry.accuracy >= 70 ? "oklch(0.7 0.18 55)" : "oklch(0.55 0.2 27)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Leagues Quick Access */}
          <div className="lg:col-span-3 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Leagues Overview</h2>
              </div>
              <Link
                href="/leagues"
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href="/leagues"
                  className="flex items-center justify-between px-4 py-3 border-b border-r border-border/50 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{league.name}</p>
                      <p className="text-[10px] text-muted-foreground">{league.country} -- {league.teamCount} teams</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors mb-3">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground font-mono">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-[10px] text-muted-foreground/70">{sub}</p>
      <ChevronRight className="absolute top-4 right-4 h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </Link>
  )
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d + (!d.includes('T') ? "T12:00:00" : ""))
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
