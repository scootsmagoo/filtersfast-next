'use client';

import { ContentBlock, Partner } from '@/lib/types/partner';
import HeroBlock from './blocks/HeroBlock';
import TextBlock from './blocks/TextBlock';
import StatsBlock from './blocks/StatsBlock';
import ImageGalleryBlock from './blocks/ImageGalleryBlock';
import TimelineBlock from './blocks/TimelineBlock';
import CTABlock from './blocks/CTABlock';
import VideoBlock from './blocks/VideoBlock';
import PerksBlock from './blocks/PerksBlock';

interface ContentBlockRendererProps {
  block: ContentBlock;
  partner: Partner;
}

export default function ContentBlockRenderer({ block, partner }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock data={block.data} />;
    case 'text':
      return <TextBlock data={block.data} />;
    case 'stats':
      return <StatsBlock data={block.data} />;
    case 'image_gallery':
      return <ImageGalleryBlock data={block.data} />;
    case 'timeline':
      return <TimelineBlock data={block.data} />;
    case 'cta':
      return <CTABlock data={block.data} />;
    case 'video':
      return <VideoBlock data={block.data} />;
    case 'perks':
      return <PerksBlock data={block.data} />;
    default:
      console.warn(`Unknown content block type: ${block.type}`);
      return null;
  }
}

