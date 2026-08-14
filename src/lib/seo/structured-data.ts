import { SITE_URL, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORGANIZATION_ID,
    name: "Ropes",
    url: SITE_URL,
    logo: `${SITE_URL}/images/ropes/hero-independent.webp`,
    description: "AI-powered professional transformation and project-building platform. Turn existing professional expertise into marketable, verifiable work.",
    sameAs: [],
    knowsAbout: [
      "Artificial Intelligence",
      "AI Automation",
      "AI Engineering",
      "AI Agents",
      "Retrieval-Augmented Generation (RAG)",
      "LLM Testing",
      "AI Security",
      "MLOps",
      "AI Product Management",
      "AI Freelancing",
      "One-Person Business Systems"
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Ropes Learning & Building Courses",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "AI Automation & No-Code Track",
          url: `${SITE_URL}/courses`
        },
        {
          "@type": "OfferCatalog",
          name: "Agentic AI & Engineering Track",
          url: `${SITE_URL}/courses`
        }
      ]
    }
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: "Ropes",
    description: "Turn existing professional expertise into AI-powered, demonstrable, marketable work.",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/courses?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export type WebPageJsonLdInput = {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
};

export function webPageJsonLd({ title, description, path, datePublished, dateModified }: WebPageJsonLdInput) {
  const canonical = `${SITE_URL}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: title,
    description: description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {})
  };
}

export function acquisitionPageFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function courseJsonLd({
  title,
  description,
  slug,
  price,
  track,
  modulesCount
}: {
  title: string;
  description: string;
  slug: string;
  price: number;
  track?: string | null;
  modulesCount?: number;
}) {
  const courseUrl = `${SITE_URL}/courses/${slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${courseUrl}#course`,
    name: title,
    description,
    provider: { "@id": ORGANIZATION_ID },
    url: courseUrl,
    offers: [
      {
        "@type": "Offer",
        category: "Paid",
        priceCurrency: "INR",
        price: price || 0,
        availability: "https://schema.org/InStock",
        url: courseUrl
      }
    ],
    educationalCredentialAwarded: {
      "@type": "EducationalOccupationalCredential",
      name: "Ropes Verifiable Skill & Project Evidence Token",
      credentialCategory: "Verifiable Project Evidence"
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT4H",
      instructor: { "@id": ORGANIZATION_ID }
    },
    ...(track ? { educationalLevel: track } : {}),
    ...(modulesCount ? { numberOfCredits: modulesCount } : {})
  };
}

export function itemListJsonLd(name: string, description: string, items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`
    }))
  };
}
