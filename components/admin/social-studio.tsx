"use client";
import { useEffect, useMemo, useState } from "react";
import { useTable } from "@/lib/hooks";
import { Btn, Card, PageHead, Tag } from "./ui";
import { IgStories } from "./ig-stories";
import { qrDataUrl } from "@/lib/qr";
import {
  SOCIAL_CATEGORIES,
  SOCIAL_TEMPLATES,
  buildSocialContext,
  downloadSocialTemplate,
  socialPageCount,
  socialPreviewUrls,
  type SocialCategory,
  type SocialContext,
  type SocialTemplate,
} from "@/lib/social-studio";
import type { Attire, Faq, WeddingInfo } from "@/lib/types";

/* One template: cover thumb, page count, download-all, and an expandable page-by-page strip. */
function TemplateCard({
  template,
  ctx,
  fontsReady,
}: {
  template: SocialTemplate;
  ctx: SocialContext;
  fontsReady: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const total = useMemo(() => socialPageCount(template, ctx), [template, ctx]);
  const cover = useMemo(
    () => (fontsReady ? socialPreviewUrls(template, ctx, template.format === "story" ? 170 : 220)[0] : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsReady, template, ctx],
  );
  const thumbCls =
    template.format === "story"
      ? "h-64 w-auto"
      : template.format === "post"
        ? "h-72 w-auto aspect-[4/5]"
        : "w-40 h-40";

  useEffect(() => {
    if (!fontsReady || !open) return;
    try {
      setPreviews(socialPreviewUrls(template, ctx, template.format === "post" ? 200 : 220));
    } catch {
      /* canvas unavailable — downloads still work after font load */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsReady, open, ctx]);

  const downloadAll = async () => {
    setBusy(true);
    try {
      const count = await downloadSocialTemplate(template, ctx, (n, t) => setProgress(`${n} / ${t}`));
      setProgress(`saved ${count} PNG${count === 1 ? "" : "s"} ✓`);
      setTimeout(() => setProgress(""), 3500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{template.title}</span>
            <Tag>
              {template.format === "story" ? "story · 9:16" : template.format === "post" ? "feed · 4:5" : "cover · 1:1"}
            </Tag>
            {total > 1 && <Tag>{`${total} pages`}</Tag>}
          </div>
          <p className="text-xs text-ink/55 mt-1.5">{template.blurb}</p>
        </div>
      </div>

      {/* Always show the first page as the cover thumb */}
      {fontsReady && cover && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-4 self-center" title={open ? "Hide pages" : "Preview all pages"}>
          <img
            src={cover}
            alt={template.title}
            className={`rounded-xl border border-taupe/25 shadow-[0_10px_24px_-16px_rgba(61,47,38,.6)] object-contain ${thumbCls}`}
          />
        </button>
      )}

      {open && (
        <div className="mt-4 pt-4 border-t border-ink/10">
          {previews.length === 0 ? (
            <p className="text-xs text-ink/40 py-6 text-center">Drawing pages…</p>
          ) : (
            <div className={`grid gap-3 ${template.format === "post" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
              {previews.map((src, i) => (
                <div key={i} className="text-center">
                  <img src={src} alt={`Page ${i + 1}`} className="w-full rounded-lg border border-taupe/20 object-contain" />
                  <span className="label !text-[9px] text-ink/50 mt-1 inline-block">
                    {template.format === "story" ? `story ${i + 1}/${total}` : total > 1 ? `cover ${i + 1}` : "post"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center gap-2 flex-wrap">
        <Btn variant="dark" onClick={() => void downloadAll()} disabled={busy}>
          {busy ? `Saving ${progress}…` : total > 1 ? `Download all ${total}` : "Download PNG"}
        </Btn>
        <Btn variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide pages" : `Preview ${total > 1 ? `${total} pages` : ""}`.trim()}
        </Btn>
        {progress && !busy && <span className="text-xs text-moss">{progress}</span>}
      </div>
    </Card>
  );
}

export function SocialStudio() {
  const { rows: infoRows } = useTable("wedding_info");
  const { rows: attire } = useTable("attire");
  const { rows: faqs } = useTable("faq");
  const info = infoRows[0] as WeddingInfo | undefined;

  const [category, setCategory] = useState<SocialCategory | "all">("all");
  const [ctx, setCtx] = useState<SocialContext | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    qrDataUrl(`${origin}/upload`, 1024)
      .then((url) => live && setQrUrl(url))
      .catch(() => live && setQrUrl(null));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    Promise.all([
      import("@/lib/ig-stories").then((m) => m.loadIgFonts()),
      buildSocialContext(info, attire as Attire[], faqs as Faq[], qrUrl),
    ]).then(([, built]) => {
      if (live) {
        setCtx(built);
        setFontsReady(true);
      }
    });
    return () => {
      live = false;
    };
  }, [info, attire, faqs, qrUrl]);

  const templates = useMemo(
    () => (category === "all" ? SOCIAL_TEMPLATES : SOCIAL_TEMPLATES.filter((t) => t.category === category)),
    [category],
  );

  const counts = useMemo(() => {
    const m = new Map<SocialCategory, number>();
    for (const t of SOCIAL_TEMPLATES) m.set(t.category, (m.get(t.category) ?? 0) + 1);
    return m;
  }, []);

  return (
    <div className="space-y-6">
      <PageHead kicker="Story series · feed posts · highlight covers · frames" title="Social studio.">
        <Tag>{`${SOCIAL_TEMPLATES.length} templates`}</Tag>
      </PageHead>

      <p className="text-sm text-ink/60 max-w-3xl -mt-3">
        Your Instagram content desk for the final countdown. Every template is drawn from the live binder — the programme,
        the attire palette, your FAQ, handle and hashtags — in the wedding&apos;s own stationery style. Big topics come as a{" "}
        <b>story series</b>: download the pages and post them in order. Feed downloads are 4:5 portrait (1080 × 1350, the
        tallest size the grid accepts); highlight covers stay square for Instagram&apos;s circle crop.
      </p>

      {!ctx && <div className="py-16 text-center text-ink/40 font-serif text-2xl italic">Preparing your templates…</div>}

      {ctx && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`label !text-[10px] rounded-full px-4 py-2 border transition-colors ${
                category === "all" ? "bg-wine text-lace border-wine" : "border-ink/15 text-ink/60 hover:border-wine"
              }`}
            >
              all ({SOCIAL_TEMPLATES.length})
            </button>
            {SOCIAL_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`label !text-[10px] rounded-full px-4 py-2 border transition-colors ${
                  category === c ? "bg-wine text-lace border-wine" : "border-ink/15 text-ink/60 hover:border-wine"
                }`}
              >
                {c} ({counts.get(c) ?? 0})
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} ctx={ctx} fontsReady={fontsReady} />
            ))}
          </div>
        </>
      )}

      {/* The original story cards, transparent frame builder and upload QR live below. */}
      <div className="pt-4">
        <IgStories embedded />
      </div>
    </div>
  );
}
