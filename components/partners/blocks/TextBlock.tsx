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
      className={`py-12 px-4 transition-colors ${bgColor === 'transparent' ? 'bg-transparent' : ''}`}
      style={bgColor !== 'transparent' ? { backgroundColor: bgColor } : {}}
    >
      <div className="container-custom max-w-4xl mx-auto text-gray-700 dark:text-gray-100">
        {data.heading && (
          <h2 className={`text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors ${alignmentClass}`}>
            {data.heading}
          </h2>
        )}
        <div 
          className={`max-w-none ${alignmentClass}`}
        >
          {data.content.split('\n\n').map((paragraph, idx) => (
            <p 
              key={idx} 
              className="mb-4 text-lg leading-relaxed"
              style={
                bgColor !== 'transparent' 
                  ? { color: '#ffffff' } 
                  : undefined
              }
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

