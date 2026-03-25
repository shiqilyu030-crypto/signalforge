import { CtaSection } from "@/components/cta-section";
import { DataSourceSection } from "@/components/data-source-section";
import { DashboardPreview } from "@/components/dashboard-preview";
import { FeaturesSection } from "@/components/features-section";
import { HealthStatus } from "@/components/health-status";
import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <SiteHeader />
      <Hero />
      <DataSourceSection />
      <FeaturesSection />
      <DashboardPreview />
      <HealthStatus />
      <CtaSection />
    </main>
  );
}
