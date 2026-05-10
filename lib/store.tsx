"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type OddsFormat = 'decimal' | 'fractional' | 'american';
export type Theme = 'dark' | 'light' | 'system';
export type DefaultView = 'cards' | 'table';
export type PredictionModel = 'blended' | 'statistical' | 'ai';
export type StatsDepth = 'basic' | 'advanced' | 'expert';

interface AppSettings {
  // Appearance
  theme: Theme;
  oddsFormat: OddsFormat;
  defaultLeague: string;
  animationsEnabled: boolean;
  compactMode: boolean;
  showConfidenceBadge: boolean;
  defaultView: DefaultView;
  autoRefreshInterval: number;

  // Prediction Preferences
  predictionModel: PredictionModel;
  confidenceThreshold: number; // 0-100
  homeAwayBias: number; // 0-100 (50 neutral)
  formWeight: number; // 0-100 (50 neutral)
  includeCups: boolean;

  // Leagues
  hideInsufficientData: boolean;
  regionalFocus: string; // 'global', 'europe', etc

  // Alerts
  alertsPreMatch: boolean;
  alertsHighConfidence: boolean;
  alertsLiveScore: boolean;
  alertsInjury: boolean;
  alertMethod: 'push' | 'email' | 'sms';

  // Betting
  defaultStake: number;
  bankrollLimit: number;
  minValueEdge: number;
  responsibleLimits: number;

  // Data
  statsDepth: StatsDepth;
  includeXG: boolean;
  historicalRange: number;
  includePitchCondition: boolean;

  // Account
  isPrivateProfile: boolean;

  // Setters
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setTheme: (theme: Theme) => void;
  setOddsFormat: (format: OddsFormat) => void;
  setDefaultLeague: (leagueId: string) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  setShowConfidenceBadge: (enabled: boolean) => void;
  setDefaultView: (view: DefaultView) => void;
  setAutoRefreshInterval: (mins: number) => void;
}

const defaultSettingsState = {
  theme: 'system' as Theme,
  oddsFormat: 'decimal' as OddsFormat,
  defaultLeague: '',
  animationsEnabled: true,
  compactMode: false,
  showConfidenceBadge: true,
  defaultView: 'cards' as DefaultView,
  autoRefreshInterval: 0,

  predictionModel: 'blended' as PredictionModel,
  confidenceThreshold: 0,
  homeAwayBias: 50,
  formWeight: 50,
  includeCups: true,

  hideInsufficientData: false,
  regionalFocus: 'global',

  alertsPreMatch: false,
  alertsHighConfidence: true,
  alertsLiveScore: false,
  alertsInjury: false,
  alertMethod: 'push' as const,

  defaultStake: 10,
  bankrollLimit: 1000,
  minValueEdge: 0,
  responsibleLimits: 0,

  statsDepth: 'advanced' as StatsDepth,
  includeXG: true,
  historicalRange: 10,
  includePitchCondition: false,

  isPrivateProfile: false,
};

const SettingsContext = createContext<AppSettings>({
  ...defaultSettingsState,
  updateSetting: () => {},
  setTheme: () => {},
  setOddsFormat: () => {},
  setDefaultLeague: () => {},
  setAnimationsEnabled: () => {},
  setCompactMode: () => {},
  setShowConfidenceBadge: () => {},
  setDefaultView: () => {},
  setAutoRefreshInterval: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettingsState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('plusone-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
      } else {
        // Fallback to legacy individual keys
        const legacyTheme = localStorage.getItem('plusone-theme') as Theme;
        const legacyFormat = localStorage.getItem('plusone-odds') as OddsFormat;
        const legacyAnimations = localStorage.getItem('plusone-animations');
        const legacyCompact = localStorage.getItem('plusone-compact');
        const legacyConfidence = localStorage.getItem('plusone-confidence');
        const legacyView = localStorage.getItem('plusone-view') as DefaultView;
        
        setSettings(prev => ({
          ...prev,
          theme: legacyTheme || prev.theme,
          oddsFormat: legacyFormat || prev.oddsFormat,
          animationsEnabled: legacyAnimations !== null ? legacyAnimations === 'true' : prev.animationsEnabled,
          compactMode: legacyCompact !== null ? legacyCompact === 'true' : prev.compactMode,
          showConfidenceBadge: legacyConfidence !== null ? legacyConfidence !== 'false' : prev.showConfidenceBadge,
          defaultView: legacyView || prev.defaultView
        }));
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(settings.theme);
      try {
        localStorage.setItem('plusone-settings', JSON.stringify(settings));
        
        // Keep legacy keys updated for anywhere they're used directly
        localStorage.setItem('plusone-theme', settings.theme);
        localStorage.setItem('plusone-odds', settings.oddsFormat);
      } catch {}
    }
  }, [settings, mounted]);

  const updateSetting = <K extends keyof typeof defaultSettingsState>(key: K, value: typeof defaultSettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (t === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      root.style.colorScheme = systemTheme;
    } else {
      root.classList.add(t);
      root.style.colorScheme = t;
    }
  };

  // Backwards compatibility functions
  const setTheme = (t: Theme) => updateSetting('theme', t);
  const setOddsFormat = (f: OddsFormat) => updateSetting('oddsFormat', f);
  const setDefaultLeague = (l: string) => updateSetting('defaultLeague', l);
  const setAnimationsEnabled = (e: boolean) => updateSetting('animationsEnabled', e);
  const setCompactMode = (e: boolean) => updateSetting('compactMode', e);
  const setShowConfidenceBadge = (e: boolean) => updateSetting('showConfidenceBadge', e);
  const setDefaultView = (v: DefaultView) => updateSetting('defaultView', v);
  const setAutoRefreshInterval = (m: number) => updateSetting('autoRefreshInterval', m);

  return (
    <SettingsContext.Provider value={{
      ...settings,
      updateSetting,
      setTheme, setOddsFormat, setDefaultLeague, setAnimationsEnabled,
      setCompactMode, setShowConfidenceBadge, setDefaultView, setAutoRefreshInterval,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useStore = () => useContext(SettingsContext);

export function formatOdds(decimalOdds: number, format: OddsFormat): string {
  if (format === 'decimal') return decimalOdds.toFixed(2);

  if (format === 'american') {
    if (decimalOdds >= 2.0) {
      return `+${Math.round((decimalOdds - 1) * 100)}`;
    } else {
      return `-${Math.round(100 / (decimalOdds - 1))}`;
    }
  }

  if (format === 'fractional') {
    const p = decimalOdds - 1;
    const fractions = [
      [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 3], [3, 2], [3, 4], [4, 3], [5, 2], [2, 5], [5, 4], [4, 5], [6, 4], [6, 5],
      [7, 2], [2, 7], [7, 4], [4, 7], [8, 5], [5, 8], [9, 2], [2, 9], [9, 4], [4, 9]
    ];
    let best = fractions[0];
    let minErr = Math.abs(p - best[0] / best[1]);
    for (const f of fractions) {
      const err = Math.abs(p - f[0] / f[1]);
      if (err < minErr) { minErr = err; best = f; }
    }
    if (minErr > 0.1) return decimalOdds.toFixed(2);
    return `${best[0]}/${best[1]}`;
  }
  return decimalOdds.toFixed(2);
}
