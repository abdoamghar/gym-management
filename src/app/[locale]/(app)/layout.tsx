import { auth } from "@/lib/auth";
import { getCurrentGym } from "@/lib/gym";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const gym = await getCurrentGym();

  return (
    <Providers>
      <AppShell gymName={gym.name}>{children}</AppShell>
    </Providers>
  );
}
