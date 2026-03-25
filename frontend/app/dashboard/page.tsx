import { DashboardShell } from "@/components/dashboard-shell";

type DashboardPageProps = {
  searchParams?: {
    symbol?: string;
  };
};

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return <DashboardShell initialSymbol={searchParams?.symbol} />;
}
