export interface GscStatus {
  isConnected: boolean;
  siteUrl: string | null;
  summary: {
    indexed: number;
    discovered: number;
    excluded: number;
    error: number;
    unknown: number;
  };
  instructions: string[];
}

export function getGscObservabilityStatus(): GscStatus {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY;
  const siteUrl = process.env.GSC_SITE_URL || "https://ropes.buzz/";

  const isConnected = Boolean(clientEmail && privateKey);

  return {
    isConnected,
    siteUrl: isConnected ? siteUrl : null,
    summary: {
      indexed: 0,
      discovered: 0,
      excluded: 0,
      error: 0,
      unknown: isConnected ? 0 : 117,
    },
    instructions: [
      "1. Open Google Search Console (search.google.com/search-console).",
      "2. Add URL prefix property for 'https://ropes.buzz/'.",
      "3. In Google Cloud Console, create a Service Account with 'Search Console Viewer' role.",
      "4. Generate a Service Account JSON Key.",
      "5. Set environment variables in Vercel / .env.local:",
      "   - GSC_CLIENT_EMAIL=<service-account-email>",
      "   - GSC_PRIVATE_KEY=<private-key-pem>",
      "   - GSC_SITE_URL=https://ropes.buzz/",
      "6. Submit sitemap: 'https://ropes.buzz/sitemap.xml'."
    ]
  };
}
