import { Link, useLocation } from "wouter";
import { Home, CheckSquare, Calendar as CalendarIcon, Tag, PlusCircle, Menu, Sun, Moon, Monitor } from "lucide-react";
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const icon =
    theme === "system"
      ? <Monitor className="h-5 w-5" />
      : resolvedTheme === "dark"
      ? <Moon className="h-5 w-5" />
      : <Sun className="h-5 w-5" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "default"}
          className={compact ? "h-10 w-10 rounded-xl" : "w-full justify-start h-11 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground gap-3"}
          title="Toggle theme"
        >
          {icon}
          {!compact && <span>
            {theme === "light" ? "Light mode" : theme === "dark" ? "Dark mode" : "System theme"}
          </span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} className="w-40 rounded-xl">
        <DropdownMenuItem
          className={`rounded-lg gap-2 cursor-pointer ${theme === "light" ? "font-semibold text-primary" : ""}`}
          onClick={() => setTheme("light")}
        >
          <Sun className="h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`rounded-lg gap-2 cursor-pointer ${theme === "dark" ? "font-semibold text-primary" : ""}`}
          onClick={() => setTheme("dark")}
        >
          <Moon className="h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`rounded-lg gap-2 cursor-pointer ${theme === "system" ? "font-semibold text-primary" : ""}`}
          onClick={() => setTheme("system")}
        >
          <Monitor className="h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/tasks", label: "My Tasks", icon: CheckSquare },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/categories", label: "Categories", icon: Tag },
  ];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col gap-2">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start text-lg h-12 ${isActive ? "font-semibold bg-primary/10 text-primary hover:bg-primary/20" : "font-medium text-muted-foreground hover:text-foreground"}`}
              onClick={onClick}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-card border-b sticky top-0 z-10">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <CheckSquare className="h-6 w-6" />
          TaskFlow
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px] p-6">
              <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-8 mt-4">
                <CheckSquare className="h-8 w-8" />
                TaskFlow
              </div>
              <NavLinks onClick={() => setMobileOpen(false)} />
              <div className="mt-auto absolute bottom-8 left-6 right-6 flex flex-col gap-3">
                <ThemeToggle />
                <Link href="/tasks/new">
                  <Button className="w-full h-12 text-lg rounded-xl shadow-md" size="lg" onClick={() => setMobileOpen(false)}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Task
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-card border-r p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-10 pl-2">
          <CheckSquare className="h-8 w-8" />
          TaskFlow
        </div>
        <NavLinks />
        <div className="mt-auto flex flex-col gap-3">
          <ThemeToggle />
          <Link href="/tasks/new">
            <Button className="w-full h-14 text-lg rounded-xl shadow-sm hover:shadow-md transition-all" size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Task
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:max-w-5xl md:mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
