"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getTeams, getH2H, getLeagues } from "@/lib/api"
import { Match } from "@/lib/types"
import { Swords, Search } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"

export default function HeadToHeadPage() {
    const [leagues, setLeagues] = useState<any[]>([])
    const [selectedLeague, setSelectedLeague] = useState("")
    const [teams, setTeams] = useState<Record<string, any>[]>([])
    const [teamA, setTeamA] = useState("")
    const [teamB, setTeamB] = useState("")
    const [results, setResults] = useState<Match[]>([])
    const [searched, setSearched] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getLeagues().then((res) => setLeagues(Array.isArray(res) ? res : [])).catch(() => setLeagues([]))
        getTeams().then((res) => setTeams(res || [])).catch(() => setTeams([]))
    }, [])

    // Clean team names: exclude ClubElo artifacts ("eng Arsenal", "ee FC Flora", "eng vs Chelsea")
    const isCleanTeam = (t: any) => t.name && /^[A-Z0-9]/.test(t.name) && !t.name.includes(" vs ")

    const filteredTeams = teams
        .filter(isCleanTeam)
        .filter((t: any) => !selectedLeague || String(t.league_id) === selectedLeague)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

    const handleSearch = async () => {
        if (!teamA || !teamB) return
        setLoading(true)
        try {
            const r = await getH2H(teamA, teamB)
            setResults(r || [])
        } catch {
            setResults([])
        }
        setLoading(false)
        setSearched(true)
    }

    const teamAName = teams.find((t) => String(t.id) === String(teamA))?.name
    const teamBName = teams.find((t) => String(t.id) === String(teamB))?.name

    const stats = results.reduce(
        (acc, m) => {
            if (m.home_score == null) return acc
            const aIsHome = m.home_team === teamAName
            const aGoals = aIsHome ? m.home_score : m.away_score
            const bGoals = aIsHome ? m.away_score : m.home_score
            if (aGoals > bGoals) acc.aWins++
            else if (bGoals > aGoals) acc.bWins++
            else acc.draws++
            return acc
        },
        { aWins: 0, bWins: 0, draws: 0 }
    )

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Swords className="h-6 w-6 text-primary" />
                        Head to Head Matchups
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Compare historical records between two teams
                    </p>
                </div>

                {/* Selection Card */}
                <div className="rounded-lg border border-border bg-card p-6 mb-8">
                    {/* League filter row */}
                    <div className="mb-5">
                        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Filter by League</label>
                        <select
                            value={selectedLeague}
                            onChange={(e) => { setSelectedLeague(e.target.value); setTeamA(""); setTeamB("") }}
                            className="w-full sm:w-64 appearance-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Leagues</option>
                            {leagues.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                        <div className="w-full md:w-1/3">
                            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
                                Team A
                            </label>
                            <select
                                value={teamA}
                                onChange={(e) => setTeamA(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select first team...</option>
                                {teams.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.league})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground font-black text-xs uppercase">
                                VS
                            </div>
                        </div>

                        <div className="w-full md:w-1/3">
                            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
                                Team B
                            </label>
                            <select
                                value={teamB}
                                onChange={(e) => setTeamB(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select second team...</option>
                                {teams
                                    .filter((t) => String(t.id) !== String(teamA))
                                    .map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.league})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="w-full md:w-auto mt-6 md:mt-auto">
                            <button
                                onClick={handleSearch}
                                disabled={loading || !teamA || !teamB}
                                className="w-full md:w-auto px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 h-[46px]"
                            >
                                {loading ? <Search className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
                                {loading ? "Loading..." : "Compare"}
                            </button>
                        </div>
                    </div>
                </div>

                {searched && !loading && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {results.length > 0 ? (
                            <>
                                {/* Stats Summary */}
                                <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
                                    <StatSummaryCard label={teamAName || "Team A"} value={stats.aWins} colorClass="text-primary" />
                                    <StatSummaryCard label="Draws" value={stats.draws} colorClass="text-warning" />
                                    <StatSummaryCard label={teamBName || "Team B"} value={stats.bWins} colorClass="text-destructive" />
                                </div>

                                {/* Match History Table */}
                                <h3 className="text-base font-bold text-foreground mb-3">Meeting History</h3>
                                <div className="rounded-lg border border-border bg-card overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border bg-secondary/30">
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                                                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">Season</th>
                                                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">League</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Home</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Score</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Away</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Venue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.map((m, i) => {
                                                    const isHomeWinner = m.home_score > m.away_score
                                                    const isAwayWinner = m.away_score > m.home_score

                                                    return (
                                                        <tr
                                                            key={i}
                                                            className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                                                        >
                                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.match_date || "—"}</td>
                                                            <td className="px-3 py-3 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{m.season}</td>
                                                            <td className="px-3 py-3 text-center hidden md:table-cell">
                                                                <span className="inline-block bg-secondary rounded-md px-2 py-1 text-xs text-muted-foreground">{m.league}</span>
                                                            </td>
                                                            <td className={`px-4 py-3 text-right font-semibold ${isHomeWinner ? "text-foreground" : "text-muted-foreground"}`}>
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <span className="truncate">{m.home_team}</span>
                                                                    <TeamLogo src={m.home_logo} alt={`${m.home_team} logo`} size={20} className="bg-white/5" />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="inline-flex items-center justify-center rounded-md bg-secondary/50 px-3 py-1 font-mono font-bold text-foreground min-w-[60px]">
                                                                    {m.home_score ?? "?"} - {m.away_score ?? "?"}
                                                                </span>
                                                            </td>
                                                            <td className={`px-4 py-3 text-left font-semibold ${isAwayWinner ? "text-foreground" : "text-muted-foreground"}`}>
                                                                <div className="flex items-center justify-start gap-2">
                                                                    <TeamLogo src={m.away_logo} alt={`${m.away_team} logo`} size={20} className="bg-white/5" />
                                                                    <span className="truncate">{m.away_team}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell truncate max-w-[150px]">
                                                                {m.venue || "—"}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-lg border border-dashed border-border py-16 text-center">
                                <Swords className="mx-auto h-8 w-8 text-border mb-3" />
                                <h3 className="text-lg font-semibold text-foreground mb-1">No Meetings Found</h3>
                                <p className="text-sm text-muted-foreground">
                                    There are no recorded matches between these two teams in the database.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

function StatSummaryCard({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
    return (
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center text-center">
            <span className={`text-4xl md:text-5xl font-black font-mono mb-2 ${colorClass}`}>
                {value}
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label} Wins</span>
        </div>
    )
}
