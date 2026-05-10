"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Image from "next/image"
import {
    getTeams, getLeagues, getDCStatus, trainDCModel,
    getMarkets, getDCPredict, getDCLeaderboard, getValueBets,
    getEnrichmentStatus, trainEnrichmentModel
} from "@/lib/api"
import { TrendingUp, BarChart3, Zap, RefreshCw, AlertCircle, Trophy, Target, ChevronDown, ChevronUp } from "lucide-react"

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground mb-3"><Icon className="h-4 w-4" /></div>
            <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{sub}</p>
        </div>
    )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-lg border border-border bg-secondary/20 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className="text-base font-black font-mono text-foreground">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
        </div>
    )
}

function PBar({ label, value, color }: { label: string; value: number; color: string }) {
    const pct = Math.round(value * 100)
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-bold font-mono">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function MarketsPage() {
    const [dcStatus, setDcStatus] = useState<any>(null)
    const [dcLoading, setDcLoading] = useState(true)
    const [training, setTraining] = useState(false)
    const [polling, setPolling] = useState(false)
    const [trainMsg, setTrainMsg] = useState("")
    const [leagues, setLeagues] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [selectedLeague, setSelectedLeague] = useState("")
    const [homeId, setHomeId] = useState("")
    const [awayId, setAwayId] = useState("")
    const [loading, setLoading] = useState(false)
    const [markets, setMarkets] = useState<any>(null)
    const [dcPred, setDcPred] = useState<any>(null)
    const [error, setError] = useState("")
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [showLb, setShowLb] = useState(false)

    // Enrichment Engine
    const [enrichStatus, setEnrichStatus] = useState<any>(null)
    const [enrichTraining, setEnrichTraining] = useState(false)
    const [enrichPolling, setEnrichPolling] = useState(false)
    const [enrichTrainMsg, setEnrichTrainMsg] = useState("")
    const [homeOdds, setHomeOdds] = useState("")
    const [drawOdds, setDrawOdds] = useState("")
    const [awayOdds, setAwayOdds] = useState("")
    const [valueBets, setValueBets] = useState<any[]>([])
    const [valueLoading, setValueLoading] = useState(false)
    const [expandAH, setExpandAH] = useState(false)
    const [expandOU, setExpandOU] = useState(false)
    const [expandCS, setExpandCS] = useState(false)

    useEffect(() => {
        getDCStatus().then(s => setDcStatus(s)).catch(() => null).finally(() => setDcLoading(false))
        getEnrichmentStatus().then(s => setEnrichStatus(s)).catch(() => null)
        getLeagues().then(d => setLeagues(Array.isArray(d) ? d : []))
        getTeams().then(d => setTeams(Array.isArray(d) ? d : []))
    }, [])

    // Clean team names: exclude ClubElo artifacts ("eng Arsenal", "ee FC Flora", "eng vs Chelsea")
    // Pattern: names starting with lowercase (country code prefix) or containing " vs "
    const isCleanTeam = (t: any) => t.name && /^[A-Z0-9]/.test(t.name) && !t.name.includes(" vs ")

    const filteredTeams = teams
        .filter(isCleanTeam)
        .filter((t: any) => !selectedLeague || String(t.league_id) === selectedLeague)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

    const handleTrain = async () => {
        setTraining(true); setTrainMsg("Starting training…")
        try {
            await trainDCModel()
            setTrainMsg("⏳ Training in progress — checking every 5s…")
            setTraining(false)
            setPolling(true)
            // Poll until ready
            const poll = setInterval(async () => {
                try {
                    const s = await getDCStatus()
                    setDcStatus(s)
                    if (s?.dc_model_trained) {
                        clearInterval(poll)
                        setPolling(false)
                        setTrainMsg(`✅ Ready! Trained on ${s.n_matches} matches across ${s.n_teams} teams.`)
                    }
                } catch { /* keep polling */ }
            }, 5000)
            // Safety timeout after 3 min
            setTimeout(() => { clearInterval(poll); setPolling(false); setTrainMsg("⚠️ Timed out — check backend logs and try again.") }, 180000)
        } catch { setTrainMsg("❌ Train request failed."); setTraining(false) }
    }

    const handleEnrichTrain = async () => {
        setEnrichTraining(true); setEnrichTrainMsg("Starting training…")
        try {
            await trainEnrichmentModel()
            setEnrichTrainMsg("⏳ Training Enrichment ML in progress…")
            setEnrichTraining(false)
            setEnrichPolling(true)
            const poll = setInterval(async () => {
                try {
                    const s = await getEnrichmentStatus()
                    setEnrichStatus(s)
                    if (s?.status !== "running" && s?.status !== "idle") {
                        clearInterval(poll)
                        setEnrichPolling(false)
                        if (s?.status === "done") {
                            setEnrichTrainMsg(`✅ Ready! Enrichment Model trained effectively.`)
                        } else {
                            setEnrichTrainMsg(`❌ Failed: ${s?.error || 'Unknown error'}`)
                        }
                    }
                } catch { }
            }, 3000)
            setTimeout(() => { clearInterval(poll); setEnrichPolling(false); setEnrichTrainMsg("⚠️ Timed out.") }, 90000)
        } catch { setEnrichTrainMsg("❌ Train request failed."); setEnrichTraining(false) }
    }

    const handleGetMarkets = async () => {
        if (!homeId || !awayId || homeId === awayId) { setError("Select different home and away teams."); return }
        setLoading(true); setError(""); setMarkets(null); setDcPred(null); setValueBets([])
        try {
            const [mkt, dc] = await Promise.all([getMarkets(Number(homeId), Number(awayId)), getDCPredict(Number(homeId), Number(awayId))])
            setMarkets(mkt); setDcPred(dc)
        } catch (e: any) { setError(e.message || "Failed — ensure DC model is trained.") }
        setLoading(false)
    }

    const handleLeaderboard = async () => {
        if (showLb) { setShowLb(false); return }
        try { const d = await getDCLeaderboard(); setLeaderboard(d?.leaderboard || []) } catch { }
        setShowLb(true)
    }

    const handleValueCheck = async () => {
        if (!homeId || !awayId || !homeOdds || !drawOdds || !awayOdds) return
        setValueLoading(true)
        try {
            const res = await getValueBets({ home_team_id: Number(homeId), away_team_id: Number(awayId), market_odds: { home_win: parseFloat(homeOdds), draw: parseFloat(drawOdds), away_win: parseFloat(awayOdds) }, min_edge_pct: 3 })
            setValueBets(res?.value_bets || [])
        } catch { setValueBets([]) }
        setValueLoading(false)
    }

    const grade: Record<string, string> = { "A+": "text-success bg-success/10", "A": "text-success bg-success/10", "B+": "text-warning bg-warning/10", "B": "text-warning bg-warning/10", "C": "text-muted-foreground bg-secondary" }

    const ou = markets?.markets?.over_under ?? {}
    const ah = markets?.markets?.asian_handicap ?? {}
    const cs = markets?.markets?.correct_score ?? []
    const m1x2 = dcPred?.calibrated ?? {}
    const dc = dcPred?.calibrated ?? {}

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-foreground">Betting Markets</h1>
                    <p className="text-sm text-muted-foreground mt-1">Dixon-Coles + Elo + xG + Monte Carlo (50k sims) · Full market sheet · Value bets · Elo rankings</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={BarChart3} label="DC Model" value={dcLoading ? "…" : dcStatus?.dc_model_trained ? "Ready" : "Untrained"} sub={dcStatus?.n_matches ? `${dcStatus.n_matches} matches` : "Not trained"} />
                    <StatCard icon={Target} label="Teams Rated" value={dcStatus?.n_teams ? String(dcStatus.n_teams) : "—"} sub="Elo + DC ratings" />
                    <StatCard icon={TrendingUp} label="Last Trained" value={dcStatus?.trained_at ? "✓" : "—"} sub={dcStatus?.trained_at ? new Date(dcStatus.trained_at).toLocaleDateString() : "Never"} />
                    <StatCard icon={Zap} label="Markets" value="9" sub="1X2 · AH · O/U · BTTS · CS…" />
                </div>

                {/* Engine card */}
                <div className="rounded-lg border border-border bg-card mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-border">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Dixon-Coles Engine</h2>
                            <p className="text-xs text-muted-foreground">MLE + time-decay · Elo · xG · Monte Carlo · Isotonic calibration</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {!dcLoading && (dcStatus?.dc_model_trained
                                ? <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-xs font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-success" />Trained</span>
                                : <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 text-warning px-3 py-1 text-xs font-semibold"><AlertCircle className="h-3 w-3" />Not Trained</span>
                            )}
                            <button onClick={handleTrain} disabled={training || polling} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
                                <RefreshCw className={`h-3.5 w-3.5 ${(training || polling) ? "animate-spin" : ""}`} />{training ? "Starting…" : polling ? "Training…" : dcStatus?.dc_model_trained ? "Retrain" : "Train Engine"}
                            </button>
                            <button onClick={handleLeaderboard} className="inline-flex items-center gap-2 rounded-lg bg-secondary text-foreground px-4 py-2 text-sm font-semibold hover:bg-secondary/80 transition-colors">
                                <Trophy className="h-3.5 w-3.5" />Elo Rankings
                            </button>
                        </div>
                    </div>
                    {trainMsg && <div className={`px-6 py-2 text-sm border-b border-border ${trainMsg.startsWith("✅") ? "bg-success/5 text-success" : trainMsg.startsWith("❌") ? "bg-destructive/5 text-destructive" : "text-muted-foreground"}`}>{trainMsg}</div>}

                    {showLb && (
                        <div className="px-6 py-4 border-b border-border max-h-72 overflow-y-auto">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Elo Leaderboard</h3>
                            {leaderboard.slice(0, 30).map((r: any, i: number) => (
                                <div key={r.team} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                                    <div className="flex items-center gap-3"><span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span><span className="text-sm">{r.team}</span></div>
                                    <div className="flex items-center gap-3"><span className={`text-xs font-semibold ${r.delta >= 0 ? "text-success" : "text-destructive"}`}>{r.delta >= 0 ? "+" : ""}{r.delta}</span><span className="text-sm font-bold font-mono w-16 text-right">{r.elo}</span></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Enrichment Engine Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-t border-border">
                        <div>
                            <h2 className="text-sm font-bold text-foreground">Enrichment ML Engine</h2>
                            <p className="text-xs text-muted-foreground">Extreme Gradient Boosting (Odds + Lines Integration)</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {(enrichStatus?.status === "done"
                                ? <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-[10px] font-semibold"><span className="h-1 w-1 rounded-full bg-success" />Trained</span>
                                : <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 text-warning px-3 py-1 text-[10px] font-semibold"><AlertCircle className="h-3 w-3" />Needs Training</span>
                            )}
                            <button onClick={handleEnrichTrain} disabled={enrichTraining || enrichPolling} className="inline-flex items-center gap-2 rounded-lg bg-secondary text-foreground px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-60 border border-border">
                                <RefreshCw className={`h-3 w-3 ${(enrichTraining || enrichPolling) ? "animate-spin" : ""}`} />{enrichTraining ? "Starting…" : enrichPolling ? "Training…" : enrichStatus?.status === "done" ? "Retrain" : "Train Engine"}
                            </button>
                        </div>
                    </div>
                    {enrichTrainMsg && <div className={`px-6 py-2 text-xs border-t border-border ${enrichTrainMsg.startsWith("✅") ? "bg-success/5 text-success" : enrichTrainMsg.startsWith("❌") ? "bg-destructive/5 text-destructive" : "text-muted-foreground"}`}>{enrichTrainMsg}</div>}

                    {/* Team picker */}
                    <div className="px-6 py-5">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Get Full Market Sheet</h3>
                        <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
                            <div className="w-full sm:w-40">
                                <label className="text-xs text-muted-foreground mb-1.5 block">League</label>
                                <select value={selectedLeague} onChange={e => { setSelectedLeague(e.target.value); setHomeId(""); setAwayId("") }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="">All Leagues</option>
                                    {leagues.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[180px]">
                                <label className="text-xs text-muted-foreground mb-1.5 block">Home Team</label>
                                <select value={homeId} onChange={e => setHomeId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="">Select home team…</option>
                                    {filteredTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="pb-2 text-sm font-bold text-muted-foreground">VS</div>
                            <div className="flex-1 min-w-[180px]">
                                <label className="text-xs text-muted-foreground mb-1.5 block">Away Team</label>
                                <select value={awayId} onChange={e => setAwayId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="">Select away team…</option>
                                    {filteredTeams.filter((t: any) => String(t.id) !== homeId).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleGetMarkets} disabled={loading || !homeId || !awayId || !dcStatus?.dc_model_trained || polling} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />{loading ? "Loading…" : polling ? "Waiting for model…" : "Get Markets"}
                            </button>
                        </div>
                        {error && <div className="mt-3 flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>}
                        {!dcStatus?.dc_model_trained && !polling && !training && (
                            <p className="mt-3 text-xs text-warning flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                Train the DC model first, then pick teams and click Get Markets.
                            </p>
                        )}
                        {polling && (
                            <p className="mt-3 text-xs text-muted-foreground animate-pulse flex items-center gap-1.5">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
                                Training in progress — Get Markets will unlock automatically when ready…
                            </p>
                        )}
                    </div>
                </div>

                {/* Results */}
                {dcPred && markets && (
                    <div className="space-y-5">

                        {/* Summary */}
                        <div className="rounded-lg border border-border bg-card p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Ensemble Prediction</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center relative shadow-sm mb-1">
                                                 <Image src={dcPred.home_logo || "/placeholder-logo.png"} alt={`${dcPred.home_team} logo`} fill sizes="48px" className="object-contain p-1" />
                                            </div>
                                            <h2 className="text-lg font-black">{dcPred.home_team}</h2>
                                        </div>
                                        <span className="text-muted-foreground font-bold text-sm mx-2">vs</span>
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center relative shadow-sm mb-1">
                                                <Image src={dcPred.away_logo || "/placeholder-logo.png"} alt={`${dcPred.away_team} logo`} fill sizes="48px" className="object-contain p-1" />
                                            </div>
                                            <h2 className="text-lg font-black">{dcPred.away_team}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5"><span className="text-sm font-black text-primary">{dcPred.prediction}</span></div>
                                    <p className="text-xs text-muted-foreground mt-1">Confidence: <span className="font-bold text-foreground">{dcPred.confidence}%</span></p>
                                </div>
                            </div>
                            <div className="space-y-3 mb-5">
                                <PBar label={`${dcPred.home_team} Win`} value={dc.home_win ?? 0} color="bg-primary" />
                                <PBar label="Draw" value={dc.draw ?? 0} color="bg-warning" />
                                <PBar label={`${dcPred.away_team} Win`} value={dc.away_win ?? 0} color="bg-info" />
                            </div>
                            <div className="flex items-center justify-center gap-8 rounded-lg bg-secondary/20 border border-border py-4">
                                <div className="text-center"><p className="text-2xl font-black text-primary">{dcPred.exp_home_goals}</p><p className="text-xs text-muted-foreground">{dcPred.home_team} exp. goals</p></div>
                                <div className="text-sm font-bold text-muted-foreground">vs</div>
                                <div className="text-center"><p className="text-2xl font-black text-info">{dcPred.exp_away_goals}</p><p className="text-xs text-muted-foreground">{dcPred.away_team} exp. goals</p></div>
                            </div>
                        </div>

                        {/* 1X2 + Quick markets */}
                        <div className="rounded-lg border border-border bg-card p-5">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Core Markets</h3>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[["Home Win", m1x2.home_win], ["Draw", m1x2.draw], ["Away Win", m1x2.away_win]].map(([l, v]: any) => (
                                    <div key={l} className="rounded-lg border border-border bg-secondary/20 p-3 text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{l}</p>
                                        <p className="text-xl font-black">{Math.round((v ?? 0) * 100)}%</p>
                                        <p className="text-[10px] text-muted-foreground/60">Fair {v > 0 ? (1 / v).toFixed(2) : "—"}x</p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <Tile label="BTTS Yes" value={`${Math.round((markets.markets?.btts?.btts_yes ?? 0) * 100)}%`} sub={`Fair ${markets.markets?.btts?.fair_yes}x`} />
                                <Tile label="BTTS No" value={`${Math.round((markets.markets?.btts?.btts_no ?? 0) * 100)}%`} sub={`Fair ${markets.markets?.btts?.fair_no}x`} />
                                <Tile label="Over 2.5" value={`${Math.round((ou["O/U 2.5"]?.over ?? 0) * 100)}%`} sub="goals" />
                                <Tile label="Under 2.5" value={`${Math.round((ou["O/U 2.5"]?.under ?? 0) * 100)}%`} sub="goals" />
                            </div>
                        </div>

                        {/* Double Chance + DNB */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-lg border border-border bg-card p-5">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Double Chance</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {["1X", "X2", "12"].map(k => <Tile key={k} label={k} value={`${Math.round((markets.markets?.double_chance?.[k] ?? 0) * 100)}%`} />)}
                                </div>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-5">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Draw No Bet / Win to Nil</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Tile label="Home DNB" value={`${Math.round((markets.markets?.draw_no_bet?.home_dnb ?? 0) * 100)}%`} />
                                    <Tile label="Away DNB" value={`${Math.round((markets.markets?.draw_no_bet?.away_dnb ?? 0) * 100)}%`} />
                                    <Tile label="Home WtN" value={`${Math.round((markets.markets?.win_to_nil?.home_win_to_nil ?? 0) * 100)}%`} />
                                    <Tile label="Away WtN" value={`${Math.round((markets.markets?.win_to_nil?.away_win_to_nil ?? 0) * 100)}%`} />
                                </div>
                            </div>
                        </div>

                        {/* Over/Under accordion */}
                        <div className="rounded-lg border border-border bg-card">
                            <button onClick={() => setExpandOU(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-secondary/10 transition-colors">
                                Over / Under Lines {expandOU ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {expandOU && (
                                <div className="px-6 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {Object.entries(ou).map(([line, v]: any) => (
                                        <div key={line} className="rounded-lg border border-border bg-secondary/20 p-3">
                                            <p className="text-[10px] text-muted-foreground mb-2">{line}</p>
                                            <div className="flex justify-between text-xs"><span className="text-success font-bold">Over {Math.round(v.over * 100)}%</span><span className="text-destructive font-bold">Under {Math.round(v.under * 100)}%</span></div>
                                            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1"><span>{v.fair_over}x</span><span>{v.fair_under}x</span></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Asian Handicap accordion */}
                        <div className="rounded-lg border border-border bg-card">
                            <button onClick={() => setExpandAH(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-secondary/10 transition-colors">
                                Asian Handicap {expandAH ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {expandAH && (
                                <div className="px-6 pb-5 overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead><tr className="border-b border-border">{["Line", "Home", "Push", "Away", "Fair H", "Fair A"].map(h => <th key={h} className="py-2 text-muted-foreground font-medium text-right first:text-left">{h}</th>)}</tr></thead>
                                        <tbody>
                                            {Object.entries(ah).map(([line, v]: any) => (
                                                <tr key={line} className="border-b border-border/40 hover:bg-secondary/10">
                                                    <td className="py-2 font-mono text-foreground">{line}</td>
                                                    <td className="py-2 text-right text-primary font-bold">{Math.round(v.home * 100)}%</td>
                                                    <td className="py-2 text-right text-muted-foreground">{Math.round(v.push * 100)}%</td>
                                                    <td className="py-2 text-right text-info font-bold">{Math.round(v.away * 100)}%</td>
                                                    <td className="py-2 text-right font-mono">{v.fair_home}</td>
                                                    <td className="py-2 text-right font-mono">{v.fair_away}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Correct score accordion */}
                        <div className="rounded-lg border border-border bg-card">
                            <button onClick={() => setExpandCS(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-secondary/10 transition-colors">
                                Top Correct Scores {expandCS ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {expandCS && (
                                <div className="px-6 pb-5 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {cs.map((s: any) => (
                                        <div key={s.score} className="rounded-lg border border-border bg-secondary/20 p-3 text-center">
                                            <p className="text-lg font-black font-mono">{s.score}</p>
                                            <p className="text-[10px] text-muted-foreground">{Math.round(s.probability * 1000) / 10}%</p>
                                            <p className="text-[10px] text-muted-foreground/60">{s.fair_odds}x</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Value bet checker */}
                        <div className="rounded-lg border border-border bg-card p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-1">Value Bet Checker</h3>
                            <p className="text-xs text-muted-foreground mb-4">Enter bookmaker 1X2 odds — we find where edge ≥ 3%</p>
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                {[["Home Odds", homeOdds, setHomeOdds], ["Draw Odds", drawOdds, setDrawOdds], ["Away Odds", awayOdds, setAwayOdds]].map(([lbl, val, set]: any) => (
                                    <div key={lbl} className="flex-1">
                                        <label className="text-xs text-muted-foreground mb-1.5 block">{lbl}</label>
                                        <input type="number" step="0.01" min="1" value={val} onChange={e => set(e.target.value)} placeholder="e.g. 2.45" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                                    </div>
                                ))}
                                <button onClick={handleValueCheck} disabled={valueLoading || !homeOdds || !drawOdds || !awayOdds} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                                    <Zap className="h-4 w-4" />{valueLoading ? "Checking…" : "Find Value"}
                                </button>
                            </div>
                            {valueLoading === false && homeOdds && valueBets.length === 0 && <p className="text-xs text-muted-foreground mt-3">No value bets at ≥3% edge with those odds.</p>}
                            {valueBets.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {valueBets.map((b: any, i: number) => (
                                        <div key={i} className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold mr-2 ${grade[b.grade] ?? "text-muted-foreground bg-secondary"}`}>{b.grade}</span><span className="text-sm font-semibold">{b.outcome.replace("_", " ").toUpperCase()}</span></div>
                                            <div className="flex flex-wrap gap-4 text-xs">
                                                <span>Model: <strong>{Math.round(b.model_prob * 100)}%</strong></span>
                                                <span>Odds: <strong className="font-mono">{b.market_odds}</strong></span>
                                                <span className="text-success font-bold">Edge +{b.edge_pct}%</span>
                                                <span>Kelly: <strong>{(b.kelly_25pct * 100).toFixed(1)}%</strong> stake</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Per-model breakdown */}
                        <div className="rounded-lg border border-border bg-card p-5">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Model Breakdown</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead><tr className="border-b border-border">{["Model", "Home Win", "Draw", "Away Win"].map(h => <th key={h} className="py-2 text-muted-foreground font-medium text-right first:text-left">{h}</th>)}</tr></thead>
                                    <tbody>
                                        {[["Dixon-Coles", dcPred.models?.dixon_coles], ["Elo", dcPred.models?.elo], ["xG Proxy", dcPred.models?.xg], ["Blended", dcPred.blended], ["Calibrated ✓", dcPred.calibrated]].map(([name, m]: any) => m && (
                                            <tr key={name} className={`border-b border-border/40 ${name === "Calibrated ✓" ? "bg-primary/5" : ""}`}>
                                                <td className={`py-2 font-medium ${name === "Calibrated ✓" ? "text-primary" : ""}`}>{name}</td>
                                                <td className="py-2 text-right font-mono">{Math.round((m.home_win ?? 0) * 100)}%</td>
                                                <td className="py-2 text-right font-mono">{Math.round((m.draw ?? 0) * 100)}%</td>
                                                <td className="py-2 text-right font-mono">{Math.round((m.away_win ?? 0) * 100)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
