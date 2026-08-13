import { AcquisitionPageTemplate } from "@/components/marketing/acquisition-page";
import { ACQUISITION_PAGES } from "@/lib/acquisition-content";
import { pageMetadata } from "@/lib/seo";

const page = ACQUISITION_PAGES["side-hustle-for-working-professionals"];
export const metadata = pageMetadata({ title: "AI Side Hustle for Working Professionals", description: page.description, path: "/side-hustle-for-working-professionals", keywords: ["AI side hustle", "side income for working professionals", "side hustle without quitting job"] });
export default function Page() { return <AcquisitionPageTemplate page={page} />; }
