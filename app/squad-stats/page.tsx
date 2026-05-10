"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getSquadStats, getLeagues } from "@/lib/api"
import { SquadStat, League } from "@/lib/types"
import { Users, ChevronRight, BarChart3, Filter } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"

export default function SquadStatsPage() {
    const [squadStats, setSquadStats] = useState<SquadStat[]>([])
    const [leagues, setLeagues] = useState<League[]>([])
    const [loading, setLoading] = useState(true)

    const [leagueId, setLeagueId] = useState("")
    const [split, setSplit] = useState("")

    useEffect(() => {
        getLeagues().then((res) => setLeagues(res || [])).catch(() => setLeagues([]))
    }, [])

    useEffect(() => {
        setLoading(true)
        const p: any = {}
        if (leagueId) p.league_id = leagueId
        if (split) p.split = split

        getSquadStats(p)
            .then((res) => {
                setSquadStats(res || [])
                setLoading(false)
            })
            .catch(() => {
                setSquadStats([])
                setLoading(false)
            })
    }, [leagueId, split])

    const isEmpty = !loading && squadStats.length === 0

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Squad Statistics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Team attacking (for) and defensive (against) statistics
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <select
                            value={leagueId}
                            onChange={(e) => setLeagueId(e.target.value)}
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
                            value={split}
                            onChange={(e) => setSplit(e.target.value)}
                            className="appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto min-w-[150px]"
                        >
                            <option value="">Both Splits</option>
                            <option value="for">For (Attacking)</option>
                            <option value="against">Against (Defensive)</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-secondary/30">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Team</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">Type</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground hidden lg:table-cell">League</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">Season</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">GP</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">Poss%</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">G</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">A</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">Plyrs</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">Avg Age</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground hidden lg:table-cell">Minutes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            Loading squad stats...
                                        </td>
                                    </tr>
                                ) : isEmpty ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            No data found. Try syncing data first.
                                        </td>
                                    </tr>
                                ) : (
                                    squadStats.map((s, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <TeamLogo src={s.logo_url} alt={`${s.team} logo`} size={20} className="bg-white/5" />
                                                    <span className="truncate">{s.team}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.split === "for" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                                                    }`}>
                                                    {s.split === "for" ? "For" : "vs"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center text-xs text-muted-foreground hidden lg:table-cell">
                                                <span className="inline-block bg-secondary rounded-md px-2 py-1">{s.league}</span>
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono text-muted-foreground hidden sm:table-cell">{s.season}</td>
                                            <td className="px-2 py-3 text-center text-muted-foreground">{s.games}</td>
                                            <td className="px-2 py-3 text-center font-mono font-medium hidden md:table-cell">
                                                {s.possession ?? "—"}
                                            </td>
                                            <td className={`px-2 py-3 text-center font-bold text-base ${s.split === "for" ? "text-primary" : "text-destructive"
                                                }`}>
                                                {s.goals ?? "—"}
                                            </td>
                                            <td className="px-2 py-3 text-center font-bold text-base text-info">
                                                {s.assists ?? "—"}
                                            </td>
                                            <td className="px-2 py-3 text-center text-muted-foreground hidden sm:table-cell">{s.players_used}</td>
                                            <td className="px-2 py-3 text-center text-muted-foreground hidden md:table-cell">{s.avg_age}</td>
                                            <td className="px-3 py-3 text-center font-mono text-muted-foreground hidden lg:table-cell">
                                                {s.minutes ? Number(s.minutes).toLocaleString() : "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
