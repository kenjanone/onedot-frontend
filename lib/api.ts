export let API = process.env.NEXT_PUBLIC_API_URL || 'https://onedot.onrender.com';
if (API.startsWith('http://') && !API.includes('localhost') && !API.includes('127.0.0.1')) {
    API = API.replace('http://', 'https://');
}

const req = async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`${API}${path}`, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

// Authenticated request — reads JWT from localStorage and adds Bearer header
const authReq = async (path: string, opts: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('plusone_token') : null;
    const headers: Record<string, string> = {
        ...(opts.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }
    return res.json();
};

export const getLeagues = () => req('/api/leagues');
export const getLeague = (id: string | number) => req(`/api/leagues/${id}`);
export const getMatches = (params: Record<string, any> = {}) => req(`/api/matches?${new URLSearchParams(params as any)}`);
export const getMatch = (id: string | number) => req(`/api/matches/${id}`);
export const updateMatch = (id: string | number, data: any) => authReq(`/api/matches/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteMatch = (id: string | number) => authReq(`/api/matches/${id}`, { method: 'DELETE' });
export const getTeams = (params: Record<string, any> = {}) => req(`/api/teams?${new URLSearchParams(params as any)}`);
export const getTeam = (id: string | number) => req(`/api/teams/${id}`);
export const getH2H = (teamId: string | number, oppId: string | number) => req(`/api/teams/${teamId}/head-to-head/${oppId}`);
export const getStandings = (params: Record<string, any> = {}) => req(`/api/standings?${new URLSearchParams(params as any)}`);
export const getSeasons = (params: Record<string, any> = {}) => req(`/api/standings/seasons?${new URLSearchParams(params as any)}`);
export const getSquadStats = (params: Record<string, any> = {}) => req(`/api/squad-stats?${new URLSearchParams(params as any)}`);
export const getPlayers = (params: Record<string, any> = {}) => req(`/api/players?${new URLSearchParams(params as any)}`);
export const getTopScorers = (params: Record<string, any> = {}) => req(`/api/players/top-scorers?${new URLSearchParams(params as any)}`);
export const getHealth = () => req('/api/health');
export const getVenueStats = (params: Record<string, any> = {}) => req(`/api/venue-stats?${new URLSearchParams(params as any)}`);
export const syncAll = (payload: any) => authReq('/api/sync/all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

// ── ML Prediction Engine ────────────────────────────────────────────────────
export const getPredictionStatus = () => req('/api/predictions/status');
export const trainPredictionModel = (payload: Record<string, any> = {}) =>
    authReq('/api/predictions/train', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const getEnrichmentStatus = () => req('/api/predictions/training-status/enrichment');
export const trainEnrichmentModel = () => authReq('/api/predictions/train/enrichment', { method: 'POST' });
export const predictMatchById = (payload: { home_team_id: number; away_team_id: number; league_id: number; season_id: number }) =>
    req('/api/predictions/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const predictConsensus = (payload: { home_team_id: number; away_team_id: number; league_id: number; season_id: number; match_id?: number }) =>
    req('/api/predictions/consensus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const getPredictionFixtures = (params: Record<string, any> = {}) =>
    req(`/api/predictions/fixtures?${new URLSearchParams(params as any)}`);
export const getUpcomingPredictions = (params: Record<string, any> = {}) =>
    req(`/api/predictions/upcoming?${new URLSearchParams(params as any)}`);
// Public predictions with bet recommendations (no auth required, 15-min cache)
export const getPublicPredictions = (params: Record<string, any> = {}) =>
    req(`/api/predictions/public?${new URLSearchParams(params as any)}`);
// Real-world accuracy from prediction_log evaluations
export const getPredictionLogAccuracy = (params: Record<string, any> = {}) =>
    req(`/api/prediction-log/accuracy?${new URLSearchParams(params as any)}`);
// Legacy rule-based prediction by team name
export const predictMatch = (payload: { home_team: string; away_team: string; league?: string }) =>
    req('/api/predictions/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
// Recent completed matches from DB (replaces hardcoded predictionsData)
export const getPredictionResults = (params: Record<string, any> = {}) =>
    req(`/api/predictions/results?${new URLSearchParams(params as any)}`);
// Weekly accuracy trend from real match data (replaces hardcoded weeklyTrends)
export const getPredictionAccuracy = (params: Record<string, any> = {}) =>
    req(`/api/predictions/accuracy?${new URLSearchParams(params as any)}`);

// ── DC Markets Engine ────────────────────────────────────────────────────────
export const getDCStatus = () => req('/api/markets/dc/status');
export const trainDCModel = () => authReq('/api/markets/dc/train', { method: 'POST' });
export const getDCPredict = (homeId: number, awayId: number) =>
    req(`/api/markets/dc/predict?home_team_id=${homeId}&away_team_id=${awayId}`);
export const getMarkets = (homeId: number, awayId: number) =>
    req(`/api/markets?home_team_id=${homeId}&away_team_id=${awayId}`);
export const getDCLeaderboard = () => req('/api/markets/dc/leaderboard');
export const getValueBets = (payload: any) =>
    req('/api/markets/value', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
// DC-engine bulk predictions for all upcoming fixtures (powers Free Picks page)
export const getMarketsUpcoming = (params: Record<string, any> = {}) =>
    req(`/api/markets/upcoming?${new URLSearchParams(params as any)}`);
// Rich pre-match data for card expand (form, H2H with scores, upcoming, stats)
export const getMatchPreview = (homeId: number, awayId: number) =>
    req(`/api/markets/match-preview?home_team_id=${homeId}&away_team_id=${awayId}`);

// ── Performance Metrics ──────────────────────────────────────────────────────
export const getPerformance = () => req('/api/performance');
export const getPerformanceDrift = () => req('/api/performance/drift');
export const getCalibration = () => req('/api/performance/calibration');
export const getPerLeague = () => req('/api/performance/per-league');
export const getConfusionMatrix = () => req('/api/performance/confusion');
export const getEnginePerformance   = () => req('/api/performance/engines');
export const getPerformanceMarkets  = () => req('/api/performance/markets');
// Grade all completed predictions against actual match results (requires admin auth)
export const evaluatePredictions = () =>
    authReq('/api/prediction-log/evaluate', { method: 'POST' });

// Recalibrate the ML model (requires admin auth)
export const recalibrate = () =>
    authReq('/api/predictions/recalibrate', { method: 'POST' });

// ── User Feedback ─────────────────────────────────────────────────────────────
export const submitFeedback = (body: {
    name?: string; email?: string;
    category?: string; message: string; rating?: number;
}) => req('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const getFeedback = (params: Record<string, any> = {}) =>
    req(`/api/feedback?${new URLSearchParams(params as any)}`);

// ── Admin Settings ───────────────────────────────────────────────────────────
export const getSettings = () => req('/api/settings');
export const getSetting  = (key: string) => req(`/api/settings/${key}`);
export const putSetting  = (key: string, value: string, description?: string) =>
    authReq(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, description }),
    });

// ── Auto-consensus job ────────────────────────────────────────────────────────
export const getAutoConsensusStatus = () => req('/api/predictions/auto-consensus/status');
export const triggerAutoConsensus   = () =>
    authReq('/api/predictions/auto-consensus', { method: 'POST' });

// ── Prediction Q&A (LLM-powered) ─────────────────────────────────────────────
export const askPrediction = (payload: {
    question: string;
    match_id?:     number;
    home_team_id?: number;
    away_team_id?: number;
    league_id?:    number;
    season_id?:    number;
    provider?:     string;
    model?:        string;
    history?:      any[];
    file_base64?:  string;
    file_mime?:    string;
}) =>
    req('/api/predict/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

export const getAIModels = () => req('/api/predict/models');
