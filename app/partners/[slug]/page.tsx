import { notFound } from 'next/navigation';
import { getPartnerBySlug } from '@/lib/db/partners';
import { Partner, ContentBlock } from '@/lib/types/partner';
import { Metadata } from 'next';
import PartnerPageContent from '@/components/partners/PartnerPageContent';

interface PartnerPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PartnerPageProps): Promise<Metadata> {
  const partner = getPartnerBySlug(params.slug);

  if (!partner || !partner.active) {
    return {
      title: 'Partner Not Found',
    };
  }

  return {
    title: partner.metaTitle || `${partner.name} | FiltersFast.com`,
    description: partner.metaDescription || partner.shortDescription,
    openGraph: {
      title: partner.metaTitle || partner.name,
      description: partner.metaDescription || partner.shortDescription,
      images: partner.heroImage ? [partner.heroImage] : [],
    },
  };
}

export default function PartnerPage({ params }: PartnerPageProps) {
  const partner = getPartnerBySlug(params.slug);

  if (!partner || !partner.active) {
    notFound();
  }

  return <PartnerPageContent partner={partner} />;
}

