import { AcquisitionPageTemplate } from "@/components/marketing/acquisition-page";
import { ACQUISITION_PAGES } from "@/lib/acquisition-content";
import { pageMetadata } from "@/lib/seo";

const page = ACQUISITION_PAGES["freelancing-without-coding"];
export const metadata = pageMetadata({ title: "Freelancing With AI Without Coding", description: page.description, path: "/freelancing-without-coding", keywords: ["freelancing without coding", "AI freelancing for non technical professionals", "no code freelancing"] });
export default function Page() { return <AcquisitionPageTemplate page={page} />; }
