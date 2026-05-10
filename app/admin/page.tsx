"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Users, ShieldCheck, RefreshCw, Activity, BarChart2,
  Trash2, UserPlus, X, AlertCircle, CheckCircle2, Loader2,
  MessageSquare, Send, CreditCard,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://onedot.onrender.com";

interface User {
  id: number;
  email: string;
  role: "user" | "admin";
  plan: string;
  phone?: string | null;
  is_active: boolean;
  trial_expires_at?: string | null;
  subscription_expires_at?: string | null;
  payment_ref?: string | null;
  payment_method?: string | null;
  payment_amount?: string | null;
  created_at?: string;
}

interface Feedback {
  id: number;
  user_email?: string;
  category?: string;
  feedback_text?: string;
  message?: string;
  created_at?: string;
  reply_text?: string | null;
  replied_at?: string | null;
}

function authHeaders(token: string | null) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

type ActionStatus = { loading: boolean; success?: string; error?: string };

export default function AdminPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"users" | "messages" | "actions">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Activation state per user
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [activatePlan, setActivatePlan] = useState("basic");
  const [activateMonths, setActivateMonths] = useState(1);

  // Reply state
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // New user form
  const [showNewUser, setShowNewUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [createStatus, setCreateStatus] = useState<ActionStatus>({ loading: false });

  const [trainStatus, setTrainStatus] = useState<ActionStatus>({ loading: false });
  const [evalStatus, setEvalStatus] = useState<ActionStatus>({ loading: false });
  const [recalStatus, setRecalStatus] = useState<ActionStatus>({ loading: false });

  useEffect(() => { if (!authLoading && (!user || !isAdmin)) router.replace("/"); }, [authLoading, user, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setUsersLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/users`, { headers: authHeaders(token) });
      const data = await res.json();
      setUsers(data.users || []);
    } catch { /* ignore */ } finally { setUsersLoading(false); }
  }, [token]);

  const fetchFeedback = useCallback(async () => {
    if (!token) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch(`${API}/api/feedback`, { headers: authHeaders(token) });
      const data = await res.json();
      setFeedback(Array.isArray(data) ? data : (data.feedback ?? []));
    } catch { /* ignore */ } finally { setFeedbackLoading(false); }
  }, [token]);

  useEffect(() => {
    if (isAdmin) { fetchUsers(); fetchFeedback(); }
  }, [isAdmin, fetchUsers, fetchFeedback]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus({ loading: true });
    try {
      const res = await fetch(`${API}/api/auth/create-user`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole, phone: newPhone || null }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to create user"); }
      setCreateStatus({ loading: false, success: "User created!" });
      setNewEmail(""); setNewPassword(""); setNewPhone(""); setNewRole("user");
      setShowNewUser(false);
      fetchUsers();
    } catch (err: unknown) {
      setCreateStatus({ loading: false, error: err instanceof Error ? err.message : "Error" });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`${API}/api/auth/users/${id}`, { method: "DELETE", headers: authHeaders(token) });
    fetchUsers();
  };

  const handleRoleToggle = async (u: User) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    await fetch(`${API}/api/auth/users/${u.id}/role`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const handleActivate = async (userId: number) => {
    const res = await fetch(`${API}/api/auth/users/${userId}/activate`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ plan: activatePlan, months: activateMonths }),
    });
    if (res.ok) { setActivatingId(null); fetchUsers(); }
  };

  const handleReply = async (fbId: number) => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      await fetch(`${API}/api/feedback/${fbId}/reply`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ reply_text: replyText }),
      });
      setReplyText(""); setReplyingId(null);
      fetchFeedback();
    } finally { setReplyLoading(false); }
  };

  const runAction = async (
    label: string,
    endpoint: string,
    setter: (s: ActionStatus) => void
  ) => {
    setter({ loading: true });
    try {
      const res = await fetch(`${API}${endpoint}`, { method: "POST", headers: authHeaders(token) });
      const data = await res.json();
      setter({ loading: false, success: data.message || `${label} started!` });
    } catch {
      setter({ loading: false, error: `Failed to run ${label}` });
    }
  };

  if (authLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users and run maintenance actions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 rounded-lg border border-border bg-card p-1 w-fit">
          {(["users", "messages", "actions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize ${tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "users" ? "👥 Users" : t === "messages" ? "💬 Messages" : "⚡ Actions"}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{users.length} registered users</span>
              <button
                onClick={() => setShowNewUser(!showNewUser)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {showNewUser ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {showNewUser ? "Cancel" : "New User"}
              </button>
            </div>

            {/* New User Form */}
            {showNewUser && (
              <form onSubmit={handleCreateUser} className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">Create New User</h3>
                {createStatus.error && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {createStatus.error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Email *</label>
                    <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="user@email.com" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Phone</label>
                    <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="+254 712 345 678" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Password *</label>
                    <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Min 8 characters" minLength={8} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Role</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value as "user" | "admin")}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={createStatus.loading}
                  className="self-end flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {createStatus.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Create User
                </button>
              </form>
            )}

            {/* Users Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {usersLoading ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading users…
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Email</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Plan</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Payment Ref</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Expires</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <>
                          <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground truncate max-w-[160px]">{u.email}</p>
                              <p className="text-[10px] text-muted-foreground">{u.phone || ""}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                u.plan === "elite" ? "bg-amber-500/15 text-amber-600" :
                                u.plan === "pro" ? "bg-blue-500/15 text-blue-600" :
                                u.plan === "basic" ? "bg-emerald-500/15 text-emerald-600" :
                                u.plan === "admin" ? "bg-primary/15 text-primary" :
                                "bg-secondary text-muted-foreground"
                              }`}>
                                {u.is_active ? "✓" : u.plan === "trial" ? "⏱" : "✗"} {u.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {u.payment_ref ? (
                                <div className="text-xs">
                                  <p className="font-mono text-foreground">{u.payment_ref}</p>
                                  <p className="text-muted-foreground">{u.payment_method} · {u.payment_amount}</p>
                                </div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {u.subscription_expires_at
                                ? new Date(u.subscription_expires_at).toLocaleDateString()
                                : u.trial_expires_at
                                ? `Trial to ${new Date(u.trial_expires_at).toLocaleDateString()}`
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setActivatingId(activatingId === u.id ? null : u.id)}
                                  title="Activate subscription"
                                  className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <CreditCard className="h-3 w-3" /> Activate
                                </button>
                                <button
                                  onClick={() => u.id !== user?.id && handleRoleToggle(u)}
                                  disabled={u.id === user?.id}
                                  title={u.role}
                                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    u.role === "admin" ? "bg-primary/15 text-primary hover:bg-primary/25" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  {u.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                                  {u.role}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={u.id === user?.id}
                                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Inline activation panel */}
                          {activatingId === u.id && (
                            <tr className="bg-primary/5 border-b border-border/50">
                              <td colSpan={5} className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-xs font-medium text-foreground">Activate plan for {u.email.split("@")[0]}:</span>
                                  <select value={activatePlan} onChange={e => setActivatePlan(e.target.value)}
                                    className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                    <option value="elite">Elite</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <select value={activateMonths} onChange={e => setActivateMonths(Number(e.target.value))}
                                    className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    {[1,2,3,6,12].map(m => <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>)}
                                  </select>
                                  <button onClick={() => handleActivate(u.id)}
                                    className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                                    <CheckCircle2 className="h-3 w-3" /> Confirm
                                  </button>
                                  <button onClick={() => setActivatingId(null)}
                                    className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-foreground hover:bg-secondary/80 transition-colors">
                                    <X className="h-3 w-3" /> Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages / Feedback Tab */}
        {tab === "messages" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{feedback.length} feedback messages</span>
              <button onClick={fetchFeedback} className="text-xs text-primary hover:underline">Refresh</button>
            </div>
            {feedbackLoading ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
            ) : feedback.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No feedback yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {feedback.map((fb) => (
                  <div key={fb.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{fb.user_email || "Anonymous"}</p>
                        <p className="text-[10px] text-muted-foreground">{fb.category} · {fb.created_at ? new Date(fb.created_at).toLocaleDateString() : ""}</p>
                      </div>
                      {!fb.reply_text && (
                        <button onClick={() => setReplyingId(replyingId === fb.id ? null : fb.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Send className="h-3 w-3" /> Reply
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground mb-2">{fb.feedback_text || fb.message}</p>
                    {fb.reply_text && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                        <p className="text-[10px] font-semibold text-primary mb-1">Admin reply · {fb.replied_at ? new Date(fb.replied_at).toLocaleDateString() : ""}</p>
                        <p className="text-xs text-foreground">{fb.reply_text}</p>
                      </div>
                    )}
                    {replyingId === fb.id && (
                      <div className="mt-2 flex gap-2">
                        <textarea
                          value={replyText} onChange={e => setReplyText(e.target.value)}
                          placeholder="Type your reply…"
                          rows={2}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleReply(fb.id)} disabled={replyLoading}
                            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                            {replyLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Send
                          </button>
                          <button onClick={() => setReplyingId(null)}
                            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-secondary/80">
                            <X className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "actions" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Activity className="h-5 w-5" />,
                label: "Retrain ML Model",
                desc: "Refit the prediction model on all available match data",
                status: trainStatus,
                onRun: () => runAction("Train", "/api/predictions/train", setTrainStatus),
              },
              {
                icon: <BarChart2 className="h-5 w-5" />,
                label: "Evaluate Predictions",
                desc: "Grade pending predictions against actual match results",
                status: evalStatus,
                onRun: () => runAction("Evaluate", "/api/prediction-log/evaluate", setEvalStatus),
              },
              {
                icon: <RefreshCw className="h-5 w-5" />,
                label: "Recalibrate Model",
                desc: "Refit the probability calibrator on graded prediction data",
                status: recalStatus,
                onRun: () => runAction("Recalibrate", "/api/predictions/recalibrate", setRecalStatus),
              },
            ].map((action) => (
              <div key={action.label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                  </div>
                </div>
                {action.status.success && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/10 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {action.status.success}
                  </div>
                )}
                {action.status.error && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {action.status.error}
                  </div>
                )}
                <button
                  onClick={action.onRun}
                  disabled={action.status.loading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 mt-auto"
                >
                  {action.status.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : action.icon}
                  {action.status.loading ? "Running…" : "Run"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
