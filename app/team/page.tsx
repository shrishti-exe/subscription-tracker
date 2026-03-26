"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>("Dognosis");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      setCurrentUserEmail(data.user.email ?? null);

      // Get team membership
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id, teams(name)")
        .eq("user_id", data.user.id)
        .single();

      if (!membership) { setLoading(false); return; }

      const teamId = membership.team_id;
      const tname = (membership.teams as any)?.name;
      if (tname) setTeamName(tname);

      // Get all members + their emails via security definer function
      const { data: memberRows } = await supabase
        .rpc("get_team_members", { p_team_id: teamId });

      if (memberRows) {
        const list: Member[] = memberRows.map((row: any) => {
          const email: string = row.email || "Unknown";
          const name = email.includes("@")
            ? email.split("@")[0]
                .split(".")
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
            : "Unknown";
          return { id: row.member_id, email, name, role: row.role };
        });
        // Sort: owners first, then alphabetically
        list.sort((a, b) => {
          if (a.role === "owner" && b.role !== "owner") return -1;
          if (b.role === "owner" && a.role !== "owner") return 1;
          return a.name.localeCompare(b.name);
        });
        setMembers(list);
      }
      setLoading(false);
    });
  }, []);

  const roleLabel = (role: string) => {
    if (role === "owner") return "Admin";
    if (role === "admin") return "Admin";
    return "Member";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold font-headline">{teamName} Team</h2>
        <p className="text-on-surface-variant mt-1">
          {members.length} member{members.length !== 1 ? "s" : ""} · All @dognosis.tech
        </p>
      </div>

      {/* Members list */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">group</span>
            No members yet. Members appear here after they sign in.
          </div>
        ) : (
          <div className="divide-y divide-surface-container/50">
            {members.map((member) => {
              const initials = member.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isYou = member.email === currentUserEmail;
              const isAdmin = member.role === "owner" || member.role === "admin";

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 px-6 py-5 hover:bg-surface-container-low transition-all"
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    isAdmin
                      ? "bg-gradient-to-br from-primary to-primary-container text-white"
                      : "bg-gradient-to-br from-secondary to-secondary-container text-white"
                  }`}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {member.name}
                      {isYou && (
                        <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">{member.email}</p>
                  </div>

                  {/* Role badge */}
                  <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full shrink-0 ${
                    isAdmin
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}>
                    {isAdmin && (
                      <span className="material-symbols-outlined text-[12px] mr-1 align-middle">shield_person</span>
                    )}
                    {roleLabel(member.role)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-on-surface-variant/50 text-center mt-6">
        Anyone who signs in with @dognosis.tech is automatically added to this team.
      </p>
    </div>
  );
}
