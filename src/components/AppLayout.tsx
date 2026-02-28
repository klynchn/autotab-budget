import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, LayoutDashboard, Receipt, Settings, Lightbulb, RefreshCw, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
{ to: "/", label: "Dashboard", icon: LayoutDashboard },
{ to: "/receipts", label: "Receipts", icon: Receipt },
{ to: "/insights", label: "Insights", icon: Lightbulb },
{ to: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
{ to: "/trips", label: "Trips", icon: Plane },
{ to: "/settings", label: "Budget", icon: Settings }];


export default function AppLayout({ children }: {children: React.ReactNode;}) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              A
            </div>
            <span className="text-lg font-bold tracking-tight">AutoTab</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) =>
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            location.pathname === to ? "text-primary" : "text-muted-foreground"}`
            }>

              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )}
        </div>
      </nav>
    </div>);

}