"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getPerformance, getPerformanceDrift, getCalibration, getPerLeague, getConfusionMatrix, evaluatePredictions, recalibrate, getEnginePerformance, getPerformanceMarkets } from "@/lib/api"
import { BarChart3, TrendingUp, Target, CheckCircle2, AlertCircle, RefreshCw, Zap, Cpu, Trophy, ChevronDown } from "lucide-react"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from "recharts"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, good }: {
    icon: React.ElementType; label: string; value: string; sub: string; good?: boolean
}) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground mb-3">
                <Icon className="h-4 w-4" />
            </div>
            <p className={`text-2xl font-bold font-mono ${good === true ? "text-success" : good === false ? "text-destructive" : "text-foreground"}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{sub}</p>
        </div>
    )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-border bg-card p-5 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>
            {sub && <p className="text-xs text-muted-foreground mb-4">{sub}</p>}
            {!sub && <div className="mb-4" />}
            {children}
        </div>
    )
}

// ─── Full Market Performance Section ──────────────────────────────────────────────────

const MKT_ENGINES = ["consensus", "dc", "ml", "legacy"] as const
const ENGINE_COLORS: Record<string, string> = {
    consensus: "#22c55e", dc: "#3b82f6", ml: "#8b5cf6", legacy: "#f59e0b",
}

function MiniBar({ pct, engine }: { pct: number | null; engine: string }) {
    if (pct == null) return <span className="text-xs text-muted-foreground/50 font-mono">—</span>
    const color = ENGINE_COLORS[engine] || "#6b7280"
    return (
        <div className="flex items-center gap-1.5 w-full">
            <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
            </div>
            <span className={`text-[10px] font-mono w-8 text-right ${
                pct >= 60 ? "text-green-400" : pct >= 45 ? "text-yellow-400" : "text-red-400"
            }`}>{pct}%</span>
        </div>
    )
}

function MarketAccuracySection({ data }: { data: any }) {
    const [expanded, setExpanded] = useState<string | null>(null)
    if (!data) return null
    const { markets, league_rankings, summary, total_graded, legacy_data } = data
    const mktEntries = Object.entries(markets || {}) as [string, any][]

    if (mktEntries.length === 0) {
        return (
            <Section title="Market Performance" sub="Full per-market accuracy from all 3 engines">
                <p className="text-xs text-muted-foreground">No market predictions graded yet. Run Evaluate Predictions after matches complete.</p>
            </Section>
        )
    }

    return (
        <Section
            title="Market Performance"
            sub={`${total_graded > 0 ? `${total_graded} graded predictions` : 'Legacy data'} · DC, ML & Legacy tracked per market`}
        >
            {/* Summary pills */}
            {(summary?.best_markets?.length > 0 || summary?.worst_markets?.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {summary.best_markets?.map((m: any) => (
                        <span key={m.market}
                            className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-1 text-[10px] font-semibold text-green-400">
                            <Trophy className="h-2.5 w-2.5" /> {m.label}{m.accuracy_pct != null ? ` · ${m.accuracy_pct}%` : ""}
                        </span>
                    ))}
                    {summary.worst_markets?.filter((m: any) => m.accuracy_pct != null && m.accuracy_pct < 45).map((m: any) => (
                        <span key={`w-${m.market}`}
                            className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[10px] font-semibold text-red-400">
                            ↓ {m.label} {m.accuracy_pct}%
                        </span>
                    ))}
                </div>
            )}

            {/* Markets table */}
            <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-2 text-muted-foreground font-medium text-left">Market</th>
                            <th className="py-2 text-muted-foreground font-medium text-center">n</th>
                            <th className="py-2 text-muted-foreground font-medium text-center w-28">Best Engine</th>
                            {MKT_ENGINES.map(e => (
                                <th key={e} className="py-2 text-muted-foreground font-medium text-center capitalize w-24">{e}</th>
                            ))}
                            <th className="py-2 w-5" />
                        </tr>
                    </thead>
                    <tbody>
                        {mktEntries.map(([key, mkt]) => (
                            <>
                                <tr
                                    key={key}
                                    className="border-b border-border/30 hover:bg-secondary/10 cursor-pointer"
                                    onClick={() => setExpanded(expanded === key ? null : key)}
                                >
                                    <td className="py-2 font-medium text-foreground">{mkt.label}</td>
                                    <td className="py-2 text-center font-mono text-muted-foreground">{mkt.total}</td>
                                    <td className="py-2 text-center">
                                        <span
                                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
                                            style={{
                                                backgroundColor: `${ENGINE_COLORS[mkt.best_engine] || "#6b7280"}22`,
                                                color: ENGINE_COLORS[mkt.best_engine] || "#6b7280",
                                            }}
                                        >
                                            {mkt.best_engine} {mkt.best_accuracy != null ? `${mkt.best_accuracy}%` : ""}
                                        </span>
                                    </td>
                                    {MKT_ENGINES.map(eng => (
                                        <td key={eng} className="py-2 px-2">
                                            <MiniBar pct={mkt[eng]?.accuracy_pct ?? null} engine={eng} />
                                        </td>
                                    ))}
                                    <td className="py-2 text-muted-foreground">
                                        <ChevronDown className={`h-3 w-3 transition-transform ${expanded === key ? 'rotate-180' : ''}`} />
                                    </td>
                                </tr>
                                {expanded === key && (league_rankings?.[key]?.length ?? 0) > 0 && (
                                    <tr key={`${key}-lg`}>
                                        <td colSpan={6 + MKT_ENGINES.length} className="px-4 py-3 bg-secondary/5">
                                            <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                                Top Leagues — {mkt.label}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {league_rankings[key].slice(0, 6).map((lr: any) => (
                                                    <span key={lr.league} className={`rounded-lg border px-2.5 py-1 text-[10px] ${
                                                        lr.tier === 'reliable'   ? 'border-green-500/30 bg-green-500/5 text-green-400' :
                                                        lr.tier === 'learning'   ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400' :
                                                                                   'border-red-500/30 bg-red-500/5 text-red-400'
                                                    }`}>
                                                        <span className="font-semibold">{lr.league}</span>
                                                        <span className="text-muted-foreground ml-1">
                                                            {lr.accuracy_pct != null ? `${lr.accuracy_pct}%` : '—'} ({lr.n})
                                                        </span>
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>

            {legacy_data && (
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Showing legacy BTTS/O2.5 data. Full breakdown available once prediction_markets_log is populated.
                </p>
            )}
        </Section>
    )
}



// ─── Engine Breakdown Section ─────────────────────────────────────────────────

const ENGINE_META: Record<string, { label: string; color: string; bg: string }> = {
    dc:        { label: "Dixon-Coles",    color: "#3b82f6", bg: "bg-blue-500/10" },
    ml:        { label: "ML Ensemble",    color: "#8b5cf6", bg: "bg-violet-500/10" },
    legacy:    { label: "Legacy Heuristic", color: "#f59e0b", bg: "bg-amber-500/10" },
    consensus: { label: "Consensus Blend", color: "#22c55e", bg: "bg-green-500/10" },
}

function EngineBar({ pct, color }: { pct: number | null; color: string }) {
    if (pct == null) return <span className="text-xs text-muted-foreground">—</span>
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
            </div>
            <span className={`text-xs font-mono font-bold w-10 text-right ${
                pct >= 55 ? "text-green-400" : pct >= 45 ? "text-foreground" : "text-red-400"
            }`}>{pct}%</span>
        </div>
    )
}

function EngineBreakdownSection({ data }: { data: any }) {
    if (!data) return null
    const { overall, last_30, by_outcome } = data
    const engines = ["dc", "ml", "legacy", "consensus"] as const

    // Find best overall engine
    const best = engines.reduce((b, e) =>
        (overall[e]?.accuracy_pct ?? 0) > (overall[b]?.accuracy_pct ?? 0) ? e : b, "dc" as typeof engines[number]
    )

    return (
        <Section title="Engine Breakdown" sub="Per-engine accuracy from evaluated predictions. DC & ML now learn from mistakes via live calibration after each sync.">
            {/* Engine scorecards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {engines.map(eng => {
                    const meta = ENGINE_META[eng]
                    const stats = overall[eng]
                    const trend = last_30[eng]
                    const isBest = eng === best && stats?.evaluated > 0
                    return (
                        <div key={eng}
                            className={`rounded-lg border p-3 relative ${
                                isBest ? "border-green-500/40 bg-green-500/5" : "border-border bg-card"
                            }`}>
                            {isBest && (
                                <span className="absolute top-2 right-2 text-[9px] font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full">BEST</span>
                            )}
                            <p className="text-[10px] text-muted-foreground mb-1 font-medium">{meta.label}</p>
                            <p className={`text-2xl font-black font-mono mb-0.5 ${
                                (stats?.accuracy_pct ?? 0) >= 55 ? "text-green-400" :
                                (stats?.accuracy_pct ?? 0) >= 45 ? "text-foreground" : "text-red-400"
                            }`}>
                                {stats?.accuracy_pct != null ? `${stats.accuracy_pct}%` : "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {stats?.correct ?? 0}/{stats?.evaluated ?? 0} correct
                            </p>
                            {trend?.accuracy_pct != null && (
                                <p className="text-[10px] text-muted-foreground/70 mt-1">
                                    Last 30d: <span className={`font-semibold ${
                                        trend.accuracy_pct >= 55 ? "text-green-400" :
                                        trend.accuracy_pct >= 45 ? "text-foreground" : "text-red-400"
                                    }`}>{trend.accuracy_pct}%</span>
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Per-outcome accuracy table */}
            {by_outcome?.length > 0 && (
                <div className="overflow-x-auto">
                    <p className="text-[10px] text-muted-foreground mb-2">Accuracy by actual outcome — reveals which engine handles Draws and Away Wins best.</p>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-2 text-muted-foreground font-medium text-left">Actual Outcome</th>
                                {engines.map(e => (
                                    <th key={e} className="py-2 text-muted-foreground font-medium text-right">
                                        {ENGINE_META[e].label.split(" ")[0]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {by_outcome.map((row: any, i: number) => (
                                <tr key={i} className="border-b border-border/40 hover:bg-secondary/10">
                                    <td className="py-2 font-medium text-foreground">{row.outcome}</td>
                                    {engines.map(e => {
                                        const s = row[e]
                                        return (
                                            <td key={e} className="py-2 text-right">
                                                <EngineBar pct={s?.accuracy_pct ?? null} color={ENGINE_META[e].color} />
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="text-[10px] text-muted-foreground/60 mt-4">
                ⚙️ DC and ML now auto-recalibrate after every sync that grades new results.
                Retrain both models after syncing a full gameweek for best results.
            </p>
        </Section>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PerformancePage() {
    const [perf, setPerf]           = useState<any>(null)
    const [drift, setDrift]         = useState<any>(null)
    const [cal, setCal]             = useState<any>(null)
    const [perLeague, setPerLeague] = useState<any>(null)
    const [confusion, setConfusion] = useState<any>(null)
    const [markets, setMarkets]     = useState<any>(null)
    const [engines, setEngines]     = useState<any>(null)
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState("")

    // Evaluate state
    const [evaluating, setEvaluating] = useState(false)
    const [evalMsg, setEvalMsg]       = useState("")

    // Recalibrate state
    const [calibrating, setCalibrating] = useState(false)
    const [calMsg, setCalMsg]           = useState("")

    const runEvaluate = async () => {
        setEvaluating(true)
        setEvalMsg("")
        try {
            const res = await evaluatePredictions()
            setEvalMsg(`✅ ${res.evaluated} prediction(s) graded. Reload to see updated metrics.`)
        } catch (e: any) {
            setEvalMsg(`❌ Evaluate failed: ${e?.message || "unknown error"}`)
        } finally {
            setEvaluating(false)
        }
    }

    const runRecalibrate = async () => {
        setCalibrating(true)
        setCalMsg("")
        try {
            const data = await recalibrate()
            setCalMsg(
                `✅ Calibrated on ${data.n_samples} predictions — ` +
                `accuracy ${data.pre_accuracy_pct}% → ${data.post_accuracy_pct}% ` +
                `(${data.improvement_pct >= 0 ? "+" : ""}${data.improvement_pct}%)`
            )
        } catch (e: any) {
            setCalMsg(`❌ Recalibrate failed: ${e?.message || "unknown error"}`)
        } finally {
            setCalibrating(false)
        }
    }

    useEffect(() => {
        Promise.all([
            getPerformance(),
            getPerformanceDrift(),
            getCalibration(),
            getPerLeague(),
            getConfusionMatrix(),
            getPerformanceMarkets().catch(() => null),
            getEnginePerformance().catch(() => null),
        ])
            .then(([p, d, c, l, cm, mk, eng]) => {
                setPerf(p); setDrift(d); setCal(c)
                setPerLeague(l); setConfusion(cm); setMarkets(mk)
                setEngines(eng)
            })
            .catch(e => setError(e.message || "Failed to load metrics."))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Loading performance metrics…</p>
        </div>
    )

    const empty = !perf || perf.n === 0

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">

                {/* ── Header + Action Buttons ── */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Model Performance</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Brier Score · RPS · Log Loss · Calibration · Confusion Matrix · ROI — from{" "}
                            <code className="text-primary">prediction_log</code>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Evaluate Predictions */}
                        <button
                            onClick={runEvaluate}
                            disabled={evaluating}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-secondary/30 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${evaluating ? "animate-spin" : ""}`} />
                            {evaluating ? "Evaluating…" : "Evaluate Predictions"}
                        </button>

                        {/* Recalibrate Model */}
                        <button
                            onClick={runRecalibrate}
                            disabled={calibrating}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                            <Zap className={`h-3.5 w-3.5 ${calibrating ? "animate-pulse" : ""}`} />
                            {calibrating ? "Calibrating…" : "Recalibrate Model"}
                        </button>
                    </div>
                </div>

                {/* ── Status messages ── */}
                {evalMsg && (
                    <div className="rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground mb-3">
                        {evalMsg}
                    </div>
                )}
                {calMsg && (
                    <div className={`rounded-lg border px-4 py-3 text-xs mb-4 ${
                        calMsg.startsWith("✅")
                            ? "border-success/30 bg-success/5 text-success"
                            : "border-destructive/30 bg-destructive/5 text-destructive"
                    }`}>
                        {calMsg}
                        {calMsg.startsWith("✅") && (
                            <span className="text-muted-foreground ml-2">
                                — Model will now apply adjusted probabilities to all future predictions.
                            </span>
                        )}
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/5 px-4 py-3 flex items-center gap-2 mb-6 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                    </div>
                )}

                {/* ── Workflow hint ── */}
                <div className="rounded-lg border border-border bg-secondary/5 px-4 py-3 mb-6 text-xs text-muted-foreground">
                    <strong className="text-foreground">Weekly workflow:</strong>{" "}
                    After matches complete → <span className="text-foreground font-medium">Evaluate Predictions</span> (grades results) →{" "}
                    <span className="text-foreground font-medium">Recalibrate Model</span> (ML learns from mistakes).
                    Requires at least 15 evaluated predictions to calibrate.
                </div>

                {empty ? (
                    <div className="rounded-lg border border-border bg-card p-12 text-center">
                        <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-sm font-semibold text-foreground mb-1">No completed predictions yet</p>
                        <p className="text-xs text-muted-foreground mb-5">
                            Performance metrics appear once matches in <code>prediction_log</code> have actual results recorded.
                            Click "Evaluate Predictions" above after matches complete.
                        </p>
                        {perLeague?.leagues?.length > 0 && (
                            <div className="text-left mt-6">
                                <p className="text-xs font-semibold text-foreground mb-3">
                                    Predictions logged across {perLeague.leagues.length} leagues (awaiting results):
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="py-2 text-muted-foreground font-medium text-left">League</th>
                                                <th className="py-2 text-muted-foreground font-medium text-right">Predictions</th>
                                                <th className="py-2 text-muted-foreground font-medium text-right">Evaluated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {perLeague.leagues.map((row: any, i: number) => (
                                                <tr key={i} className="border-b border-border/40">
                                                    <td className="py-2 text-foreground">{row.league}</td>
                                                    <td className="py-2 text-right font-mono">{row.matches}</td>
                                                    <td className="py-2 text-right font-mono text-muted-foreground">{row.evaluated}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            <StatCard icon={Target} label="Accuracy" value={`${Math.round((perf?.accuracy ?? 0) * 100)}%`} sub={`${perf?.n} predictions`} good={(perf?.accuracy ?? 0) > 0.45} />
                            <StatCard icon={TrendingUp} label="Brier Score" value={String(perf?.brier_score ?? "—")} sub="Lower = better (0 is perfect, 0.667 = random)" good={(perf?.brier_score ?? 1) < 0.5} />
                            <StatCard icon={BarChart3} label="RPS" value={String(perf?.rps ?? "—")} sub="Ranked Probability Score (< 0.33 = beats random)" good={(perf?.rps ?? 1) < 0.33} />
                            <StatCard icon={CheckCircle2} label="Log Loss" value={String(perf?.log_loss ?? "—")} sub="Cross-entropy (< 1.0 = good)" good={(perf?.log_loss ?? 2) < 1.0} />
                        </div>

                        {/* Significance */}
                        {perf?.significance && (
                            <div className={`rounded-lg border px-5 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${perf.significance.significant ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
                                <div>
                                    <p className={`text-sm font-bold ${perf.significance.significant ? "text-success" : "text-warning"}`}>
                                        {perf.significance.significant ? "✅ Statistically Significant Skill Detected" : "⚠️ Not Yet Statistically Significant"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Observed accuracy {perf.significance.observed_accuracy_pct}% vs baseline {perf.significance.baseline_accuracy_pct}% · p-value {perf.significance.p_value}
                                        {" · "}{perf.significance.n_predictions} predictions tested
                                    </p>
                                </div>
                                {perf?.roi && perf.roi.bets > 0 && (
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-lg font-black font-mono ${perf.roi.roi_pct >= 0 ? "text-success" : "text-destructive"}`}>{perf.roi.roi_pct >= 0 ? "+" : ""}{perf.roi.roi_pct}%</p>
                                        <p className="text-xs text-muted-foreground">Flat-stake ROI ({perf.roi.bets} bets)</p>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Engine Breakdown — NEW: per-engine accuracy */}
                        <EngineBreakdownSection data={engines} />

                        {/* Market Performance — Full per-market, per-engine breakdown */}
                        <MarketAccuracySection data={markets} />

                        {/* Rolling Drift */}

                        {drift?.drift?.length > 0 && (
                            <Section title="Rolling Performance Drift" sub={`${drift.window}-match rolling Brier score and accuracy over time`}>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={drift.drift} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                                            <XAxis dataKey="match_number" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <Tooltip content={({ active, payload }: any) => {
                                                if (!active || !payload?.length) return null
                                                const d = payload[0].payload
                                                return (
                                                    <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs">
                                                        <p className="font-semibold text-foreground mb-1">Match #{d.match_number}</p>
                                                        <p className="text-muted-foreground">Brier: <span className="font-bold text-foreground">{d.rolling_brier}</span></p>
                                                        <p className="text-muted-foreground">Accuracy: <span className="font-bold text-foreground">{d.rolling_acc}%</span></p>
                                                        <p className="text-muted-foreground">RPS: <span className="font-bold text-foreground">{d.rolling_rps}</span></p>
                                                    </div>
                                                )
                                            }} />
                                            <ReferenceLine y={0.5} stroke="oklch(0.6 0.18 27)" strokeDasharray="4 4" label={{ value: "Brier 0.5", fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                                            <Line type="monotone" dataKey="rolling_brier" stroke="oklch(0.65 0.19 145)" dot={false} strokeWidth={2} name="Brier" />
                                            <Line type="monotone" dataKey="rolling_rps" stroke="oklch(0.6 0.18 220)" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="RPS" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Section>
                        )}

                        {/* Calibration */}
                        {cal?.bins?.length > 0 && (
                            <Section title="Probability Calibration" sub="When the model says 70%, does it win 70% of the time? Perfect model = diagonal line.">
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={cal.bins} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                                            <XAxis dataKey="predicted_prob" tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <YAxis tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <Tooltip content={({ active, payload }: any) => {
                                                if (!active || !payload?.length) return null
                                                const d = payload[0].payload
                                                return (
                                                    <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs">
                                                        <p className="font-semibold text-foreground">Predicted {Math.round(d.predicted_prob * 100)}%</p>
                                                        <p className="text-muted-foreground">Actual: <span className="font-bold text-foreground">{Math.round(d.actual_freq * 100)}%</span></p>
                                                        <p className="text-muted-foreground">Gap: <span className={`font-bold ${Math.abs(d.gap) < 0.05 ? "text-success" : "text-warning"}`}>{d.gap > 0 ? "+" : ""}{Math.round(d.gap * 100)}%</span></p>
                                                        <p className="text-muted-foreground">n={d.n_samples}</p>
                                                    </div>
                                                )
                                            }} />
                                            <ReferenceLine stroke="oklch(0.55 0.01 260)" strokeDasharray="4 4" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }] as any} />
                                            <Line type="monotone" dataKey="predicted_prob" stroke="oklch(0.55 0.01 260)" dot={false} strokeDasharray="4 2" name="Perfect" />
                                            <Line type="monotone" dataKey="actual_freq" stroke="oklch(0.65 0.19 250)" dot={{ fill: "oklch(0.65 0.19 250)", r: 3 }} strokeWidth={2} name="Actual" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                                    <span>✅ Well-calibrated bins: <strong className="text-foreground">{cal.well_calibrated_bins}/{cal.n_bins}</strong></span>
                                    <span>Total predictions: <strong className="text-foreground">{cal.n_predictions}</strong></span>
                                </div>
                            </Section>
                        )}

                        {/* Per-League */}
                        {perLeague?.leagues?.length > 0 && (
                            <Section title="Per-League Performance" sub="Ranked by Brier score (lower = better). Leagues without evaluated results show prediction counts only.">
                                {perLeague.leagues.filter((l: any) => l.accuracy != null).length > 0 && (
                                    <div className="h-[200px] w-full mb-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={perLeague.leagues.filter((l: any) => l.accuracy != null)}
                                                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                                                <XAxis dataKey="league" tick={{ fontSize: 9, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                                                <Tooltip content={({ active, payload }: any) => {
                                                    if (!active || !payload?.length) return null
                                                    const d = payload[0].payload
                                                    return (
                                                        <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs">
                                                            <p className="font-semibold text-foreground">{d.league}</p>
                                                            <p className="text-muted-foreground">Predictions: <strong className="text-foreground">{d.matches}</strong></p>
                                                            <p className="text-muted-foreground">Evaluated: <strong className="text-foreground">{d.evaluated}</strong></p>
                                                            <p className="text-muted-foreground">Accuracy: <strong className="text-foreground">{d.accuracy}%</strong></p>
                                                            {d.brier != null && <p className="text-muted-foreground">Brier: <strong className="text-foreground">{d.brier}</strong></p>}
                                                            {d.rps != null && <p className="text-muted-foreground">RPS: <strong className="text-foreground">{d.rps}</strong></p>}
                                                        </div>
                                                    )
                                                }} />
                                                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} maxBarSize={80}>
                                                    {perLeague.leagues.filter((l: any) => l.accuracy != null).map((row: any, i: number) => (
                                                        <Cell key={i} fill={row.accuracy >= 55 ? "oklch(0.65 0.19 145)" : row.accuracy >= 45 ? "oklch(0.7 0.18 55)" : "oklch(0.55 0.2 27)"} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-border">
                                                {["League", "Confidence", "Predictions", "Evaluated", "Accuracy", "Brier", "RPS"].map(h => (
                                                    <th key={h} className="py-2 text-muted-foreground font-medium text-right first:text-left">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {perLeague.leagues.map((row: any, i: number) => {
                                                const tierColors: Record<string, string> = {
                                                    reliable:   "oklch(0.65 0.19 145)",   // green
                                                    learning:   "oklch(0.75 0.18 65)",    // yellow
                                                    unreliable: "oklch(0.55 0.2 27)",     // red
                                                    new:        "oklch(0.5 0.01 260)",    // grey
                                                }
                                                const tierBg: Record<string, string> = {
                                                    reliable:   "oklch(0.65 0.19 145 / 0.12)",
                                                    learning:   "oklch(0.75 0.18 65  / 0.12)",
                                                    unreliable: "oklch(0.55 0.2  27  / 0.12)",
                                                    new:        "oklch(0.5  0.01 260 / 0.10)",
                                                }
                                                const tierIcon: Record<string, string> = {
                                                    reliable: "🟢", learning: "🟡",
                                                    unreliable: "🔴", new: "⬜",
                                                }
                                                const tier = row.confidence_tier || "new"
                                                return (
                                                    <tr key={i} className="border-b border-border/40 hover:bg-secondary/10">
                                                        <td className="py-2 text-foreground">{row.league}</td>
                                                        <td className="py-2 text-right">
                                                            <span style={{
                                                                color: tierColors[tier],
                                                                background: tierBg[tier],
                                                                borderRadius: "9999px",
                                                                padding: "2px 8px",
                                                                fontSize: "10px",
                                                                fontWeight: 600,
                                                                whiteSpace: "nowrap",
                                                            }}>
                                                                {tierIcon[tier]} {row.tier_label || "Insufficient Data"}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 text-right font-mono">{row.matches}</td>
                                                        <td className="py-2 text-right font-mono text-muted-foreground">{row.evaluated}</td>
                                                        <td className={`py-2 text-right font-mono font-bold ${
                                                            row.accuracy == null ? "text-muted-foreground" :
                                                            row.accuracy >= 55 ? "text-success" :
                                                            row.accuracy < 40 ? "text-destructive" : "text-foreground"
                                                        }`}>
                                                            {row.accuracy != null ? `${row.accuracy}%` : "—"}
                                                        </td>
                                                        <td className={`py-2 text-right font-mono ${row.brier != null && row.brier < 0.45 ? "text-success" : "text-foreground"}`}>
                                                            {row.brier ?? "—"}
                                                        </td>
                                                        <td className="py-2 text-right font-mono text-muted-foreground">{row.rps ?? "—"}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Section>
                        )}

                        {/* Market Accuracy */}
                        <MarketAccuracySection data={markets} />

                        {/* Confusion Matrix */}
                        {confusion?.matrix && (() => {
                            const matrix = confusion.matrix
                            const totalPredictions = confusion.n_predictions ?? 0
                            const predHomeWin = (["Away Win", "Draw", "Home Win"]
                                .reduce((sum: number, actual: string) => sum + (matrix[`Actual ${actual}`]?.["Pred Home Win"] ?? 0), 0))
                            const isBiased = totalPredictions > 0 && predHomeWin === totalPredictions

                            return (
                                <>
                                    <Section title="Confusion Matrix" sub="Where is the model going wrong? Rows = actual, Columns = predicted.">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="py-2 text-muted-foreground font-medium text-left">Actual \ Pred</th>
                                                        {["Away Win", "Draw", "Home Win"].map(l => (
                                                            <th key={l} className="py-2 text-muted-foreground font-medium text-right">{l}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {["Away Win", "Draw", "Home Win"].map((actual, ri) => {
                                                        const actKey = `Actual ${actual}`
                                                        return (
                                                            <tr key={actual} className="border-b border-border/40">
                                                                <td className="py-2 font-medium text-foreground">{actual}</td>
                                                                {["Away Win", "Draw", "Home Win"].map((pred, ci) => {
                                                                    const v = matrix[actKey]?.[`Pred ${pred}`] ?? 0
                                                                    const isDiag = ri === ci
                                                                    return (
                                                                        <td key={pred} className={`py-2 text-right font-mono font-bold ${isDiag ? "text-success" : v > 0 ? "text-destructive" : "text-muted-foreground"}`}>{v}</td>
                                                                    )
                                                                })}
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                            <p className="text-[10px] text-muted-foreground mt-3">
                                                Green diagonal = correct predictions · Red off-diagonal = errors · n={confusion.n_predictions}
                                            </p>
                                        </div>
                                    </Section>

                                    {isBiased && (
                                        <div className="rounded-lg border border-warning/30 bg-warning/5 px-5 py-4 mt-0">
                                            <p className="text-sm font-bold text-warning mb-1">⚠️ Model Bias Detected — Always Predicting Home Win</p>
                                            <p className="text-xs text-muted-foreground">Every prediction is classified as <strong className="text-foreground">Home Win</strong>. The ML model was likely trained on imbalanced data. Try retraining on the Predictions page, or use the Dynamic Consensus Engine which blends DC + ML + Legacy to mitigate this bias.</p>
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </>
                )}
            </main>
            <Footer />
        </div>
    )
}
