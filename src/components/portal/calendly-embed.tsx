"use client";

import Script from "next/script";

export function CalendlyEmbed({ url }: { url: string }) {
  return (
    <>
      <div className="calendly-inline-widget h-[700px] w-full rounded-xl border border-border" data-url={url} />
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
    </>
  );
}
