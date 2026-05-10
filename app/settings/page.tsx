'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSettings,
  putSetting,
  getAutoConsensusStatus,
  triggerAutoConsensus,
} from '@/lib/api';
import { Settings, Bot, Clock, Play, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface AppSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string | null;
}

interface ConsensusStatus {
  interval_hours: number;
  last_run: string | null;
  last_count: number;
  last_error: string | null;
}

const PRESETS = [
  { label: '1h',  value: 1 },
  { label: '3h',  value: 3 },
  { label: '6h',  value: 6 },
  { label: '12h', value: 12 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
];

function fmtDate(iso: string | null) {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch { return iso; }
}

export default function SettingsPage() {
  const [settings, setSettings]         = useState<AppSetting[]>([]);
  const [status, setStatus]             = useState<ConsensusStatus | null>(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [triggering, setTriggering]     = useState(false);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [intervalInput, setIntervalInput] = useState('6');

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([
        getSettings().catch(() => ({ settings: [] })),
        getAutoConsensusStatus().catch(() => null),
      ]);
      const all: AppSetting[] = s.settings ?? [];
      setSettings(all);
      setStatus(st);
      const row = all.find((r) => r.key === 'consensus_interval_hours');
      if (row) setIntervalInput(row.value);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const saveInterval = async () => {
    const hours = parseInt(intervalInput, 10);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      showToast('Enter a value between 1 and 168 hours.', false);
      return;
    }
    setSaving(true);
    try {
      await putSetting(
        'consensus_interval_hours',
        String(hours),
        'How often the auto-consensus prediction job runs (hours). Min: 1, Max: 168.'
      );
      showToast(`Interval saved: every ${hours}h. Active from next scheduled run.`);
      await refresh();
    } catch (e: any) {
      showToast(`Save failed: ${e.message}`, false);
    } finally {
      setSaving(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerAutoConsensus();
      showToast('Job started — predictions will be logged in the background.');
      setTimeout(refresh, 5000);
    } catch (e: any) {
      showToast(`Trigger failed: ${e.message}`, false);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Toast — full-width on phones, corner on larger screens */}
      {toast && (
        <div
          className={`fixed top-3 left-3 right-3 z-50 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl
            sm:left-auto sm:right-4 sm:max-w-sm
            ${toast.ok
              ? 'border-primary/30 bg-card text-primary'
              : 'border-destructive/30 bg-card text-destructive'}`}
        >
          {toast.ok
            ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 lg:px-6">

        {/* Page Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Admin Settings</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">Configure system behaviour without server restarts.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading settings…
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">

            {/* ── Interval Card ───────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm sm:text-base">Prediction Job Interval</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    How often DC + ML + Legacy predictions run automatically for upcoming fixtures.
                  </p>
                </div>
              </div>

              {status && (
                <p className="text-sm text-muted-foreground">
                  Current: <span className="text-primary font-semibold">{status.interval_hours}h</span>
                </p>
              )}

              {/* Preset buttons — 3 per row on small screens, all 6 on wider */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setIntervalInput(String(p.value))}
                    className={`rounded-lg border py-2 text-xs font-medium transition-colors
                      ${intervalInput === String(p.value)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom input + Save — stacks vertically on very small phones */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-medium">Custom (hours, 1–168)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={168}
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(e.target.value)}
                    className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                  <button
                    onClick={saveInterval}
                    disabled={saving}
                    className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 active:scale-95"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Job Status Card ─────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm sm:text-base">Auto-Consensus Job</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monitor and trigger the background prediction job.
                  </p>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden text-sm">
                {[
                  { label: 'Last Run',           value: fmtDate(status?.last_run ?? null) },
                  { label: 'Predictions Logged', value: String(status?.last_count ?? 0) },
                  { label: 'Last Error',         value: status?.last_error ?? 'None', error: !!status?.last_error },
                ].map((row) => (
                  <div key={row.label} className="flex flex-wrap gap-1 justify-between items-center px-3 py-2.5">
                    <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">{row.label}</span>
                    <span className={`font-medium text-xs sm:text-sm break-all text-right max-w-full ${row.error ? 'text-destructive' : 'text-foreground'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleTrigger}
                disabled={triggering}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50 active:scale-95"
              >
                {triggering
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Running…</>
                  : <><Play className="h-4 w-4" /> Run Now</>}
              </button>
              <p className="text-center text-xs text-muted-foreground -mt-2">
                Triggers an immediate run. Results appear in Prediction Log.
              </p>
            </div>

            {/* ── Raw Settings Table ───────────────────────────── */}
            {settings.length > 0 && (
              <div className="col-span-full rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-4">
                <h2 className="font-semibold text-sm sm:text-base">All Settings</h2>
                {/* On mobile: show as stacked key/value cards instead of a table */}
                <div className="block sm:hidden flex flex-col gap-3">
                  {settings.map((s) => (
                    <div key={s.key} className="rounded-lg border border-border p-3 flex flex-col gap-1">
                      <code className="text-xs text-primary bg-secondary rounded px-1.5 py-0.5 w-fit">{s.key}</code>
                      <div className="flex justify-between items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Value</span>
                        <span className="text-sm font-semibold">{s.value}</span>
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Updated: {fmtDate(s.updated_at)}</p>
                    </div>
                  ))}
                </div>
                {/* On larger screens: regular table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Key', 'Value', 'Description', 'Last Updated'].map((h) => (
                          <th key={h} className="pb-2 pr-4 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {settings.map((s) => (
                        <tr key={s.key} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-2.5 pr-4"><code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-primary">{s.key}</code></td>
                          <td className="py-2.5 pr-4 font-medium">{s.value}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground max-w-xs">{s.description ?? '—'}</td>
                          <td className="py-2.5 text-muted-foreground whitespace-nowrap">{fmtDate(s.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
