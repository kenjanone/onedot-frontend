"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getLeagues, getStandings } from "@/lib/api"
import { League, Standing } from "@/lib/types"
import { Trophy, ChevronRight, ArrowUpDown, Globe } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { TeamLogo } from "@/components/team-logo"

const countryFlags: Record<string, string> = {
  England: "ENG",
  Germany: "GER",
  Spain: "ESP",
  France: "FRA",
  Italy: "ITA",
  Netherlands: "NED",
  Turkey: "TUR",
  Belgium: "BEL",
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [standingsData, setStandingsData] = useState<Standing[]>([])
  const [loadingLeagues, setLoadingLeagues] = useState(true)
  const [loadingStandings, setLoadingStandings] = useState(false)
  const [sortBy, setSortBy] = useState<string>("rank")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    getLeagues()
      .then((data) => {
        setLeagues(data)
        if (data.length > 0) {
          setSelectedLeague(data[0])
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingLeagues(false))
  }, [])

  useEffect(() => {
    if (selectedLeague) {
      setLoadingStandings(true)
      getStandings({ league_id: selectedLeague.id })
        .then((data) => setStandingsData(data.standings || data || []))
        .catch((err) => console.error(err))
        .finally(() => setLoadingStandings(false))
    }
  }, [selectedLeague])

  const sorted = [...standingsData].sort((a, b) => {
    const valA = a[sortBy] ?? 0
    const valB = b[sortBy] ?? 0
    const mul = sortDir === "asc" ? 1 : -1
    return (valA > valB ? 1 : valA < valB ? -1 : 0) * mul
  })

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(col)
      setSortDir(col === "rank" ? "asc" : "desc")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground text-balance">Leagues & Standings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {leagues.length} leagues tracked across {new Set(leagues.map((l) => l.country)).size} countries
          </p>
        </div>

        {/* League Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {loadingLeagues && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(selectedLeague?.id === league.id ? null : league)}
              className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${selectedLeague?.id === league.id
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-card hover:border-border/80"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold ${selectedLeague?.id === league.id
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
                  }`}>
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{league.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {countryFlags[league.country] || league.country} -- {league.teamCount} teams
                  </p>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${selectedLeague?.id === league.id ? "rotate-90 text-primary" : "text-muted-foreground"
                }`} />
            </button>
          ))}
        </div>

        {/* Standings Table */}
        {selectedLeague && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">{selectedLeague.name} Standings</h2>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                2025-2026
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <SortHeader label="#" col="rank" active={sortBy} dir={sortDir} onSort={handleSort} className="w-10 text-center" />
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Team</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">MP</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">W</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">D</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">L</th>
                    <SortHeader label="GF" col="goals_for" active={sortBy} dir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">GA</th>
                    <SortHeader label="GD" col="goal_difference" active={sortBy} dir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                    <SortHeader label="Pts" col="points" active={sortBy} dir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {loadingStandings ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-2 py-2.5"><Skeleton className="h-3 w-4 mx-auto" /></td>
                        <td className="px-3 py-2.5"><Skeleton className="h-3 w-28" /></td>
                        <td className="px-2 py-2.5 hidden sm:table-cell"><Skeleton className="h-3 w-6 mx-auto" /></td>
                        <td className="px-2 py-2.5 hidden sm:table-cell"><Skeleton className="h-3 w-6 mx-auto" /></td>
                        <td className="px-2 py-2.5 hidden sm:table-cell"><Skeleton className="h-3 w-6 mx-auto" /></td>
                        <td className="px-2 py-2.5 hidden sm:table-cell"><Skeleton className="h-3 w-6 mx-auto" /></td>
                        <td className="px-2 py-2.5 hidden md:table-cell"><Skeleton className="h-3 w-6 mx-auto" /></td>
                        <td className="px-2 py-2.5 hidden md:table-cell"><Skeleton className="h-3 w-6 mx-auto" /></td>
                        <td className="px-2 py-2.5 hidden sm:table-cell"><Skeleton className="h-3 w-8 mx-auto" /></td>
                        <td className="px-2 py-2.5"><Skeleton className="h-3 w-8 mx-auto" /></td>
                      </tr>
                    ))
                  ) : sorted.map((row, idx) => (
                    <StandingRowComponent key={row.team_id || row.team} row={row} idx={idx} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedLeague && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Select a league above to view standings</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

function SortHeader({
  label,
  col,
  active,
  dir,
  onSort,
  className = "",
}: {
  label: string
  col: string
  active: string
  dir: string
  onSort: (c: string) => void
  className?: string
}) {
  return (
    <th className={`px-2 py-2.5 text-center text-xs font-medium text-muted-foreground ${className}`}>
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-0.5 hover:text-foreground transition-colors ${active === col ? "text-primary" : ""
          }`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  )
}

function StandingRowComponent({ row, idx }: { row: any; idx: number }) {
  const getZoneColor = (rank: number) => {
    if (rank <= 4) return "border-l-2 border-l-primary"
    if (rank <= 6) return "border-l-2 border-l-info"
    if (rank >= 18) return "border-l-2 border-l-destructive"
    return "border-l-2 border-l-transparent"
  }

  return (
    <tr className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${getZoneColor(row.rank || idx + 1)}`}>
      <td className="px-2 py-2.5 text-center text-xs font-bold font-mono text-muted-foreground">{row.rank || idx + 1}</td>
      <td className="px-3 py-2.5 text-sm font-semibold text-foreground">
        <div className="flex items-center gap-2">
           <TeamLogo src={row.logo_url} alt={`${row.team_id || row.team} logo`} size={20} className="bg-white/5" />
           <span className="truncate">{row.team_id || row.team}</span>
        </div>
      </td>
      <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{row.matches_played || 0}</td>
      <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{row.wins || 0}</td>
      <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{row.draws || 0}</td>
      <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{row.losses || 0}</td>
      <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden md:table-cell">{row.goals_for || 0}</td>
      <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden md:table-cell">{row.goals_against || 0}</td>
      <td className={`px-2 py-2.5 text-center text-xs font-mono font-bold hidden sm:table-cell ${(row.goals_for - row.goals_against) > 0 ? "text-primary" : (row.goals_for - row.goals_against) < 0 ? "text-destructive" : "text-muted-foreground"
        }`}>
        {(row.goals_for - row.goals_against) > 0 ? `+${row.goals_for - row.goals_against}` : (row.goals_for - row.goals_against) || 0}
      </td>
      <td className="px-2 py-2.5 text-center text-sm font-bold font-mono text-foreground">{row.points || 0}</td>
    </tr>
  )
}
