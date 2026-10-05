"use client";

import { useState } from "react";
import { useAppStore, type View } from "@/lib/store";
import { LipiSetuLogo } from "./logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpenText,
  ChevronDown,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ScrollText,
  SpellCheck,
  UserRound,
  GraduationCap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEARN_ITEMS: { view: View; label: string }[] = [
  { view: "alphabet", label: "Sanskrit Alphabet" },
  { view: "words", label: "Basic Words" },
  { view: "sentences", label: "Simple Sentences" },
  { view: "vocabulary", label: "Vocabulary" },
  { view: "quiz", label: "Interactive Quiz" },
];

export function Header() {
  const { view, user, navigate, setUser } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  const isActive = (v: View) => view === v;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    navigate("home");
  };

  const navLink = (v: View, label: string) => (
    <button
      key={v}
      onClick={() => {
        navigate(v);
        setMobileOpen(false);
        setLearnOpen(false);
      }}
      className={cn(
        "text-sm font-medium transition-colors rounded-md px-3 py-2",
        isActive(v)
          ? "text-primary bg-secondary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <LipiSetuLogo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLink("home", "Home")}
          {navLink("translator", "Translator")}
          {/* Learn dropdown */}
          <div className="relative">
            <button
              onClick={() => setLearnOpen((o) => !o)}
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors rounded-md px-3 py-2",
                ["alphabet", "words", "sentences", "vocabulary", "quiz"].includes(view)
                  ? "text-primary bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-expanded={learnOpen}
              aria-haspopup="true"
            >
              <GraduationCap className="h-4 w-4" />
              Learn Sanskrit
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", learnOpen && "rotate-180")}
              />
            </button>
            {learnOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setLearnOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute left-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-lg">
                  {LEARN_ITEMS.map((item) => (
                    <button
                      key={item.view}
                      onClick={() => {
                        navigate(item.view);
                        setLearnOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors",
                        isActive(item.view)
                          ? "bg-secondary text-primary font-medium"
                          : "text-popover-foreground hover:bg-muted"
                      )}
                    >
                      {item.view === "quiz" ? (
                        <SpellCheck className="h-4 w-4" />
                      ) : (
                        <BookOpenText className="h-4 w-4" />
                      )}
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {user && navLink("history", "My History")}
        </nav>

        {/* Auth area */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("dashboard")}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[120px] truncate font-medium">{user.name}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("profile")} className="gap-2">
                    <UserRound className="h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("history")} className="gap-2">
                    <History className="h-4 w-4" /> My History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("translator")} className="gap-2">
                    <ScrollText className="h-4 w-4" /> New Translation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("login")}>
                <LogIn className="mr-1.5 h-4 w-4" />
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("register")}>
                Register
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {navLink("home", "Home")}
            {navLink("translator", "Inscription Translator")}
            <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Learn Sanskrit
            </p>
            {LEARN_ITEMS.map((item) => navLink(item.view, item.label))}
            {user && (
              <>
                <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  My Account
                </p>
                {navLink("dashboard", "Dashboard")}
                {navLink("history", "My History")}
                {navLink("profile", "Profile")}
              </>
            )}
            <div className="mt-3 flex gap-2">
              {user ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                >
                  <LogOut className="mr-1.5 h-4 w-4" /> Logout ({user.name})
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigate("login");
                      setMobileOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      navigate("register");
                      setMobileOpen(false);
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
