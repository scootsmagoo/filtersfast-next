import { HeroBlockData } from '@/lib/types/partner';

interface HeroBlockProps {
  data: HeroBlockData;
}

export default function HeroBlock({ data }: HeroBlockProps) {
  return (
    <div className="relative w-full">
      {/* Hero Image */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        <img
          src={data.image}
          alt={data.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {data.title}
            </h1>
            {data.subtitle && (
              <p className="text-xl md:text-2xl text-white/90 mb-6 drop-shadow-lg">
                {data.subtitle}
              </p>
            )}
            {data.ctaText && data.ctaUrl && (
              <a
                href={data.ctaUrl}
                className="inline-block px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-orange-dark transition-colors shadow-lg"
              >
                {data.ctaText}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

