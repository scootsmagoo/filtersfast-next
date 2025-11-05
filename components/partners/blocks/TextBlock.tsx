import { TextBlockData } from '@/lib/types/partner';

interface TextBlockProps {
  data: TextBlockData;
}

export default function TextBlock({ data }: TextBlockProps) {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[data.alignment || 'left'];

  // OWASP A05 Fix: Use CSS classes instead of inline styles
  const bgColorClass = data.backgroundColor === '#085394' 
    ? 'bg-[#085394]' 
    : data.backgroundColor 
      ? `bg-[${data.backgroundColor}]` 
      : 'bg-transparent';
  
  const textColorClass = data.backgroundColor && data.backgroundColor !== 'transparent'
    ? 'text-white'
    : 'text-gray-700 dark:text-gray-100';

  return (
    <section 
      className={`py-12 px-4 transition-colors ${bgColorClass}`}
      role="region"
      aria-label={data.heading || 'Content section'}
    >
      <div className={`container-custom max-w-4xl mx-auto ${textColorClass}`}>
        {data.heading && (
          <h2 className={`text-3xl font-bold mb-6 transition-colors ${alignmentClass}`}>
            {data.heading}
          </h2>
        )}
        <div className={`max-w-none ${alignmentClass}`}>
          {data.content.split('\n\n').map((paragraph, idx) => (
            <p 
              key={idx} 
              className="mb-4 text-lg leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

