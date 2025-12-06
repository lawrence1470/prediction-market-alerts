import { DashboardHeader } from "~/app/_components/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main>{children}</main>
    </div>
  );
}
