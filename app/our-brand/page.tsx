'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function OurBrandPage() {
  // Set page metadata
  useEffect(() => {
    document.title = 'Our Brand | FiltersFast.com';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover FiltersFast brand air and water filters - proudly made in the USA with NSF certification. Quality filtration at affordable prices.');
    }
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      image: '/images/ff-air-hero-v1.jpg',
      title: 'Quality Air Filters',
      subtitle: 'MADE IN THE USA',
      link: '/air-filters',
      buttonText: 'Shop Filters',
    },
    {
      image: '/images/ff-air-water-hero-v1.jpg',
      title: 'Filters You Can Trust',
      link: '/products',
      buttonText: 'Shop Filters',
    },
    {
      image: '/images/ff-water-hero-v1.jpg',
      title: 'Budget-Friendly Fridge Filters',
      subtitle: 'FOR YOUR CONVENIENCE',
      link: '/refrigerator-filters',
      buttonText: 'Shop Discount Filters',
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="bg-brand-blue text-white py-16"
        aria-labelledby="hero-heading"
      >
        <div className="container-custom text-center">
          <h1 id="hero-heading" className="text-4xl md:text-5xl font-bold mb-6 max-w-4xl mx-auto">
            Protect yourself and your family from the things you can&apos;t see.
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            When it comes to filters for your home, you want to make sure that you&apos;re getting the best option at the best price. We are proud to have our own Filters Fast® brand for air and compatible water filters at a fraction of the cost of name brands.
          </p>
        </div>
      </section>

      {/* Product Carousel */}
      <section 
        className="relative h-[400px] md:h-[500px] overflow-hidden"
        aria-label="FiltersFast brand product showcase"
        aria-live="polite"
      >
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={index !== currentSlide}
          >
            <div className="relative w-full h-full">
              <Image
                src={slide.image}
                alt={`${slide.title} showcase`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center text-white px-4">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="text-2xl md:text-3xl mb-6 text-white font-semibold bg-brand-blue/80 inline-block px-4 py-2 rounded">
                      {slide.subtitle}
                    </p>
                  )}
                  <Link href={slide.link}>
                    <Button className="text-lg px-8 py-3">
                      {slide.buttonText}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Buttons */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" aria-hidden="true" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10" role="group" aria-label="Carousel navigation">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide ? 'true' : 'false'}
            />
          ))}
        </div>
      </section>

      {/* Air & Furnace Filters Section */}
      <section className="bg-brand-blue text-white py-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
            <div className="flex-shrink-0">
              <Image
                src="/touch-icon-114x114.png"
                alt="FiltersFast Brand Badge"
                width={114}
                height={114}
                className="w-24 h-24 md:w-28 md:h-28"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-xl md:text-2xl leading-relaxed">
                Filters Fast® Brand Air & Furnace Filters are proudly made in the United States and undergo rigorous testing to ensure that they meet MERV rating requirements.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/air-filters">
                <Button className="text-lg px-8 py-3">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Air Filter Features */}
      <section 
        className="relative min-h-[500px] bg-cover bg-center flex items-center"
        style={{ backgroundImage: "url('/images/household-brand-filter-change-v1.jpg')" }}
        aria-labelledby="air-filter-features-heading"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/95 md:to-white/90"></div>
        <div className="container-custom relative z-10">
          <div className="ml-auto max-w-xl bg-white/95 md:bg-transparent p-8 rounded-lg">
            <h2 id="air-filter-features-heading" className="text-3xl font-bold mb-6 text-gray-900">
              Filters Fast® Brand Air Filters
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <Check className="w-12 h-12 text-green-600 flex-shrink-0" aria-hidden="true" />
                <p className="text-gray-700">
                  Are tested using sensitive laboratory equipment to ensure they meet the requirements of their MERV rating.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <Check className="w-12 h-12 text-green-600 flex-shrink-0" aria-hidden="true" />
                <p className="text-gray-700">
                  Constructed with high quality pleated media and DO NOT contain fiberglass.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <Check className="w-12 h-12 text-green-600 flex-shrink-0" aria-hidden="true" />
                <p className="text-gray-700">
                  Are available in MERV 13 ratings 1-in., 2-in., 4-in., or 5-in. depth in the most common filter sizes.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <Check className="w-12 h-12 text-green-600 flex-shrink-0" aria-hidden="true" />
                <p className="text-gray-700">
                  Can be made in any custom air filter size.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Water Filters Section */}
      <section className="bg-brand-blue text-white py-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
            <div className="flex-shrink-0">
              <Image
                src="/touch-icon-114x114.png"
                alt="FiltersFast Brand Badge"
                width={114}
                height={114}
                className="w-24 h-24 md:w-28 md:h-28"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-xl md:text-2xl leading-relaxed">
                The Filters Fast® Brand has a wide selection of compatible water filter replacements for top refrigerator brands.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/water-filters">
                <Button className="text-lg px-8 py-3">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NSF Certification Intro */}
      <section 
        className="relative min-h-[500px] bg-cover bg-center flex items-center"
        style={{ backgroundImage: "url('/images/household-brand-water-glass-v1.jpg')" }}
        aria-labelledby="nsf-intro-heading"
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container-custom relative z-10">
          <div className="max-w-2xl">
            <p className="text-2xl md:text-3xl text-white leading-relaxed p-8 bg-black/30 rounded-lg">
              All Filters Fast® fridge filters are submitted for NSF certification. This process involves a meticulous process and adheres to NSF certification policies.
            </p>
          </div>
        </div>
      </section>

      {/* NSF Ratings Explanation */}
      <section 
        className="py-16 bg-gray-50"
        aria-labelledby="nsf-ratings-heading"
      >
        <div className="container-custom">
          <h2 id="nsf-ratings-heading" className="text-3xl font-bold text-center mb-4 text-gray-900">
            Each NSF certification has a number to tell you what the<br className="hidden md:block" />
            filter is certified to reduce. Here is what each one means:
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
            {/* NSF 42 */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Image
                  src="/images/nsf-rating-42-v1.png"
                  alt="NSF 42 Certification"
                  width={150}
                  height={150}
                  className="w-auto h-auto"
                />
              </div>
              <p className="text-gray-700 leading-relaxed">
                NSF 42 certified means that the filter will reduce aesthetic contaminants. Aesthetic impurities are things like chlorine taste and odor.
              </p>
            </div>

            {/* NSF 53 */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Image
                  src="/images/nsf-rating-53-v1.png"
                  alt="NSF 53 Certification"
                  width={150}
                  height={150}
                  className="w-auto h-auto"
                />
              </div>
              <p className="text-gray-700 leading-relaxed">
                NSF 53 means that the filter is certified to reduce contaminants that cause health effects like lead.
              </p>
            </div>

            {/* NSF 401 */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Image
                  src="/images/nsf-rating-401-v1.png"
                  alt="NSF 401 Certification"
                  width={150}
                  height={150}
                  className="w-auto h-auto"
                />
              </div>
              <p className="text-gray-700 leading-relaxed">
                NSF 401 means that the filter will reduce one or more of the 15 emerging contaminants from drinking water. Emerging contaminants include pharmaceuticals or chemicals not yet regulated by the EPA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-brand-blue text-white py-12">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
            <div className="flex-1 text-center md:text-left">
              <p className="text-2xl md:text-3xl leading-relaxed">
                Shop our wide selection of compatible air & water filter replacements today!
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/products">
                <Button className="text-lg px-8 py-3">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

