import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import SideNav from "@/components/SideNav";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "The Curator | Subscription Intelligence",
  description: "Track and manage all your subscriptions in one place",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialTeamId: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: membership } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .single();
        initialTeamId = membership?.team_id ?? null;
      }
    } catch {}
  }

  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-body min-h-screen">
        <StoreProvider initialTeamId={initialTeamId}>
          <SideNav />
          <div className="md:ml-64 flex flex-col min-h-screen">
            <TopBar />
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
          </div>
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
