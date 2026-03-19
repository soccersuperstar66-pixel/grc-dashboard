import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShieldCheck, Activity, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Regulations", icon: LayoutDashboard },
  { href: "/gap-analysis", label: "Gap Analysis", icon: ShieldCheck },
  { href: "/ai-compliance-checker", label: "AI Compliance Checker", icon: ScanSearch },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <span className="font-display font-bold text-sidebar-foreground tracking-tight text-lg">
            Trust<span className="text-accent">GRC</span>
          </span>
        </div>
      </div>

      <div className="px-4 py-6 flex-1 flex flex-col gap-1 overflow-y-auto">
        <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2">
          Dashboard
        </div>
        
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-accent" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border/20">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent border border-sidebar-border/30 flex items-center justify-center text-sm font-bold text-sidebar-foreground">
            JS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground leading-none">Jane Smith</span>
            <span className="text-xs text-sidebar-foreground/50 mt-1">Compliance Officer</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
