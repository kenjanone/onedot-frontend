"use client"

import Image from "next/image"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getTeam, getSquadStats, getMatches, getH2H } from "@/lib/api"
import {
    ArrowLeft, Users, Trophy, TrendingUp, Shield,
    Swords, BarChart3, Target, Calendar, ChevronRight
} from "lucide-react"

interface TeamData {
    id: number
    name: string
    league_id?: number
    short_name?: string
    country?: string
    founded?: number
    stadium?: string
    logo_url?: string
}

interface StatRow {
    label: string
    value: string | number
    highlight?: boolean
}

function StatCard({ label, value, icon: Icon, color = "text-primary" }: {
    label: string
    value: string | number
    icon?: any
    color?: string
}) {
    return (
        <div className="rounded-lg border border-border bg-card px-4 py-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                {Icon && <Icon className={`h-4 w-4 ${color}`} />}
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
        </div>
    )
}

function MatchRow({ match, teamId }: { match: any; teamId: number }) {
    const isHome = match.home_team_id === teamId
    const gf = isHome ? match.home_score : match.away_score
    const ga = isHome ? match.away_score : match.home_score
    const opp = isHome ? match.away_team : match.home_team
    
    // In getMatches, ht.logo_url AS home_logo, at.logo_url AS away_logo is now returned
    const oppLogo = isHome ? match.away_logo : match.home_logo
    
    const result = gf !== null && ga !== null ? (gf > ga ? "W" : gf < ga ? "L" : "D") : "-"
    const resultColor = result === "W" ? "text-success bg-success/10" : result === "L" ? "text-destructive bg-destructive/10" : result === "D" ? "text-muted-foreground bg-secondary" : "text-info bg-info/10 text-[10px]"
    
    return (
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm hover:bg-secondary/20 transition-colors px-2 -mx-2 rounded">
            <div className="flex items-center gap-3">
                <span className={`${resultColor} font-bold px-1.5 py-0.5 rounded w-6 text-center shrink-0`}>
                  {result !== "-" ? result : "TBD"}
                </span>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground mr-1 shrink-0">{isHome ? "vs" : "@"}</span>
                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                            <Image src={oppLogo || "/placeholder-logo.png"} alt={`${opp} logo`} fill sizes="20px" className="object-contain p-0.5" />
                        </div>
                        <p className="font-medium text-foreground">{opp}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{match.match_date ? new Date(match.match_date).toLocaleDateString() : ""} {match.league || ""}</p>
                </div>
            </div>
            {gf !== null && ga !== null ? (
              <p className="font-bold text-foreground font-mono">{gf} - {ga}</p>
            ) : (
              <p className="text-xs font-medium text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />Upcoming</p>
            )}
        </div>
    )
}

export default function TeamProfilePage() {
    const params = useParams()
    const router = useRouter()
    const teamId = Number(params.id)

    const [team, setTeam] = useState<TeamData | null>(null)
    const [squadStats, setSquadStats] = useState<any[]>([])
    const [matches, setMatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!teamId) return
        setLoading(true)
        Promise.all([
            getTeam(teamId),
            getSquadStats({ team_id: teamId, limit: 10 }),
            getMatches({ team_id: teamId, limit: 10, ordering: "-match_date" }),
        ])
            .then(([teamData, squadData, matchData]) => {
                setTeam(teamData || null)
                const sq = Array.isArray(squadData) ? squadData : (squadData?.results || squadData?.data || [])
                setSquadStats(sq)
                const mx = Array.isArray(matchData) ? matchData : (matchData?.results || matchData?.data || [])
                setMatches(mx)
            })
            .catch(() => setError("Failed to load team data."))
            .finally(() => setLoading(false))
    }, [teamId])

    // Aggregate squad stats — prefer "for" split
    const sqFor = squadStats.find((s) => s.split === "for") || squadStats[0]
    const sqAg = squadStats.find((s) => s.split === "against") || null

    const completedMatches = matches.filter((m) => m.home_score !== null && m.home_score !== undefined)
    const wins = completedMatches.filter((m) => {
        const isHome = m.home_team_id === teamId
        const gf = isHome ? m.home_score : m.away_score
        const ga = isHome ? m.away_score : m.home_score
        return gf > ga
    }).length
    const draws = completedMatches.filter((m) => m.home_score === m.away_score).length
    const losses = completedMatches.length - wins - draws

    const totalGoalsFor = completedMatches.reduce((sum, m) => {
        const isHome = m.home_team_id === teamId
        return sum + (isHome ? (m.home_score || 0) : (m.away_score || 0))
    }, 0)
    const totalGoalsAg = completedMatches.reduce((sum, m) => {
        const isHome = m.home_team_id === teamId
        return sum + (isHome ? (m.away_score || 0) : (m.home_score || 0))
    }, 0)

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">

                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : error ? (
                    <div className="text-center py-24 text-muted-foreground">{error}</div>
                ) : !team ? (
                    <div className="text-center py-24 text-muted-foreground">Team not found.</div>
                ) : (
                    <div className="space-y-6">

                        {/* Team Header */}
                        <div className="rounded-lg border border-border bg-card px-6 py-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center relative">
                                    {team.logo_url ? (
                                        <Image src={team.logo_url} alt={`${team.name} logo`} fill sizes="64px" className="object-contain p-2" />
                                    ) : (
                                        <Shield className="h-8 w-8 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-black text-foreground">{team.name}</h1>
                                    {(team.short_name || team.country) && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {team.short_name && <span>{team.short_name}</span>}
                                            {team.short_name && team.country && <span className="mx-1">·</span>}
                                            {team.country && <span>{team.country}</span>}
                                        </p>
                                    )}
                                    {team.stadium && (
                                        <p className="text-xs text-muted-foreground mt-1">🏟️ {team.stadium}</p>
                                    )}
                                    {team.founded && (
                                        <p className="text-xs text-muted-foreground mt-0.5">📅 Est. {team.founded}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Form KPIs */}
                        {completedMatches.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Form ({completedMatches.length} matches)</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <StatCard label="Wins" value={wins} icon={Trophy} color="text-success" />
                                    <StatCard label="Draws" value={draws} icon={BarChart3} color="text-warning" />
                                    <StatCard label="Losses" value={losses} icon={TrendingUp} color="text-destructive" />
                                    <StatCard label="Goal Diff" value={`+${totalGoalsFor - totalGoalsAg}`} icon={Target} color={totalGoalsFor >= totalGoalsAg ? "text-success" : "text-destructive"} />
                                </div>
                            </div>
                        )}

                        {/* Squad Stats */}
                        {sqFor && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Attacking Stats */}
                                <div className="rounded-lg border border-border bg-card px-5 py-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Swords className="h-4 w-4 text-primary" />
                                        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Attacking</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: "Goals", value: sqFor.goals ?? "—" },
                                            { label: "Assists", value: sqFor.assists ?? "—" },
                                            { label: "Possession", value: sqFor.possession ? `${sqFor.possession}%` : "—" },
                                            { label: "Players Used", value: sqFor.players_used ?? "—" },
                                            { label: "Avg Age", value: sqFor.avg_age ?? "—" },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{label}</span>
                                                <span className="font-semibold text-foreground">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Defensive Stats */}
                                {sqAg ? (
                                    <div className="rounded-lg border border-border bg-card px-5 py-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Shield className="h-4 w-4 text-info" />
                                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Defensive</h2>
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { label: "Goals Conceded", value: sqAg.goals ?? "—" },
                                                { label: "Clean Sheets", value: sqAg.clean_sheets ?? "—" },
                                                { label: "GK Save %", value: sqAg.goalkeeping?.gk_save_pct ? `${sqAg.goalkeeping.gk_save_pct}%` : "—" },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{label}</span>
                                                    <span className="font-semibold text-foreground">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-border bg-card px-5 py-5 flex items-center justify-center text-sm text-muted-foreground">
                                        Defensive stats not available
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recent Matches */}
                        {matches.length > 0 && (
                            <div className="rounded-lg border border-border bg-card px-5 py-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Matches</h2>
                                </div>
                                <div>
                                    {matches.map((m, i) => (
                                        <MatchRow key={m.id || i} match={m} teamId={teamId} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No data state */}
                        {!sqFor && completedMatches.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                <p>No detailed stats available for this team yet.</p>
                                <p className="text-xs mt-1">Sync data first to populate team stats.</p>
                            </div>
                        )}

                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
