import { TimelineBlockData } from '@/lib/types/partner';

interface TimelineBlockProps {
  data: TimelineBlockData;
}

export default function TimelineBlock({ data }: TimelineBlockProps) {
  return (
    <section 
      className="py-16 px-4 bg-gray-50 dark:bg-gray-800 transition-colors"
      role="region"
      aria-label="Partnership timeline"
    >
      <div className="container-custom max-w-4xl mx-auto">
        <ol className="relative list-none" role="list">
          {/* Timeline line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-brand-orange hidden md:block" aria-hidden="true" />

          {data.events.map((event, idx) => (
            <li key={idx} className="relative mb-12 last:mb-0">
              {/* Year badge */}
              <div className="md:absolute md:left-1/2 md:-translate-x-1/2 mb-4 md:mb-0">
                <time 
                  className="bg-brand-orange text-white px-6 py-2 rounded-full font-bold text-lg inline-block"
                  dateTime={event.year}
                >
                  {event.year}
                </time>
              </div>

              {/* Content */}
              <div className={`md:w-1/2 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:ml-auto md:pl-12'}`}>
                <article className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md border-l-4 border-brand-orange mt-8 md:mt-0 transition-colors">
                  {event.season && (
                    <div className="text-sm font-semibold text-brand-orange mb-2">
                      {event.season}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors">
                    {event.description}
                  </p>
                </article>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

