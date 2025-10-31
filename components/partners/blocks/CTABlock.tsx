import { CTABlockData } from '@/lib/types/partner';
import { ExternalLink } from 'lucide-react';

interface CTABlockProps {
  data: CTABlockData;
}

export default function CTABlock({ data }: CTABlockProps) {
  const bgColor = data.backgroundColor || '#ffffff';

  return (
    <div 
      className="py-16 px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="container-custom max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
          {data.heading}
        </h2>
        {data.description && (
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 transition-colors">
            {data.description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {data.buttons.map((button, idx) => (
            <a
              key={idx}
              href={button.url}
              target={button.external ? '_blank' : undefined}
              rel={button.external ? 'noopener noreferrer' : undefined}
              className={`inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-colors ${
                button.variant === 'secondary'
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-brand-orange text-white hover:bg-brand-orange-dark'
              }`}
            >
              {button.text}
              {button.external && <ExternalLink className="w-5 h-5" />}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

