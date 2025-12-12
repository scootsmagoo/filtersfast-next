import Link from 'next/link';
import { blogCategories, BlogCategory } from '@/lib/types/blog';
import { Search } from 'lucide-react';

interface BlogSidebarProps {
  currentCategory?: BlogCategory;
}

export default function BlogSidebar({ currentCategory }: BlogSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <section className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6" aria-labelledby="blog-search-heading">
        <h2 id="blog-search-heading" className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Search the Blog
        </h2>
        <form action="/blog/search" method="get" className="relative" role="search">
          <label htmlFor="blog-search-input" className="sr-only">
            Search blog articles
          </label>
          <input
            id="blog-search-input"
            type="search"
            name="q"
            placeholder="Search articles..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            autoComplete="off"
            maxLength={500}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
            aria-label="Submit search"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
      </section>

      {/* Categories */}
      <section className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6" aria-labelledby="blog-categories-heading">
        <h2 id="blog-categories-heading" className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Categories
        </h2>
        <nav aria-label="Blog categories navigation">
          <ul className="space-y-2">
            <li>
              <Link
                href="/blog"
                className={`block px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                  !currentCategory
                    ? 'bg-brand-orange text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-current={!currentCategory ? 'page' : undefined}
              >
                All Posts
              </Link>
            </li>
            {Object.values(blogCategories).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/blog/category/${category.slug}`}
                  className={`block px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                    currentCategory === category.slug
                      ? 'bg-brand-orange text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  aria-current={currentCategory === category.slug ? 'page' : undefined}
                >
                  {category.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {/* Helpful Links */}
      <section className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6" aria-labelledby="helpful-resources-heading">
        <h2 id="helpful-resources-heading" className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Helpful Resources
        </h2>
        <nav aria-label="External filtration resources">
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <a
                href="https://www.ashrae.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                ASHRAE
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.awra.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                American Water Resources Association
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.awwa.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                American Water Works Association
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.epa.gov/safewater/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                EPA Ground Water & Drinking Water
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.epa.gov/iaq/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                EPA Indoor Air Quality
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.nafahq.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                National Air Filtration Association
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.ngwa.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                National Ground Water Association
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
          </ul>
        </nav>
      </section>

      {/* Need Help Section */}
      <section className="bg-brand-orange rounded-lg shadow-md p-6 text-white" aria-labelledby="contact-help-heading">
        <h2 id="contact-help-heading" className="text-lg font-bold mb-2">
          Need Filtration Help?
        </h2>
        <p className="text-sm mb-4">
          Our filtration experts are ready to help you find the perfect solution.
        </p>
        <address className="space-y-2 text-sm not-italic">
          <p>
            <strong>Phone:</strong>{' '}
            <a 
              href="tel:+18664383458" 
              className="underline hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-orange"
            >
              (866) 438-3458
            </a>
          </p>
          <p>
            <strong>Text:</strong>{' '}
            <a 
              href="sms:+17042289166" 
              className="underline hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-orange"
            >
              (704) 228-9166
            </a>
          </p>
          <p>
            <strong>Email:</strong>{' '}
            <a 
              href="mailto:support@filtersfast.com" 
              className="underline hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-orange"
            >
              support@filtersfast.com
            </a>
          </p>
        </address>
      </section>
    </div>
  );
}

