"use client"

import { useEffect, useState, useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getPlayers, getLeagues } from "@/lib/api"
import { Player, League } from "@/lib/types"
import { Users, Search, ArrowUpDown, Filter } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"

type SortCol = "goals" | "assists" | "games" | "minutes" | "playerName"

export default function PlayersPage() {
  const [sortBy, setSortBy] = useState<SortCol>("goals")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [search, setSearch] = useState("")
  const [leagueFilter, setLeagueFilter] = useState("")
  const [posFilter, setPosFilter] = useState("")
  const [playersData, setPlayersData] = useState<Player[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getPlayers({ limit: 1000 }),
      getLeagues()
    ]).then(([playersRes, leaguesRes]) => {
      setPlayersData(playersRes || [])
      setLeagues(leaguesRes || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSort = (col: SortCol) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(col)
      setSortDir(col === "playerName" ? "asc" : "desc")
    }
  }

  const sorted = useMemo(() => {
    let data = [...playersData]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        (p) =>
          (p.player_name || "").toLowerCase().includes(q) ||
          (p.team || "").toLowerCase().includes(q) ||
          (p.nationality || "").toLowerCase().includes(q)
      )
    }
    if (leagueFilter) data = data.filter((p) => p.league === leagueFilter)
    if (posFilter) data = data.filter((p) => p.position === posFilter)

    return data.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1
      if (sortBy === "playerName") return (a.player_name || "").localeCompare(b.player_name || "") * mul
      const mapKey = sortBy === "games" ? "matches_played" : sortBy === "minutes" ? "minutes_played" : sortBy
      return (((a[mapKey] as number) || 0) - ((b[mapKey] as number) || 0)) * mul
    })
  }, [sortBy, sortDir, search, leagueFilter, posFilter, playersData])

  const positions = [...new Set(playersData.map((p) => p.position).filter(Boolean))].sort()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground text-balance">Player Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading..." : `${playersData.length} players across ${new Set(playersData.map((p) => p.league).filter(Boolean)).size} leagues`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search players, teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-card pl-9 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Leagues</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Positions</option>
              {positions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Player Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground w-10">#</th>
                  <ColHeader label="Player" col="playerName" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="text-left" />
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Team</th>
                  <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">Pos</th>
                  <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">Nat</th>
                  <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">Age</th>
                  <ColHeader label="GP" col="games" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                  <ColHeader label="Min" col="minutes" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                  <ColHeader label="G" col="goals" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <ColHeader label="A" col="assists" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground">G+A</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading players...</td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted-foreground">No players found</td>
                  </tr>
                ) : sorted.map((player, idx) => (
                  <tr
                    key={player.id}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <div>
                        <span className="text-sm font-semibold text-foreground">{player.player_name}</span>
                        <span className="lg:hidden text-[10px] text-muted-foreground ml-1.5">{player.team}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <TeamLogo src={player.logo_url} alt={`${player.team} logo`} size={20} className="bg-white/5" />
                        <span className="truncate">{player.team}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center hidden md:table-cell">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${player.position === "FW"
                        ? "bg-destructive/10 text-destructive"
                        : player.position === "MF"
                          ? "bg-info/10 text-info"
                          : "bg-secondary text-muted-foreground"
                        }`}>
                        {player.position || "-"}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden md:table-cell">{player.nationality || "-"}</td>
                    <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{player.age || "-"}</td>
                    <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden sm:table-cell">{player.matches_played || 0}</td>
                    <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground hidden lg:table-cell">{(player.minutes_played || 0).toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center text-sm font-bold font-mono text-foreground">{player.goals || 0}</td>
                    <td className="px-2 py-2.5 text-center text-sm font-bold font-mono text-foreground">{player.assists || 0}</td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold font-mono text-primary">
                        {(player.goals || 0) + (player.assists || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function ColHeader({
  label,
  col,
  sortBy,
  sortDir,
  onSort,
  className = "",
}: {
  label: string
  col: SortCol
  sortBy: SortCol
  sortDir: "asc" | "desc"
  onSort: (c: SortCol) => void
  className?: string
}) {
  return (
    <th className={`px-2 py-2.5 text-center text-xs font-medium text-muted-foreground ${className}`}>
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-0.5 hover:text-foreground transition-colors ${sortBy === col ? "text-primary" : ""
          }`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  )
}
