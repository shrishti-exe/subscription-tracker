import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!membership?.team_id) {
      return NextResponse.json({ error: "Not in a team" }, { status: 403 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        team_id: membership.team_id,
        name: body.name,
        amount: body.amount,
        billing_cycle: body.billingCycle,
        start_date: body.startDate,
        category: body.category,
        linked_account: body.linkedAccount ?? null,
        status: body.status,
        auto_renew: body.autoRenew,
        notes: body.notes ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teamId: membership.team_id, subscription: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!membership?.team_id) return NextResponse.json({ subscriptions: [] });

    const { data, error } = await supabase
      .rpc("get_subscriptions_with_creator", { p_team_id: membership.team_id });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ teamId: membership.team_id, subscriptions: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
