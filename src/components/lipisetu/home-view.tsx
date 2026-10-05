"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Camera,
  Contrast,
  FileText,
  GraduationCap,
  Languages,
  ScrollText,
  Sparkles,
  Wand2,
  BookOpenText,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    icon: Camera,
    step: "1",
    title: "Upload Image",
    text: "Photograph or upload an ancient temple inscription — stone walls, pillars, copper plates.",
  },
  {
    icon: Contrast,
    step: "2",
    title: "Enhance Image",
    text: "Grayscale, contrast, brightness and sharpening filters bring worn carvings into focus.",
  },
  {
    icon: Wand2,
    step: "3",
    title: "Devanagari OCR",
    text: "OCR reads the Sanskrit text straight from the enhanced image, like an expert epigrapher.",
  },
  {
    icon: FileText,
    step: "4",
    title: "Extract Sanskrit",
    text: "Review and correct the extracted Devanagari text with its scholarly transliteration.",
  },
  {
    icon: Languages,
    step: "5",
    title: "Translate",
    text: "AI translates the Sanskrit into fluent English and Kannada, with epigraphic notes.",
  },
  {
    icon: ScrollText,
    step: "6",
    title: "Result & Save",
    text: "A museum-style translated image is generated for sharing, and results are saved to your personal archive.",
  },
];

const MODULES = [
  {
    icon: ScrollText,
    title: "Main Module",
    subtitle: "Inscription Translation",
    text: "Image → Enhancement → OCR → Sanskrit Text → English & Kannada → Translated Image. The complete OCR-powered epigraphic pipeline in your browser.",
    view: "translator" as const,
    cta: "Open Translator",
  },
  {
    icon: BookOpenText,
    title: "Learning Module",
    subtitle: "Sanskrit for Everyone",
    text: "Alphabet, basic words, simple sentences, vocabulary and an interactive quiz — learn Sanskrit step by step with Kannada support.",
    view: "alphabet" as const,
    cta: "Start Learning",
  },
  {
    icon: GraduationCap,
    title: "User Module",
    subtitle: "Your Personal Archive",
    text: "Register and login to save translations, revisit your history, and track quiz progress — all tied to your account.",
    view: "register" as const,
    cta: "Create Account",
  },
];

export function HomeView() {
  const { user, navigate } = useAppStore();

  return (
    <div>
      {/* Hero */}
      <section className="bg-parchment border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-5">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                Sanskrit Inscription Translation System
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Ancient Inscription,{" "}
                <span className="text-primary">Digital Understanding</span>
              </h1>
              <p className="font-devanagari text-xl text-primary/80">
                प्राचीन शिलालेखः &rarr; आधुनिक बोधः
              </p>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                LipiSetu is a bridge across centuries. Upload photos of temple walls
                and stone inscriptions, let our enhancement filters and OCR-powered
                Devanagari text recognition reveal the Sanskrit within, read it in English and
                Kannada, and download a beautifully translated image.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Button size="lg" className="gap-2" onClick={() => navigate("translator")}>
                  <Camera className="h-4 w-4" />
                  Translate an Inscription
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(user ? "dashboard" : "register")}
                >
                  {user ? "Go to Dashboard" : "Create Free Account"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Browsing and translation are open to all — login to save results and history.
              </p>
            </div>

            {/* Decorative workflow card */}
            <div className="relative mx-auto w-full max-w-md">
              <Card className="overflow-hidden border-2 border-primary/15 shadow-xl">
                <div className="bg-primary px-5 py-3 text-primary-foreground">
                  <p className="font-devanagari text-lg">॥ स्वस्ति श्री ॥</p>
                  <p className="text-xs opacity-80">
                    How every great inscription begins
                  </p>
                </div>
                <CardContent className="space-y-4 p-6">
                  {[
                    { dev: "शिलालेखम्", en: "stone inscription" },
                    { dev: "छायाचित्रम्", en: "photograph" },
                    { dev: "संवर्धनम्", en: "enhancement" },
                    { dev: "पाठः", en: "extracted text" },
                    { dev: "अनुवादः", en: "translation" },
                  ].map((row, i) => (
                    <div
                      key={row.dev}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card px-4 py-3"
                    >
                      <span className="font-devanagari text-lg font-medium">{row.dev}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {i < 4 && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
                        {row.en}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            The LipiSetu Pipeline
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Six steps from weathered stone to readable translation — each step visible,
            controllable, and correctable by you.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_STEPS.map((s) => (
            <Card key={s.step} className="group transition-all hover:shadow-md hover:border-primary/40">
              <CardContent className="flex gap-4 p-5">
                <div className="relative shrink-0">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {s.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Three Modules, One Setu</h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
              A complete ecosystem for reading and learning the ancient language of
              Indian inscriptions.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {MODULES.map((m) => (
              <Card key={m.title} className="flex flex-col transition-all hover:shadow-md hover:border-primary/40">
                <CardContent className="flex flex-1 flex-col p-6">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <m.icon className="h-6 w-6" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {m.title}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold">{m.subtitle}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {m.text}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 w-full gap-2 group"
                    onClick={() => navigate(m.view)}
                  >
                    {m.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-lg sm:px-12">
          <div className="bg-parchment absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="relative">
            <p className="font-devanagari text-2xl font-semibold">विद्या ददाति विनयम्</p>
            <p className="mt-1 text-sm opacity-85">
              &ldquo;Knowledge grants humility&rdquo; — from the Hitopadeśa
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-2xl font-bold sm:text-3xl">
              Begin your journey into India&rsquo;s epigraphic heritage
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
                onClick={() => navigate("translator")}
              >
                <Camera className="h-4 w-4" /> Try the Translator
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={() => navigate("alphabet")}
              >
                <GraduationCap className="h-4 w-4" /> Explore Learning
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
