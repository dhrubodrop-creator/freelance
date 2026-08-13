import { AcquisitionPageTemplate } from "@/components/marketing/acquisition-page";
import { ACQUISITION_PAGES } from "@/lib/acquisition-content";
import { pageMetadata } from "@/lib/seo";

const page = ACQUISITION_PAGES["turn-skills-into-freelance-services"];
export const metadata = pageMetadata({ title: "Turn Existing Skills Into Freelance Services With AI", description: page.description, path: "/turn-skills-into-freelance-services", keywords: ["turn skills into freelance services", "freelancing with existing skills", "AI services to offer"] });
export default function Page() { return <AcquisitionPageTemplate page={page} />; }
