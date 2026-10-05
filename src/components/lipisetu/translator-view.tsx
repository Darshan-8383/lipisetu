"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ResultPanel } from "./result-panel";
import { SAMPLE_INSCRIPTIONS } from "./learn-data";
import {
  GeminiError,
  downscaleForApi,
  geminiOcr,
  geminiTranslate,
  geminiTranslatedImage,
  prettyModelName,
} from "@/lib/gemini";
import {
  DEFAULT_SETTINGS,
  AUTO_SETTINGS,
  enhanceImage,
  fileToDataUrl,
  urlToDataUrl,
  makeThumbnail,
  loadImage,
  imageDataToDataUrl,
  drawImageData,
  type EnhanceSettings,
} from "@/lib/image-enhance";
import {
  Camera,
  CheckCircle2,
  Contrast,
  FileText,
  Languages,
  Loader2,
  RefreshCw,
  Save,
  ScrollText,
  UploadCloud,
  Wand2,
  AlertCircle,
  LogIn,
  ArrowRight,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Upload", icon: Camera },
  { n: 2, label: "Enhance", icon: Contrast },
  { n: 3, label: "OCR", icon: Wand2 },
  { n: 4, label: "Sanskrit Text", icon: FileText },
  { n: 5, label: "Translate", icon: Languages },
  { n: 6, label: "Result", icon: ScrollText },
];

type OcrResult = {
  sanskrit: string;
  transliteration: string;
  notes: string;
  hasDevanagari: boolean;
};

type TranslationResult = {
  english: string;
  kannada: string;
  transliteration: string;
  notes: string;
};

export function TranslatorView() {
  const { user, navigate, setAssistantContext } = useAppStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);

  // Image state
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [enhancedImageData, setEnhancedImageData] = useState<ImageData | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [settings, setSettings] = useState<EnhanceSettings>(DEFAULT_SETTINGS);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  // Text state
  const [sanskritText, setSanskritText] = useState("");

  // Translation state
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);

  // AI engine + translated image state
  const [ocrEngine, setOcrEngine] = useState<string | null>(null);
  const [translateEngine, setTranslateEngine] = useState<string | null>(null);
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [translatedImageLoading, setTranslatedImageLoading] = useState(false);
  const [translatedImageError, setTranslatedImageError] = useState<
    string | null
  >(null);
  const [imageEngine, setImageEngine] = useState<string | null>(null);
  const imageAttemptRef = useRef(false);

  // Save state
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  /** Adopt a new image: reset pipeline and move to enhancement. */
  const adoptImage = useCallback(async (dataUrl: string) => {
    setOriginalUrl(dataUrl);
    setEnhancedUrl(null);
    setEnhancedImageData(null);
    setThumbnail(null);
    setOcrResult(null);
    setOcrError(null);
    setSanskritText("");
    setTranslation(null);
    setTranslateError(null);
    setSavedId(null);
    setTitle("");
    setOcrEngine(null);
    setTranslateEngine(null);
    setTranslatedImage(null);
    setTranslatedImageLoading(false);
    setTranslatedImageError(null);
    setImageEngine(null);
    imageAttemptRef.current = false;
    const img = await loadImage(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0);
    setSourceImageData(ctx.getImageData(0, 0, img.width, img.height));
    setSettings(DEFAULT_SETTINGS);
    setStep(2);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Unsupported file",
          description: "Please upload an image file (JPG, PNG, WebP…).",
          variant: "destructive",
        });
        return;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        await adoptImage(dataUrl);
      } catch {
        toast({
          title: "Could not read image",
          description: "The file may be corrupted. Try a different photo.",
          variant: "destructive",
        });
      }
    },
    [adoptImage, toast]
  );

  const handleSample = useCallback(
    async (path: string) => {
      try {
        const dataUrl = await urlToDataUrl(path);
        await adoptImage(dataUrl);
      } catch {
        toast({
          title: "Could not load sample",
          description: "Please try uploading your own image instead.",
          variant: "destructive",
        });
      }
    },
    [adoptImage, toast]
  );

  /** Share the current inscription with the AI assistant. */
  useEffect(() => {
    setAssistantContext({
      view: "Inscription Translator",
      sanskrit: sanskritText,
      transliteration: translation?.transliteration || ocrResult?.transliteration,
      english: translation?.english,
      kannada: translation?.kannada,
      notes: translation?.notes || ocrResult?.notes,
    });
  }, [sanskritText, translation, ocrResult, setAssistantContext]);

  useEffect(() => () => setAssistantContext(null), [setAssistantContext]);

  /** Re-run the enhancement pipeline whenever source or settings change. */
  useEffect(() => {
    if (!sourceImageData) return;
    setProcessing(true);
    const timer = setTimeout(() => {
      try {
        const result = enhanceImage(sourceImageData, settings);
        setEnhancedImageData(result);
        setEnhancedUrl(imageDataToDataUrl(result));
        if (canvasRef.current) drawImageData(canvasRef.current, result);
      } finally {
        setProcessing(false);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [sourceImageData, settings]);

  /** Run OCR on the enhanced (or original) image — OCR engine first, built-in fallback. */
  const runOcr = async () => {
    const image = enhancedUrl ?? originalUrl;
    if (!image) return;
    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);
    setStep(3);
    try {
      let data: OcrResult | null = null;
      let engine: string | null = null;
      let geminiIssue: string | null = null;
      try {
        const apiImage = await downscaleForApi(image);
        const r = await geminiOcr(apiImage);
        data = {
          sanskrit: r.sanskrit,
          transliteration: r.transliteration,
          notes: r.notes,
          hasDevanagari: r.hasDevanagari,
        };
        engine = prettyModelName(r.model);
      } catch (err) {
        geminiIssue =
          err instanceof GeminiError ? err.message : "The OCR engine was unavailable.";
      }
      if (!data) {
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        });
        const j: OcrResult & { error?: string; engineUnavailable?: boolean } =
          await res.json();
        if (!res.ok) {
          setOcrError(
            j.engineUnavailable
              ? `${geminiIssue ?? "The OCR engine was unavailable."} The built-in fallback engine is not available on this deployment — add a working API key in Profile → AI Engine.`
              : j.error ?? "OCR failed. Please try again."
          );
          return;
        }
        data = j;
        engine = "LipiSetu Built-in Engine";
        toast({
          title: "Used the built-in engine",
          description: geminiIssue,
        });
      }
      setOcrResult(data);
      setSanskritText(data.sanskrit ?? "");
      setOcrEngine(engine);
      setStep(4);
      if (!data.hasDevanagari) {
        toast({
          title: "No Devanagari detected",
          description:
            "The system could not find readable Devanagari. You can still edit the text manually.",
        });
      }
    } catch {
      setOcrError("Network error while running OCR. Please try again.");
    } finally {
      setOcrLoading(false);
    }
  };

  /** Translate the (possibly corrected) Sanskrit text — OCR engine first, built-in fallback. */
  const runTranslate = async () => {
    const text = sanskritText.trim();
    if (!text) {
      toast({
        title: "Nothing to translate",
        description: "Enter or extract some Sanskrit text first.",
        variant: "destructive",
      });
      return;
    }
    setTranslating(true);
    setTranslateError(null);
    setTranslation(null);
    setStep(5);
    try {
      let data: TranslationResult | null = null;
      let engine: string | null = null;
      let geminiIssue: string | null = null;
      try {
        const r = await geminiTranslate(text);
        data = {
          english: r.english,
          kannada: r.kannada,
          transliteration: r.transliteration,
          notes: r.notes,
        };
        engine = prettyModelName(r.model);
      } catch (err) {
        geminiIssue =
          err instanceof GeminiError ? err.message : "The OCR engine was unavailable.";
      }
      if (!data) {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const j: TranslationResult & {
          error?: string;
          engineUnavailable?: boolean;
        } = await res.json();
        if (!res.ok) {
          setTranslateError(
            j.engineUnavailable
              ? `${geminiIssue ?? "The OCR engine was unavailable."} The built-in fallback engine is not available on this deployment — add a working API key in Profile → AI Engine.`
              : j.error ?? "Translation failed. Please try again."
          );
          return;
        }
        data = j;
        engine = "LipiSetu Built-in Engine";
        toast({
          title: "Used the built-in engine",
          description: geminiIssue,
        });
      }
      setTranslation(data);
      setTranslateEngine(engine);
      setStep(6);
      if (!title) {
        setTitle(
          `Inscription — ${new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`
        );
      }
    } catch {
      setTranslateError("Network error while translating. Please try again.");
    } finally {
      setTranslating(false);
    }
  };

  /** Generate the AI translated image. */
  const generateTranslatedImage = async () => {
    if (!originalUrl || !translation) return;
    setTranslatedImageLoading(true);
    setTranslatedImageError(null);
    try {
      const ref = await downscaleForApi(originalUrl, 1280).catch(() => null);
      const r = await geminiTranslatedImage({
        originalImage: ref,
        sanskrit: sanskritText,
        transliteration:
          translation.transliteration || ocrResult?.transliteration || "",
        english: translation.english,
        kannada: translation.kannada,
      });
      setTranslatedImage(r.dataUrl);
      setImageEngine(prettyModelName(r.model));
    } catch (err) {
      setTranslatedImage(null);
      setImageEngine(null);
      setTranslatedImageError(
        err instanceof GeminiError
          ? err.message
          : "Could not generate the translated image. Please try again."
      );
    } finally {
      setTranslatedImageLoading(false);
    }
  };

  /** Auto-generate the translated image once the result step is reached. */
  useEffect(() => {
    if (step !== 6 || !translation) return;
    if (imageAttemptRef.current) return;
    imageAttemptRef.current = true;
    void generateTranslatedImage();
  }, [step, translation, generateTranslatedImage]);

  /** Save the result to the user's account. */
  const saveResult = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Create a free account to save results to your history.",
      });
      navigate("login");
      return;
    }
    if (!originalUrl) return;
    setSaving(true);
    try {
      let thumb = thumbnail;
      if (!thumb) {
        thumb = await makeThumbnail(originalUrl);
        setThumbnail(thumb);
      }
      const res = await fetch("/api/translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Inscription",
          originalImage: originalUrl,
          enhancedImage: enhancedUrl,
          thumbnail: thumb,
          translatedImage,
          engine: translateEngine ?? ocrEngine,
          sanskritText,
          transliteration: translation?.transliteration ?? ocrResult?.transliteration ?? "",
          englishTranslation: translation?.english ?? "",
          kannadaTranslation: translation?.kannada ?? "",
          notes: translation?.notes ?? ocrResult?.notes ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Could not save",
          description: data.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }
      setSavedId(data.translation.id);
      toast({
        title: "Result saved!",
        description: "Find it anytime under My History.",
      });
    } catch {
      toast({
        title: "Could not save",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setOriginalUrl(null);
    setSourceImageData(null);
    setEnhancedUrl(null);
    setEnhancedImageData(null);
    setThumbnail(null);
    setOcrResult(null);
    setOcrError(null);
    setSanskritText("");
    setTranslation(null);
    setTranslateError(null);
    setSavedId(null);
    setTitle("");
    setOcrEngine(null);
    setTranslateEngine(null);
    setTranslatedImage(null);
    setTranslatedImageLoading(false);
    setTranslatedImageError(null);
    setImageEngine(null);
    imageAttemptRef.current = false;
  };

  const set = <K extends keyof EnhanceSettings>(key: K, value: EnhanceSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 font-display text-3xl font-bold">
            Inscription Translator
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/40 text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              OCR
            </Badge>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Image → Enhancement → OCR → Sanskrit → English &amp; Kannada →
            Translated Image
          </p>
        </div>
        {originalUrl && (
          <Button variant="outline" size="sm" onClick={resetAll} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Start New
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const current = step === s.n;
            return (
              <li key={s.n} className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    if (s.n <= step) setStep(s.n);
                  }}
                  disabled={s.n > step}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                    current && "border-primary bg-primary text-primary-foreground",
                    done && "border-primary/40 bg-secondary text-primary hover:bg-secondary/80",
                    !current && !done && "border-border text-muted-foreground"
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.n}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-4 rounded sm:w-8",
                      step > s.n ? "bg-primary/40" : "bg-border"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* STEP 1 — Upload */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors sm:p-16",
                  dragOver
                    ? "border-primary bg-secondary/60"
                    : "border-border hover:border-primary/50 hover:bg-muted/40"
                )}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-8 w-8" />
                </span>
                <div>
                  <p className="text-lg font-semibold">Upload an inscription image</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Drag &amp; drop a photo of a temple wall, stone slab, pillar or copper
                    plate — or click below to browse. JPG, PNG and WebP supported.
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <span className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    <Camera className="h-4 w-4" /> Choose Image
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              …or try a sample inscription
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SAMPLE_INSCRIPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSample(s.path)}
                  className="group overflow-hidden rounded-xl border border-border text-left transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="h-36 overflow-hidden bg-muted">
                    { }
                    <img
                      src={s.path}
                      alt={s.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — Enhance */}
      {step === 2 && originalUrl && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Contrast className="h-5 w-5 text-primary" />
                Image Enhancement
              </CardTitle>
              <CardDescription>
                Fine-tune the filters, then run OCR on the enhanced image.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                <div className="grid gap-0 sm:grid-cols-2">
                  <figure className="border-b border-border/50 sm:border-b-0 sm:border-r">
                    { }
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-h-80 w-full object-contain"
                    />
                    <figcaption className="border-t border-border/50 bg-muted/60 py-1.5 text-center text-xs font-medium text-muted-foreground">
                      Original
                    </figcaption>
                  </figure>
                  <figure className="relative">
                    {enhancedUrl ? (
                       
                      <img
                        src={enhancedUrl}
                        alt="Enhanced"
                        className="max-h-80 w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-80 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    {processing && (
                      <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-primary shadow">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…
                      </div>
                    )}
                    <figcaption className="border-t border-border/50 bg-secondary/60 py-1.5 text-center text-xs font-medium text-primary">
                      Enhanced
                    </figcaption>
                  </figure>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button onClick={runOcr} className="gap-2" disabled={processing}>
                  <Wand2 className="h-4 w-4" /> Run OCR on Enhanced Image
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={async () => {
                    setEnhancedUrl(null);
                    setEnhancedImageData(null);
                    await runOcr();
                  }}
                >
                  Skip enhancement, use original
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setSettings(AUTO_SETTINGS)}
                >
                  Auto
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                >
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="grayscale" className="text-sm">
                  Grayscale
                </Label>
                <Checkbox
                  id="grayscale"
                  checked={settings.grayscale}
                  onCheckedChange={(v) => set("grayscale", v === true)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Contrast enhancement</Label>
                  <Checkbox
                    checked={settings.contrast}
                    onCheckedChange={(v) => set("contrast", v === true)}
                    aria-label="Toggle contrast enhancement"
                  />
                </div>
                <Slider
                  value={[settings.contrastAmount]}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!settings.contrast}
                  onValueChange={([v]) => set("contrastAmount", v)}
                />
                <p className="text-xs text-muted-foreground">
                  Stretch: {settings.contrastAmount}%
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Brightness</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.brightness > 0 ? "+" : ""}
                    {settings.brightness}
                  </span>
                </div>
                <Slider
                  value={[settings.brightness + 50]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => set("brightness", v - 50)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Sharpening</Label>
                  <Checkbox
                    checked={settings.sharpen}
                    onCheckedChange={(v) => set("sharpen", v === true)}
                    aria-label="Toggle sharpening"
                  />
                </div>
                <Slider
                  value={[settings.sharpenAmount]}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!settings.sharpen}
                  onValueChange={([v]) => set("sharpenAmount", v)}
                />
                <p className="text-xs text-muted-foreground">
                  Amount: {settings.sharpenAmount}%
                </p>
              </div>

              <div className="space-y-2 border-t border-border/70 pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Thresholding (binarize)</Label>
                  <Checkbox
                    checked={settings.threshold}
                    onCheckedChange={(v) => set("threshold", v === true)}
                    aria-label="Toggle thresholding"
                  />
                </div>
                <Slider
                  value={[settings.thresholdLevel]}
                  min={0}
                  max={254}
                  step={2}
                  disabled={!settings.threshold}
                  onValueChange={([v]) => set("thresholdLevel", v)}
                />
                <p className="text-xs text-muted-foreground">
                  {settings.thresholdLevel === 0
                    ? "0 = auto (Otsu)"
                    : `Level: ${settings.thresholdLevel}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3 — OCR */}
      {step === 3 && (
        <Card className="mx-auto max-w-xl text-center">
          <CardContent className="flex flex-col items-center gap-5 p-10">
            <div className="relative">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wand2 className="h-10 w-10" />
              </span>
              <Loader2 className="absolute -bottom-1 -right-1 h-7 w-7 animate-spin text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">
                {ocrError ? "OCR could not complete" : "Reading the inscription…"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {ocrError
                  ? ocrError
                  : "OCR is analysing the enhanced image and transcribing the Devanagari text — if your key or network is unavailable, LipiSetu falls back to its built-in engine."}
              </p>
            </div>
            {!ocrError && <Progress value={45} className="w-full max-w-xs" />}
            <div className="flex gap-2">
              {ocrError && (
                <>
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <Contrast className="h-4 w-4" /> Adjust Enhancement
                  </Button>
                  <Button onClick={runOcr} className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Retry OCR
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4 — Sanskrit text */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Sanskrit Text Extraction
            </CardTitle>
            <CardDescription>
              Check the extracted text below and correct anything the OCR may have
              misread — carvings can be ambiguous after centuries of weathering.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {ocrResult?.notes && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">OCR notes: </span>
                  {ocrResult.notes}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sanskrit">Extracted Devanagari text</Label>
                <Badge variant="secondary" className="font-devanagari text-xs">
                  संस्कृतम्
                </Badge>
              </div>
              <Textarea
                id="sanskrit"
                dir="auto"
                value={sanskritText}
                onChange={(e) => {
                  setSanskritText(e.target.value);
                  setSavedId(null);
                }}
                placeholder="The extracted Sanskrit text will appear here — you can edit it…"
                className="min-h-44 font-devanagari text-xl leading-relaxed"
              />
              {ocrResult?.transliteration && (
                <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Transliteration (IAST)
                  </p>
                  <p className="font-iast mt-1 whitespace-pre-wrap text-sm italic">
                    {ocrResult.transliteration}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={runTranslate} className="gap-2">
                <Languages className="h-4 w-4" /> Translate to English &amp; Kannada
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={runOcr} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Re-run OCR
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)} className="gap-2">
                <Contrast className="h-4 w-4" /> Back to Enhancement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5 — Translating */}
      {step === 5 && (
        <Card className="mx-auto max-w-xl text-center">
          <CardContent className="flex flex-col items-center gap-5 p-10">
            <div className="relative">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Languages className="h-10 w-10" />
              </span>
              <Loader2 className="absolute -bottom-1 -right-1 h-7 w-7 animate-spin text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">
                {translateError ? "Translation could not complete" : "Translating…"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {translateError
                  ? translateError
                  : "The engine is rendering the Sanskrit into scholarly English and fluent Kannada."}
              </p>
            </div>
            {!translateError && <Progress value={65} className="w-full max-w-xs" />}
            <div className="flex gap-2">
              {translateError ? (
                <>
                  <Button variant="outline" onClick={() => setStep(4)} className="gap-2">
                    <FileText className="h-4 w-4" /> Edit Text
                  </Button>
                  <Button onClick={runTranslate} className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Retry
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6 — Result */}
      {step === 6 && translation && originalUrl && (
        <div className="space-y-6">
          <ResultPanel
            title="Translation Result"
            originalImage={originalUrl}
            enhancedImage={enhancedUrl}
            sanskritText={sanskritText}
            transliteration={translation.transliteration || ocrResult?.transliteration}
            englishTranslation={translation.english}
            kannadaTranslation={translation.kannada}
            notes={translation.notes || ocrResult?.notes}
            engine={translateEngine ?? ocrEngine}
            translatedImage={translatedImage}
            translatedImageLoading={translatedImageLoading}
            translatedImageError={translatedImageError}
            onRegenerateTranslatedImage={generateTranslatedImage}
            imageEngine={imageEngine}
          />

          {/* Save card */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Save className="h-5 w-5 text-primary" />
                Save this result
              </CardTitle>
              <CardDescription>
                {user
                  ? "Store this translation in your personal history."
                  : "Login or create a free account to keep this result in your history."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Temple Wall Inscription, Hampi"
                    maxLength={120}
                  />
                </div>
                {user ? (
                  <Button
                    onClick={saveResult}
                    disabled={saving || !!savedId}
                    className="gap-2 sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                      </>
                    ) : savedId ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Result
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => navigate("login")} className="gap-2">
                    <LogIn className="h-4 w-4" /> Login to Save
                  </Button>
                )}
              </div>

              {savedId && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="flex flex-wrap items-center gap-2">
                    Saved to your history.
                    <button
                      className="font-medium text-primary hover:underline"
                      onClick={() => navigate("history")}
                    >
                      View My History →
                    </button>
                  </AlertDescription>
                </Alert>
              )}

              {!user && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Your session translations are temporary until you login.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
