"use server";

import { createClient } from "@/lib/supabase/server";

export interface SubscriptionInput {
  name: string;
  amount: number;
  billingCycle: string;
  startDate: string;
  category: string;
  linkedAccount?: string;
  status: string;
  autoRenew: boolean;
  notes?: string;
}

export async function createSubscription(input: SubscriptionInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .single();

  if (!membership?.team_id) throw new Error("Not in a team");

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      team_id: membership.team_id,
      name: input.name,
      amount: input.amount,
      billing_cycle: input.billingCycle,
      start_date: input.startDate,
      category: input.category,
      linked_account: input.linkedAccount ?? null,
      status: input.status,
      auto_renew: input.autoRenew,
      notes: input.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { teamId: membership.team_id, subscription: data };
}
