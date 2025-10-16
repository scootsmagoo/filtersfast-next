import HeroSection from '@/components/home/HeroSection';
import FilterTools from '@/components/home/FilterTools';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import HomeFilterClub from '@/components/home/HomeFilterClub';
import TrustIndicators from '@/components/home/TrustIndicators';

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FilterTools />
      <FeaturedCategories />
      <HomeFilterClub />
      <TrustIndicators />
    </div>
  );
}

