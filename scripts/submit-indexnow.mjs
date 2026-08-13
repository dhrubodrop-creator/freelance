const host = "ropes.buzz";
const key = "b7a8e1cc8fafebcf38ace714814fb78c";
const keyLocation = `https://${host}/${key}.txt`;
const sitemapUrl = `https://${host}/sitemap.xml`;

const keyResponse = await fetch(keyLocation);
if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) {
  throw new Error(`IndexNow key verification failed at ${keyLocation}.`);
}

const requested = process.argv.slice(2);
let candidates = requested;

if (candidates.length === 0) {
  const sitemapResponse = await fetch(sitemapUrl);
  if (!sitemapResponse.ok) {
    throw new Error(`Could not read ${sitemapUrl}: HTTP ${sitemapResponse.status}`);
  }
  const sitemap = await sitemapResponse.text();
  candidates = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const urls = [...new Set(candidates.map((candidate) => {
  const url = new URL(candidate, `https://${host}`);
  if (url.protocol !== "https:" || url.hostname !== host || url.search || url.hash) {
    throw new Error(`IndexNow only accepts canonical ${host} URLs without query strings or fragments: ${candidate}`);
  }
  return url.pathname === "/" ? `https://${host}` : url.toString().replace(/\/$/, "");
}))];

if (urls.length === 0) throw new Error("No canonical URLs were supplied for IndexNow.");
if (urls.length > 10_000) throw new Error("IndexNow accepts at most 10,000 URLs per submission.");

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList: urls }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow rejected the submission: HTTP ${response.status} ${await response.text()}`);
}

console.log(`IndexNow accepted ${urls.length} ${requested.length ? "changed" : "sitemap"} canonical URLs (HTTP ${response.status}).`);
