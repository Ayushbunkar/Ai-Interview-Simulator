"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  ShieldAlert,
  Users,
  CalendarCheck,
  Code2,
  Cpu,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  Activity,
  Layers,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
  image: string | null;
  googleId: string | null;
  createdAt: string;
}

interface PlatformStats {
  totalUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  totalSessions: number;
  completedSessions: number;
  totalSubmissions: number;
  totalQuestions: number;
  totalProblems: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "telemetry">("overview");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/users?search=${encodeURIComponent(search)}&role=${roleFilter === "all" ? "" : roleFilter}`),
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        setNotification({ type: "error", text: "Forbidden: Administrator permissions required." });
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentLogs(statsData.recentLogs || []);
        setRecentSessions(statsData.recentSessions || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData.users || []);
      }
    } catch {
      setNotification({ type: "error", text: "Failed to load administration telemetry." });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchData();
    }
  }, [authLoading, user, roleFilter]);

  const handleRoleToggle = async (targetUser: AdminUser) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    if (targetUser.id === user?.id && newRole === "user") {
      alert("You cannot revoke your own administrator privileges.");
      return;
    }

    if (!confirm(`Are you sure you want to change ${targetUser.email}'s role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    setActionLoading(targetUser.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, role: newRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update role");
      }

      setNotification({ type: "success", text: `Updated ${targetUser.email} to ${newRole}.` });
      fetchData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerificationToggle = async (targetUser: AdminUser) => {
    setActionLoading(targetUser.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, emailVerified: !targetUser.emailVerified }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle verification");
      }

      setNotification({
        type: "success",
        text: `Updated verification status for ${targetUser.email}.`,
      });
      fetchData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (targetUser.id === user?.id) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!confirm(`CAUTION: Permanently delete account ${targetUser.email}? All associated sessions will be removed.`)) {
      return;
    }

    setActionLoading(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users?userId=${targetUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete user");
      }

      setNotification({ type: "success", text: `Deleted user ${targetUser.email}.` });
      fetchData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center text-xs text-muted-foreground">
        Verifying administrator credentials...
      </div>
    );
  }

  // Enforce Access Control: If not admin, render 403 Forbidden Screen
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center p-8 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Access Restricted (403 Forbidden)</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              This administrative area requires verified system administrator privileges. Your current account ({user?.email || "anonymous"}) does not have clearance to view this resource.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              Return to Candidate Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-14 z-20">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wide">
                <ShieldCheck className="h-3 w-3" />
                <span>Admin Console</span>
              </span>
              <span className="text-xs text-muted-foreground">• Supabase PostgreSQL</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Platform Administration & User Management
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "overview"
                  ? "bg-card text-foreground shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "users"
                  ? "bg-card text-foreground shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Users ({stats?.totalUsers || 0})
            </button>
            <button
              onClick={() => setActiveTab("telemetry")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "telemetry"
                  ? "bg-card text-foreground shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              System Logs
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {notification && (
          <div
            className={`rounded-xl border p-3.5 text-xs flex items-center justify-between gap-3 ${
              notification.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            }`}
          >
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-[11px] font-bold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Total Users</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {loadingData ? "..." : stats?.totalUsers || 0}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {stats?.verifiedUsers || 0} verified accounts
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Interviews</span>
                  <CalendarCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {loadingData ? "..." : stats?.totalSessions || 0}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {stats?.completedSessions || 0} completed evaluations
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Code Submissions</span>
                  <Code2 className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {loadingData ? "..." : stats?.totalSubmissions || 0}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">OnlineCompiler execution</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Database Curated Bank</span>
                  <Layers className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {loadingData ? "..." : stats?.totalQuestions || 0}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {stats?.totalProblems || 0} live coding problems
                </p>
              </div>
            </div>

            {/* Recent Sessions Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Recent Interview Simulations</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live candidate simulation sessions stored in PostgreSQL
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted/50 transition"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">Session Title</th>
                      <th className="px-4 py-3">Target Role</th>
                      <th className="px-4 py-3">Difficulty</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentSessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No interview sessions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      recentSessions.map(sess => (
                        <tr key={sess.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-foreground">{sess.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{sess.targetRole}</td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">{sess.difficulty}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                sess.status === "completed"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {sess.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-foreground">
                            {sess.totalScore !== null ? `${sess.totalScore}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(sess.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. USER MANAGEMENT TAB */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchData()}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="user">Standard Users</option>
                </select>

                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted/50 transition"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Users Data Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email Verified</th>
                      <th className="px-4 py-3">Auth Type</th>
                      <th className="px-4 py-3">Joined Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No users matched your criteria.
                        </td>
                      </tr>
                    ) : (
                      usersList.map(u => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{u.name || "Anonymous User"}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                u.role === "admin"
                                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {u.emailVerified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {u.googleId ? "Google OAuth" : "Email & Password"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleRoleToggle(u)}
                              disabled={actionLoading === u.id || u.id === user.id}
                              className="px-2 py-1 rounded border border-border bg-background hover:bg-muted/50 text-[10px] font-semibold text-foreground transition disabled:opacity-50"
                            >
                              {u.role === "admin" ? "Demote to User" : "Make Admin"}
                            </button>
                            <button
                              onClick={() => handleVerificationToggle(u)}
                              disabled={actionLoading === u.id}
                              className="px-2 py-1 rounded border border-border bg-background hover:bg-muted/50 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                            >
                              {u.emailVerified ? "Unverify" : "Verify"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={actionLoading === u.id || u.id === user.id}
                              className="p-1 rounded border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition disabled:opacity-30 inline-block align-middle"
                              title="Delete User"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. TELEMETRY TAB */}
        {activeTab === "telemetry" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">API Telemetry & Provider Usage Logs</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Audit trail of calls to Groq AI, Judge0 compiler, and STT voice providers
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Endpoint</th>
                      <th className="px-4 py-3">Model / Lang</th>
                      <th className="px-4 py-3">Latency</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[11px]">
                    {recentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-sans">
                          No external API calls logged yet.
                        </td>
                      </tr>
                    ) : (
                      recentLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-sans font-bold text-foreground">{log.service}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{log.endpoint}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{log.modelOrLang}</td>
                          <td className="px-4 py-2.5 text-foreground">{log.responseTimeMs}ms</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.status === "success"
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : "text-destructive bg-destructive/10"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
