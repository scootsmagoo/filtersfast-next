import { CTABlockData } from '@/lib/types/partner';
import { ExternalLink } from 'lucide-react';

interface CTABlockProps {
  data: CTABlockData;
}

export default function CTABlock({ data }: CTABlockProps) {
  // OWASP A05 Fix: Use CSS classes instead of inline styles
  const bgColorClass = data.backgroundColor 
    ? `bg-[${data.backgroundColor}]`
    : 'bg-white dark:bg-gray-900';

  return (
    <section 
      className={`py-16 px-4 ${bgColorClass} transition-colors`}
      role="region"
      aria-label="Call to action"
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
              className={`inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                button.variant === 'secondary'
                  ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-600'
                  : 'bg-brand-orange text-white hover:bg-brand-orange-dark focus:ring-brand-orange'
              }`}
              aria-label={button.external ? `${button.text} (opens in new tab)` : button.text}
            >
              {button.text}
              {button.external && <ExternalLink className="w-5 h-5" aria-hidden="true" />}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

