import ProductGrid from '@/components/products/ProductGrid';
import FilterSidebar from '@/components/products/FilterSidebar';

export const metadata = {
  title: 'Refrigerator Water Filters | FiltersFast',
  description: 'Shop replacement refrigerator water filters for all major brands. Free shipping on orders $99+.',
};

// Mock product data (would come from API/database in production)
const products = [
  {
    id: 1,
    name: 'GE MWF Refrigerator Water Filter',
    brand: 'GE',
    sku: 'MWF',
    price: 39.99,
    originalPrice: 49.99,
    rating: 4.8,
    reviewCount: 1247,
    image: '/products/ge-mwf.jpg',
    inStock: true,
    badges: ['bestseller', 'genuine'],
  },
  {
    id: 2,
    name: 'Whirlpool EDR1RXD1 Water Filter',
    brand: 'Whirlpool',
    sku: 'EDR1RXD1',
    price: 44.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/products/whirlpool-edr1rxd1.jpg',
    inStock: true,
    badges: ['genuine'],
  },
  {
    id: 3,
    name: 'LG LT700P Refrigerator Water Filter',
    brand: 'LG',
    sku: 'LT700P',
    price: 42.99,
    originalPrice: 54.99,
    rating: 4.9,
    reviewCount: 2103,
    image: '/products/lg-lt700p.jpg',
    inStock: true,
    badges: ['bestseller', 'genuine'],
  },
  {
    id: 4,
    name: 'Samsung DA29-00020B Water Filter',
    brand: 'Samsung',
    sku: 'DA29-00020B',
    price: 38.99,
    rating: 4.6,
    reviewCount: 734,
    image: '/products/samsung-da29.jpg',
    inStock: true,
  },
  {
    id: 5,
    name: 'FiltersFast FF-100 Compatible Filter',
    brand: 'FiltersFast',
    sku: 'FF-100',
    price: 24.99,
    originalPrice: 39.99,
    rating: 4.7,
    reviewCount: 1456,
    image: '/products/ff-100.jpg',
    inStock: true,
    badges: ['sale', 'value'],
  },
  {
    id: 6,
    name: 'Frigidaire WF3CB PureSource 3 Filter',
    brand: 'Frigidaire',
    sku: 'WF3CB',
    price: 47.99,
    rating: 4.8,
    reviewCount: 623,
    image: '/products/frigidaire-wf3cb.jpg',
    inStock: true,
    badges: ['genuine'],
  },
];

export default function RefrigeratorFiltersPage() {
  return (
    <div className="bg-brand-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-brand-gray-200 dark:border-gray-700 transition-colors">
        <div className="container-custom py-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Refrigerator Water Filters
            </h1>
            <p className="text-lg text-brand-gray-600 dark:text-gray-100 transition-colors">
              Premium replacement water filters for all major refrigerator brands. 
              Genuine OEM and compatible options with free shipping on orders $99+.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-800 border-b border-brand-gray-200 dark:border-gray-700 transition-colors">
        <div className="container-custom py-3">
          <nav className="flex text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
            <a href="/" className="hover:text-brand-orange transition-colors">Home</a>
            <span className="mx-2">/</span>
            <span className="text-brand-gray-900 dark:text-gray-100 font-medium transition-colors">Refrigerator Water Filters</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <FilterSidebar />
          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-3">
            <ProductGrid products={products} />
          </main>
        </div>
      </div>
    </div>
  );
}

