import { AcquisitionPageTemplate } from "@/components/marketing/acquisition-page";
import { ACQUISITION_PAGES } from "@/lib/acquisition-content";
import { pageMetadata } from "@/lib/seo";

const page = ACQUISITION_PAGES["ai-automation-freelancing"];
export const metadata = pageMetadata({ title: "AI Automation Freelancing: Build Client-Ready Workflows", description: page.description, path: "/ai-automation-freelancing", keywords: ["AI automation freelancing", "AI automation services", "n8n freelancing"] });
export default function Page() { return <AcquisitionPageTemplate page={page} />; }
