"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CalendarDays,
  Download,
  FileText,
  ImageIcon,
  IdCard,
  Languages,
  Loader2,
  RefreshCw,
  ScrollText,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  composeTranslationCard,
  downloadDataUrl,
} from "@/lib/translation-card";

export type ResultPanelProps = {
  title: string;
  createdAt?: string;
  originalImage: string;
  enhancedImage?: string | null;
  sanskritText: string;
  transliteration?: string | null;
  englishTranslation?: string | null;
  kannadaTranslation?: string | null;
  notes?: string | null;
  /** AI engine that produced the OCR/translation, e.g. "OCR" */
  engine?: string | null;
  /** AI-generated translated image (data URL), if one was produced */
  translatedImage?: string | null;
  translatedImageLoading?: boolean;
  translatedImageError?: string | null;
  onRegenerateTranslatedImage?: () => void;
  /** Model used for the AI translated image, e.g. "OCR" */
  imageEngine?: string | null;
};

export function ResultPanel({
  title,
  createdAt,
  originalImage,
  enhancedImage,
  sanskritText,
  transliteration,
  englishTranslation,
  kannadaTranslation,
  notes,
  engine,
  translatedImage,
  translatedImageLoading,
  translatedImageError,
  onRegenerateTranslatedImage,
  imageEngine,
}: ResultPanelProps) {
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  // Translation card (deterministic canvas composition)
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const composeCard = async () => {
    setCardLoading(true);
    setCardError(null);
    try {
      const url = await composeTranslationCard({
        title,
        originalImage,
        sanskrit: sanskritText,
        transliteration,
        english: englishTranslation,
        kannada: kannadaTranslation,
        engineNote: imageEngine ?? engine ?? null,
      });
      setCardUrl(url);
    } catch {
      setCardError(
        "Could not compose the card in this browser. Please try again."
      );
    } finally {
      setCardLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          {dateStr && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateStr}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {engine && (
            <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {engine}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            LipiSetu Translation
          </Badge>
        </div>
      </div>

      {/* Images */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ImageIcon className="h-4 w-4 text-primary" />
              Original Inscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/40">
              <img
                src={originalImage}
                alt="Original inscription image"
                className="max-h-96 w-full object-contain"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Enhanced Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enhancedImage ? (
              <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/40">
                <img
                  src={enhancedImage}
                  alt="Enhanced inscription image"
                  className="max-h-96 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                No enhanced version was generated
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sanskrit text */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ScrollText className="h-4 w-4 text-primary" />
            Sanskrit Text (Devanagari)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap font-devanagari text-2xl leading-relaxed">
            {sanskritText}
          </p>
          {transliteration && (
            <>
              <Separator className="my-4" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                IAST Transliteration
              </p>
              <p className="font-iast mt-1.5 whitespace-pre-wrap text-sm italic leading-relaxed">
                {transliteration}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Translations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Languages className="h-4 w-4 text-primary" />
              English Translation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">
              {englishTranslation ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Languages className="h-4 w-4 text-primary" />
              Kannada Translation
              <span className="font-kannada text-xs text-muted-foreground">(ಕನ್ನಡ)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-kannada whitespace-pre-wrap text-lg leading-relaxed">
              {kannadaTranslation ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Translated Image */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-primary" />
            Translated Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ai">
            <TabsList className="mb-3">
              <TabsTrigger value="ai" className="gap-1.5">
                <Wand2 className="h-3.5 w-3.5" />
                AI-Generated
              </TabsTrigger>
              <TabsTrigger value="card" className="gap-1.5">
                <IdCard className="h-3.5 w-3.5" />
                Clean Card
              </TabsTrigger>
            </TabsList>

            {/* AI-generated translated image */}
            <TabsContent value="ai" className="mt-0 space-y-3">
              {translatedImageLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">
                    Creating the translated image…
                  </p>
                  <p className="max-w-sm text-center text-xs text-muted-foreground">
                    The image model composes a museum-style plaque from your
                    inscription photo and its translations. This can take up to
                    a minute.
                  </p>
                </div>
              ) : translatedImage ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/40">
                    <img
                      src={translatedImage}
                      alt="AI-generated translated image of the inscription"
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        downloadDataUrl(
                          translatedImage,
                          `lipisetu-translated-image-${Date.now()}.png`
                        )
                      }
                    >
                      <Download className="h-4 w-4" /> Download Image
                    </Button>
                    {onRegenerateTranslatedImage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={onRegenerateTranslatedImage}
                      >
                        <RefreshCw className="h-4 w-4" /> Regenerate
                      </Button>
                    )}
                    {imageEngine && (
                      <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        {imageEngine}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : translatedImageError ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        AI image generation unavailable
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {translatedImageError}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {onRegenerateTranslatedImage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={onRegenerateTranslatedImage}
                      >
                        <RefreshCw className="h-4 w-4" /> Try Again
                      </Button>
                    )}
                    <p className="self-center text-xs text-muted-foreground">
                      The “Clean Card” tab always produces a downloadable
                      translated image.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-4">
                    <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No AI translated image was generated for this result.
                    </p>
                  </div>
                  {onRegenerateTranslatedImage && (
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={onRegenerateTranslatedImage}
                    >
                      <Wand2 className="h-4 w-4" /> Generate translated image
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Clean card */}
            <TabsContent value="card" className="mt-0 space-y-3">
              {cardUrl ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/40">
                    <img
                      src={cardUrl}
                      alt="Translation card with Sanskrit, English and Kannada text"
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        downloadDataUrl(
                          cardUrl,
                          `lipisetu-translation-card-${Date.now()}.jpg`
                        )
                      }
                    >
                      <Download className="h-4 w-4" /> Download Card
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={composeCard}
                      disabled={cardLoading}
                    >
                      {cardLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Recompose
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
                  <IdCard className="h-8 w-8 text-primary" />
                  <p className="max-w-md text-sm text-muted-foreground">
                    Compose a museum-style card with the original photo and the
                    Sanskrit, English and Kannada text rendered exactly —
                    perfect for sharing and printing.
                  </p>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={composeCard}
                    disabled={cardLoading}
                  >
                    {cardLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Composing…
                      </>
                    ) : (
                      <>
                        <IdCard className="h-4 w-4" /> Compose Translation Card
                      </>
                    )}
                  </Button>
                  {cardError && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" /> {cardError}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notes */}
      {notes && (
        <Card className="border-primary/25 bg-secondary/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Epigraphic Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90">{notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
