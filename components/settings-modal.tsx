"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useStore } from "@/lib/store";

import {
  Settings, X, Moon, Sun, Monitor, LayoutGrid, LayoutList,
  RefreshCw, TrendingUp, Cpu, Activity, Calculator,
  Trophy, Globe, Bell, Mail, Smartphone, Eye,
  Shield, Download, Trash2, PieChart, Coins
} from "lucide-react";

// Components
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        enabled ? "bg-primary" : "bg-muted"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-4 pb-2 first:pt-0">
      {children}
    </p>
  );
}

const TABS = [
  { id: "predictions", label: "Prediction Preferences", icon: TrendingUp },
  { id: "display", label: "Display & Format", icon: Monitor },
  { id: "leagues", label: "Leagues & Competitions", icon: Trophy },
  { id: "betting", label: "Betting Integration", icon: Coins },
  { id: "data", label: "Data & Statistics", icon: PieChart },
  { id: "notifications", label: "Notifications & Alerts", icon: Bell },
  { id: "privacy", label: "Privacy & Account", icon: Shield },
];

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const store = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <button
        id="settings-btn"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-4xl h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary/10">
              <div>
                <h2 className="text-xl font-bold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your preferences and platform experience</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Layout */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              
              {/* Sidebar */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-secondary/10 overflow-x-auto md:overflow-y-auto flex md:flex-col py-2 px-4 md:px-0 shrink-0">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap rounded-md md:rounded-none flex items-center gap-3 px-4 md:px-6 py-2.5 md:py-3 text-sm font-medium transition-colors ${
                        isActive 
                          ? "bg-secondary text-foreground md:border-r-2 md:border-primary" 
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground md:border-r-2 md:border-transparent"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-xl mx-auto md:mx-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* --- PREDICTIONS TAB --- */}
                  {activeTab === "predictions" && (
                    <div className="space-y-6">
                      <div>
                        <SectionTitle>Engine Strategy</SectionTitle>
                        <div className="py-2 border-b border-border/40">
                          <p className="text-sm font-medium text-foreground mb-3">Preferred Model</p>
                          <div className="grid grid-cols-3 gap-3">
                            {([
                              { id: "blended", label: "Blended", icon: Activity },
                              { id: "statistical", label: "Statistical", icon: Calculator },
                              { id: "ai", label: "AI & ML", icon: Cpu },
                            ] as const).map(({ id, label, icon: Icon }) => (
                              <button
                                key={id}
                                onClick={() => store.updateSetting("predictionModel", id)}
                                className={`flex flex-col items-center justify-center gap-2 rounded-lg border py-3 transition-colors ${
                                  store.predictionModel === id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground"
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <SettingRow label="Confidence Threshold" description="Only show predictions above this certainty %">
                          <select 
                            value={store.confidenceThreshold}
                            onChange={(e) => store.updateSetting("confidenceThreshold", Number(e.target.value))}
                            className="bg-secondary border border-border rounded-md text-sm px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value={0}>Show All</option>
                            <option value={50}>High (&gt;50%)</option>
                            <option value={60}>Very High (&gt;60%)</option>
                            <option value={70}>Expert (&gt;70%)</option>
                          </select>
                        </SettingRow>

                        <SettingRow label="Home/Away Bias Weight" description="Adjust standard home advantage factor (50 is neutral)">
                          <div className="w-32 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">0</span>
                            <input 
                              type="range" min="0" max="100" 
                              value={store.homeAwayBias} 
                              onChange={(e) => store.updateSetting("homeAwayBias", Number(e.target.value))}
                              className="w-full accent-primary" 
                            />
                            <span className="text-xs text-muted-foreground">100</span>
                          </div>
                        </SettingRow>

                        <SettingRow label="Recent Form Weighting" description="Balance between historical season data and last 5 matches">
                          <div className="w-32 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Hist</span>
                            <input 
                              type="range" min="0" max="100" 
                              value={store.formWeight} 
                              onChange={(e) => store.updateSetting("formWeight", Number(e.target.value))}
                              className="w-full accent-primary" 
                            />
                            <span className="text-xs text-muted-foreground">Form</span>
                          </div>
                        </SettingRow>

                        <SettingRow label="Include Cup Matches" description="Factor domestic cup form into league predictions">
                          <Toggle enabled={store.includeCups} onToggle={() => store.updateSetting("includeCups", !store.includeCups)} />
                        </SettingRow>
                      </div>
                    </div>
                  )}

                  {/* --- DISPLAY TAB --- */}
                  {activeTab === "display" && (
                    <div className="space-y-6">
                      <SectionTitle>Appearance</SectionTitle>
                      
                      <div className="py-2 border-b border-border/40">
                        <p className="text-sm font-medium text-foreground mb-3">Theme</p>
                        <div className="grid grid-cols-3 gap-3">
                          {([
                            { id: "light" as const, label: "Light", Icon: Sun },
                            { id: "dark" as const, label: "Dark", Icon: Moon },
                            { id: "system" as const, label: "System", Icon: Monitor },
                          ]).map(({ id, label, Icon }) => (
                            <button
                              key={id}
                              onClick={() => store.setTheme(id)}
                              className={`flex flex-col items-center justify-center gap-2 rounded-lg border py-3 transition-colors ${
                                store.theme === id
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-xs font-medium">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <SettingRow label="Odds Format" description="Select how you prefer to view betting odds">
                        <select 
                          value={store.oddsFormat}
                          onChange={(e) => store.setOddsFormat(e.target.value as any)}
                          className="bg-secondary border border-border rounded-md text-sm px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="decimal">Decimal (2.50)</option>
                          <option value="american">American (+150)</option>
                          <option value="fractional">Fractional (3/2)</option>
                        </select>
                      </SettingRow>

                      <div className="py-3 border-b border-border/40">
                        <p className="text-sm font-medium text-foreground mb-3">Default View Layout</p>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { id: "cards" as const, label: "Card Grid", Icon: LayoutGrid },
                            { id: "table" as const, label: "List Table", Icon: LayoutList },
                          ]).map(({ id, label, Icon }) => (
                            <button
                              key={id}
                              onClick={() => store.setDefaultView(id)}
                              className={`flex items-center justify-center gap-2 rounded-lg border py-2 transition-colors ${
                                store.defaultView === id
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-medium">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <SettingRow label="Compact Mode" description="Reduce spacing and card sizes to see more matches">
                        <Toggle enabled={store.compactMode} onToggle={() => store.setCompactMode(!store.compactMode)} />
                      </SettingRow>

                      <SettingRow label="UI Animations" description="Enable smooth transitions and physical effects">
                        <Toggle enabled={store.animationsEnabled} onToggle={() => store.setAnimationsEnabled(!store.animationsEnabled)} />
                      </SettingRow>
                    </div>
                  )}

                  {/* --- LEAGUES TAB --- */}
                  {activeTab === "leagues" && (
                    <div className="space-y-6">
                      <SectionTitle>Competitions</SectionTitle>
                      
                      <SettingRow label="Hide Insufficient Data" description="Filter out minor leagues where models are less accurate">
                        <Toggle enabled={store.hideInsufficientData} onToggle={() => store.updateSetting("hideInsufficientData", !store.hideInsufficientData)} />
                      </SettingRow>

                      <SettingRow label="Regional Focus" description="Prioritize fixtures from specific geographic regions in dashboard">
                        <select 
                          value={store.regionalFocus}
                          onChange={(e) => store.updateSetting("regionalFocus", e.target.value)}
                          className="bg-secondary border border-border rounded-md text-sm px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="global">Global (All)</option>
                          <option value="europe">Europe (UEFA)</option>
                          <option value="south_america">South America (CONMEBOL)</option>
                          <option value="americas">Americas (CONCACAF + CONMEBOL)</option>
                          <option value="asia">Asia / Africa</option>
                        </select>
                      </SettingRow>
                      
                      {/* Placeholder for complex multi-selects */}
                      <div className="py-4 opacity-50 cursor-not-allowed">
                        <p className="text-sm font-medium text-foreground">Followed Leagues <span className="text-[10px] ml-2 px-2 py-0.5 rounded bg-primary/20 text-primary">Pro</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Select specific leagues to pin to your dashboard (Coming soon)</p>
                      </div>
                    </div>
                  )}

                  {/* --- BETTING TAB --- */}
                  {activeTab === "betting" && (
                    <div className="space-y-6">
                      <SectionTitle>Stakes & Bankroll</SectionTitle>
                      
                      <SettingRow label="Default Stake Value" description="Base unit for calculating returns ($ or £)">
                        <input 
                          type="number"
                          value={store.defaultStake}
                          onChange={(e) => store.updateSetting("defaultStake", Number(e.target.value))}
                          className="bg-secondary border border-border rounded-md text-sm px-3 py-1.5 w-24 focus:ring-1 focus:ring-primary outline-none"
                        />
                      </SettingRow>

                      <SettingRow label="Minimum Value Edge (%)" description="Only highlight value bets that exceed this edge threshold">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" min="0" max="20" step="0.5"
                            value={store.minValueEdge}
                            onChange={(e) => store.updateSetting("minValueEdge", Number(e.target.value))}
                            className="bg-secondary border border-border rounded-md text-sm px-3 py-1.5 w-20 focus:ring-1 focus:ring-primary outline-none"
                          />
                          <span className="text-sm text-foreground">%</span>
                        </div>
                      </SettingRow>

                      <SettingRow label="Bankroll Tracker Limit" description="Set your total betting budget for tracking">
                        <input 
                          type="number"
                          value={store.bankrollLimit}
                          onChange={(e) => store.updateSetting("bankrollLimit", Number(e.target.value))}
                          className="bg-secondary border border-border rounded-md text-sm px-3 py-1.5 w-28 focus:ring-1 focus:ring-primary outline-none"
                        />
                      </SettingRow>

                      <div className="py-4 border-t border-border/40 mt-4 opacity-50 cursor-not-allowed">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          Linked Bookmakers <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">Integration API</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">Sync odds directly from your accounts</p>
                        <button disabled className="bg-secondary text-muted-foreground px-4 py-2 rounded-md text-xs font-medium w-full border border-border">Connect Account</button>
                      </div>
                    </div>
                  )}

                  {/* --- DATA TAB --- */}
                  {activeTab === "data" && (
                    <div className="space-y-6">
                      <SectionTitle>Analysis Depth</SectionTitle>
                      
                      <SettingRow label="Statistic Profile Depth" description="Select how much data is shown by default">
                        <div className="flex bg-secondary p-1 rounded-lg">
                          {(["basic", "advanced", "expert"] as const).map(d => (
                            <button 
                              key={d}
                              onClick={() => store.updateSetting("statsDepth", d)}
                              className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md capitalize ${
                                store.statsDepth === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </SettingRow>

                      <SettingRow label="Include Advanced Metrics (xG, xA)" description="Use expected goals and assists in default views">
                        <Toggle enabled={store.includeXG} onToggle={() => store.updateSetting("includeXG", !store.includeXG)} />
                      </SettingRow>

                      <SettingRow label="Historical Range" description="Number of past matches to show in H2H charts">
                        <select 
                          value={store.historicalRange}
                          onChange={(e) => store.updateSetting("historicalRange", Number(e.target.value))}
                          className="bg-secondary border border-border rounded-md text-sm px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value={5}>Last 5 Matches</option>
                          <option value={10}>Last 10 Matches</option>
                          <option value={20}>Last 20 Matches</option>
                          <option value={50}>Last 50 Matches</option>
                        </select>
                      </SettingRow>

                      <SettingRow label="Pitch/Weather Factors" description="Factor stadium conditions into predictions (if available)">
                        <Toggle enabled={store.includePitchCondition} onToggle={() => store.updateSetting("includePitchCondition", !store.includePitchCondition)} />
                      </SettingRow>
                    </div>
                  )}

                  {/* --- NOTIFICATIONS TAB --- */}
                  {activeTab === "notifications" && (
                    <div className="space-y-6">
                      <SectionTitle>Delivery</SectionTitle>
                      
                      <div className="py-2 border-b border-border/40">
                        <p className="text-sm font-medium text-foreground mb-3">Alert Method</p>
                        <div className="grid grid-cols-3 gap-3">
                          {([
                            { id: "push" as const, label: "Push", Icon: Smartphone },
                            { id: "email" as const, label: "Email", Icon: Mail },
                            { id: "sms" as const, label: "SMS", Icon: Globe },
                          ]).map(({ id, label, Icon }) => (
                            <button
                              key={id}
                              onClick={() => store.updateSetting("alertMethod", id)}
                              className={`flex flex-col items-center justify-center gap-2 rounded-lg border py-3 transition-colors ${
                                store.alertMethod === id
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-medium">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <SectionTitle>Event Triggers</SectionTitle>

                      <SettingRow label="Pre-Match Alerts" description="Notify 1hr before tracked fixtures kick off">
                        <Toggle enabled={store.alertsPreMatch} onToggle={() => store.updateSetting("alertsPreMatch", !store.alertsPreMatch)} />
                      </SettingRow>

                      <SettingRow label="High Confidence Picks" description="Alert me when engine finds a massive edge">
                        <Toggle enabled={store.alertsHighConfidence} onToggle={() => store.updateSetting("alertsHighConfidence", !store.alertsHighConfidence)} />
                      </SettingRow>

                      <SettingRow label="Live Score Updates" description="In-play status of matches with predictions">
                        <Toggle enabled={store.alertsLiveScore} onToggle={() => store.updateSetting("alertsLiveScore", !store.alertsLiveScore)} />
                      </SettingRow>

                      <SettingRow label="Team News & Injuries" description="Lineups and late withdrawal alerts">
                        <Toggle enabled={store.alertsInjury} onToggle={() => store.updateSetting("alertsInjury", !store.alertsInjury)} />
                      </SettingRow>
                    </div>
                  )}

                  {/* --- PRIVACY TAB --- */}
                  {activeTab === "privacy" && (
                    <div className="space-y-6">
                      <SectionTitle>Account Control</SectionTitle>
                      
                      <SettingRow label="Private Profile" description="Hide your betting history and tracking from public leaderboards">
                        <Toggle enabled={store.isPrivateProfile} onToggle={() => store.updateSetting("isPrivateProfile", !store.isPrivateProfile)} />
                      </SettingRow>

                      <div className="py-6 border-t border-border/40 mt-4">
                        <p className="text-sm font-medium text-foreground mb-2">Data Management</p>
                        <div className="flex gap-3 mt-4">
                          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition shadow-sm border border-border">
                            <Download className="h-3.5 w-3.5" /> Export Data (CSV)
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-xs font-medium rounded-lg hover:bg-destructive/20 transition border border-destructive/20">
                            <Trash2 className="h-3.5 w-3.5" /> Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-background px-6 py-4 flex items-center justify-between z-10">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Settings saved automatically to local storage
                </p>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="text-xs text-primary hover:underline"
                >
                  ⚙ Admin Settings →
                </Link>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg bg-primary text-primary-foreground px-8 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xl shadow-primary/20"
              >
                Done
              </button>
            </div>


          </div>
        </div>,
        document.body
      )}
    </>
  );
}
