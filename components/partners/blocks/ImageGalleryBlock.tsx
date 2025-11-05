'use client';

import { useState } from 'react';
import { ImageGalleryBlockData } from '@/lib/types/partner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryBlockProps {
  data: ImageGalleryBlockData;
}

export default function ImageGalleryBlock({ data }: ImageGalleryBlockProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const layout = data.layout || 'carousel';

  if (layout === 'carousel') {
    return (
      <div className="py-12 px-4 bg-gray-900">
        <div className="container-custom max-w-6xl mx-auto">
          <div 
            className="relative"
            role="region"
            aria-roledescription="carousel"
            aria-label="Image gallery"
          >
            {/* Main Image */}
            <div 
              className="relative h-[400px] md:h-[600px] overflow-hidden rounded-lg"
              aria-live="polite"
              aria-atomic="true"
            >
              <img
                src={data.images[currentIndex].url}
                alt={data.images[currentIndex].alt}
                className="w-full h-full object-cover"
                loading="lazy"
                width={1200}
                height={600}
              />
              {data.images[currentIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4">
                  <p className="text-center">{data.images[currentIndex].caption}</p>
                </div>
              )}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                Image {currentIndex + 1} of {data.images.length}
              </div>
            </div>

            {/* Navigation */}
            {data.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex((currentIndex - 1 + data.images.length) % data.images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white focus:bg-white rounded-full flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-label={`Previous image (${currentIndex} of ${data.images.length})`}
                  aria-controls="carousel-content"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-900" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setCurrentIndex((currentIndex + 1) % data.images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white focus:bg-white rounded-full flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-label={`Next image (${currentIndex + 2} of ${data.images.length})`}
                  aria-controls="carousel-content"
                >
                  <ChevronRight className="w-6 h-6 text-gray-900" aria-hidden="true" />
                </button>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-4" role="group" aria-label="Carousel pagination">
                  {data.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        idx === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                      aria-current={idx === currentIndex ? 'true' : 'false'}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <section 
      className="py-12 px-4"
      role="region"
      aria-label="Image gallery"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.images.map((image, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-lg aspect-video">
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
                width={600}
                height={338}
              />
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3">
                  <p className="text-sm">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

