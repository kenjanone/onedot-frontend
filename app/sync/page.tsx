"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getHealth, getLeagues } from "@/lib/api"
import { HealthStatus, League, LogEntry } from "@/lib/types"
import { CheckCircle, XCircle, RefreshCw, Download, Trash2, AlertTriangle, Database } from "lucide-react"

export default function SyncPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null)
    const [leagues, setLeagues] = useState<League[]>([])
    const [log, setLog] = useState<LogEntry[]>([])

    useEffect(() => {
        getHealth()
            .then(setHealth)
            .catch(() => setHealth({ status: "unhealthy" }))

        getLeagues()
            .then((data) => setLeagues(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("getLeagues failed:", err)
                setLeagues([])
            })
    }, [])

    const addLog = (msg: string, type = "info") => {
        setLog((l) => [{ msg, type, time: new Date().toLocaleTimeString() }, ...l])
    }

    const checkHealth = async () => {
        const h = await getHealth().catch(() => ({ status: "unhealthy" }))
        setHealth(h)
        addLog(`API Health: ${h.status}`, h.status === "healthy" ? "success" : "error")
    }

    const triggerImport = () => {
        addLog("To import your Excel file, run:", "info")
        addLog("cd football-analytics/importer", "code")
        addLog('python import_excel.py --file "C:/Users/LATIB PRO/Downloads/download (1).xlsx"', "code")
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <RefreshCw className="h-6 w-6 text-primary" />
                        Sync & Data Manager
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitor API health, trigger imports, and manage your data synchronizations
                    </p>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* API Health */}
                    <div className="rounded-lg border border-border bg-card p-6">
                        <h3 className="text-base font-bold text-foreground mb-4 flex items-center justify-between">
                            API Status
                            <button
                                onClick={checkHealth}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-secondary h-8 px-3 text-muted-foreground"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </button>
                        </h3>
                        <div className="flex items-center gap-4">
                            {health?.status === "healthy" ? (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                    <XCircle className="h-6 w-6" />
                                </div>
                            )}
                            <div>
                                <div className="text-lg font-bold text-foreground capitalize">
                                    {health?.status || "Checking..."}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Database className="h-3.5 w-3.5" />
                                    Database: {health?.database || "—"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Overview */}
                    <div className="rounded-lg border border-border bg-card p-6">
                        <h3 className="text-base font-bold text-foreground mb-4">Data Overview</h3>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">Leagues in database:</span>
                            <span className="text-xl font-bold font-mono text-foreground">{leagues.length}</span>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground border border-border/50">
                            <div className="flex items-center gap-2">
                                <span className="rounded bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground">Extension</span>
                                <span>→</span>
                                <span className="rounded bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground">Sync</span>
                                <span>→</span>
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">API</span>
                                <span>→</span>
                                <span className="rounded bg-info/10 px-1.5 py-0.5 text-xs font-semibold text-info">Database</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="flex flex-col gap-6">
                        {/* Import Guide */}
                        <div className="rounded-lg border border-border bg-card p-6">
                            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                                <Download className="h-5 w-5 text-info" />
                                Import Excel Data
                            </h3>
                            <div className="rounded-lg bg-secondary/30 border border-border p-4 mb-4">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Run this sequence in your terminal:</p>
                                <div className="font-mono text-sm text-info bg-background rounded p-2.5 overflow-x-auto whitespace-nowrap border border-border/50">
                                    <div className="mb-1 text-muted-foreground">$ <span className="text-foreground">cd football-analytics/importer</span></div>
                                    <div><span className="text-muted-foreground">$ </span><span className="text-primary-foreground">python</span> import_excel.py --file "C:/Users/LATIB PRO/Downloads/download (1).xlsx"</div>
                                </div>
                            </div>
                            <button
                                onClick={triggerImport}
                                className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Show Import Command
                            </button>
                        </div>

                        {/* Chrome Setup */}
                        <div className="rounded-lg border border-border bg-card p-6">
                            <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-warning" />
                                Chrome Extension Setup
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                The extension is typically configured to sync to the live Render API or localhost automatically.
                            </p>
                            <div className="rounded-lg bg-secondary/30 border border-border p-4">
                                <p className="text-xs text-muted-foreground mb-2">Check <code className="bg-background px-1 rounded">backend_sync.js</code> line 9:</p>
                                <code className="block font-mono text-xs text-primary bg-primary/5 p-2 rounded border border-primary/20 break-all mb-3">
                                    this.backendUrl = 'https://onedot.onrender.com';
                                </code>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Already configured correctly
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="rounded-lg border border-border bg-card p-0 flex flex-col hide-scrollbar h-[526px]">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-base font-bold text-foreground">Activity Log</h3>
                            <button
                                onClick={() => setLog([])}
                                disabled={log.length === 0}
                                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 h-7 px-2.5 text-muted-foreground"
                            >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Clear
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto w-full">
                            {log.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <Database className="h-8 w-8 mb-2" />
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {log.map((l, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-start justify-between gap-4 rounded-lg p-3 text-sm ${l.type === "success"
                                                ? "bg-primary/10 text-primary"
                                                : l.type === "error"
                                                    ? "bg-destructive/10 text-destructive"
                                                    : l.type === "code"
                                                        ? "bg-secondary text-info font-mono text-xs"
                                                        : "bg-secondary/50 text-foreground"
                                                }`}
                                        >
                                            <span className="break-all">{l.msg}</span>
                                            <span className="shrink-0 text-[10px] font-medium opacity-60 mt-0.5">{l.time}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
