import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Droplet, Wind, Waves, Sparkles, Package, Tag, Ruler } from 'lucide-react';

const categories = [
  {
    name: 'Refrigerator Water Filters',
    href: '/refrigerator-filters',
    icon: Droplet,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Air Filters',
    href: '/air-filters',
    icon: Wind,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    badge: 'Custom Sizes',
  },
  {
    name: 'Water Filters',
    href: '/water-filters',
    icon: Waves,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
  },
  {
    name: 'Pool & Spa Filters',
    href: '/pool-filters',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Humidifier Filters',
    href: '/humidifier-filters',
    icon: Package,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  {
    name: 'Shop Sale',
    href: '/sale',
    icon: Tag,
    color: 'text-brand-orange',
    bgColor: 'bg-orange-50',
  },
];

export default function FeaturedCategories() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors">
            Featured Categories
          </h2>
          <p className="text-lg text-brand-gray-600 dark:text-gray-300 transition-colors">
            Browse our most popular filter categories
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.name} href={category.href}>
                <Card className="group p-6 h-full hover:border-brand-orange border-2 border-transparent transition-all relative">
                  {category.badge && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-brand-orange text-white text-xs font-bold rounded">
                      {category.badge}
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`${category.bgColor} dark:bg-gray-700 p-4 rounded-full group-hover:scale-110 transition-all`}>
                      <Icon className={`w-8 h-8 ${category.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-brand-gray-900 dark:text-gray-100 group-hover:text-brand-orange transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-brand-orange font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Shop Now →
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

