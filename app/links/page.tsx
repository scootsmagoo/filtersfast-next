import { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, BookOpen, Users, Shield, Droplets, Wind, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Educational Resources & Links | FiltersFast',
  description: 'Learn about air and water filtration from trusted sources. Find helpful articles, industry associations, and educational content about indoor air quality and water quality.',
};

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-blue to-blue-700 dark:from-blue-900 dark:to-gray-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-6" aria-hidden="true" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Educational Resources & Links
            </h1>
            <p className="text-xl text-blue-100 dark:text-gray-300">
              At FiltersFast, we carry a complete selection of air filters and water filter cartridges. 
              Learn more about filtration from trusted industry sources and our educational content.
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* FiltersFast Educational Content */}
          <section aria-labelledby="filtersfast-content">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-8 h-8 text-brand-orange" aria-hidden="true" />
              <h2 id="filtersfast-content" className="text-3xl font-bold text-gray-900 dark:text-white">
                FiltersFast Educational Content
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResourceCard
                title="Blog"
                description="Read expert articles on water and air filtration, filter maintenance tips, and industry news from The Filtered Files."
                href="https://blog.filtersfast.com/blog/"
                icon={<BookOpen className="w-6 h-6" />}
                external
              />
              <ResourceCard
                title="Forums"
                description="Join our community forum to ask questions, share experiences, and get advice from filtration experts and other customers."
                href="https://forums.filtersfast.com/forums/"
                icon={<Users className="w-6 h-6" />}
                external
              />
              <ResourceCard
                title="Support Center"
                description="Access our comprehensive knowledge base with FAQs, installation guides, troubleshooting tips, and product information."
                href="/support"
                icon={<Shield className="w-6 h-6" />}
              />
              <ResourceCard
                title="Model Lookup Tool"
                description="Find the right filter for your appliance by searching by brand and model number. Get exact compatibility matches."
                href="/model-lookup"
                icon={<GraduationCap className="w-6 h-6" />}
              />
            </div>
          </section>

          {/* Water Quality Resources */}
          <section aria-labelledby="water-quality-resources">
            <div className="flex items-center gap-3 mb-6">
              <Droplets className="w-8 h-8 text-blue-600" aria-hidden="true" />
              <h2 id="water-quality-resources" className="text-3xl font-bold text-gray-900 dark:text-white">
                Water Quality Resources
              </h2>
            </div>
            <div className="space-y-4">
              <ExternalResourceCard
                title="Water Quality Association (WQA)"
                description="The WQA is a not-for-profit trade association representing the residential, commercial and industrial water treatment industry. Learn about water quality standards, certifications, and treatment technologies."
                href="https://www.wqa.org"
              />
              <ExternalResourceCard
                title="EPA Drinking Water Quality"
                description="The Environmental Protection Agency's comprehensive resource on drinking water standards, contaminants, regulations, and safe drinking water information."
                href="https://www.epa.gov/ground-water-and-drinking-water"
              />
            </div>
          </section>

          {/* Air Quality Resources */}
          <section aria-labelledby="air-quality-resources">
            <div className="flex items-center gap-3 mb-6">
              <Wind className="w-8 h-8 text-green-600" aria-hidden="true" />
              <h2 id="air-quality-resources" className="text-3xl font-bold text-gray-900 dark:text-white">
                Air Quality Resources
              </h2>
            </div>
            <div className="space-y-4">
              <ExternalResourceCard
                title="American Society of Heating, Refrigerating and Air-Conditioning Engineers (ASHRAE)"
                description="ASHRAE is a global society advancing human well-being through sustainable technology for the built environment. Find industry standards, guidelines, and research on HVAC systems and indoor air quality."
                href="https://www.ashrae.org/"
              />
              <ExternalResourceCard
                title="EPA Indoor Air Quality Information"
                description="Comprehensive information about indoor air pollutants, health effects, and strategies to improve air quality in your home or office from the Environmental Protection Agency."
                href="https://www.epa.gov/indoor-air-quality-iaq"
              />
            </div>
          </section>

          {/* Why These Resources Matter */}
          <section aria-labelledby="why-education-matters" className="bg-brand-gray-50 dark:bg-gray-800 rounded-xl p-8 transition-colors">
            <h2 id="why-education-matters" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Why Filter Education Matters
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Understanding the importance of proper filtration is essential for maintaining a healthy home environment. 
                Clean air and water are fundamental to your family&apos;s health and well-being.
              </p>
              <p>
                The resources listed above are from trusted industry organizations and government agencies that set 
                standards, conduct research, and provide education about filtration technologies. Whether you&apos;re 
                concerned about:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contaminants in your drinking water</li>
                <li>Indoor air quality and allergens</li>
                <li>HVAC efficiency and energy savings</li>
                <li>Filter ratings and certifications (MERV, NSF, etc.)</li>
                <li>Proper maintenance schedules</li>
              </ul>
              <p>
                These resources can help you make informed decisions about your filtration needs. And of course, 
                our expert customer service team is always available to answer your questions at{' '}
                <a 
                  href="tel:+18664383458" 
                  className="text-brand-orange hover:text-brand-orange-dark font-semibold underline focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
                  aria-label="Call FiltersFast customer service at 866-438-3458"
                >
                  (866) 438-3458
                </a>.
              </p>
            </div>
          </section>

          {/* Additional Help */}
          <section aria-labelledby="need-help" className="text-center">
            <h2 id="need-help" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Need More Help?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Our filtration experts are here to help you find the perfect solution for your needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/support"
                className="btn-secondary inline-flex items-center gap-2"
                aria-label="Visit our support center for help and FAQs"
              >
                <Shield className="w-5 h-5" aria-hidden="true" />
                Visit Support Center
              </Link>
              <a
                href="mailto:support@filtersfast.com"
                className="btn-primary inline-flex items-center gap-2"
                aria-label="Email FiltersFast support team at support@filtersfast.com"
              >
                Email Us
              </a>
              <a
                href="tel:+18664383458"
                className="btn-primary inline-flex items-center gap-2"
                aria-label="Call FiltersFast customer service at 866-438-3458"
              >
                Call (866) 438-3458
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// Resource Card Component for Internal Links
interface ResourceCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

function ResourceCard({ title, description, href, icon, external }: ResourceCardProps) {
  const className = "block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 h-full group focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2";
  const ariaLabel = external ? `${title} - Opens in new tab. ${description}` : `${title}. ${description}`;
  
  const content = (
    <>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-brand-orange text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" aria-hidden="true">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-orange transition-colors">
              {title}
            </h3>
            {external && (
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-brand-orange transition-colors" aria-hidden="true" />
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </>
  );

  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}

// External Resource Card Component
interface ExternalResourceCardProps {
  title: string;
  description: string;
  href: string;
}

function ExternalResourceCard({ title, description, href }: ExternalResourceCardProps) {
  const ariaLabel = `${title} - Opens in new tab. ${description}`;
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 group focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
      aria-label={ariaLabel}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-orange transition-colors">
              {title}
            </h3>
            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-brand-orange transition-colors" aria-hidden="true" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </a>
  );
}

