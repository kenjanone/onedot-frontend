"use client"

import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  getTeams,
  getLeagues,
  getPredictionStatus,
  trainPredictionModel,
  predictMatchById,
  predictConsensus,
  getPredictionFixtures,
  getPredictionResults,
  getPredictionAccuracy,
  askPrediction,
  getAIModels,
  API,
} from "@/lib/api"

import {
  TrendingUp,
  ChevronRight,
  Target,
  BarChart3,
  Zap,
  Info,
  Brain,
  RefreshCw,
  Play,
  AlertCircle,
  Cpu,
  Calendar,
  Clock,
  GitMerge,
  CheckCircle2,
  Circle,
  SplitSquareHorizontal,
  Search,
  MessageSquare,
  Send,
  Sparkles,
  ChevronDown,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import { TeamLogo } from "@/components/team-logo"

export default function PredictionsPage() {
  // Live DB results
  const [liveResults, setLiveResults] = useState<any[]>([])
  const [resultsLoading, setResultsLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)

  // Weekly accuracy
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([])

  // Custom Prediction State
  const [leagues, setLeagues] = useState<Record<string, any>[]>([])
  const [teams, setTeams] = useState<Record<string, any>[]>([])
  const [selectedLeague, setSelectedLeague] = useState("")
  const [home, setHome] = useState("")
  const [away, setAway] = useState("")
  const [loadingPred, setLoadingPred] = useState(false)
  const [customResult, setCustomResult] = useState<Record<string, any> | null>(null)

  // ML Engine State
  const [engineStatus, setEngineStatus] = useState<Record<string, any> | null>(null)
  const [engineLoading, setEngineLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [trainResult, setTrainResult] = useState<Record<string, any> | null>(null)
  const [trainingMessage, setTrainingMessage] = useState("")
  const [fixtures, setFixtures] = useState<any[]>([])
  const [fixturesLoading, setFixturesLoading] = useState(true)
  const [selectedFixture, setSelectedFixture] = useState<any | null>(null)
  const [fixtureResult, setFixtureResult] = useState<Record<string, any> | null>(null)
  const [predictingFixture, setPredictingFixture] = useState<number | null>(null)
  const [fixtureLeague, setFixtureLeague] = useState("")

  // Consensus Engine State
  const [consensusFixture, setConsensusFixture] = useState<any | null>(null)
  const [consensusResult, setConsensusResult] = useState<Record<string, any> | null>(null)
  const [predictingConsensus, setPredictingConsensus] = useState<number | null>(null)
  const [consensusLeague, setConsensusLeague] = useState("")
  const [consensusSearch, setConsensusSearch] = useState("")
  // Custom match consensus (for matches not in the 30-fixture list)
  const [customHome, setCustomHome] = useState("")
  const [customAway, setCustomAway] = useState("")
  const [customLeague, setCustomLeague] = useState("")
  const [customConsensusLoading, setCustomConsensusLoading] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)

  // Polling ref so we can cancel it on unmount
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Compact classes
  const gapClass = "gap-4 lg:gap-6"
  const paddingClass = "px-4 lg:px-6 py-6"
  const cardPadding = "p-6"
  
  // Base animation class
  const entryAnim = "animate-in fade-in slide-in-from-bottom-4 duration-500"

  useEffect(() => {
    getLeagues().then((data: any) => setLeagues(Array.isArray(data) ? data : []))
    getTeams({ limit: 1000 }).then((data: any) => setTeams(Array.isArray(data) ? data : []))
    getPredictionStatus()
      .then((s: any) => setEngineStatus(s))
      .catch(() => setEngineStatus(null))
      .finally(() => setEngineLoading(false))
    getPredictionFixtures({ limit: 100 })
      .then((r: any) => setFixtures(Array.isArray(r?.fixtures) ? r.fixtures : []))
      .catch(() => setFixtures([]))
      .finally(() => setFixturesLoading(false))
    getPredictionResults({ limit: 30 })
      .then((r: any) => {
        const results = Array.isArray(r?.results) ? r.results : []
        setLiveResults(results)
        if (results.length > 0) setSelected(results[0])
      })
      .catch(() => setLiveResults([]))
      .finally(() => setResultsLoading(false))
    getPredictionAccuracy({ weeks: 9 })
      .then((data: any) => setWeeklyTrends(Array.isArray(data) ? data : []))
      .catch(() => setWeeklyTrends([]))

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  // ── Training with background polling ───────────────────────────────────────
  // The backend /train endpoint returns immediately (BackgroundTasks).
  // We poll /training-status every 3s until done or error.
  const pollTrainingStatus = async (attempts = 0) => {
    const MAX_ATTEMPTS = 200 // ~10 minutes at 3s intervals

    if (attempts >= MAX_ATTEMPTS) {
      setTrainResult({ success: false, error: "Training taking longer than 10 minutes. Check backend logs." })
      setTraining(false)
      setTrainingMessage("")
      return
    }

    try {
      const res = await fetch(`${API}/api/predictions/training-status`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const status = await res.json()

      if (status.status === "done") {
        setTrainResult(status.result ?? { success: true })
        getPredictionStatus()
          .then((s) => setEngineStatus(s))
          .catch(() => {})
        setTraining(false)
        setTrainingMessage("")
      } else if (status.status === "error") {
        setTrainResult({ success: false, error: status.error || "Training failed on the server." })
        setTraining(false)
        setTrainingMessage("")
      } else {
        // Still running - compute elapsed time and poll again
        const elapsed = status.started_at
          ? Math.round(Date.now() / 1000 - status.started_at)
          : attempts * 3
        setTrainingMessage(`Training in progress... ${elapsed}s elapsed`)
        pollRef.current = setTimeout(() => pollTrainingStatus(attempts + 1), 3000)
      }
    } catch {
      // Network hiccup - keep retrying
      pollRef.current = setTimeout(() => pollTrainingStatus(attempts + 1), 3000)
    }
  }

  const handleTrain = async () => {
    setTraining(true)
    setTrainResult(null)
    setTrainingMessage("Starting training...")

    try {
      const r = await trainPredictionModel()

      if (r?.started === false) {
        // Already in progress - just start polling for the running job
        setTrainingMessage("Training already in progress, polling for updates...")
        pollRef.current = setTimeout(() => pollTrainingStatus(0), 3000)
        return
      }

      // Training kicked off - start polling /training-status
      setTrainingMessage("Training started in background...")
      pollRef.current = setTimeout(() => pollTrainingStatus(0), 3000)
    } catch (err: any) {
      const msg = err?.message || ""
      if (
        msg.includes("HTTP2") ||
        msg.includes("ERR_HTTP2") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError")
      ) {
        // The HTTP/2 connection dropped - training may still have started on the server.
        // Begin polling to find out.
        setTrainingMessage("Connection dropped - checking if training started on the server...")
        pollRef.current = setTimeout(() => pollTrainingStatus(0), 5000)
      } else {
        setTrainResult({ success: false, error: "Could not reach backend. Is the server running?" })
        setTraining(false)
        setTrainingMessage("")
      }
    }
  }

  // ── Fixture prediction with 503 / 422 awareness ────────────────────────────
  const handlePredictFixture = async (fixture: any) => {
    setPredictingFixture(fixture.id)
    setSelectedFixture(fixture)
    setFixtureResult(null)

    try {
      const res = await fetch(`${API}/api/predictions/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home_team_id: fixture.home_team_id,
          away_team_id: fixture.away_team_id,
          league_id: fixture.league_id,
          season_id: fixture.season_id,
        }),
      })

      if (!res.ok) {
        const status = res.status
        let errorMsg = "Prediction failed."

        if (status === 503) {
          errorMsg =
            "Backend is unavailable (503 Service Unavailable). The server may be cold-starting - wait ~30 seconds and try again."
        } else if (status === 422) {
          errorMsg =
            "Model not trained yet. Click 'Train Engine' above, wait for training to complete, then predict."
        } else if (status === 500) {
          errorMsg = "Internal server error during prediction. Check backend logs."
        } else {
          try {
            const body = await res.json()
            errorMsg = body?.detail || body?.error || errorMsg
          } catch {}
        }

        setFixtureResult({ error: errorMsg })
      } else {
        const data = await res.json()
        setFixtureResult(data)
      }
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setFixtureResult({
          error:
            "Cannot reach the backend. The server may be sleeping (cold start) - wait 30 seconds and try again.",
        })
      } else {
        setFixtureResult({ error: "Prediction failed. Train the model first." })
      }
    }

    setPredictingFixture(null)
  }

  const displayedFixtures = fixtureLeague
    ? fixtures.filter((f: any) => String(f.league_id) === fixtureLeague)
    : fixtures

  // Name-quality guard (mirrors Markets page)
  const isCleanTeam = (t: any) => t.name && /^[A-Z0-9]/.test(t.name) && !t.name.includes(" vs ")

  // Fixture list filtered by league + text search
  const consensusFixtures = (() => {
    let list = consensusLeague
      ? fixtures.filter((f: any) => String(f.league_id) === consensusLeague)
      : fixtures
    if (consensusSearch.trim()) {
      const q = consensusSearch.toLowerCase()
      list = list.filter((f: any) =>
        f.home_team?.toLowerCase().includes(q) || f.away_team?.toLowerCase().includes(q)
      )
    }
    return list
  })()

  // Teams for the custom match form
  const customConsensusTeams = teams
    .filter(isCleanTeam)
    .filter((t: any) => !customLeague || String(t.league_id) === customLeague)
    .sort((a: any, b: any) => a.name.localeCompare(b.name))

  const handleConsensusPredict = async (fixture: any) => {
    setPredictingConsensus(fixture.id)
    setConsensusFixture(fixture)
    setConsensusResult(null)
    try {
      const data = await predictConsensus({
        home_team_id: fixture.home_team_id,
        away_team_id: fixture.away_team_id,
        league_id:    fixture.league_id,
        season_id:    fixture.season_id,
        match_id:     fixture.id,
      })
      setConsensusResult(data)
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("503")) {
        setConsensusResult({ error: "Backend unavailable (503). Try again in ~30 seconds." })
      } else if (msg.includes("422")) {
        setConsensusResult({ error: "ML engine not trained yet. Train the engine first, then retry." })
      } else {
        setConsensusResult({ error: msg || "Consensus prediction failed. Check backend logs." })
      }
    }
    setPredictingConsensus(null)
  }

  // ── Custom match consensus (team picker, not fixture-based) ───────────────
  const handleCustomConsensus = async () => {
    if (!customHome || !customAway) return
    const homeTeam = teams.find((t: any) => String(t.id) === customHome)
    const awayTeam = teams.find((t: any) => String(t.id) === customAway)
    if (!homeTeam || !awayTeam) return
    const leagueId = homeTeam.league_id
    // Derive season from fixtures in the same league, or fall back to first available
    const seasonId =
      fixtures.find((f: any) => f.league_id === leagueId)?.season_id ??
      fixtures[0]?.season_id ?? 1
    const fakeFx = {
      id: -1,
      home_team:    homeTeam.name,
      away_team:    awayTeam.name,
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id,
      league_id:    leagueId,
      season_id:    seasonId,
      home_logo:    homeTeam.logo_url,
      away_logo:    awayTeam.logo_url,
      match_date:   null,
      league:       leagues.find((l: any) => l.id === leagueId)?.name ?? "",
    }
    setCustomConsensusLoading(true)
    setConsensusFixture(fakeFx)
    setConsensusResult(null)
    try {
      const data = await predictConsensus({
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        league_id:    leagueId,
        season_id:    seasonId,
      })
      setConsensusResult(data)
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("503"))
        setConsensusResult({ error: "Backend unavailable (503). Try again in ~30 seconds." })
      else if (msg.includes("422"))
        setConsensusResult({ error: "ML engine not trained yet. Train the engine first, then retry." })
      else
        setConsensusResult({ error: msg || "Consensus prediction failed. Check backend logs." })
    }
    setCustomConsensusLoading(false)
  }

  const filteredTeams = selectedLeague
    ? teams.filter((t: any) => String(t.league_id) === String(selectedLeague))
    : teams

  const handlePredict = async () => {
    if (!home || !away) return
    setLoadingPred(true)
    try {
      const res = await fetch(`${API}/api/predictions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_team: home, away_team: away }),
      })
      if (!res.ok) {
        const status = res.status
        if (status === 503) {
          setCustomResult({ error: "Backend unavailable (503). Try again in ~30 seconds." })
        } else {
          const body = await res.json().catch(() => ({}))
          setCustomResult({ error: body?.detail || "Backend predictions unavailable." })
        }
      } else {
        const data = await res.json()
        setCustomResult(data)
      }
    } catch {
      setCustomResult({ error: "Backend predictions unavailable." })
    }
    setLoadingPred(false)
  }

  // Derive summary stats
  const completed = liveResults.filter((m: any) => m.home_score !== null)
  const correctCount = completed.filter((m: any) => m.home_score !== m.away_score).length
  const accuracy = completed.length > 0 ? Math.round((correctCount / completed.length) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={`mx-auto max-w-[1280px] ${paddingClass}`}>
        {/* Page Header */}
        <div className={`mb-6 ${entryAnim}`}>
          <h1 className="text-xl font-bold text-foreground text-balance">Match Predictions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            WPA-powered predictions with statistical team analysis
          </p>
        </div>

        {/* Stat Cards */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 ${entryAnim} delay-100`}>
          <StatCard
            icon={Target}
            label="Model Accuracy"
            value={engineStatus?.cv_accuracy ? `${Math.round(engineStatus.cv_accuracy * 100)}%` : `${accuracy}%`}
            sub={engineStatus?.n_samples ? `${engineStatus.n_samples} matches trained` : `${correctCount}/${completed.length} correct`}
          />
          <StatCard icon={TrendingUp} label="Upcoming Fixtures" value={String(fixtures.length)} sub="Ready to predict" />
          <StatCard icon={BarChart3} label="Results in DB" value={String(completed.length)} sub="From Supabase" />
          <StatCard
            icon={Cpu}
            label="ML Engine"
            value={engineStatus?.model_trained ? "Ready" : "Untrained"}
            sub={engineStatus?.n_features ? `${engineStatus.n_features} features` : "Not trained yet"}
          />
        </div>

        {/* ── ML Prediction Engine Section ─────────────────────────────────── */}
        <div className={`rounded-lg border border-border bg-card mb-6 overflow-hidden ${entryAnim} delay-150`}>
          {/* Engine Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-base font-bold text-foreground">ML Prediction Engine</h2>
                <p className="text-xs text-muted-foreground">
                  XGBoost + Random Forest ensemble - trained on historical match data
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              {engineLoading ? (
                <span className="text-xs text-muted-foreground animate-pulse">Loading status...</span>
              ) : engineStatus?.model_trained ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
                    Trained
                  </span>
                  {engineStatus.cv_accuracy && (
                    <span className="text-xs text-muted-foreground">
                      CV Accuracy:{" "}
                      <span className="font-bold text-foreground">
                        {Math.round(engineStatus.cv_accuracy * 100)}%
                      </span>
                    </span>
                  )}
                  {engineStatus.n_samples > 0 && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      on{" "}
                      <span className="font-bold text-foreground">
                        {engineStatus.n_samples.toLocaleString()}
                      </span>{" "}
                      matches
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 text-warning px-3 py-1 text-xs font-semibold">
                  <AlertCircle className="h-3 w-3" />
                  Not Trained
                </span>
              )}
              <button
                onClick={handleTrain}
                disabled={training}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${training ? "animate-spin" : ""}`} />
                {training ? "Training..." : engineStatus?.model_trained ? "Retrain" : "Train Engine"}
              </button>
            </div>
          </div>

          {/* Training progress banner */}
          {training && trainingMessage && (
            <div className="px-6 py-3 text-sm border-b border-border bg-primary/5 text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 animate-pulse flex-shrink-0" />
              <span>{trainingMessage}</span>
              <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
                Runs in background - page will update automatically when done.
              </span>
            </div>
          )}

          {/* Train result banner */}
          {trainResult && !training && (
            <div
              className={`px-6 py-3 text-sm border-b border-border ${
                trainResult.success
                  ? "bg-success/5 text-success"
                  : "bg-destructive/5 text-destructive"
              }`}
            >
              {trainResult.success
                ? `✅ Trained on ${trainResult.matches_trained} matches. CV accuracy: ${Math.round(
                    (trainResult.cv_accuracy || 0) * 100
                  )}% - completed in ${trainResult.elapsed_seconds}s`
                : `âŒ ${trainResult.error || "Training failed"}`}
            </div>
          )}


          {/* Fixture List */}
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Upcoming Fixtures - Click to Predict
              </h3>
              <select
                value={fixtureLeague}
                onChange={(e: any) => setFixtureLeague(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[160px]"
              >
                <option value="">All Leagues</option>
                {leagues.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {fixturesLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse py-4 text-center">
                Loading fixtures...
              </p>
            ) : displayedFixtures.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming fixtures found. Sync data first.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {displayedFixtures.map((fx: any) => (
                  <div
                    key={fx.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors cursor-pointer ${
                      selectedFixture?.id === fx.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-secondary/30"
                    }`}
                    onClick={() => handlePredictFixture(fx)}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                        <TeamLogo
                           src={fx.home_logo}
                           alt={`${fx.home_team} logo`}
                           size={24}
                           className="object-contain p-0.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                          {fx.home_team}{" "}
                          <span className="text-muted-foreground font-normal text-xs">vs</span>{" "}
                          {fx.away_team}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fx.league} ·{" "}
                          {fx.match_date ? new Date(fx.match_date).toLocaleDateString() : "TBD"}
                          {fx.gameweek ? ` · GW${fx.gameweek}` : ""}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                        <TeamLogo
                           src={fx.away_logo}
                           alt={`${fx.away_team} logo`}
                           size={24}
                           className="object-contain p-0.5"
                        />
                      </div>
                    </div>
                    <button
                      disabled={predictingFixture === fx.id}
                      className="ml-3 flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {predictingFixture === fx.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      {predictingFixture === fx.id ? "Predicting..." : "Predict"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixture Prediction Result Panel */}
          {fixtureResult && selectedFixture && (
            <div className="border-t border-border px-6 py-5 bg-secondary/10">
              {fixtureResult.error ? (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Prediction Error</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fixtureResult.error}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Match Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {fixtureResult.match?.league}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                             <TeamLogo
                               src={fixtureResult.match?.home_logo}
                               alt={fixtureResult.match?.home_team || "Home"}
                               size={40}
                               className="object-contain p-1"
                             />
                           </div>
                           <p className="text-lg font-bold text-foreground">{fixtureResult.match?.home_team}</p>
                        </div>
                        <span className="text-muted-foreground font-medium px-2">vs</span>
                        <div className="flex items-center gap-2">
                           <p className="text-lg font-bold text-foreground">{fixtureResult.match?.away_team}</p>
                           <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                             <TeamLogo
                               src={fixtureResult.match?.away_logo}
                               alt={fixtureResult.match?.away_team || "Away"}
                               size={40}
                               className="object-contain p-1"
                             />
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          fixtureResult.confidence === "High"
                            ? "bg-success/10 text-success"
                            : fixtureResult.confidence === "Medium"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {fixtureResult.confidence} Confidence
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((fixtureResult.confidence_score || 0) * 100)}% certainty
                      </p>
                    </div>
                  </div>

                  {/* Predicted Outcome */}
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-5 py-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Predicted Outcome</p>
                    <p className="text-xl font-black text-primary">{fixtureResult.predicted_outcome}</p>
                  </div>

                  {/* Probability Tiles */}
                  <div className="grid grid-cols-3 gap-3">
                    {(["Home Win", "Draw", "Away Win"] as const).map((label, i) => {
                      const keys = ["home_win", "draw", "away_win"] as const
                      const val = fixtureResult.probabilities?.[keys[i]] ?? 0
                      return (
                        <div
                          key={label}
                          className="rounded-lg border border-border bg-card px-3 py-3 text-center"
                        >
                          <p className="text-2xl font-black text-foreground">
                            {Math.round(val * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* xG & Predicted Score */}
                  {fixtureResult.expected_goals && (
                    <div className="rounded-lg border border-border bg-card px-5 py-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Expected Goals (xG)
                      </p>
                      <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-black text-primary">
                            {fixtureResult.expected_goals.home_xg}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fixtureResult.match?.home_team}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Predicted Score</p>
                          <p className="text-xl font-bold text-foreground">
                            {fixtureResult.expected_goals.predicted_score}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-info">
                            {fixtureResult.expected_goals.away_xg}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fixtureResult.match?.away_team}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Factors & Performance Patterns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fixtureResult.key_factors?.length > 0 && (
                      <div className="rounded-lg border border-border bg-card px-4 py-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Key Deciding Factors
                        </p>
                        <ul className="space-y-2">
                          {fixtureResult.key_factors.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {fixtureResult.team_comparison && (
                      <div className="rounded-lg border border-border bg-card px-4 py-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Performance Patterns
                        </p>
                        <div className="space-y-3">
                          {["home", "away"].map((side: any) => {
                            const tc = fixtureResult.team_comparison[side]
                            const name =
                              side === "home"
                                ? fixtureResult.match?.home_team
                                : fixtureResult.match?.away_team
                            return (
                              <div key={side}>
                                <p className="text-xs font-semibold text-foreground mb-1.5">{name}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="rounded-md bg-success/5 border border-success/20 px-3 py-2 text-center">
                                    <p className="text-sm font-bold text-success">
                                      {Math.round((tc?.clean_sheet_rate || 0) * 100)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">Clean Sheet Rate</p>
                                  </div>
                                  <div className="rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2 text-center">
                                    <p className="text-sm font-bold text-destructive">
                                      {Math.round((tc?.blank_rate || 0) * 100)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">Blank Rate</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* H2H Summary */}
                  {fixtureResult.h2h &&
                    fixtureResult.h2h.home_wins +
                      fixtureResult.h2h.draws +
                      fixtureResult.h2h.away_wins >
                      0 && (
                      <div className="rounded-lg border border-border bg-card px-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Head to Head History
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-primary font-bold">
                            {fixtureResult.h2h.home_wins}W
                          </span>
                          <span className="text-muted-foreground">{fixtureResult.h2h.draws}D</span>
                          <span className="text-info font-bold">{fixtureResult.h2h.away_wins}W</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {fixtureResult.match?.home_team} vs {fixtureResult.match?.away_team}
                          </span>
                        </div>
                        {fixtureResult.h2h.last_5?.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {fixtureResult.h2h.last_5.map((r: string, i: number) => (
                              <span
                                key={i}
                                className={`text-xs font-bold rounded px-1.5 py-0.5 ${
                                  r === "H"
                                    ? "bg-primary/10 text-primary"
                                    : r === "A"
                                    ? "bg-info/10 text-info"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {r === "H" ? "HW" : r === "A" ? "AW" : "D"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate Custom Prediction */}
        <div className={`rounded-lg border border-border bg-card ${cardPadding} mb-6 ${entryAnim} delay-200`}>
          <h2 className="text-xl font-bold text-foreground mb-4">ðŸ”® Generate Custom Prediction</h2>
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Filter by League (optional)
            </label>
            <select
              value={selectedLeague}
              onChange={(e: any) => {
                setSelectedLeague(e.target.value)
                setHome("")
                setAway("")
              }}
              className="w-full sm:w-72 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Leagues</option>
              {leagues.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs text-muted-foreground mb-1.5 block">Home Team</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={home}
                onChange={(e: any) => setHome(e.target.value)}
              >
                <option value="">Select home team...</option>
                {filteredTeams.map((t: any) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pb-2 text-sm font-bold text-muted-foreground">VS</div>
            <div className="flex-1 w-full">
              <label className="text-xs text-muted-foreground mb-1.5 block">Away Team</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={away}
                onChange={(e: any) => setAway(e.target.value)}
              >
                <option value="">Select away team...</option>
                {filteredTeams
                  .filter((t: any) => t.name !== home)
                  .map((t: any) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={handlePredict}
              disabled={loadingPred || !home || !away}
              className="w-full sm:w-auto px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {loadingPred ? "Predicting..." : "Predict"}
            </button>
          </div>

          {customResult && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                customResult.error
                  ? "border-destructive bg-destructive/5"
                  : "border-primary/30 bg-primary/5"
              }`}
            >
              {customResult.error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <Info className="h-5 w-5" />
                  <p className="text-sm font-medium">{customResult.error}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    Result: 
                    <div className="flex items-center gap-1.5 ml-1">
                      {customResult.home_logo && (
                        <div className="relative h-5 w-5 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={customResult.home_logo} alt="" className="object-contain absolute inset-0 w-full h-full p-0.5" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      )}
                      <span>{customResult.home_team}</span>
                    </div>
                    <span className="text-muted-foreground font-normal text-sm">vs</span> 
                    <div className="flex items-center gap-1.5">
                      <span>{customResult.away_team}</span>
                      {customResult.away_logo && (
                        <div className="relative h-5 w-5 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={customResult.away_logo} alt="" className="object-contain absolute inset-0 w-full h-full p-0.5" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      )}
                    </div>
                    {customResult.confidence === "high" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase animate-pulse">
                        ðŸ”¥ High Confidence Tip!
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium">
                    <div className="bg-background rounded-md p-2 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">{customResult.home_team}</p>
                      <p className="font-mono text-lg">
                        {Math.round(customResult.home_win_prob * 100)}%
                      </p>
                    </div>
                    <div className="bg-background rounded-md p-2 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">Draw</p>
                      <p className="font-mono text-lg">{Math.round(customResult.draw_prob * 100)}%</p>
                    </div>
                    <div className="bg-background rounded-md p-2 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">{customResult.away_team}</p>
                      <p className="font-mono text-lg">
                        {Math.round(customResult.away_win_prob * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Predicted Score: {customResult.predicted_score.home} -{" "}
                      {customResult.predicted_score.away}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Dynamic Consensus Engine Section ──────────────────────────── */}
        <div className={`rounded-lg border border-border bg-card mb-6 overflow-hidden ${entryAnim} delay-250`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <GitMerge className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Dynamic Consensus Engine</h2>
                <p className="text-xs text-muted-foreground">
                  Blends DC + ML + Legacy + Enrichment models - weights adapt to historical accuracy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block animate-pulse" />
                3 Engines Active
              </span>
            </div>
          </div>

          {/* Fixture Picker */}
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-foreground">Select Fixture - Consensus Predict</h3>
              <div className="flex items-center gap-2">
                {/* League filter */}
                <select
                  value={consensusLeague}
                  onChange={(e: any) => setConsensusLeague(e.target.value)}
                  className="appearance-none rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
                >
                  <option value="">All Leagues</option>
                  {leagues.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                {/* Text search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search team..."
                    value={consensusSearch}
                    onChange={(e: any) => setConsensusSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-secondary/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-36"
                  />
                </div>
              </div>
            </div>

            {fixturesLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse py-4 text-center">Loading fixtures...</p>
            ) : consensusFixtures.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming fixtures. Sync data first.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {consensusFixtures.map((fx: any) => (
                  <div
                    key={fx.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors cursor-pointer ${
                      consensusFixture?.id === fx.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-secondary/30"
                    }`}
                    onClick={() => handleConsensusPredict(fx)}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                        <TeamLogo
                           src={fx.home_logo}
                           alt={`${fx.home_team} logo`}
                           size={24}
                           className="object-contain p-0.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                          {fx.home_team}
                          <span className="text-muted-foreground font-normal text-xs">vs</span>
                          {fx.away_team}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fx.league} · {fx.match_date ? new Date(fx.match_date).toLocaleDateString() : "TBD"}
                          {fx.gameweek ? ` · GW${fx.gameweek}` : ""}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                        <TeamLogo
                           src={fx.away_logo}
                           alt={`${fx.away_team} logo`}
                           size={24}
                           className="object-contain p-0.5"
                        />
                      </div>
                    </div>
                    <button
                      disabled={predictingConsensus === fx.id}
                      className="ml-3 flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {predictingConsensus === fx.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <GitMerge className="h-3 w-3" />
                      )}
                      {predictingConsensus === fx.id ? "Analysing..." : "Consensus"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Can't find it? Custom match search ─────────────────────── */}
            <div className="mt-4 rounded-lg border border-dashed border-border bg-secondary/10">
              <button
                onClick={() => setShowCustomForm((v: boolean) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" />
                  Can't find the match? Search by team
                </span>
                <span>{showCustomForm ? "▲" : "▼"}</span>
              </button>
              {showCustomForm && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">League (optional)</label>
                    <select
                      value={customLeague}
                      onChange={(e: any) => { setCustomLeague(e.target.value); setCustomHome(""); setCustomAway("") }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">All Leagues</option>
                      {leagues.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Home Team</label>
                      <select
                        value={customHome}
                        onChange={(e: any) => setCustomHome(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Select home team...</option>
                        {customConsensusTeams.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <span className="pb-2 text-xs font-bold text-muted-foreground">VS</span>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Away Team</label>
                      <select
                        value={customAway}
                        onChange={(e: any) => setCustomAway(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Select away team...</option>
                        {customConsensusTeams
                          .filter((t: any) => String(t.id) !== customHome)
                          .map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                      </select>
                    </div>
                    <button
                      onClick={handleCustomConsensus}
                      disabled={!customHome || !customAway || customConsensusLoading}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {customConsensusLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <GitMerge className="h-3 w-3" />
                      )}
                      {customConsensusLoading ? "Analysing..." : "Run Consensus"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {consensusResult && consensusFixture && (
            <>
              <div className="border-t border-border px-6 py-5 bg-secondary/10">
              {consensusResult.error ? (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Consensus Error</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{consensusResult.error}</p>
                  </div>
                </div>
              ) : (() => {
                const cs   = consensusResult.consensus  ?? {}
                const eng  = consensusResult.engines     ?? {}
                const wts  = consensusResult.weights_used ?? {}
                const mkt  = consensusResult.markets     ?? {}
                const agr  = consensusResult.agreement   ?? "split"
                const match = consensusResult.match      ?? {}

                const agreementMeta = {
                  full:     { label: "Full Agreement",     color: "bg-success/10 text-success",   Icon: CheckCircle2 },
                  majority: { label: "Majority Agreement", color: "bg-warning/10 text-warning",   Icon: Circle },
                  split:    { label: "Split Decision",     color: "bg-destructive/10 text-destructive", Icon: SplitSquareHorizontal },
                }[agr as string] ?? { label: agr, color: "bg-muted text-muted-foreground", Icon: Circle }

                const confidenceColor =
                  cs.confidence === "High"   ? "bg-success/10 text-success" :
                  cs.confidence === "Medium" ? "bg-warning/10 text-warning" :
                                              "bg-muted text-muted-foreground"

                const dcW  = Math.round((wts.dc     ?? 0.45) * 100)
                const mlW  = Math.round((wts.ml     ?? 0.35) * 100)
                const legW = Math.round((wts.legacy ?? 0.20) * 100)

                return (
                  <div className="space-y-5">
                    {/* Match header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{match.league}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                             <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                               <TeamLogo
                                 src={consensusFixture?.home_logo}
                                 alt={match.home_team || "Home"}
                                 size={40}
                                 className="object-contain p-1"
                               />
                             </div>
                             <p className="text-lg font-bold text-foreground">{match.home_team}</p>
                          </div>
                          <span className="text-muted-foreground font-medium px-2">vs</span>
                          <div className="flex items-center gap-2">
                             <p className="text-lg font-bold text-foreground">{match.away_team}</p>
                             <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                               <TeamLogo
                                 src={consensusFixture?.away_logo}
                                 alt={match.away_team || "Away"}
                                 size={40}
                                 className="object-contain p-1"
                               />
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${confidenceColor}`}>
                          {cs.confidence} Confidence
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${agreementMeta.color}`}>
                          <agreementMeta.Icon className="h-3.5 w-3.5" />
                          {agreementMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* Consensus verdict */}
                    <div className="rounded-xl bg-primary/8 border border-primary/25 px-6 py-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Consensus Prediction</p>
                      <p className="text-2xl font-black text-primary">{cs.predicted_outcome}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cs.confidence_score?.toFixed(1)}% certainty score</p>
                    </div>

                    {/* Blended probability tiles */}
                    <div className="grid grid-cols-3 gap-3">
                      {(["Home Win", "Draw", "Away Win"] as const).map((label, i) => {
                        const keys = ["home_win", "draw", "away_win"] as const
                        const val  = cs[keys[i]] ?? 0
                        return (
                          <div key={label} className="rounded-lg border border-border bg-card px-3 py-3 text-center">
                            <p className="text-2xl font-black text-foreground">{Math.round(val * 100)}%</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Per-engine breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Engine Breakdown</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(["dc", "ml", "legacy"] as const).map((key) => {
                          const e        = eng[key] ?? {}
                          const labels   = { dc: "Dixon-Coles", ml: "ML Ensemble", legacy: "Legacy Heuristic" }
                          const outcome  = e.predicted_outcome ?? "-"
                          const outcomeColor =
                            outcome === cs.predicted_outcome ? "text-success" : "text-muted-foreground"
                          return (
                            <div key={key} className="rounded-lg border border-border bg-card px-4 py-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">{labels[key]}</p>
                              <p className={`text-sm font-bold mb-2 ${outcomeColor}`}>{outcome}</p>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span className="flex-1 text-center">
                                  <span className="block font-semibold text-foreground">{Math.round((e.home_win ?? 0) * 100)}%</span>
                                  H
                                </span>
                                <span className="flex-1 text-center">
                                  <span className="block font-semibold text-foreground">{Math.round((e.draw ?? 0) * 100)}%</span>
                                  D
                                </span>
                                <span className="flex-1 text-center">
                                  <span className="block font-semibold text-foreground">{Math.round((e.away_win ?? 0) * 100)}%</span>
                                  A
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Weight bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engine Weights</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          wts.source === "dynamic_historical"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}>
                          {wts.source === "dynamic_historical" ? "⚡ Dynamic" : "Default"}
                        </span>
                      </div>
                      <div className="flex rounded-lg overflow-hidden h-7 text-xs font-bold">
                        <div
                          className="flex items-center justify-center bg-primary/80 text-primary-foreground transition-all"
                          style={{ width: `${dcW}%` }}
                        >DC {dcW}%</div>
                        <div
                          className="flex items-center justify-center bg-info/70 text-white transition-all"
                          style={{ width: `${mlW}%` }}
                        >ML {mlW}%</div>
                        <div
                          className="flex items-center justify-center bg-warning/60 text-foreground transition-all"
                          style={{ width: `${legW}%` }}
                        >Leg {legW}%</div>
                      </div>
                    </div>

                    {/* Markets */}
                    {(mkt.btts_yes != null || mkt.over_2_5 != null) && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Markets</p>
                        <div className="flex flex-wrap gap-2">
                          {mkt.btts_yes != null && (
                            <>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                                mkt.btts_yes > 0.5 ? "border-success/30 bg-success/10 text-success" : "border-border bg-secondary/30 text-muted-foreground"
                              }`}>
                                BTTS Yes {Math.round(mkt.btts_yes * 100)}%
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                                mkt.btts_no > 0.5 ? "border-success/30 bg-success/10 text-success" : "border-border bg-secondary/30 text-muted-foreground"
                              }`}>
                                BTTS No {Math.round((mkt.btts_no ?? 0) * 100)}%
                              </span>
                            </>
                          )}
                          {mkt.over_2_5 != null && (
                            <>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                                mkt.over_2_5 > 0.5 ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary/30 text-muted-foreground"
                              }`}>
                                Over 2.5 {Math.round(mkt.over_2_5 * 100)}%
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                                mkt.under_2_5 > 0.5 ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary/30 text-muted-foreground"
                              }`}>
                                Under 2.5 {Math.round((mkt.under_2_5 ?? 0) * 100)}%
                              </span>
                            </>
                          )}
                          {mkt.home_xg != null && (
                            <span className="rounded-full px-3 py-1 text-xs font-semibold border border-border bg-secondary/30 text-muted-foreground">
                              xG {mkt.home_xg} - {mkt.away_xg}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
              </div>
              <div className="px-6 pb-5">
                <PredictionQA consensusResult={consensusResult} fixture={consensusFixture} />
              </div>
            </>
          )}
        </div>

        {/* Bottom Section: Results List + Detail + Chart */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Past Results */}
          <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Recent Results - From Database
              </h2>
              {resultsLoading ? (
                <p className="text-sm text-muted-foreground animate-pulse py-8 text-center">
                  Loading results from Supabase...
                </p>
              ) : liveResults.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    No completed matches in the database yet.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Sync data first to populate results.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
                  {liveResults.map((match: any) => (
                    <ResultCard
                      key={match.id}
                      match={match}
                      isSelected={selected?.id === match.id}
                      onSelect={() => setSelected(match)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Match Detail + Weekly Accuracy */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Match Detail */}
            <div>
              {selected ? (
                <>
                  <div className="rounded-lg border border-border bg-card p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {selected.league} · {selected.season}
                        </p>
                        <h3 className="text-sm font-semibold text-foreground">
                          {selected.home_team} vs {selected.away_team}
                        </h3>
                      </div>
                      {selected.home_score !== null && (
                        <div className="text-right">
                          <p className="text-2xl font-black font-mono text-foreground">
                            {selected.home_score} - {selected.away_score}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selected.match_date
                              ? new Date(selected.match_date).toLocaleDateString()
                              : ""}
                            {selected.gameweek ? ` · GW${selected.gameweek}` : ""}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selected.home_score !== null && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            selected.home_score > selected.away_score
                              ? "bg-primary/10 text-primary"
                              : selected.home_score < selected.away_score
                              ? "bg-info/10 text-info"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {selected.home_score > selected.away_score
                            ? `${selected.home_team} Win`
                            : selected.home_score < selected.away_score
                            ? `${selected.away_team} Win`
                            : "Draw"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4 mb-4">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Win Probability Timeline
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Real-time WPA requires a live match data feed
                    </p>
                    <div className="flex items-center justify-center h-40 rounded-lg bg-secondary/20 border border-dashed border-border">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                        <p className="text-sm text-muted-foreground">
                          WPA data not available for stored results
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Use the ML Prediction engine above to get pre-match probabilities
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
                  Select a match from the list to view details
                </div>
              )}
            </div>

            {/* Weekly Accuracy Trend */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Weekly Accuracy Trend</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Model performance by gameweek - from Supabase
              </p>
              {weeklyTrends.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] rounded-lg bg-secondary/20 border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    No gameweek data yet - sync match data first
                  </p>
                </div>
              ) : (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyTrends}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.22 0.01 260)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0].payload
                          return (
                            <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                              <p className="text-xs font-semibold text-foreground">{d.week}</p>
                              <p className="text-xs text-muted-foreground">
                                {d.correct}/{d.predictions} correct ({d.accuracy}%)
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                        {weeklyTrends.map((entry: any, i: number) => (
                          <Cell
                            key={i}
                            fill={
                              entry.accuracy >= 80
                                ? "oklch(0.65 0.19 145)"
                                : entry.accuracy >= 70
                                ? "oklch(0.7 0.18 55)"
                                : "oklch(0.55 0.2 27)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground mb-3">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-1">{sub}</p>
    </div>
  )
}

function ResultCard({
  match,
  isSelected,
  onSelect,
}: {
  key?: any
  match: any
  isSelected: boolean
  onSelect: () => any
}) {
  const homeWon = match.home_score > match.away_score
  const awayWon = match.away_score > match.home_score

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-4 transition-all ${
        isSelected ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-border/80"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              homeWon
                ? "bg-primary/10 text-primary"
                : awayWon
                ? "bg-info/10 text-info"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {homeWon ? "Home Win" : awayWon ? "Away Win" : "Draw"}
          </span>
          {match.gameweek && (
            <span className="text-[10px] text-muted-foreground">GW{match.gameweek}</span>
          )}
        </div>
        <ChevronRight
          className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${homeWon ? "text-foreground" : "text-foreground/70"}`}>
            {match.home_team}
          </p>
          <p className={`text-sm font-semibold ${awayWon ? "text-foreground" : "text-foreground/70"}`}>
            {match.away_team}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black font-mono text-foreground">
            {match.home_score} - {match.away_score}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-2">
        {match.league} ·{" "}
        {match.match_date ? new Date(match.match_date).toLocaleDateString() : ""}
      </p>
    </button>
  )
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-xs font-bold font-mono text-foreground">{value}</span>
    </div>
  )
}

// ── Prediction Q&A — Floating Side Panel ──────────────────────────────────────
const QUICK_QUESTIONS = [
  "Why is this outcome favored?",
  "What are the best bets?",
  "Which engine disagrees and why?",
  "Is BTTS likely here?",
  "How confident should I be?",
  "What does the xG suggest?",
]

const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B · Smartest" },
  { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B · Fastest"  },
  { id: "mixtral-8x7b-32768",      label: "Mixtral 8x7B · Long ctx" },
]
const GEMINI_MODELS = [
  { id: "gemini-2.0-flash",      label: "Gemini 2.0 Flash · Smart" },
  { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite · Fast" },
]

type ChatMessage = { role: "user" | "assistant"; content: string; hasAttachment?: boolean; attachmentType?: string }

export function PredictionQA({
  consensusResult,
  fixture,
}: {
  consensusResult: Record<string, any> | null
  fixture: Record<string, any> | null
}) {
  const [open, setOpen]             = useState(false)
  const [question, setQuestion]     = useState("")
  const [history, setHistory]       = useState<ChatMessage[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const [selectedProvider, setSelectedProvider] = useState<"groq" | "gemini">("groq")
  const [selectedModel, setSelectedModel]       = useState(GROQ_MODELS[0].id)
  const [configuredProviders, setConfiguredProviders] = useState<{ groq: boolean; gemini: boolean }>({ groq: true, gemini: true })

  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [attachment, setAttachment] = useState<{ file: File; base64: string; preview: string | null } | null>(null)

  const matchLabel = fixture
    ? `${fixture.home_team ?? fixture.home_name ?? ""} vs ${fixture.away_team ?? fixture.away_name ?? ""}`
    : "this match"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large (max 5MB)")
      return
    }
    const reader = new FileReader()
    reader.onload = (evt) => {
      const b64 = (evt.target?.result as string).split(",")[1]
      let preview = null
      if (file.type.startsWith("image/")) {
        preview = evt.target?.result as string
      }
      setAttachment({ file, base64: b64, preview })
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!open) return
    getAIModels().then((data: any) => {
      if (data?.configured) setConfiguredProviders(data.configured)
      if (!data?.configured?.groq && data?.configured?.gemini) {
        setSelectedProvider("gemini")
        setSelectedModel(GEMINI_MODELS[0].id)
      }
    }).catch(() => {})
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history, loading])

  const handleProviderChange = (p: "groq" | "gemini") => {
    setSelectedProvider(p)
    setSelectedModel(p === "groq" ? GROQ_MODELS[0].id : GEMINI_MODELS[0].id)
  }

  const currentModels = selectedProvider === "groq" ? GROQ_MODELS : GEMINI_MODELS

  const handleAsk = async (q: string) => {
    if (!q.trim() && !attachment) return
    if (loading) return
    const currentAttachmentType = attachment?.file.type.startsWith("image/") ? "image" : "file"
    const userMsg: ChatMessage = { role: "user", content: q.trim() || "", hasAttachment: !!attachment, attachmentType: currentAttachmentType }
    const updatedHistory = [...history, userMsg]
    setHistory(updatedHistory)
    setQuestion("")
    setLoading(true)
    setError(null)
    const currentAttachment = attachment
    setAttachment(null)
    
    try {
      const payload: any = {
        question: q.trim() || "What can you tell me about the attached file?",
        provider: selectedProvider,
        model:    selectedModel,
        history:  history,
      }
      if (currentAttachment) {
        payload.file_base64 = currentAttachment.base64
        payload.file_mime = currentAttachment.file.type
      }
      if (fixture?.id && fixture.id !== -1) payload.match_id     = fixture.id
      if (fixture?.home_team_id)            payload.home_team_id = fixture.home_team_id
      if (fixture?.away_team_id)            payload.away_team_id = fixture.away_team_id
      if (fixture?.league_id)               payload.league_id    = fixture.league_id
      if (fixture?.season_id)               payload.season_id    = fixture.season_id
      const res = await askPrediction(payload)
      setHistory([...updatedHistory, { role: "assistant", content: res.answer }])
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("503") || msg.includes("No LLM")) {
        setError("AI service unavailable. Check GROQ_API_KEY or GEMINI_API_KEY in Render.")
      } else if (msg.includes("404")) {
        setError("No prediction data found. Run a consensus prediction first.")
      } else {
        setError("Could not get an answer. Try again in a moment.")
      }
      setHistory(history)
    }
    setLoading(false)
  }

  if (!consensusResult || consensusResult.error) return null

  return (
    <>
      {/* Inline trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Ask AI about this prediction"
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-primary/20 bg-primary/5 text-primary py-3 mt-2 font-semibold hover:bg-primary/10 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        Ask PlusOne AI
      </button>

      {/* Slide-out panel portaled to document body */}
      {typeof document !== "undefined" && createPortal(
        <>
          {open && (
            <div
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
          )}
          <div
            className={`fixed top-0 right-0 z-[110] h-[100dvh] w-full sm:w-[450px] flex flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">PlusOne AI</p>
              <p className="text-xs text-muted-foreground truncate max-w-[220px]">{matchLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => { setHistory([]); setError(null) }}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-secondary/50 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border shrink-0 bg-secondary/10">
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {(["groq", "gemini"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                disabled={!configuredProviders[p]}
                className={`px-3 py-1.5 font-medium transition-colors capitalize ${
                  selectedProvider === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/20 text-muted-foreground hover:bg-secondary/50"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {p === "groq" ? "Groq" : "Gemini"}
              </button>
            ))}
          </div>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs rounded-lg border border-border bg-secondary/20 px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {currentModels.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <span className="text-[10px] text-muted-foreground">Free tier</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
          {history.length === 0 && !loading && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center pt-2">Ask anything about this prediction</p>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  disabled={loading}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-secondary/20 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-secondary/40 text-foreground border border-border rounded-tl-sm"
              }`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">PlusOne AI</span>
                  </div>
                )}
                {msg.hasAttachment && (
                  <div className="flex items-center gap-1.5 mb-1.5 px-2 py-1 bg-black/10 rounded-md w-fit text-primary-foreground border border-primary-foreground/20">
                    {msg.attachmentType === "image" ? <ImageIcon className="h-3 w-3 opacity-90" /> : <Paperclip className="h-3 w-3 opacity-90" />}
                    <span className="text-[10px] font-medium opacity-90">Attached context</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary/40 border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-xs text-muted-foreground animate-pulse">Thinking...</span>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-destructive/5 border border-destructive/20 rounded-2xl rounded-tl-sm px-4 py-3 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-border px-4 py-3 bg-card">
          {attachment && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/30 rounded-lg border border-border w-fit max-w-full relative shadow-sm">
              {attachment.preview ? (
                <img src={attachment.preview} alt="upload" className="h-8 w-8 object-cover rounded-md border border-border" />
              ) : (
                <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center border border-border">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col flex-1 min-w-0 mr-6">
                <span className="text-xs font-semibold text-foreground truncate">{attachment.file.name}</span>
                <span className="text-[10px] text-muted-foreground">{Math.round(attachment.file.size / 1024)} KB</span>
              </div>
              <button 
                onClick={() => setAttachment(null)} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center rounded-xl bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary w-10 h-10 transition-colors shrink-0 border border-transparent hover:border-border"
              title="Attach File or Image"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,.txt,.csv,.json" 
              onChange={handleFileChange} 
            />
            <textarea
              ref={inputRef}
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleAsk(question)
                }
              }}
              placeholder={history.length > 0 ? "Ask a follow-up..." : "Ask anything about this prediction..."}
              className="flex-1 rounded-xl border border-border bg-secondary/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none scrollbar-thin"
            />
            <button
              onClick={() => handleAsk(question)}
              disabled={loading || (!question.trim() && !attachment)}
              className="flex items-center justify-center rounded-xl bg-primary text-primary-foreground w-10 h-10 hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
              title="Send"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
        </>,
        document.body
      )}
    </>
  )
}
