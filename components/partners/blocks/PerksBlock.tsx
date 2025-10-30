import { PerksBlockData } from '@/lib/types/partner';

interface PerksBlockProps {
  data: PerksBlockData;
}

export default function PerksBlock({ data }: PerksBlockProps) {
  const bgColor = data.backgroundColor || '#085394';
  const columns = data.columns || 4;
  
  const gridClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[columns] || 'md:grid-cols-4';

  return (
    <div 
      className="py-16 px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="container-custom">
        {data.title && (
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {data.title}
          </h2>
        )}
        
        <div className={`grid grid-cols-1 ${gridClass} gap-8 max-w-6xl mx-auto`}>
          {data.perks.map((perk, idx) => (
            <div key={idx} className="text-center">
              {perk.icon && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={perk.icon}
                    alt=""
                    className="w-16 h-16 object-contain"
                  />
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">
                {perk.title}
              </h3>
              <p className="text-white/90">
                {perk.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

