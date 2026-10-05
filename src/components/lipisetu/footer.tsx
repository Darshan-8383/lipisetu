"use client";

import { useAppStore } from "@/lib/store";

export function Footer() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <footer className="mt-auto border-t border-border/70 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="max-w-sm">
            <p className="font-devanagari text-lg font-semibold text-primary">लिपिसेतु</p>
            <p className="font-display text-sm font-bold">LipiSetu</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ancient Inscription → Digital Understanding. A bridge (सेतु) between
              the carved past and the digital present.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-2 font-semibold">Explore</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("translator")}>
                    Inscription Translator
                  </button>
                </li>
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("home")}>
                    How It Works
                  </button>
                </li>
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("quiz")}>
                    Interactive Quiz
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">Learn</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("alphabet")}>
                    Sanskrit Alphabet
                  </button>
                </li>
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("words")}>
                    Basic Words
                  </button>
                </li>
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("vocabulary")}>
                    Vocabulary
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">Account</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("login")}>
                    Login
                  </button>
                </li>
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("register")}>
                    Register
                  </button>
                </li>
                <li>
                  <button className="hover:text-foreground" onClick={() => navigate("history")}>
                    My History
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} LipiSetu — Sanskrit Inscription Translation System</p>
          <p className="font-devanagari">प्राचीन शिलालेखः → आधुनिक बोधः</p>
        </div>
      </div>
    </footer>
  );
}
