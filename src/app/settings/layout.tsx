import { AppNav } from "@/components/app-nav";
import { PAGE_FRAME } from "@/components/page-frame";
import { SettingsNav } from "@/components/settings-nav";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <main className={cn(PAGE_FRAME, "flex flex-1 flex-col gap-6 py-8 md:flex-row md:gap-16")}>
        <SettingsNav />
        <div className="flex max-w-xl min-w-0 flex-1 flex-col gap-8">{children}</div>
      </main>
    </>
  );
}
