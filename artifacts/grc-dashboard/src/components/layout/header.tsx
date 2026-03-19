import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search regulations, policies..." 
            className="w-full pl-9 pr-4 py-2 bg-muted/50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
        </Button>
      </div>
    </header>
  );
}
