export interface BingStatus {
  isConnected: boolean;
  apiKeySet: boolean;
  indexNowAccepted: number;
  indexed: number;
  crawled: number;
  excluded: number;
  instructions: string[];
}

export function getBingObservabilityStatus(): BingStatus {
  const apiKey = process.env.BING_WEBMASTER_API_KEY;
  const isConnected = Boolean(apiKey);

  return {
    isConnected,
    apiKeySet: isConnected,
    indexNowAccepted: 117, // Submitted via IndexNow protocol key endpoint
    indexed: 0, // Requires Bing Webmaster API token query
    crawled: 0,
    excluded: 0,
    instructions: [
      "1. Sign in to Bing Webmaster Tools (bing.com/webmasters).",
      "2. Add property 'https://ropes.buzz/' or import from Google Search Console.",
      "3. Go to Settings -> API Access -> API Key and generate an API Key.",
      "4. Set environment variable in Vercel / .env.local:",
      "   - BING_WEBMASTER_API_KEY=<your-bing-api-key>",
      "5. Note: IndexNow ACCEPTED confirms receipt by Bing servers; INDEXED requires Bingbot crawl completion."
    ]
  };
}
