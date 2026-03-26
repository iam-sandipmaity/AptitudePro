import { AppHeader } from "@/components/ui/app-header";
import { requireAppUser } from "@/lib/auth";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAppUser();

  return (
    <div>
      <AppHeader />
      {children}
    </div>
  );
}
