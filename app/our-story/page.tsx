'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import Card from '@/components/ui/Card';

// Server-side metadata is exported in layout.tsx or can be added via Metadata API

export default function OurStoryPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const teamImages = [
    { src: '/images/our-story1.jpg', alt: 'FiltersFast team members collaborating in the office' },
    { src: '/images/our-story2.jpg', alt: 'FiltersFast warehouse and fulfillment center' },
    { src: '/images/our-story3.jpg', alt: 'FiltersFast customer service team helping customers' },
    { src: '/images/our-story4.jpg', alt: 'FiltersFast team celebrating company milestone' },
    { src: '/images/our-story5.jpg', alt: 'FiltersFast leadership team and employees' },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % teamImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + teamImages.length) % teamImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  // Auto-advance carousel (WCAG 2.2.2 compliant with pause control)
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % teamImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, teamImages.length]);

  // Pause auto-play on user interaction
  const handleUserInteraction = () => {
    setIsAutoPlaying(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section 
        className="relative h-[400px] bg-gradient-to-r from-brand-blue to-brand-blue-dark flex items-center justify-center"
        aria-labelledby="page-title"
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 container-custom text-center">
          <h1 id="page-title" className="text-5xl md:text-6xl font-bold text-white">
            Our Story
          </h1>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="container-custom py-16" aria-labelledby="intro-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="intro-heading" className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8 transition-colors">
            In 2003, Ray Scardigno became frustrated trying to purchase his refrigerator filter online...
          </h2>

          <Card className="p-8 mb-12 bg-brand-orange/5 dark:bg-brand-orange/10 border-l-4 border-brand-orange transition-colors">
            <blockquote className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed transition-colors">
              <p className="mb-4">
                There were only a handful of small sites selling filters online. My refrigerator filter seemed like a common type and I didn&apos;t want to pay the mark up of the big box stores but I simply could not figure out how to buy filters online. I saw an opportunity to create a shopping experience where customers could find the filter they need fast and deliver their product for a great price!
              </p>
              <footer className="text-right">
                <cite className="font-bold text-gray-900 dark:text-gray-100 not-italic transition-colors">
                  - Ray Scardigno, Founder/CEO Filters Fast
                </cite>
              </footer>
            </blockquote>
          </Card>

          {/* Video Section */}
          <div className="mb-12">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                title="FiltersFast Company Story Video - Learn about our journey"
                src="https://www.youtube.com/embed/xdQWnKSkPng"
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Mission Text */}
          <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 space-y-6 transition-colors">
            <p>
              Since 2004, Filters Fast has grown to become the top filtration provider online in the United States and continues to grow rapidly. Though we have expanded to sell filters all over the world, Filters Fast still remains a family owned business located in Charlotte, NC.
            </p>
            <p>
              Filters Fast&apos;s mission is to provide our customers with the best filtration shopping experience - a comprehensive catalog that is easy to navigate, the tools and education to make the right choice, and the best customer experience and support to help along the way. Each member of our team knows that everything they do is important and can change lives! This mindset is what drives us to the highest levels of performance and innovation. Our focus is filtration, but our mission is so much more than that.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section 
        className="bg-gray-50 dark:bg-gray-800 py-16 transition-colors" 
        aria-labelledby="team-heading"
      >
        <div className="container-custom">
          <h2 id="team-heading" className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12 transition-colors">
            The Faces Behind the Business
          </h2>

          <div className="max-w-6xl mx-auto">
            {/* Image Carousel */}
            <div 
              className="relative"
              role="region"
              aria-label="Team photos carousel"
              aria-live="polite"
            >
              {/* Main Image Display */}
              <div className="overflow-hidden rounded-lg shadow-xl">
                <div className="relative h-[400px] md:h-[500px]">
                  {teamImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden={index !== currentSlide}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button
                type="button"
                onClick={() => {
                  handleUserInteraction();
                  prevSlide();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-full shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-brand-orange focus:ring-offset-2"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUserInteraction();
                  nextSlide();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-full shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-brand-orange focus:ring-offset-2"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" aria-hidden="true" />
              </button>

              {/* Play/Pause Button - WCAG 2.2.2 Compliance */}
              <button
                type="button"
                onClick={toggleAutoPlay}
                className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-full shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-brand-orange focus:ring-offset-2 z-10"
                aria-label={isAutoPlaying ? 'Pause carousel auto-play' : 'Resume carousel auto-play'}
              >
                {isAutoPlaying ? (
                  <Pause className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Play className="w-5 h-5" aria-hidden="true" />
                )}
              </button>

              {/* Slide Indicators */}
              <div className="flex justify-center gap-2 mt-6" role="group" aria-label="Carousel navigation">
                {teamImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      handleUserInteraction();
                      goToSlide(index);
                    }}
                    className={`w-3 h-3 rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-brand-orange focus:ring-offset-2 ${
                      index === currentSlide
                        ? 'bg-brand-orange w-8'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                    aria-current={index === currentSlide}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Awards & Associations Section */}
      <section 
        className="container-custom py-16"
        aria-labelledby="awards-heading"
      >
        <h2 id="awards-heading" className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12 transition-colors">
          Awards &amp; Associations
        </h2>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center justify-items-center">
            <div className="flex items-center justify-center p-4">
              <Image
                src="/images/twp2024.png"
                alt="Top Work Places 2024 Award"
                width={105}
                height={195}
                className="w-auto h-auto max-h-48"
              />
            </div>
            <div className="flex items-center justify-center p-4">
              <Image
                src="/images/tptw2023.jpeg"
                alt="Top Work Places 2018 through 2023 Awards"
                width={200}
                height={135}
                className="w-auto h-auto max-h-32"
              />
            </div>
            <div className="flex items-center justify-center p-4">
              <Image
                src="/images/bptw2023.png"
                alt="Best Places to Work 2023 Award"
                width={150}
                height={147}
                className="w-auto h-auto max-h-32"
              />
            </div>
            <div className="flex items-center justify-center p-4">
              <Image
                src="/images/water-quality.png"
                alt="Water Quality Association Member"
                width={200}
                height={135}
                className="w-auto h-auto max-h-32"
              />
            </div>
            <div className="flex items-center justify-center p-4">
              <Image
                src="/images/nafa.png"
                alt="National Air Filtration Association Member"
                width={200}
                height={135}
                className="w-auto h-auto max-h-32"
              />
            </div>
            <div className="flex items-center justify-center p-4">
              <Image
                src="/images/bbb-a-plus.png"
                alt="Better Business Bureau A+ Rating"
                width={200}
                height={135}
                className="w-auto h-auto max-h-32"
              />
            </div>
            <div className="flex items-center justify-center p-4">
              <Image
                src="/images/family-business-award.png"
                alt="Family Business Award"
                width={200}
                height={135}
                className="w-auto h-auto max-h-32"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

