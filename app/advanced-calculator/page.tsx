"use client"

import React, { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { QuickStartWizard } from "@/components/quick-start-wizard"
import styles from "./advanced.module.css"
import html2canvas from "html2canvas"
import { getTeams, API } from "@/lib/api"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts"

export default function AdvancedCalculatorPage() {
  const [activeTab, setActiveTab] = useState("input")
  const [teams, setTeams] = useState<any[]>([])
  
  // Custom What-If State
  const [homeTeamId, setHomeTeamId] = useState("")
  const [awayTeamId, setAwayTeamId] = useState("")
  const [h2hWeight, setH2hWeight] = useState(25)
  const [outlierThreshold, setOutlierThreshold] = useState(3.0)
  const [homeAdvantage, setHomeAdvantage] = useState(1.1)
  
  // Manual Season Stats overrides
  const [homeMatches, setHomeMatches] = useState(0)
  const [homeScored, setHomeScored] = useState(0)
  const [homeConceded, setHomeConceded] = useState(0)
  
  const [awayMatches, setAwayMatches] = useState(0)
  const [awayScored, setAwayScored] = useState(0)
  const [awayConceded, setAwayConceded] = useState(0)
  
  const [predictionResult, setPredictionResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const shareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getTeams({ limit: 1000 }).then(res => {
      if (Array.isArray(res)) setTeams(res.sort((a,b) => a.name.localeCompare(b.name)))
    })
  }, [])

  const calculateWhatIf = async () => {
    if (!homeTeamId || !awayTeamId) {
      setError("Please select both teams.")
      return
    }
    
    setLoading(true)
    setError("")
    setPredictionResult(null)
    
    try {
      // We will send the What-If parameters to the backend
      const res = await fetch(`${API}/api/predictions/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home_team_id: parseInt(homeTeamId),
          away_team_id: parseInt(awayTeamId),
          h2h_weight: h2hWeight / 100, // backend expects 0-1
          outlier_threshold: outlierThreshold,
          home_advantage: homeAdvantage,
          manual_stats: {
            home: { matches: homeMatches, scored: homeScored, conceded: homeConceded },
            away: { matches: awayMatches, scored: awayScored, conceded: awayConceded }
          }
        })
      })
      
      if (!res.ok) {
        throw new Error("Failed to calculate What-If scenario. Make sure backend supports this endpoint.")
      }
      
      const data = await res.json()
      setPredictionResult(data)
      setActiveTab("results")
    } catch (err: any) {
      setError(err.message || "An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const sharePrediction = async () => {
    if (!shareRef.current) return
    try {
      const canvas = await html2canvas(shareRef.current, { backgroundColor: "#ffffff" })
      const link = document.createElement("a")
      link.download = "1plus-prediction.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (err) {
      console.error("Failed to generate image", err)
    }
  }

  // Visualization Data
  const chartData = predictionResult ? [
    { name: predictionResult.home_team, xG: predictionResult.expected_goals?.home_xg || 0, fill: "#2ecc71" },
    { name: predictionResult.away_team, xG: predictionResult.expected_goals?.away_xg || 0, fill: "#e74c3c" }
  ] : []

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <QuickStartWizard />
      
      <div className={styles.pageWrapper}>
        <div className="max-w-[1000px] mx-auto pt-4 pb-12">
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'input' ? 'bg-white text-[#667eea] shadow-md' : 'bg-white/20 text-white'}`}
              onClick={() => setActiveTab("input")}
            >
              Manual Input & Parameters
            </button>
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'results' ? 'bg-white text-[#667eea] shadow-md' : 'bg-white/20 text-white'}`}
              onClick={() => setActiveTab("results")}
            >
              Analysis & Results
            </button>
          </div>

          <div className={styles.card}>
            {activeTab === "input" && (
              <div>
                <h2>Advanced Scenario Configuration</h2>
                <div className={styles.infoBox}>
                  <strong>What-If Analysis:</strong> Tweak the underlying parameters of the ML and Dixon-Coles engines. Adjust H2H weights, control outlier score detection, and manually override season context to see how it affects the final prediction.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={styles.inputGroup}>
                    <label>Home Team</label>
                    <select value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)}>
                      <option value="">Select Home Team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Away Team</label>
                    <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)}>
                      <option value="">Select Away Team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <h3 className="font-bold text-gray-700 mb-3">Model Parameters</h3>
                  <div className="space-y-4">
                    <div className={styles.inputGroup}>
                      <div className="flex justify-between">
                        <label>H2H Weighting ({h2hWeight}%)</label>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={h2hWeight} onChange={(e) => setH2hWeight(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className={styles.inputHint}>How much influence historical head-to-head matches should have.</p>
                    </div>

                    <div className={styles.inputGroup}>
                      <div className="flex justify-between">
                        <label>Outlier Detection Threshold ({outlierThreshold}x)</label>
                      </div>
                      <input 
                        type="range" min="1.0" max="5.0" step="0.1"
                        value={outlierThreshold} onChange={(e) => setOutlierThreshold(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className={styles.inputHint}>Multiplies the standard deviation. Lower values discard more "unusual" scores (e.g. 7-0 blowouts) from the dataset before calculating xG.</p>
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <div className="flex justify-between">
                        <label>Home Advantage Multiplier ({homeAdvantage}x)</label>
                      </div>
                      <input 
                        type="range" min="0.5" max="2.0" step="0.05"
                        value={homeAdvantage} onChange={(e) => setHomeAdvantage(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <h3 className="font-bold text-gray-700 mb-3">Manual Season Context (Optional Overrides)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-bold text-center mb-2">Home Stats</h4>
                      <div className={styles.inputGroup}>
                        <label>Matches Played</label>
                        <input type="number" value={homeMatches} onChange={(e) => setHomeMatches(Number(e.target.value))} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Goals Scored</label>
                        <input type="number" value={homeScored} onChange={(e) => setHomeScored(Number(e.target.value))} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Goals Conceded</label>
                        <input type="number" value={homeConceded} onChange={(e) => setHomeConceded(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-bold text-center mb-2">Away Stats</h4>
                      <div className={styles.inputGroup}>
                        <label>Matches Played</label>
                        <input type="number" value={awayMatches} onChange={(e) => setAwayMatches(Number(e.target.value))} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Goals Scored</label>
                        <input type="number" value={awayScored} onChange={(e) => setAwayScored(Number(e.target.value))} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Goals Conceded</label>
                        <input type="number" value={awayConceded} onChange={(e) => setAwayConceded(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

                <button 
                  className={`${styles.btn} ${styles.btnSecondary} mt-6`}
                  onClick={calculateWhatIf}
                  disabled={loading}
                >
                  {loading ? "Recalculating..." : "Calculate What-If Scenario"}
                </button>
              </div>
            )}

            {activeTab === "results" && predictionResult && (
              <div ref={shareRef} className="bg-white p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2>Scenario Results</h2>
                  <button onClick={sharePrediction} className="px-3 py-1 bg-[#667eea] text-white rounded text-sm font-bold hover:bg-[#764ba2] transition-colors">
                    Share Card
                  </button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-6 text-center">
                  <div className="flex items-center justify-center gap-8 mb-4">
                    <div className="text-right flex-1">
                      <h3 className="text-2xl font-black text-gray-800">{predictionResult.home_team}</h3>
                      <p className="text-sm text-gray-500">Home</p>
                    </div>
                    <div className="px-4 py-2 bg-gray-200 rounded-full font-bold text-gray-600">VS</div>
                    <div className="text-left flex-1">
                      <h3 className="text-2xl font-black text-gray-800">{predictionResult.away_team}</h3>
                      <p className="text-sm text-gray-500">Away</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-[#eef2f3] to-[#8e9eab] rounded-xl shadow-inner">
                     <p className="text-sm text-gray-600 font-bold uppercase tracking-widest mb-1">Predicted Outcome</p>
                     <p className="text-3xl font-black text-[#2c3e50]">{predictionResult.predicted_outcome}</p>
                     {predictionResult.expected_goals && (
                       <p className="text-xl font-bold mt-2 bg-white/50 inline-block px-4 py-1 rounded-full text-gray-700">
                         {predictionResult.expected_goals.predicted_score}
                       </p>
                     )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Probabilities */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Adjusted Probabilities</h3>
                    <div className={styles.probBar}>
                      <div className={styles.probLabel}>
                        <span>Home Win</span>
                        <span>{Math.round(predictionResult.probabilities.home_win * 100)}%</span>
                      </div>
                      <div className={styles.barContainer}>
                        <div className={`${styles.barFill} ${styles.barFillHome}`} style={{ width: `${Math.round(predictionResult.probabilities.home_win * 100)}%` }}></div>
                      </div>
                    </div>
                    <div className={styles.probBar}>
                      <div className={styles.probLabel}>
                        <span>Draw</span>
                        <span>{Math.round(predictionResult.probabilities.draw * 100)}%</span>
                      </div>
                      <div className={styles.barContainer}>
                        <div className={`${styles.barFill} ${styles.barFillDraw}`} style={{ width: `${Math.round(predictionResult.probabilities.draw * 100)}%` }}></div>
                      </div>
                    </div>
                    <div className={styles.probBar}>
                      <div className={styles.probLabel}>
                        <span>Away Win</span>
                        <span>{Math.round(predictionResult.probabilities.away_win * 100)}%</span>
                      </div>
                      <div className={styles.barContainer}>
                        <div className={`${styles.barFill} ${styles.barFillAway}`} style={{ width: `${Math.round(predictionResult.probabilities.away_win * 100)}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* xG Chart */}
                  {predictionResult.expected_goals && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-[250px]">
                      <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Expected Goals (xG)</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                          <Bar dataKey="xG" radius={[4, 4, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                
                {predictionResult.outliers_removed > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm flex items-start gap-2 border border-amber-200">
                    <span className="font-bold">Outlier System:</span>
                    <span>Discarded {predictionResult.outliers_removed} anomalous scorelines based on your {outlierThreshold}x threshold setting.</span>
                  </div>
                )}
                
                <div className="mt-6 text-center text-xs text-gray-400">
                  Powered by 1+ Pro What-If Analysis Engine
                </div>
              </div>
            )}
            
            {activeTab === "results" && !predictionResult && (
              <div className="text-center py-12 text-gray-500">
                Configure parameters and click "Calculate What-If Scenario" to see results.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
