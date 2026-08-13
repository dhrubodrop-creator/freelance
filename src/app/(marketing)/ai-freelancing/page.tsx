import { AcquisitionPageTemplate } from "@/components/marketing/acquisition-page";
import { ACQUISITION_PAGES } from "@/lib/acquisition-content";
import { pageMetadata } from "@/lib/seo";

const page = ACQUISITION_PAGES["ai-freelancing"];
export const metadata = pageMetadata({ title: "AI Freelancing: Skills, Systems, Portfolio & Services", description: page.description, path: "/ai-freelancing", keywords: ["AI freelancing", "AI skills for freelancers", "freelance AI services", "how to sell AI services"] });
export default function Page() { return <AcquisitionPageTemplate page={page} />; }
