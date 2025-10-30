import { StatsBlockData } from '@/lib/types/partner';

interface StatsBlockProps {
  data: StatsBlockData;
}

export default function StatsBlock({ data }: StatsBlockProps) {
  const bgColor = data.backgroundColor || '#085394';
  const textColor = data.textColor || '#ffffff';

  return (
    <div 
      className="py-16 px-4"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {data.stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-3">
                {stat.number}
              </div>
              <div className="text-sm md:text-base font-medium uppercase tracking-wide opacity-90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

