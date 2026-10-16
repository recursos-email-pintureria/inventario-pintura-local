/** Protected layout: everything below requires a valid session. */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", replace: true });
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
