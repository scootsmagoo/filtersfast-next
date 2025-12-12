import { StatsBlockData } from '@/lib/types/partner';

interface StatsBlockProps {
  data: StatsBlockData;
}

export default function StatsBlock({ data }: StatsBlockProps) {
  // OWASP A05 Fix: Use CSS classes instead of inline styles
  const bgColorClass = data.backgroundColor === '#085394' 
    ? 'bg-[#085394]' 
    : 'bg-brand-blue';
  
  const textColorClass = data.textColor === '#ffffff' || !data.textColor
    ? 'text-white'
    : 'text-gray-900';

  return (
    <section 
      className={`py-16 px-4 ${bgColorClass} ${textColorClass}`}
      role="region"
      aria-label="Partnership impact statistics"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {data.stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-3" role="text">
                {stat.number}
              </div>
              <div className="text-sm md:text-base font-medium uppercase tracking-wide opacity-90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

