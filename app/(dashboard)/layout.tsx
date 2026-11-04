import Script from 'next/script';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ToastProvider } from '@/components/ui/Toast';
import { DashboardShell } from '@/components/layout/DashboardShell';

// Wraps every page inside the (dashboard) group. The middleware already guards
// these routes, but we check again here so a Server Component never renders
// for a signed-out user.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <ToastProvider>
      {/* Runs before first paint: if the post-login welcome hasn't played this
          session, mark the document so CSS hides the dashboard underneath until
          the greeting finishes. This is what kills the "flash of dashboard
          before the greeting" on login. */}
      <Script id="welcome-gate" strategy="beforeInteractive">
        {`try{if(sessionStorage.getItem('heyvanilla_welcomed')!=='1'){document.documentElement.setAttribute('data-welcoming','1');}}catch(e){}`}
      </Script>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}
