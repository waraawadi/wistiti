import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingUseCasePage } from "@/components/marketing/marketing-use-case-page";
import { MARKETING_USE_CASES_BY_SLUG, MARKETING_USE_CASE_SLUGS } from "@/lib/marketing-use-cases";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return MARKETING_USE_CASE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const c = MARKETING_USE_CASES_BY_SLUG[params.slug];
  if (!c) {
    return { title: "Cas d'usage" };
  }
  return {
    title: `${c.title} — collecte photos d’événements`,
    description: c.teaser,
  };
}

export default function CasUsageDetailPage({ params }: Props) {
  const content = MARKETING_USE_CASES_BY_SLUG[params.slug];
  if (!content) {
    notFound();
  }
  return <MarketingUseCasePage content={content} />;
}
