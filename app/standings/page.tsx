"use client"

import { useEffect, useState, useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getStandings, getLeagues, getSeasons } from "@/lib/api"
import { Standing, League, Season } from "@/lib/types"
import { Filter, ChevronRight, Trophy } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"



export default function StandingsPage() {
    const [standings, setStandings] = useState<Standing[]>([])
    const [leagues, setLeagues] = useState<League[]>([])
    const [seasons, setSeasons] = useState<Season[]>([])
    const [loading, setLoading] = useState(true)

    const [leagueId, setLeagueId] = useState("")
    const [seasonId, setSeasonId] = useState("")

    useEffect(() => {
        getLeagues().then((res) => setLeagues(res || [])).catch(() => setLeagues([]))
    }, [])

    useEffect(() => {
        const params: any = leagueId ? { league_id: leagueId } : {}
        getSeasons(params)
            .then((res) => {
                const raw: Season[] = res || []
                // Deduplicate by season label — keep only unique season strings
                const seen = new Set<string>()
                const unique = raw.filter((s) => {
                    const key = `${s.season}`
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                setSeasons(unique)
            })
            .catch(() => setSeasons([]))
    }, [leagueId])

    useEffect(() => {
        setLoading(true)
        const p: any = {}
        if (leagueId) p.league_id = leagueId
        if (seasonId) p.season_id = seasonId

        getStandings(p)
            .then((rows) => {
                setStandings(rows || [])
                setLoading(false)
            })
            .catch(() => {
                setStandings([])
                setLoading(false)
            })
    }, [leagueId, seasonId])

    const current = standings.filter((r) => r.is_current)
    const previous = standings.filter((r) => !r.is_current)

    const prevGroups = previous.reduce((acc: Record<string, Standing[]>, row) => {
        const key = `${row.league} — ${row.season}`
        acc[key] = acc[key] || []
        acc[key].push(row)
        return acc
    }, {})

    const isEmpty = !loading && standings.length === 0

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-primary" />
                        League Standings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Current and historical standings across all leagues
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <select
                            value={leagueId}
                            onChange={(e) => {
                                setLeagueId(e.target.value)
                                setSeasonId("")
                            }}
                            className="appearance-none rounded-lg border border-border bg-card pl-9 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto min-w-[180px]"
                        >
                            <option value="">All Leagues</option>
                            {leagues.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            value={seasonId}
                            onChange={(e) => setSeasonId(e.target.value)}
                            disabled={seasons.length === 0}
                            className="appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 w-full sm:w-auto min-w-[150px]"
                        >
                            <option value="">Current Season</option>
                            {seasons.map((s) => (
                                <option key={s.season_id} value={s.season_id}>
                                    {s.season} {s.is_current ? " ★" : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading && (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        Loading standings...
                    </div>
                )}

                {isEmpty && (
                    <div className="py-12 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                        No standings data available. You may need to sync data first.
                    </div>
                )}

                {/* Current Season */}
                {current.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-lg font-bold text-foreground">{current[0].league}</h2>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                                Current Season — {current[0].season}
                            </span>
                        </div>
                        <StandingsTable rows={current} highlight />
                    </div>
                )}

                {/* Previous Seasons */}
                {Object.keys(prevGroups).length > 0 && (
                    <div>
                        {current.length > 0 && (
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Previous Seasons
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            {Object.entries(prevGroups).map(([key, rows]) => (
                                <PreviousSeasonGroup key={key} label={key} rows={rows} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

function StandingsTable({ rows, highlight = false }: { rows: any[]; highlight?: boolean }) {
    return (
        <div className={`rounded-lg border overflow-hidden ${highlight ? 'border-primary/30 shadow-[0_0_24px_rgba(34,197,94,0.1)]' : 'border-border'} bg-card`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-secondary/30">
                            <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground w-12">#</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Team</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">P</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">W</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">D</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">L</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">GF</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">GA</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">GD</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr
                                key={`${r.team}-${i}`}
                                className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${i === 0 && highlight ? "bg-primary/5" : ""
                                    }`}
                            >
                                <td className="px-3 py-3 text-center font-mono text-muted-foreground">{r.rank ?? i + 1}</td>
                                <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <TeamLogo 
                                          src={r.logo_url} 
                                          alt={`${r.team} logo`} 
                                          size={20} 
                                          className="bg-white/5" 
                                        />
                                        <span className="truncate">{r.team}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-3 text-center text-muted-foreground">{r.games}</td>
                                <td className="px-2 py-3 text-center font-semibold text-primary">{r.wins}</td>
                                <td className="px-2 py-3 text-center font-semibold text-warning">{r.ties}</td>
                                <td className="px-2 py-3 text-center font-semibold text-destructive">{r.losses}</td>
                                <td className="px-2 py-3 text-center text-muted-foreground hidden sm:table-cell">{r.goals_for}</td>
                                <td className="px-2 py-3 text-center text-muted-foreground hidden sm:table-cell">{r.goals_against}</td>
                                <td className={`px-2 py-3 text-center font-semibold ${r.goal_diff > 0 ? "text-primary" : r.goal_diff < 0 ? "text-destructive" : "text-muted-foreground"
                                    }`}>
                                    {r.goal_diff > 0 ? "+" : ""}{r.goal_diff}
                                </td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-base text-foreground">{r.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function PreviousSeasonGroup({ label, rows }: { label: string; rows: any[] }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden transition-all">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
                    <span className="font-semibold text-foreground">{label}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {rows.length} teams
                    </span>
                </div>
            </button>
            {open && (
                <div className="border-t border-border p-4 bg-background">
                    <StandingsTable rows={rows} />
                </div>
            )}
        </div>
    )
}
