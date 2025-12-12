import { Star, Shield, RotateCcw, Headphones } from 'lucide-react';

const trustFeatures = [
  {
    icon: Star,
    title: '62,000+ 5-Star Reviews',
    description: 'Rated excellent by thousands of happy customers',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    icon: Shield,
    title: 'Unbeatable Quality',
    description: 'Premium filters from trusted brands',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: RotateCcw,
    title: '365-Day Returns',
    description: 'Full year to return any product, no questions asked',
    color: 'text-brand-blue',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Expert help whenever you need it',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
];

export default function TrustIndicators() {
  return (
    <section className="py-16 bg-brand-gray-50 dark:bg-gray-800 transition-colors">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors">
            Why Choose FiltersFast?
          </h2>
          <p className="text-lg text-brand-gray-600 dark:text-gray-300 transition-colors">
            America&apos;s most trusted online filtration retailer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="text-center group"
              >
                <div className={`${feature.bgColor} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-10 h-10 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Social Proof Bar */}
        <div className="mt-16 bg-white dark:bg-gray-700 rounded-xl shadow-lg p-8 transition-colors">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-orange mb-2">2M+</div>
              <div className="text-brand-gray-600 dark:text-gray-300 transition-colors">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-orange mb-2">5,000+</div>
              <div className="text-brand-gray-600 dark:text-gray-300 transition-colors">Products</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-orange mb-2">99.7%</div>
              <div className="text-brand-gray-600 dark:text-gray-300 transition-colors">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-orange mb-2">20+</div>
              <div className="text-brand-gray-600 dark:text-gray-300 transition-colors">Years in Business</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-xl text-brand-gray-700 dark:text-gray-300 mb-6 transition-colors">
            Join millions of customers who trust FiltersFast for their filtration needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:1-866-438-3458"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white font-bold py-3 px-8 rounded hover:bg-brand-blue-dark transition-colors"
            >
              <Headphones className="w-5 h-5" />
              Call: 1-866-438-3458
            </a>
            <a
              href="/reviews"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border-2 border-brand-blue dark:border-blue-400 text-brand-blue dark:text-blue-400 font-bold py-3 px-8 rounded hover:bg-brand-blue hover:text-white transition-colors"
            >
              <Star className="w-5 h-5" />
              Read Reviews
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

