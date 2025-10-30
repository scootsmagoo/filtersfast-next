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

  const bgColor = data.backgroundColor || 'transparent';

  return (
    <div 
      className="py-12 px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="container-custom max-w-4xl mx-auto">
        {data.heading && (
          <h2 className={`text-3xl font-bold text-gray-900 mb-6 ${alignmentClass}`}>
            {data.heading}
          </h2>
        )}
        <div 
          className={`prose prose-lg max-w-none ${alignmentClass}`}
          style={{ color: bgColor !== 'transparent' ? '#ffffff' : 'inherit' }}
        >
          {data.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

