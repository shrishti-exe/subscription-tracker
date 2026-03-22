"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Team {
  id: string;
  name: string;
  role: string;
  memberCount: number;
}

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [tab, setTab] = useState<"workspace" | "billing" | "notifications">("workspace");
  const [toast, setToast] = useState("");
  const router = useRouter();

  const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        await loadTeams(data.user.id);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseConfigured]);

  const loadTeams = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("team_members")
      .select("role, teams(id, name)")
      .eq("user_id", userId);

    if (data) {
      const teamList: Team[] = data.map((row: any) => ({
        id: row.teams.id,
        name: row.teams.name,
        role: row.role,
        memberCount: 1,
      }));
      setTeams(teamList);
      if (teamList.length > 0) {
        setActiveTeam(teamList[0]);
        await loadMembers(teamList[0].id);
      }
    }
  };

  const loadMembers = async (tid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("team_members")
      .select("id, role, invited_email, users:user_id(email, raw_user_meta_data)")
      .eq("team_id", tid);

    if (data) {
      const memberList: Member[] = data.map((row: any) => ({
        id: row.id,
        email: row.users?.email || row.invited_email || "Pending",
        name: row.users?.raw_user_meta_data?.full_name || row.invited_email || "Pending invite",
        role: row.role,
        avatar: row.users?.raw_user_meta_data?.avatar_url,
      }));
      setMembers(memberList);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !user) return;
    setCreating(true);
    const supabase = createClient();

    const { data: team, error } = await supabase
      .from("teams")
      .insert({ name: newTeamName.trim(), owner_id: user.id })
      .select()
      .single();

    if (!error && team) {
      await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "owner",
      });
      await loadTeams(user.id);
      setNewTeamName("");
      showToast(`Team "${team.name}" created!`);
    }
    setCreating(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !activeTeam) return;
    setInviting(true);
    const supabase = createClient();

    const { error } = await supabase.from("team_members").insert({
      team_id: activeTeam.id,
      invited_email: inviteEmail.trim(),
      role: "member",
    });

    if (!error) {
      showToast(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      await loadMembers(activeTeam.id);
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const supabase = createClient();
    await supabase.from("team_members").delete().eq("id", memberId);
    if (activeTeam) await loadMembers(activeTeam.id);
    showToast("Member removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-on-surface text-surface px-5 py-3 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-sm text-teal-400">check_circle</span>
          {toast}
        </div>
      )}

      <h2 className="text-3xl font-extrabold font-headline mb-8">Settings</h2>

      {/* Tab Bar */}
      <div className="flex bg-surface-container-low p-1 rounded-xl gap-1 mb-8 w-fit">
        {(["workspace", "billing", "notifications"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-white text-primary shadow-sm font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t === "workspace" ? "Team Workspace" : t === "billing" ? "Billing" : "Notifications"}
          </button>
        ))}
      </div>

      {/* ── WORKSPACE TAB ── */}
      {tab === "workspace" && (
        <div className="space-y-6">
          {!supabaseConfigured || !user ? (
            /* Demo mode notice */
            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">group</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-headline mb-2">Team Workspaces</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                    Create a shared workspace so your whole team can track subscriptions together.
                    Sign in with Google to enable team features.
                  </p>
                  <button
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    Sign in to unlock
                  </button>
                </div>
              </div>

              {/* Feature preview */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: "group_add", title: "Invite teammates", desc: "Add anyone by email" },
                  { icon: "sync", title: "Shared subscriptions", desc: "Everyone sees the same data" },
                  { icon: "shield_person", title: "Role management", desc: "Owner, admin, member roles" },
                ].map((f) => (
                  <div key={f.title} className="bg-surface-container-low rounded-2xl p-4">
                    <span className="material-symbols-outlined text-primary mb-2">{f.icon}</span>
                    <p className="font-bold text-sm">{f.title}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Active Team Selector */}
              {teams.length > 0 && (
                <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
                  <h3 className="font-bold font-headline mb-4">Your Teams</h3>
                  <div className="space-y-3">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={async () => {
                          setActiveTeam(team);
                          await loadMembers(team.id);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                          activeTeam?.id === team.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-bold text-sm">
                          {team.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{team.name}</p>
                          <p className="text-xs text-on-surface-variant capitalize">{team.role}</p>
                        </div>
                        {activeTeam?.id === team.id && (
                          <span className="material-symbols-outlined text-primary">check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {activeTeam && (
                <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold font-headline">
                      {activeTeam.name} — Members
                    </h3>
                    <span className="text-xs text-on-surface-variant">
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-3 mb-8">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low transition-all"
                      >
                        {member.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary-container flex items-center justify-center text-white font-bold text-sm">
                            {member.name[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{member.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{member.email}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                            member.role === "owner"
                              ? "bg-primary/10 text-primary"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {member.role}
                        </span>
                        {member.role !== "owner" && activeTeam.role === "owner" && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-error hover:bg-error-container/30 rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">person_remove</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Invite */}
                  <div>
                    <p className="text-sm font-bold mb-3">Invite by email</p>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                        placeholder="colleague@company.com"
                        className="flex-1 h-12 px-4 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none placeholder:text-outline-variant"
                      />
                      <button
                        onClick={handleInvite}
                        disabled={inviting}
                        className="px-5 h-12 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {inviting ? "..." : "Invite"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Create New Team */}
              <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
                <h3 className="font-bold font-headline mb-4">Create New Team</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                    placeholder="e.g. Engineering, Marketing"
                    className="flex-1 h-12 px-4 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none placeholder:text-outline-variant"
                  />
                  <button
                    onClick={handleCreateTeam}
                    disabled={creating || !newTeamName.trim()}
                    className="px-5 h-12 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {tab === "billing" && (
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
          <h3 className="font-bold font-headline mb-6">Billing & Plan</h3>
          <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl mb-6">
            <span className="material-symbols-outlined text-primary">workspace_premium</span>
            <div>
              <p className="font-bold">Free Plan</p>
              <p className="text-xs text-on-surface-variant">Unlimited subscriptions, 1 workspace</p>
            </div>
            <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              Current
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Paid plans with unlimited workspaces, CSV export, and email notifications coming soon.
          </p>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab === "notifications" && (
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
          <h3 className="font-bold font-headline mb-6">Notification Settings</h3>
          <p className="text-sm text-on-surface-variant mb-4">
            Configure your renewal alerts in the{" "}
            <button
              onClick={() => router.push("/reminders")}
              className="text-primary font-bold underline underline-offset-2"
            >
              Reminders
            </button>{" "}
            tab.
          </p>
          <div className="space-y-4">
            {[
              { label: "Renewal reminders", desc: "Get alerted before subscriptions renew", enabled: true },
              { label: "Weekly digest", desc: "Summary of upcoming renewals every Monday", enabled: false },
              { label: "Budget alerts", desc: "Alert when monthly spend exceeds a threshold", enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-on-surface-variant">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={item.enabled} />
                  <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
