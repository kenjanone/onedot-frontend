export interface League {
    id: number;
    name: string;
    country?: string;
    logo?: string;
}

export interface Match {
    id: number;
    league_id: number;
    league: string;
    season_id: number;
    season: string;
    match_date: string;
    gameweek?: number;
    home_team: string;
    away_team: string;
    home_logo?: string;
    away_logo?: string;
    home_score?: number | null;
    away_score?: number | null;
    venue?: string;
    attendance?: number;
    status?: string;
}

export interface Player {
    id: number;
    team_id?: number;
    team: string;
    logo_url?: string;
    league?: string;
    player_name: string;
    nationality?: string;
    position?: string;
    age?: number | string;
    matches_played?: number;
    minutes_played?: number;
    goals?: number;
    assists?: number;
}

export interface Standing {
    rank: number;
    team: string;
    league: string;
    league_id: number;
    season: string;
    season_id: number;
    games: number;
    wins: number;
    ties: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_diff: number;
    points: number;
    points_avg?: number;
    is_current?: boolean;
    home_away_split?: any;
}

export interface SquadStat {
    team: string;
    logo_url?: string;
    split: "for" | "against";
    league?: string;
    season?: string;
    games: number;
    possession?: number | string;
    goals?: number;
    assists?: number;
    players_used?: number;
    avg_age?: number | string;
    minutes?: number;
}

export interface HealthStatus {
    status: string;
    database?: string;
}

export interface Season {
    league_id: number;
    league: string;
    season_id: number;
    season: string;
    is_current: boolean;
}

export interface LogEntry {
    msg: string;
    type: string;
    time: string;
}
