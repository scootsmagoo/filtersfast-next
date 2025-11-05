/**
 * Initialize Partners Landing Pages
 * 
 * Creates tables and seeds initial partner data based on legacy FiltersFast partners
 */

import { 
  initPartnersTable,
  createPartner,
  getAllPartners
} from '@/lib/db/partners';
import { CreatePartnerInput, ContentBlock } from '@/lib/types/partner';

console.log('🏢 Initializing Partner Landing Pages...\n');

try {
  // Initialize tables
  console.log('📊 Creating database tables...');
  initPartnersTable();
  console.log('✅ Tables created\n');

  // Check if partners already exist
  const existing = getAllPartners();
  if (existing.length > 0) {
    console.log(`ℹ️  Found ${existing.length} existing partners. Skipping seed.\n`);
    console.log('Existing partners:');
    existing.forEach(p => console.log(`  - ${p.name} (${p.slug})`));
    process.exit(0);
  }

  console.log('🌱 Seeding initial partner data...\n');

  // Wine To Water - Charity Partner
  const wineToWaterBlocks: ContentBlock[] = [
    {
      id: 'wtw-hero',
      type: 'hero',
      order: 1,
      data: {
        image: '/partners/wine-to-water/hero.jpg',
        title: 'Wine To Water Community Impact',
        subtitle: 'Our partnership began in 2011 and continues to this day'
      }
    },
    {
      id: 'wtw-text-1',
      type: 'text',
      order: 2,
      data: {
        content: 'Our partnership with Wine To Water began in 2011 and continues to this day. For every refrigerator filter purchased, Filters Fast donates a portion of each sale directly to Wine To Water.',
        alignment: 'left'
      }
    },
    {
      id: 'wtw-text-2',
      type: 'text',
      order: 3,
      data: {
        heading: 'Water is just the beginning',
        content: 'Wine To Water is a non-profit organization that is committed to supporting life and dignity for all through the power of clean water. Wine To Water has worked to bring clean water access to over 1.6 million people and counting in 50 different countries. What sets Wine To Water apart is their focus on sustainability and transformation in the communities they work in. In addition to working hand in hand with communities in hard-to-reach places, they also provide emergency response to areas that experience hurricanes, monsoons or war.'
      }
    },
    {
      id: 'wtw-cta',
      type: 'cta',
      order: 4,
      data: {
        heading: 'Learn More About Wine To Water',
        description: 'Visit their website to see the impact clean water is making around the world',
        buttons: [
          {
            text: 'Visit Wine To Water',
            url: 'https://www.wtw.org',
            variant: 'primary',
            external: true
          }
        ]
      }
    }
  ];

  const wineToWater: CreatePartnerInput = {
    name: 'Wine to Water',
    slug: 'wine-to-water',
    type: 'charity',
    shortDescription: 'Supporting life and dignity through the power of clean water',
    description: 'Wine To Water is a water charity and certified WASH (Water, Sanitation And Hygiene) organization located in Boone, NC. Since 2011, FiltersFast.com has partnered with Wine To Water to work towards one mission: to end the global water crisis.',
    logo: '/partners/wine-to-water/logo.png',
    heroImage: '/partners/wine-to-water/hero.jpg',
    partnershipStartDate: new Date('2011-01-01'),
    missionStatement: 'Supporting life and dignity for all through the power of clean water',
    websiteUrl: 'https://www.wtw.org',
    metaTitle: 'Wine To Water Partnership | FiltersFast.com',
    metaDescription: 'Learn about our partnership with Wine To Water and how we\'re helping bring clean water to communities in need around the world.',
    contentBlocks: wineToWaterBlocks,
    active: true,
    featured: true,
    displayOrder: 1
  };

  createPartner(wineToWater);
  console.log('✅ Created Wine to Water');

  // Habitat for Humanity - Charity Partner
  const habitatBlocks: ContentBlock[] = [
    {
      id: 'habitat-hero',
      type: 'hero',
      order: 1,
      data: {
        image: '/partners/habitat-for-humanity/banner.jpg',
        title: 'Building Homes, Communities, and Hope',
        subtitle: 'Our partnership with Habitat for Humanity of the Charlotte Region'
      }
    },
    {
      id: 'habitat-stats',
      type: 'stats',
      order: 2,
      data: {
        stats: [
          { number: '4,000+', label: 'FAMILIES SERVED SINCE 1983' },
          { number: '★★★★', label: 'RATING VIA CHARITY NAVIGATOR' },
          { number: '$20M+', label: 'PAID BY HABITAT CHARLOTTE REGION HOMEOWNERS IN PROPERTY TAXES' }
        ],
        backgroundColor: '#085394',
        textColor: '#ffffff'
      }
    },
    {
      id: 'habitat-text',
      type: 'text',
      order: 3,
      data: {
        heading: 'Playing Our Part',
        content: 'At Filters Fast, we believe that everyone should have a safe place to call home. That\'s why we partner with Habitat for Humanity of the Charlotte Region. Since 2019, we have participated in many opportunities to support our local community through Habitat for Humanity.'
      }
    },
    {
      id: 'habitat-gallery',
      type: 'image_gallery',
      order: 4,
      data: {
        layout: 'carousel',
        images: [
          { url: '/partners/habitat-for-humanity/habitat-1.jpeg', alt: 'Habitat Build 1' },
          { url: '/partners/habitat-for-humanity/habitat-2.jpeg', alt: 'Habitat Build 2' },
          { url: '/partners/habitat-for-humanity/habitat-3.jpg', alt: 'Habitat Build 3' },
          { url: '/partners/habitat-for-humanity/habitat-4.jpg', alt: 'Habitat Build 4' }
        ]
      }
    },
    {
      id: 'habitat-timeline',
      type: 'timeline',
      order: 5,
      data: {
        events: [
          {
            year: '2019',
            season: 'Spring',
            title: 'Book Drive',
            description: 'Book Drive for Habitat\'s Julia\'s Cafe & Books to raise money to build energy-efficient, affordable houses.'
          },
          {
            year: '2019',
            season: 'Summer',
            title: 'Build Day',
            description: 'Filters Fast employees had an opportunity to participate in a build or ReStore volunteer shift.'
          },
          {
            year: '2019',
            season: 'Fall',
            title: 'Another Build',
            description: 'Filters Fast employees had another opportunity to participate in a build.'
          },
          {
            year: '2020',
            season: 'Spring',
            title: 'COVID-19 Response',
            description: 'Filters Fast jumped into action and pledged to match every $1 donated by customers up to $10,000 to assist with COVID-19 challenges.'
          },
          {
            year: '2021-Now',
            title: 'Ongoing Partnership',
            description: 'Filters Fast frequently donates filters and other products by the truckload directly to Habitat for Humanity of the Charlotte Region.'
          }
        ]
      }
    },
    {
      id: 'habitat-cta',
      type: 'cta',
      order: 6,
      data: {
        heading: 'Want to Get Involved?',
        description: 'Learn more about Habitat for Humanity of the Charlotte Region\'s impact in our local area.',
        buttons: [
          {
            text: 'Learn More',
            url: 'https://www.habitatcltregion.org/',
            variant: 'primary',
            external: true
          }
        ]
      }
    }
  ];

  const habitat: CreatePartnerInput = {
    name: 'Habitat for Humanity',
    slug: 'habitat-for-humanity',
    type: 'charity',
    shortDescription: 'Building homes, communities, and hope',
    description: 'Habitat for Humanity brings people together to build homes, communities, and hope. We partner with Habitat for Humanity of the Charlotte Region to help families achieve strength, stability, and self-reliance through shelter.',
    logo: '/partners/habitat-for-humanity/logo.png',
    heroImage: '/partners/habitat-for-humanity/banner.jpg',
    partnershipStartDate: new Date('2019-01-01'),
    missionStatement: 'Everyone deserves a safe place to call home',
    websiteUrl: 'https://www.habitatcltregion.org/',
    metaTitle: 'Habitat for Humanity Partnership | FiltersFast.com',
    metaDescription: 'Learn about our partnership with Habitat for Humanity of the Charlotte Region and how we\'re helping build homes and communities.',
    contentBlocks: habitatBlocks,
    active: true,
    featured: false,
    displayOrder: 2
  };

  createPartner(habitat);
  console.log('✅ Created Habitat for Humanity');

  // Cystic Fibrosis Foundation - Xtreme Hike
  const xtremeHikeBlocks: ContentBlock[] = [
    {
      id: 'xtreme-hero',
      type: 'hero',
      order: 1,
      data: {
        image: '/partners/xtreme-hike/banner.jpg',
        title: 'Xtreme Hike for the Cure',
        subtitle: 'Supporting the Cystic Fibrosis Foundation'
      }
    },
    {
      id: 'xtreme-stats',
      type: 'stats',
      order: 2,
      data: {
        stats: [
          { number: '1 IN 31', label: 'AMERICANS ARE SYMPTOMLESS CARRIERS OF THE DEFECTIVE CF GENE' },
          { number: '70,000', label: 'CHILDREN & ADULTS WORLDWIDE HAVE CYSTIC FIBROSIS' },
          { number: '0', label: 'CURES EXIST FOR CYSTIC FIBROSIS' }
        ],
        backgroundColor: '#085394',
        textColor: '#ffffff'
      }
    },
    {
      id: 'xtreme-about',
      type: 'text',
      order: 3,
      data: {
        heading: 'About Cystic Fibrosis',
        content: 'Cystic Fibrosis (CF) is an inherited, life-threatening disease that causes severe damage to the lungs, digestive system, and other organs in the body. When someone is diagnosed with cystic fibrosis, it means that the cells in their body produce mucus, sweat, and digestive juices that are thick and sticky. These thick and sticky secretions can plug up tubes, ducts, and passageways in the body, especially in the lungs and pancreas.'
      }
    },
    {
      id: 'xtreme-text',
      type: 'text',
      order: 4,
      data: {
        heading: 'About the Cystic Fibrosis Foundation',
        content: 'The mission of the Cystic Fibrosis Foundation is to cure cystic fibrosis and to provide all people with CF the opportunity to lead long, fulfilling lives by funding research and drug development, partnering with the CF community, and advancing high-quality, specialized care.'
      }
    },
    {
      id: 'xtreme-playing-part',
      type: 'text',
      order: 5,
      data: {
        heading: 'Playing Our Part',
        content: 'As an online filtration company, we believe that it is our responsibility to give back to our community, especially if it\'s a cause that aligns with our company\'s mission. Because cystic fibrosis affects the lungs, there is no question that we would want to partner with the Cystic Fibrosis Foundation to help find a cure. Not only does our Founder and CEO, Ray, help raise money by participating in the Cystic Fibrosis Foundation - Western Carolina Chapter Xtreme Hike for the Cure, but we are proud to be a sponsor too!'
      }
    },
    {
      id: 'xtreme-ray',
      type: 'text',
      order: 6,
      data: {
        heading: 'Ray\'s \'WHY\' Behind Xtreme Hike for the Cure',
        content: 'Filters Fast\'s Founder and CEO, Ray Scardigno and Team Filters Fast, have participated in Xtreme Hike for the Cure to help raise money for the Cystic Fibrosis Foundation for over 7 years. Each year, they hike a grueling 30.1 miles in one day, which is both physically and mentally challenging. So far, Ray and his teammates have raised more than $166,000 to aid in finding a cure for cystic fibrosis.\n\n"Personally, the hike always proves challenging, and training is a critical part of the hike. It is a huge commitment, but nothing compared to the time those with CF have to spend on treatments every day. I am inspired by other hikers who have CF or have family members that have CF and am excited to help them move closer to the day that CF stands for Cure Found!" - Ray Scardigno',
        backgroundColor: '#085394'
      }
    },
    {
      id: 'xtreme-cta',
      type: 'cta',
      order: 7,
      data: {
        heading: 'Want to Get Involved?',
        description: 'Please consider joining our team or making a tax-deductible donation. With your help, we can find a cure for cystic fibrosis!',
        buttons: [
          {
            text: 'Donate to NC Fall Xtreme Hike',
            url: 'https://fundraise.cff.org/FallHike2025/FiltersFast',
            variant: 'primary',
            external: true
          },
          {
            text: 'Donate to Yosemite Xtreme Hike',
            url: 'https://fundraise.cff.org/yosemite/FiltersFast',
            variant: 'secondary',
            external: true
          }
        ]
      }
    }
  ];

  const xtremeHike: CreatePartnerInput = {
    name: 'Cystic Fibrosis Foundation - Xtreme Hike',
    slug: 'xtreme-hike',
    type: 'charity',
    shortDescription: 'Fighting for a cure for Cystic Fibrosis',
    description: 'Cystic Fibrosis is an inherited, life-threatening disease that causes severe damage to the lungs. Help fund research to find a cure by supporting our team in the Xtreme Hike for the Cure.',
    logo: '/partners/xtreme-hike/logo.png',
    heroImage: '/partners/xtreme-hike/banner.jpg',
    partnershipStartDate: new Date('2015-01-01'),
    missionStatement: 'Finding a cure for Cystic Fibrosis',
    websiteUrl: 'https://www.cff.org',
    metaTitle: 'Xtreme Hike for the Cure | FiltersFast.com',
    metaDescription: 'Learn about our participation in the Cystic Fibrosis Foundation Xtreme Hike and how we\'re helping fund research for a cure.',
    contentBlocks: xtremeHikeBlocks,
    active: true,
    featured: false,
    displayOrder: 3
  };

  createPartner(xtremeHike);
  console.log('✅ Created Xtreme Hike');

  // American Home Shield - Corporate Partner
  const ahsBlocks: ContentBlock[] = [
    {
      id: 'ahs-hero',
      type: 'hero',
      order: 1,
      data: {
        image: '/partners/american-home-shield/hero.jpg',
        title: 'Welcome, American Home Shield Customers!',
        subtitle: 'YOUR 10% OFF + FREE SHIPPING WILL BE APPLIED AT CHECKOUT'
      }
    },
    {
      id: 'ahs-text',
      type: 'text',
      order: 2,
      data: {
        content: 'You trust American Home Shield for the unexpected challenges that homeownership can bring, and FiltersFast.com is here to help you take care of the things that you can\'t see! We believe that the quality of your home\'s air and water can have an impact on your health and wellness, and that\'s why we\'re here to help you find the best product solutions for your home based on your unique needs. From furnace filters to water filters to humidifiers and home wellness essentials, we offer a variety of products to help you have optimal health in your house and out!'
      }
    },
    {
      id: 'ahs-perks',
      type: 'perks',
      order: 3,
      data: {
        backgroundColor: '#085394',
        columns: 4,
        perks: [
          {
            title: 'Save 10% Off',
            description: 'on all products sitewide!',
            icon: '/partners/icons/save.png'
          },
          {
            title: '1000s of Products',
            description: 'to meet your filtration needs.',
            icon: '/partners/icons/shop.png'
          },
          {
            title: 'Subscribe & Save',
            description: 'Filtration essentials delivered on a customizable schedule.',
            icon: '/partners/icons/subscribe.png'
          },
          {
            title: 'Free Shipping',
            description: 'on all orders!',
            icon: '/partners/icons/ship.png'
          }
        ]
      }
    }
  ];

  const ahs: CreatePartnerInput = {
    name: 'American Home Shield',
    slug: 'american-home-shield',
    type: 'corporate',
    shortDescription: 'Exclusive discount for American Home Shield customers',
    description: 'American Home Shield customers receive 10% off + free shipping on all FiltersFast.com products.',
    logo: '/partners/american-home-shield/logo.png',
    heroImage: '/partners/american-home-shield/hero.jpg',
    websiteUrl: 'https://www.ahs.com',
    discountCode: '976897',
    discountDescription: '10% off + free shipping on all products',
    metaTitle: 'American Home Shield Customer Discount | FiltersFast.com',
    metaDescription: 'American Home Shield customers receive exclusive 10% off + free shipping on all FiltersFast.com products.',
    contentBlocks: ahsBlocks,
    active: true,
    featured: false,
    displayOrder: 10
  };

  createPartner(ahs);
  console.log('✅ Created American Home Shield');

  // Frontdoor - Corporate Partner
  const frontdoorBlocks: ContentBlock[] = [
    {
      id: 'frontdoor-hero',
      type: 'hero',
      order: 1,
      data: {
        image: '/partners/frontdoor/hero.jpg',
        title: 'Welcome, Frontdoor Customers!',
        subtitle: 'YOUR 10% OFF + FREE SHIPPING WILL BE APPLIED AT CHECKOUT'
      }
    },
    {
      id: 'frontdoor-text',
      type: 'text',
      order: 2,
      data: {
        content: 'You trust Frontdoor for the unexpected challenges that homeownership can bring, and FiltersFast.com is here to help you take care of the things that you can\'t see! We believe that the quality of your home\'s air and water can have an impact on your health and wellness, and that\'s why we\'re here to help you find the best product solutions for your home based on your unique needs. From furnace filters to water filters to humidifiers and home wellness essentials, we offer a variety of products to help you have optimal health in your house and out!'
      }
    },
    {
      id: 'frontdoor-perks',
      type: 'perks',
      order: 3,
      data: {
        backgroundColor: '#085394',
        columns: 4,
        perks: [
          {
            title: 'Save 10% Off',
            description: 'on all products sitewide!',
            icon: '/partners/icons/save.png'
          },
          {
            title: '1000s of Products',
            description: 'to meet your filtration needs.',
            icon: '/partners/icons/shop.png'
          },
          {
            title: 'Subscribe & Save',
            description: 'Filtration essentials delivered on a customizable schedule.',
            icon: '/partners/icons/subscribe.png'
          },
          {
            title: 'Free Shipping',
            description: 'on all orders!',
            icon: '/partners/icons/ship.png'
          }
        ]
      }
    }
  ];

  const frontdoor: CreatePartnerInput = {
    name: 'Frontdoor',
    slug: 'frontdoor',
    type: 'corporate',
    shortDescription: 'Exclusive discount for Frontdoor customers',
    description: 'Frontdoor customers receive 10% off + free shipping on all FiltersFast.com products.',
    logo: '/partners/frontdoor/logo.png',
    heroImage: '/partners/frontdoor/hero.jpg',
    websiteUrl: 'https://www.frontdoorhome.com',
    discountCode: '443237',
    discountDescription: '10% off + free shipping on all products',
    metaTitle: 'Frontdoor Customer Discount | FiltersFast.com',
    metaDescription: 'Frontdoor customers receive exclusive 10% off + free shipping on all FiltersFast.com products.',
    contentBlocks: frontdoorBlocks,
    active: true,
    featured: false,
    displayOrder: 11
  };

  createPartner(frontdoor);
  console.log('✅ Created Frontdoor');

  // 2-10 Home Warranty - Corporate Partner
  const twoTenBlocks: ContentBlock[] = [
    {
      id: '2-10-hero',
      type: 'hero',
      order: 1,
      data: {
        image: '/partners/2-10-home-warranty/hero.jpg',
        title: 'Welcome, 2-10 Home Warranty Customers!',
        subtitle: 'YOUR EXCLUSIVE DISCOUNT WILL BE APPLIED AT CHECKOUT'
      }
    },
    {
      id: '2-10-text',
      type: 'text',
      order: 2,
      data: {
        content: 'As a 2-10 Home Warranty customer, you understand the importance of maintaining your home. FiltersFast.com is here to help you maintain cleaner air and water in your home with our wide selection of air filters, water filters, and home wellness products. Your exclusive discount is automatically applied at checkout!'
      }
    },
    {
      id: '2-10-perks',
      type: 'perks',
      order: 3,
      data: {
        backgroundColor: '#085394',
        columns: 4,
        perks: [
          {
            title: 'Exclusive Savings',
            description: 'Special discount for 2-10 customers',
            icon: '/partners/icons/save.png'
          },
          {
            title: '1000s of Products',
            description: 'Air filters, water filters, and more',
            icon: '/partners/icons/shop.png'
          },
          {
            title: 'Subscribe & Save',
            description: 'Never run out of filters again',
            icon: '/partners/icons/subscribe.png'
          },
          {
            title: 'Free Shipping',
            description: 'on qualifying orders',
            icon: '/partners/icons/ship.png'
          }
        ]
      }
    }
  ];

  const twoTen: CreatePartnerInput = {
    name: '2-10 Home Warranty',
    slug: '2-10-home-warranty',
    type: 'corporate',
    shortDescription: 'Exclusive discount for 2-10 Home Warranty customers',
    description: '2-10 Home Warranty customers receive exclusive savings on all FiltersFast.com products. Maintain your home with quality air and water filters.',
    logo: '/partners/2-10-home-warranty/logo.png',
    heroImage: '/partners/2-10-home-warranty/hero.jpg',
    websiteUrl: 'https://www.2-10.com',
    discountCode: '2-10-PARTNER',
    discountDescription: 'Exclusive discount for 2-10 Home Warranty customers',
    metaTitle: '2-10 Home Warranty Customer Discount | FiltersFast.com',
    metaDescription: '2-10 Home Warranty customers receive exclusive savings on all FiltersFast.com products.',
    contentBlocks: twoTenBlocks,
    active: true,
    featured: false,
    displayOrder: 12
  };

  createPartner(twoTen);
  console.log('✅ Created 2-10 Home Warranty');

  // AAA - Discount Program Partner
  const aaaBlocks: ContentBlock[] = [
    {
      id: 'aaa-hero',
      type: 'hero',
      order: 1,
      data: {
        image: '/partners/aaa/hero.jpg',
        title: 'Welcome, AAA Members!',
        subtitle: 'YOUR MEMBER DISCOUNT WILL BE APPLIED AT CHECKOUT'
      }
    },
    {
      id: 'aaa-text',
      type: 'text',
      order: 2,
      data: {
        content: 'As a valued AAA member, you have access to exclusive savings on FiltersFast.com! Whether you need air filters, water filters, or home wellness products, we\'re here to help you maintain a healthier home environment. Your AAA member discount is automatically applied at checkout.'
      }
    },
    {
      id: 'aaa-perks',
      type: 'perks',
      order: 3,
      data: {
        backgroundColor: '#085394',
        columns: 4,
        perks: [
          {
            title: 'AAA Member Savings',
            description: 'Exclusive discount for members',
            icon: '/partners/icons/save.png'
          },
          {
            title: 'Quality Products',
            description: 'Top brands for your home',
            icon: '/partners/icons/shop.png'
          },
          {
            title: 'Subscribe & Save',
            description: 'Automatic delivery options',
            icon: '/partners/icons/subscribe.png'
          },
          {
            title: 'Fast Shipping',
            description: 'Quick delivery to your door',
            icon: '/partners/icons/ship.png'
          }
        ]
      }
    }
  ];

  const aaa: CreatePartnerInput = {
    name: 'AAA',
    slug: 'aaa',
    type: 'discount_program',
    shortDescription: 'Exclusive savings for AAA members',
    description: 'AAA members receive exclusive discounts on all FiltersFast.com products. Take advantage of your membership benefits for cleaner air and water in your home.',
    logo: '/partners/aaa/logo.png',
    heroImage: '/partners/aaa/hero.jpg',
    websiteUrl: 'https://www.aaa.com',
    discountCode: 'AAA-MEMBER',
    discountDescription: 'AAA member exclusive discount',
    metaTitle: 'AAA Member Discount | FiltersFast.com',
    metaDescription: 'AAA members receive exclusive discounts on all FiltersFast.com products. Save on air filters, water filters, and more.',
    contentBlocks: aaaBlocks,
    active: true,
    featured: false,
    displayOrder: 20
  };

  createPartner(aaa);
  console.log('✅ Created AAA');

  console.log('\n✨ Partner landing pages initialized successfully!\n');
  
  const allPartners = getAllPartners();
  console.log(`📊 Total partners: ${allPartners.length}`);
  console.log('Partners created:');
  allPartners.forEach(p => {
    console.log(`  - ${p.name} (${p.type}) - /${p.slug}`);
  });
  
} catch (error: any) {
  console.error('❌ Error:', error.message);
  console.error(error);
  process.exit(1);
}

