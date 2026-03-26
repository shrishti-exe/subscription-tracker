import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Only allow @dognosis.tech email addresses
      if (!user?.email?.endsWith("@dognosis.tech")) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=unauthorized_domain`
        );
      }

      // Auto-provision user into the shared Dognosis team
      await supabase.rpc("join_dognosis_team");

      // Save email to user_preferences so the cron job can reach them
      await supabase.from("user_preferences").upsert(
        { user_id: user.id, email: user.email, updated_at: new Date().toISOString() },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
