import { AcquisitionPageTemplate } from "@/components/marketing/acquisition-page";
import { ACQUISITION_PAGES } from "@/lib/acquisition-content";
import { pageMetadata } from "@/lib/seo";

const page = ACQUISITION_PAGES["solopreneur-with-ai"];
export const metadata = pageMetadata({ title: "Solopreneur With AI: Build a Capable One-Person Business", description: page.description, path: "/solopreneur-with-ai", keywords: ["AI solopreneur", "one person business with AI", "AI tools for solopreneurs"] });
export default function Page() { return <AcquisitionPageTemplate page={page} />; }
