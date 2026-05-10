// ============================================================
// PlusOne Football Analytics — Static data reflecting the
// baryonic-skylab backend schema (leagues, teams, matches,
// standings, player_stats, squad_stats, predictions, venue stats).
// ============================================================

export interface League {
  id: number
  name: string
  country: string
  fbref_id: number | null
  teamCount: number
  matchCount: number
  currentSeason: string
}

export interface Team {
  id: number
  name: string
  league: string
  leagueId: number
}

export interface StandingRow {
  rank: number
  team: string
  league: string
  leagueId: number
  season: string
  seasonId: number
  games: number
  wins: number
  ties: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  pointsAvg: number | null
  isCurrent: boolean
}

export interface Match {
  id: number
  matchDate: string
  gameweek: number | null
  startTime: string | null
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  scoreRaw: string | null
  venue: string
  referee: string | null
  attendance: number | null
  league: string
  season: string
  isPlayed: boolean
}

export interface PlayerStat {
  id: number
  playerName: string
  nationality: string
  position: string
  team: string
  league: string
  season: string
  age: number
  games: number
  gamesStarts: number
  minutes: number
  minutes90s: number | null
  goals: number
  assists: number
}

export interface SquadStat {
  id: number
  team: string
  league: string
  season: string
  split: "for" | "against"
  playersUsed: number | null
  avgAge: number | null
  possession: number | null
  games: number
  gamesStarts: number | null
  minutes: number | null
  goals: number
  assists: number
}

export interface VenueStat {
  team: string
  league: string
  venue: "home" | "away"
  games: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export interface HeadToHead {
  matchDate: string
  season: string
  league: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  venue: string
  scoreRaw: string | null
}

export interface Prediction {
  homeTeam: string
  awayTeam: string
  homeWinProb: number
  drawProb: number
  awayWinProb: number
  predictedHome: number
  predictedAway: number
  confidence: "high" | "medium" | "low"
  homeStats: TeamPredictionStats | null
  awayStats: TeamPredictionStats | null
  actualResult: ActualResult | null
}

export interface TeamPredictionStats {
  goalsPerGame: number
  winRate: number
  possession: number | null
  avgAge: number | null
  goalsFor: number | null
  goalsAgainst: number | null
  rank: number | null
  points: number | null
}

export interface ActualResult {
  homeScore: number
  awayScore: number
  matchDate: string | null
  predictionCorrect: boolean
}

export interface SyncStatus {
  league: string
  season: string | null
  log: { type: string; rows: number; lastSync: string | null }[]
  live: { fixtures: number; homeAwayRows: number; standingsRows: number }
}

export interface WpaPlay {
  minute: number
  homeWp: number
  event: string
  team: string
}

export interface WeeklyTrend {
  week: string
  accuracy: number
  predictions: number
  correct: number
}

// ── Leagues from 03_seed_leagues.sql ──
export const leagues: League[] = [
  { id: 1, name: "Premier League", country: "England", fbref_id: 9, teamCount: 20, matchCount: 380, currentSeason: "2025-2026" },
  { id: 2, name: "Championship", country: "England", fbref_id: 10, teamCount: 24, matchCount: 552, currentSeason: "2025-2026" },
  { id: 3, name: "Bundesliga", country: "Germany", fbref_id: 20, teamCount: 18, matchCount: 306, currentSeason: "2025-2026" },
  { id: 4, name: "La Liga", country: "Spain", fbref_id: 12, teamCount: 20, matchCount: 380, currentSeason: "2025-2026" },
  { id: 5, name: "Ligue 1", country: "France", fbref_id: 13, teamCount: 18, matchCount: 306, currentSeason: "2025-2026" },
  { id: 6, name: "Serie A", country: "Italy", fbref_id: 11, teamCount: 20, matchCount: 380, currentSeason: "2025-2026" },
  { id: 7, name: "Eredivisie", country: "Netherlands", fbref_id: 23, teamCount: 18, matchCount: 306, currentSeason: "2025-2026" },
  { id: 8, name: "Super Lig", country: "Turkey", fbref_id: 26, teamCount: 19, matchCount: 342, currentSeason: "2025-2026" },
  { id: 9, name: "Belgian Pro League", country: "Belgium", fbref_id: 37, teamCount: 16, matchCount: 240, currentSeason: "2025-2026" },
]

// ── Teams (sample from key leagues) ──
export const teamsData: Team[] = [
  { id: 1, name: "Liverpool", league: "Premier League", leagueId: 1 },
  { id: 2, name: "Arsenal", league: "Premier League", leagueId: 1 },
  { id: 3, name: "Manchester City", league: "Premier League", leagueId: 1 },
  { id: 4, name: "Nottingham Forest", league: "Premier League", leagueId: 1 },
  { id: 5, name: "Chelsea", league: "Premier League", leagueId: 1 },
  { id: 6, name: "Newcastle", league: "Premier League", leagueId: 1 },
  { id: 7, name: "Bournemouth", league: "Premier League", leagueId: 1 },
  { id: 8, name: "Aston Villa", league: "Premier League", leagueId: 1 },
  { id: 9, name: "Brighton", league: "Premier League", leagueId: 1 },
  { id: 10, name: "Fulham", league: "Premier League", leagueId: 1 },
  { id: 11, name: "Manchester United", league: "Premier League", leagueId: 1 },
  { id: 12, name: "Brentford", league: "Premier League", leagueId: 1 },
  { id: 13, name: "Barcelona", league: "La Liga", leagueId: 4 },
  { id: 14, name: "Real Madrid", league: "La Liga", leagueId: 4 },
  { id: 15, name: "Atletico Madrid", league: "La Liga", leagueId: 4 },
  { id: 16, name: "Bayern Munich", league: "Bundesliga", leagueId: 3 },
  { id: 17, name: "Dortmund", league: "Bundesliga", leagueId: 3 },
  { id: 18, name: "Leverkusen", league: "Bundesliga", leagueId: 3 },
  { id: 19, name: "PSG", league: "Ligue 1", leagueId: 5 },
  { id: 20, name: "Inter Milan", league: "Serie A", leagueId: 6 },
  { id: 21, name: "Juventus", league: "Serie A", leagueId: 6 },
  { id: 22, name: "Napoli", league: "Serie A", leagueId: 6 },
  { id: 23, name: "PSV", league: "Eredivisie", leagueId: 7 },
  { id: 24, name: "Ajax", league: "Eredivisie", leagueId: 7 },
]

// ── Standings ──
export const standingsData: StandingRow[] = [
  { rank: 1, team: "Liverpool", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 21, ties: 5, losses: 2, goalsFor: 62, goalsAgainst: 21, goalDiff: 41, points: 68, pointsAvg: 2.43, isCurrent: true },
  { rank: 2, team: "Arsenal", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 19, ties: 6, losses: 3, goalsFor: 56, goalsAgainst: 19, goalDiff: 37, points: 63, pointsAvg: 2.25, isCurrent: true },
  { rank: 3, team: "Manchester City", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 18, ties: 5, losses: 5, goalsFor: 58, goalsAgainst: 28, goalDiff: 30, points: 59, pointsAvg: 2.11, isCurrent: true },
  { rank: 4, team: "Nottingham Forest", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 16, ties: 5, losses: 7, goalsFor: 42, goalsAgainst: 27, goalDiff: 15, points: 53, pointsAvg: 1.89, isCurrent: true },
  { rank: 5, team: "Chelsea", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 14, ties: 7, losses: 7, goalsFor: 52, goalsAgainst: 33, goalDiff: 19, points: 49, pointsAvg: 1.75, isCurrent: true },
  { rank: 6, team: "Newcastle", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 13, ties: 7, losses: 8, goalsFor: 44, goalsAgainst: 30, goalDiff: 14, points: 46, pointsAvg: 1.64, isCurrent: true },
  { rank: 7, team: "Bournemouth", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 13, ties: 6, losses: 9, goalsFor: 43, goalsAgainst: 35, goalDiff: 8, points: 45, pointsAvg: 1.61, isCurrent: true },
  { rank: 8, team: "Aston Villa", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 12, ties: 6, losses: 10, goalsFor: 39, goalsAgainst: 38, goalDiff: 1, points: 42, pointsAvg: 1.50, isCurrent: true },
  { rank: 9, team: "Brighton", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 10, ties: 9, losses: 9, goalsFor: 41, goalsAgainst: 38, goalDiff: 3, points: 39, pointsAvg: 1.39, isCurrent: true },
  { rank: 10, team: "Fulham", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 10, ties: 8, losses: 10, goalsFor: 36, goalsAgainst: 35, goalDiff: 1, points: 38, pointsAvg: 1.36, isCurrent: true },
  { rank: 11, team: "Manchester United", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 10, ties: 6, losses: 12, goalsFor: 33, goalsAgainst: 37, goalDiff: -4, points: 36, pointsAvg: 1.29, isCurrent: true },
  { rank: 12, team: "Brentford", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 10, ties: 5, losses: 13, goalsFor: 43, goalsAgainst: 42, goalDiff: 1, points: 35, pointsAvg: 1.25, isCurrent: true },
  { rank: 13, team: "Crystal Palace", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 8, ties: 8, losses: 12, goalsFor: 30, goalsAgainst: 36, goalDiff: -6, points: 32, pointsAvg: 1.14, isCurrent: true },
  { rank: 14, team: "West Ham", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 8, ties: 6, losses: 14, goalsFor: 31, goalsAgainst: 45, goalDiff: -14, points: 30, pointsAvg: 1.07, isCurrent: true },
  { rank: 15, team: "Everton", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 7, ties: 8, losses: 13, goalsFor: 25, goalsAgainst: 37, goalDiff: -12, points: 29, pointsAvg: 1.04, isCurrent: true },
  { rank: 16, team: "Wolves", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 7, ties: 6, losses: 15, goalsFor: 32, goalsAgainst: 48, goalDiff: -16, points: 27, pointsAvg: 0.96, isCurrent: true },
  { rank: 17, team: "Ipswich Town", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 5, ties: 10, losses: 13, goalsFor: 24, goalsAgainst: 43, goalDiff: -19, points: 25, pointsAvg: 0.89, isCurrent: true },
  { rank: 18, team: "Leicester City", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 5, ties: 5, losses: 18, goalsFor: 24, goalsAgainst: 52, goalDiff: -28, points: 20, pointsAvg: 0.71, isCurrent: true },
  { rank: 19, team: "Tottenham", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 4, ties: 6, losses: 18, goalsFor: 38, goalsAgainst: 52, goalDiff: -14, points: 18, pointsAvg: 0.64, isCurrent: true },
  { rank: 20, team: "Southampton", league: "Premier League", leagueId: 1, season: "2025-2026", seasonId: 1, games: 28, wins: 2, ties: 5, losses: 21, goalsFor: 14, goalsAgainst: 56, goalDiff: -42, points: 11, pointsAvg: 0.39, isCurrent: true },
]

// ── Matches ──
export const matchesData: Match[] = [
  { id: 1, matchDate: "2026-03-01", gameweek: 28, startTime: "15:00", homeTeam: "Liverpool", awayTeam: "Manchester City", homeScore: 2, awayScore: 1, scoreRaw: "2-1", venue: "Anfield", referee: "Michael Oliver", attendance: 54074, league: "Premier League", season: "2025-2026", isPlayed: true },
  { id: 2, matchDate: "2026-03-01", gameweek: 28, startTime: "17:30", homeTeam: "Arsenal", awayTeam: "Chelsea", homeScore: 1, awayScore: 1, scoreRaw: "1-1", venue: "Emirates Stadium", referee: "Anthony Taylor", attendance: 60260, league: "Premier League", season: "2025-2026", isPlayed: true },
  { id: 3, matchDate: "2026-03-02", gameweek: 28, startTime: "14:00", homeTeam: "Newcastle", awayTeam: "Aston Villa", homeScore: 3, awayScore: 0, scoreRaw: "3-0", venue: "St. James' Park", referee: "Simon Hooper", attendance: 52305, league: "Premier League", season: "2025-2026", isPlayed: true },
  { id: 4, matchDate: "2026-03-02", gameweek: 28, startTime: "14:00", homeTeam: "Bournemouth", awayTeam: "Brighton", homeScore: 2, awayScore: 2, scoreRaw: "2-2", venue: "Vitality Stadium", referee: "Craig Pawson", attendance: 11379, league: "Premier League", season: "2025-2026", isPlayed: true },
  { id: 5, matchDate: "2026-03-08", gameweek: 29, startTime: "12:30", homeTeam: "Manchester City", awayTeam: "Arsenal", homeScore: null, awayScore: null, scoreRaw: null, venue: "Etihad Stadium", referee: null, attendance: null, league: "Premier League", season: "2025-2026", isPlayed: false },
  { id: 6, matchDate: "2026-03-08", gameweek: 29, startTime: "17:30", homeTeam: "Chelsea", awayTeam: "Liverpool", homeScore: null, awayScore: null, scoreRaw: null, venue: "Stamford Bridge", referee: null, attendance: null, league: "Premier League", season: "2025-2026", isPlayed: false },
  { id: 7, matchDate: "2026-03-08", gameweek: 29, startTime: "15:00", homeTeam: "Aston Villa", awayTeam: "Tottenham", homeScore: null, awayScore: null, scoreRaw: null, venue: "Villa Park", referee: null, attendance: null, league: "Premier League", season: "2025-2026", isPlayed: false },
  { id: 8, matchDate: "2026-03-09", gameweek: 29, startTime: "14:00", homeTeam: "Nottingham Forest", awayTeam: "Newcastle", homeScore: null, awayScore: null, scoreRaw: null, venue: "City Ground", referee: null, attendance: null, league: "Premier League", season: "2025-2026", isPlayed: false },
  { id: 9, matchDate: "2026-03-01", gameweek: 25, startTime: "21:00", homeTeam: "Barcelona", awayTeam: "Real Madrid", homeScore: 3, awayScore: 2, scoreRaw: "3-2", venue: "Camp Nou", referee: "Jesus Gil Manzano", attendance: 99354, league: "La Liga", season: "2025-2026", isPlayed: true },
  { id: 10, matchDate: "2026-03-01", gameweek: 24, startTime: "18:30", homeTeam: "Bayern Munich", awayTeam: "Dortmund", homeScore: 4, awayScore: 1, scoreRaw: "4-1", venue: "Allianz Arena", referee: "Felix Zwayer", attendance: 75024, league: "Bundesliga", season: "2025-2026", isPlayed: true },
  { id: 11, matchDate: "2026-03-02", gameweek: 27, startTime: "20:45", homeTeam: "PSG", awayTeam: "Lyon", homeScore: 2, awayScore: 0, scoreRaw: "2-0", venue: "Parc des Princes", referee: "Francois Letexier", attendance: 48583, league: "Ligue 1", season: "2025-2026", isPlayed: true },
  { id: 12, matchDate: "2026-03-02", gameweek: 27, startTime: "20:45", homeTeam: "Inter Milan", awayTeam: "Juventus", homeScore: 1, awayScore: 1, scoreRaw: "1-1", venue: "San Siro", referee: "Daniele Orsato", attendance: 75817, league: "Serie A", season: "2025-2026", isPlayed: true },
]

// ── Players ──
export const playersData: PlayerStat[] = [
  { id: 1, playerName: "Mohamed Salah", nationality: "EGY", position: "FW", team: "Liverpool", league: "Premier League", season: "2025-2026", age: 33, games: 28, gamesStarts: 27, minutes: 2340, minutes90s: 26.0, goals: 19, assists: 13 },
  { id: 2, playerName: "Erling Haaland", nationality: "NOR", position: "FW", team: "Manchester City", league: "Premier League", season: "2025-2026", age: 25, games: 26, gamesStarts: 26, minutes: 2280, minutes90s: 25.3, goals: 22, assists: 4 },
  { id: 3, playerName: "Alexander Isak", nationality: "SWE", position: "FW", team: "Newcastle", league: "Premier League", season: "2025-2026", age: 26, games: 27, gamesStarts: 26, minutes: 2220, minutes90s: 24.7, goals: 17, assists: 5 },
  { id: 4, playerName: "Bryan Mbeumo", nationality: "CMR", position: "FW", team: "Brentford", league: "Premier League", season: "2025-2026", age: 25, games: 28, gamesStarts: 28, minutes: 2440, minutes90s: 27.1, goals: 15, assists: 8 },
  { id: 5, playerName: "Cole Palmer", nationality: "ENG", position: "MF", team: "Chelsea", league: "Premier League", season: "2025-2026", age: 23, games: 25, gamesStarts: 25, minutes: 2100, minutes90s: 23.3, goals: 14, assists: 10 },
  { id: 6, playerName: "Bukayo Saka", nationality: "ENG", position: "FW", team: "Arsenal", league: "Premier League", season: "2025-2026", age: 24, games: 24, gamesStarts: 24, minutes: 2050, minutes90s: 22.8, goals: 12, assists: 11 },
  { id: 7, playerName: "Luis Diaz", nationality: "COL", position: "FW", team: "Liverpool", league: "Premier League", season: "2025-2026", age: 29, games: 27, gamesStarts: 22, minutes: 1900, minutes90s: 21.1, goals: 11, assists: 4 },
  { id: 8, playerName: "Matheus Cunha", nationality: "BRA", position: "FW", team: "Wolves", league: "Premier League", season: "2025-2026", age: 26, games: 28, gamesStarts: 27, minutes: 2390, minutes90s: 26.6, goals: 11, assists: 6 },
  { id: 9, playerName: "Chris Wood", nationality: "NZL", position: "FW", team: "Nottingham Forest", league: "Premier League", season: "2025-2026", age: 34, games: 28, gamesStarts: 28, minutes: 2450, minutes90s: 27.2, goals: 14, assists: 3 },
  { id: 10, playerName: "Robert Lewandowski", nationality: "POL", position: "FW", team: "Barcelona", league: "La Liga", season: "2025-2026", age: 37, games: 25, gamesStarts: 25, minutes: 2150, minutes90s: 23.9, goals: 20, assists: 5 },
  { id: 11, playerName: "Raphinha", nationality: "BRA", position: "FW", team: "Barcelona", league: "La Liga", season: "2025-2026", age: 29, games: 25, gamesStarts: 24, minutes: 2080, minutes90s: 23.1, goals: 16, assists: 10 },
  { id: 12, playerName: "Harry Kane", nationality: "ENG", position: "FW", team: "Bayern Munich", league: "Bundesliga", season: "2025-2026", age: 32, games: 24, gamesStarts: 24, minutes: 2100, minutes90s: 23.3, goals: 24, assists: 8 },
  { id: 13, playerName: "Omar Marmoush", nationality: "EGY", position: "FW", team: "Manchester City", league: "Premier League", season: "2025-2026", age: 26, games: 12, gamesStarts: 10, minutes: 920, minutes90s: 10.2, goals: 5, assists: 3 },
  { id: 14, playerName: "Vinicius Jr.", nationality: "BRA", position: "FW", team: "Real Madrid", league: "La Liga", season: "2025-2026", age: 25, games: 22, gamesStarts: 22, minutes: 1900, minutes90s: 21.1, goals: 15, assists: 7 },
  { id: 15, playerName: "Lamine Yamal", nationality: "ESP", position: "FW", team: "Barcelona", league: "La Liga", season: "2025-2026", age: 18, games: 25, gamesStarts: 23, minutes: 1980, minutes90s: 22.0, goals: 10, assists: 12 },
]

// ── Squad Stats (for/against splits) ──
export const squadStatsData: SquadStat[] = [
  { id: 1, team: "Liverpool", league: "Premier League", season: "2025-2026", split: "for", playersUsed: 24, avgAge: 27.3, possession: 59.4, games: 28, gamesStarts: null, minutes: null, goals: 62, assists: 48 },
  { id: 2, team: "Liverpool", league: "Premier League", season: "2025-2026", split: "against", playersUsed: null, avgAge: null, possession: null, games: 28, gamesStarts: null, minutes: null, goals: 21, assists: 16 },
  { id: 3, team: "Arsenal", league: "Premier League", season: "2025-2026", split: "for", playersUsed: 23, avgAge: 25.9, possession: 57.8, games: 28, gamesStarts: null, minutes: null, goals: 56, assists: 42 },
  { id: 4, team: "Arsenal", league: "Premier League", season: "2025-2026", split: "against", playersUsed: null, avgAge: null, possession: null, games: 28, gamesStarts: null, minutes: null, goals: 19, assists: 14 },
  { id: 5, team: "Manchester City", league: "Premier League", season: "2025-2026", split: "for", playersUsed: 25, avgAge: 27.1, possession: 63.2, games: 28, gamesStarts: null, minutes: null, goals: 58, assists: 44 },
  { id: 6, team: "Manchester City", league: "Premier League", season: "2025-2026", split: "against", playersUsed: null, avgAge: null, possession: null, games: 28, gamesStarts: null, minutes: null, goals: 28, assists: 22 },
  { id: 7, team: "Chelsea", league: "Premier League", season: "2025-2026", split: "for", playersUsed: 27, avgAge: 24.8, possession: 55.1, games: 28, gamesStarts: null, minutes: null, goals: 52, assists: 38 },
  { id: 8, team: "Chelsea", league: "Premier League", season: "2025-2026", split: "against", playersUsed: null, avgAge: null, possession: null, games: 28, gamesStarts: null, minutes: null, goals: 33, assists: 24 },
  { id: 9, team: "Barcelona", league: "La Liga", season: "2025-2026", split: "for", playersUsed: 22, avgAge: 25.2, possession: 64.5, games: 25, gamesStarts: null, minutes: null, goals: 63, assists: 50 },
  { id: 10, team: "Barcelona", league: "La Liga", season: "2025-2026", split: "against", playersUsed: null, avgAge: null, possession: null, games: 25, gamesStarts: null, minutes: null, goals: 24, assists: 18 },
  { id: 11, team: "Bayern Munich", league: "Bundesliga", season: "2025-2026", split: "for", playersUsed: 24, avgAge: 26.8, possession: 62.1, games: 24, gamesStarts: null, minutes: null, goals: 68, assists: 52 },
  { id: 12, team: "Bayern Munich", league: "Bundesliga", season: "2025-2026", split: "against", playersUsed: null, avgAge: null, possession: null, games: 24, gamesStarts: null, minutes: null, goals: 22, assists: 16 },
]

// ── Home/Away Venue Stats ──
export const venueStatsData: VenueStat[] = [
  { team: "Liverpool", league: "Premier League", venue: "home", games: 14, wins: 12, draws: 2, losses: 0, goalsFor: 38, goalsAgainst: 8, goalDiff: 30, points: 38 },
  { team: "Liverpool", league: "Premier League", venue: "away", games: 14, wins: 9, draws: 3, losses: 2, goalsFor: 24, goalsAgainst: 13, goalDiff: 11, points: 30 },
  { team: "Arsenal", league: "Premier League", venue: "home", games: 14, wins: 11, draws: 3, losses: 0, goalsFor: 32, goalsAgainst: 7, goalDiff: 25, points: 36 },
  { team: "Arsenal", league: "Premier League", venue: "away", games: 14, wins: 8, draws: 3, losses: 3, goalsFor: 24, goalsAgainst: 12, goalDiff: 12, points: 27 },
  { team: "Manchester City", league: "Premier League", venue: "home", games: 14, wins: 11, draws: 2, losses: 1, goalsFor: 36, goalsAgainst: 10, goalDiff: 26, points: 35 },
  { team: "Manchester City", league: "Premier League", venue: "away", games: 14, wins: 7, draws: 3, losses: 4, goalsFor: 22, goalsAgainst: 18, goalDiff: 4, points: 24 },
  { team: "Chelsea", league: "Premier League", venue: "home", games: 14, wins: 9, draws: 3, losses: 2, goalsFor: 30, goalsAgainst: 14, goalDiff: 16, points: 30 },
  { team: "Chelsea", league: "Premier League", venue: "away", games: 14, wins: 5, draws: 4, losses: 5, goalsFor: 22, goalsAgainst: 19, goalDiff: 3, points: 19 },
]

// ── Head-to-Head (sample) ──
export const headToHeadData: HeadToHead[] = [
  { matchDate: "2026-03-01", season: "2025-2026", league: "Premier League", homeTeam: "Liverpool", awayTeam: "Manchester City", homeScore: 2, awayScore: 1, venue: "Anfield", scoreRaw: "2-1" },
  { matchDate: "2025-11-30", season: "2025-2026", league: "Premier League", homeTeam: "Manchester City", awayTeam: "Liverpool", homeScore: 1, awayScore: 2, venue: "Etihad Stadium", scoreRaw: "1-2" },
  { matchDate: "2025-03-10", season: "2024-2025", league: "Premier League", homeTeam: "Liverpool", awayTeam: "Manchester City", homeScore: 1, awayScore: 1, venue: "Anfield", scoreRaw: "1-1" },
  { matchDate: "2024-11-30", season: "2024-2025", league: "Premier League", homeTeam: "Manchester City", awayTeam: "Liverpool", homeScore: 1, awayScore: 2, venue: "Etihad Stadium", scoreRaw: "1-2" },
]

// ── Predictions ──
export const predictionsData: Prediction[] = [
  {
    homeTeam: "Manchester City", awayTeam: "Arsenal",
    homeWinProb: 0.42, drawProb: 0.28, awayWinProb: 0.30,
    predictedHome: 1, predictedAway: 1, confidence: "high",
    homeStats: { goalsPerGame: 2.07, winRate: 0.64, possession: 63.2, avgAge: 27.1, goalsFor: 58, goalsAgainst: 28, rank: 3, points: 59 },
    awayStats: { goalsPerGame: 2.0, winRate: 0.68, possession: 57.8, avgAge: 25.9, goalsFor: 56, goalsAgainst: 19, rank: 2, points: 63 },
    actualResult: null,
  },
  {
    homeTeam: "Chelsea", awayTeam: "Liverpool",
    homeWinProb: 0.28, drawProb: 0.26, awayWinProb: 0.46,
    predictedHome: 1, predictedAway: 2, confidence: "high",
    homeStats: { goalsPerGame: 1.86, winRate: 0.50, possession: 55.1, avgAge: 24.8, goalsFor: 52, goalsAgainst: 33, rank: 5, points: 49 },
    awayStats: { goalsPerGame: 2.21, winRate: 0.75, possession: 59.4, avgAge: 27.3, goalsFor: 62, goalsAgainst: 21, rank: 1, points: 68 },
    actualResult: null,
  },
  {
    homeTeam: "Liverpool", awayTeam: "Manchester City",
    homeWinProb: 0.55, drawProb: 0.22, awayWinProb: 0.23,
    predictedHome: 2, predictedAway: 1, confidence: "high",
    homeStats: { goalsPerGame: 2.21, winRate: 0.75, possession: 59.4, avgAge: 27.3, goalsFor: 62, goalsAgainst: 21, rank: 1, points: 68 },
    awayStats: { goalsPerGame: 2.07, winRate: 0.64, possession: 63.2, avgAge: 27.1, goalsFor: 58, goalsAgainst: 28, rank: 3, points: 59 },
    actualResult: { homeScore: 2, awayScore: 1, matchDate: "2026-03-01", predictionCorrect: true },
  },
  {
    homeTeam: "Barcelona", awayTeam: "Real Madrid",
    homeWinProb: 0.48, drawProb: 0.24, awayWinProb: 0.28,
    predictedHome: 2, predictedAway: 1, confidence: "high",
    homeStats: { goalsPerGame: 2.52, winRate: 0.72, possession: 64.5, avgAge: 25.2, goalsFor: 63, goalsAgainst: 24, rank: 1, points: 64 },
    awayStats: { goalsPerGame: 2.04, winRate: 0.64, possession: 56.8, avgAge: 27.6, goalsFor: 51, goalsAgainst: 22, rank: 2, points: 58 },
    actualResult: { homeScore: 3, awayScore: 2, matchDate: "2026-03-01", predictionCorrect: true },
  },
  {
    homeTeam: "Bayern Munich", awayTeam: "Dortmund",
    homeWinProb: 0.62, drawProb: 0.20, awayWinProb: 0.18,
    predictedHome: 3, predictedAway: 1, confidence: "high",
    homeStats: { goalsPerGame: 2.83, winRate: 0.79, possession: 62.1, avgAge: 26.8, goalsFor: 68, goalsAgainst: 22, rank: 1, points: 62 },
    awayStats: { goalsPerGame: 1.75, winRate: 0.50, possession: 54.2, avgAge: 25.4, goalsFor: 42, goalsAgainst: 36, rank: 5, points: 41 },
    actualResult: { homeScore: 4, awayScore: 1, matchDate: "2026-03-01", predictionCorrect: true },
  },
  {
    homeTeam: "Nottingham Forest", awayTeam: "Newcastle",
    homeWinProb: 0.38, drawProb: 0.30, awayWinProb: 0.32,
    predictedHome: 1, predictedAway: 1, confidence: "medium",
    homeStats: { goalsPerGame: 1.50, winRate: 0.57, possession: 44.5, avgAge: 27.5, goalsFor: 42, goalsAgainst: 27, rank: 4, points: 53 },
    awayStats: { goalsPerGame: 1.57, winRate: 0.46, possession: 51.2, avgAge: 26.9, goalsFor: 44, goalsAgainst: 30, rank: 6, points: 46 },
    actualResult: null,
  },
]

// ── Sync Status (mock of /api/sync/status response) ──
export const syncStatusData: SyncStatus[] = [
  { league: "Premier League", season: "2025-2026", log: [{ type: "sync_all", rows: 412, lastSync: "2026-03-02T14:30:00" }, { type: "fixtures", rows: 380, lastSync: "2026-03-02T14:25:00" }], live: { fixtures: 380, homeAwayRows: 40, standingsRows: 20 } },
  { league: "La Liga", season: "2025-2026", log: [{ type: "sync_all", rows: 356, lastSync: "2026-03-02T13:45:00" }], live: { fixtures: 310, homeAwayRows: 40, standingsRows: 20 } },
  { league: "Bundesliga", season: "2025-2026", log: [{ type: "sync_all", rows: 289, lastSync: "2026-03-01T22:10:00" }], live: { fixtures: 248, homeAwayRows: 36, standingsRows: 18 } },
  { league: "Serie A", season: "2025-2026", log: [{ type: "sync_all", rows: 342, lastSync: "2026-03-02T12:00:00" }], live: { fixtures: 320, homeAwayRows: 40, standingsRows: 20 } },
  { league: "Ligue 1", season: "2025-2026", log: [{ type: "sync_all", rows: 280, lastSync: "2026-03-01T23:15:00" }], live: { fixtures: 260, homeAwayRows: 36, standingsRows: 18 } },
  { league: "Eredivisie", season: "2025-2026", log: [{ type: "fixtures", rows: 215, lastSync: "2026-02-28T18:00:00" }], live: { fixtures: 215, homeAwayRows: 36, standingsRows: 18 } },
  { league: "Championship", season: "2025-2026", log: [{ type: "sync_all", rows: 490, lastSync: "2026-03-02T15:00:00" }], live: { fixtures: 460, homeAwayRows: 48, standingsRows: 24 } },
  { league: "Super Lig", season: "2025-2026", log: [{ type: "fixtures", rows: 198, lastSync: "2026-02-27T10:30:00" }], live: { fixtures: 198, homeAwayRows: 38, standingsRows: 19 } },
  { league: "Belgian Pro League", season: "2025-2026", log: [{ type: "sync_all", rows: 210, lastSync: "2026-02-28T20:00:00" }], live: { fixtures: 200, homeAwayRows: 32, standingsRows: 16 } },
]

// ── WPA timeline ──
export const wpaTimelineData: WpaPlay[] = [
  { minute: 0, homeWp: 0.55, event: "Kickoff", team: "" },
  { minute: 8, homeWp: 0.58, event: "Dangerous attack by home side", team: "Home" },
  { minute: 15, homeWp: 0.65, event: "GOAL - Home team scores", team: "Home" },
  { minute: 22, homeWp: 0.62, event: "Away free kick in good position", team: "Away" },
  { minute: 30, homeWp: 0.68, event: "Home penalty won", team: "Home" },
  { minute: 32, homeWp: 0.75, event: "GOAL - Penalty converted", team: "Home" },
  { minute: 38, homeWp: 0.72, event: "Away shot on target saved", team: "Away" },
  { minute: 45, homeWp: 0.74, event: "Half Time", team: "" },
  { minute: 52, homeWp: 0.70, event: "Away pressing high", team: "Away" },
  { minute: 58, homeWp: 0.62, event: "GOAL - Away team scores", team: "Away" },
  { minute: 65, homeWp: 0.60, event: "Away substitution, fresh legs", team: "Away" },
  { minute: 72, homeWp: 0.55, event: "Home red card!", team: "Home" },
  { minute: 78, homeWp: 0.48, event: "GOAL - Away equalizer", team: "Away" },
  { minute: 85, homeWp: 0.45, event: "Away dominant possession", team: "Away" },
  { minute: 88, homeWp: 0.52, event: "GOAL - Late home winner!", team: "Home" },
  { minute: 90, homeWp: 0.55, event: "Full Time", team: "" },
]

// ── Weekly accuracy ──
export const weeklyTrends: WeeklyTrend[] = [
  { week: "GW20", accuracy: 68, predictions: 10, correct: 7 },
  { week: "GW21", accuracy: 75, predictions: 10, correct: 8 },
  { week: "GW22", accuracy: 71, predictions: 10, correct: 7 },
  { week: "GW23", accuracy: 81, predictions: 10, correct: 8 },
  { week: "GW24", accuracy: 69, predictions: 10, correct: 7 },
  { week: "GW25", accuracy: 78, predictions: 10, correct: 8 },
  { week: "GW26", accuracy: 82, predictions: 10, correct: 8 },
  { week: "GW27", accuracy: 76, predictions: 10, correct: 8 },
  { week: "GW28", accuracy: 80, predictions: 10, correct: 8 },
]
